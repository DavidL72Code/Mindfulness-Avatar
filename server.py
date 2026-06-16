import base64
import json
import os
import queue
import re
import time
from concurrent.futures import ThreadPoolExecutor
from threading import Lock, Thread
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

from google.auth.transport.requests import Request as GoogleAuthRequest
from google.oauth2 import id_token as google_id_token

from chatbot import (
    build_activity_step_message,
    build_chat_prompt,
    build_session_recap,
    call_gemini,
    call_gemini_stream,
    find_activity,
    load_mindfulness_activities,
    summarize_history,
    synthesize_edge_tts,
    synthesize_edge_tts_with_lipsync,
    synthesize_edge_tts_with_word_boundaries,
    synthesize_edge_tts_streaming,
)


def load_env_file(path):
    if not os.path.exists(path):
        return
    with open(path, "r", encoding="utf-8") as env_file:
        for raw_line in env_file:
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key:
                os.environ.setdefault(key, value)


load_env_file(os.path.join(os.path.dirname(__file__), ".env"))

WEB_DIR = os.getenv(
    "WEB_DIR",
    os.path.join(os.path.dirname(__file__), "Web_mindfulnessconnected"),
)
MAX_HISTORY_MESSAGES = 20
SUMMARY_BATCH_SIZE = 10
FIREBASE_PROJECT_ID = os.getenv("EXPO_PUBLIC_FIREBASE_PROJECT_ID", "").strip()
MINDFULNESS_ACTIVITIES = load_mindfulness_activities()
SESSIONS = {}
SESSIONS_LOCK = Lock()
RATE_LIMITS = {}
RATE_LIMITS_LOCK = Lock()
TOKEN_CACHE = {}
TOKEN_CACHE_LOCK = Lock()
GOOGLE_AUTH_REQUEST = GoogleAuthRequest()
MAX_CHAT_MESSAGE_LENGTH = 4000
MAX_TTS_TEXT_LENGTH = 1200
MAX_PREWARM_ITEMS = 100
MAX_PREWARM_TEXT_LENGTH = 500
MAX_PREWARM_TOTAL_CHARS = 12000
TOKEN_CACHE_TTL_SECONDS = 300

RATE_LIMIT_POLICIES = {
    "activities": (60, 60),
    "chat": (12, 60),
    "chat_stream": (12, 60),
    "tts": (20, 60),
    "tts_prewarm": (2, 300),
    "session_end": (10, 60),
    "activity_select": (20, 60),
    "activity_step": (30, 60),
}

DEFAULT_ALLOWED_ORIGINS = {
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "https://mindfulness-avatar.vercel.app",
    "https://multilingual-virtual-assistant.onrender.com",
    "https://mindfulness-avatar.onrender.com",
}

_SENTENCE_SPLIT = re.compile(r'(?<=[.!?:;])\s+')


class _ClientDisconnected(Exception):
    pass


def extract_speakable_chunks(buf):
    """Split buf on sentence boundaries; return (complete_chunks, remainder)."""
    parts = _SENTENCE_SPLIT.split(buf)
    complete = [p.strip() for p in parts[:-1] if p.strip()]
    return complete, parts[-1]


def _session_key(user_id, session_id):
    return f"{user_id}:{session_id}"


def get_or_create_session(user_id, session_id):
    session_key = _session_key(user_id, session_id)
    with SESSIONS_LOCK:
        session = SESSIONS.get(session_key)
        if session is None:
            session = {
                "user_id": user_id,
                "history": [],
                "summary": "",
                "completed_activities": [],
                "active_activity_id": None,
                "current_step_index": None,
            }
            SESSIONS[session_key] = session
        return session


def get_session_snapshot(user_id, session_id):
    session = get_or_create_session(user_id, session_id)
    with SESSIONS_LOCK:
        return {
            "history": list(session["history"]),
            "summary": session["summary"],
            "completed_activities": list(session["completed_activities"]),
            "active_activity_id": session["active_activity_id"],
            "current_step_index": session["current_step_index"],
        }


def remove_session(user_id, session_id):
    with SESSIONS_LOCK:
        return SESSIONS.pop(_session_key(user_id, session_id), None)


def update_session_memory(session, user_message, assistant_message):
    with SESSIONS_LOCK:
        session["history"].append({"role": "user", "content": user_message})
        session["history"].append({"role": "assistant", "content": assistant_message})

        if len(session["history"]) > MAX_HISTORY_MESSAGES:
            overflow = len(session["history"]) - MAX_HISTORY_MESSAGES
            batch_size = max(SUMMARY_BATCH_SIZE, overflow)
            batch_to_summarize = session["history"][:batch_size]
            prior_summary = session["summary"]
            session["history"] = session["history"][batch_size:]
        else:
            batch_to_summarize = None
            prior_summary = None

    # Run summarization outside the lock so other requests aren't blocked
    if batch_to_summarize:
        new_summary = summarize_history(batch_to_summarize, prior_summary)
        with SESSIONS_LOCK:
            session["summary"] = new_summary


def serialize_activities(session):
    completed_ids = set(session["completed_activities"])
    return [
        {
            "id": activity["id"],
            "title": activity["title"],
            "description": activity["description"],
            "completed": activity["id"] in completed_ids,
        }
        for activity in MINDFULNESS_ACTIVITIES
    ]


def build_step_payload(session):
    activity_id = session["active_activity_id"]
    current_step_index = session["current_step_index"]
    if not activity_id or current_step_index is None:
        return None

    activity = find_activity(activity_id)
    if not activity:
        return None

    return {
        "activity_id": activity["id"],
        "activity_title": activity["title"],
        "activity_description": activity["description"],
        "current_step_index": current_step_index,
        "total_steps": len(activity["steps"]),
        "current_step": activity["steps"][current_step_index],
    }


def send_json(handler, payload, status=200):
    response = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(response)))
    handler.end_headers()
    handler.wfile.write(response)


def send_error_json(handler, status, message):
    send_json(handler, {"error": message}, status=status)


def send_bytes(handler, payload, content_type, status=200):
    handler.send_response(status)
    handler.send_header("Content-Type", content_type)
    handler.send_header("Content-Length", str(len(payload)))
    handler.end_headers()
    handler.wfile.write(payload)


def load_allowed_origins():
    configured = []
    for env_key in ("ALLOWED_ORIGINS", "ALLOWED_ORIGIN"):
        raw = os.getenv(env_key, "")
        if not raw:
            continue
        configured.extend(
            value.strip().rstrip("/")
            for value in raw.split(",")
            if value.strip() and value.strip() != "*"
        )

    if configured:
        return set(configured)
    return set(DEFAULT_ALLOWED_ORIGINS)


ALLOWED_ORIGINS = load_allowed_origins()
CSP_HEADER = "; ".join(
    [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'self'",
        "form-action 'self'",
        "script-src 'self' 'unsafe-inline' https://www.gstatic.com https://translate.google.com https://translate.googleapis.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: blob: https:",
        "media-src 'self' data: blob: https:",
        "connect-src 'self' https: wss:",
        "frame-src 'self' https://translate.google.com https://translate.googleapis.com",
    ]
)


class ChatHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_DIR, **kwargs)

    def get_request_origin(self):
        origin = (self.headers.get("Origin") or "").strip()
        return origin.rstrip("/") if origin else ""

    def get_request_host_origin(self):
        host = (self.headers.get("X-Forwarded-Host") or self.headers.get("Host") or "").strip()
        if not host:
            return ""
        proto = (self.headers.get("X-Forwarded-Proto") or "http").strip()
        return f"{proto}://{host}".rstrip("/")

    def is_origin_allowed(self, origin):
        if not origin:
            return True
        return origin in ALLOWED_ORIGINS or origin == self.get_request_host_origin()

    def require_allowed_origin(self):
        origin = self.get_request_origin()
        if self.is_origin_allowed(origin):
            return True
        send_error_json(self, 403, "Origin is not allowed.")
        return False

    def end_headers(self):
        origin = self.get_request_origin()
        if origin and self.is_origin_allowed(origin):
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Content-Security-Policy", CSP_HEADER)
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.send_header(
            "Permissions-Policy",
            "camera=(), geolocation=(), microphone=(self), browsing-topics=()",
        )
        super().end_headers()

    def get_client_ip(self):
        forwarded_for = self.headers.get("X-Forwarded-For", "")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        return self.client_address[0]

    def require_rate_limit(self, scope, identity):
        limit, window_seconds = RATE_LIMIT_POLICIES[scope]
        now = time.time()
        key = (scope, identity)
        with RATE_LIMITS_LOCK:
            timestamps = RATE_LIMITS.get(key, [])
            timestamps = [ts for ts in timestamps if now - ts < window_seconds]
            if len(timestamps) >= limit:
                retry_after = max(1, int(window_seconds - (now - timestamps[0])))
                self.send_response(429)
                self.send_header("Retry-After", str(retry_after))
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Rate limit exceeded."}).encode("utf-8"))
                RATE_LIMITS[key] = timestamps
                return False
            timestamps.append(now)
            RATE_LIMITS[key] = timestamps
        return True

    def require_auth(self):
        if not FIREBASE_PROJECT_ID:
            send_error_json(self, 500, "Server auth is not configured.")
            return None

        header = self.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            send_error_json(self, 401, "Missing bearer token.")
            return None

        token = header[7:].strip()
        if not token:
            send_error_json(self, 401, "Missing bearer token.")
            return None

        now = time.time()
        with TOKEN_CACHE_LOCK:
            cached = TOKEN_CACHE.get(token)
            if cached and now - cached["verified_at"] < TOKEN_CACHE_TTL_SECONDS:
                return cached["claims"]

        try:
            claims = google_id_token.verify_firebase_token(
                token,
                GOOGLE_AUTH_REQUEST,
                FIREBASE_PROJECT_ID,
            )
        except Exception:
            send_error_json(self, 401, "Invalid or expired bearer token.")
            return None

        user_id = (
            (claims or {}).get("uid")
            or (claims or {}).get("user_id")
            or (claims or {}).get("sub")
        )
        if not claims or not user_id:
            send_error_json(self, 401, "Invalid bearer token.")
            return None
        claims["uid"] = user_id

        with TOKEN_CACHE_LOCK:
            TOKEN_CACHE[token] = {"claims": claims, "verified_at": now}
        return claims

    def do_OPTIONS(self):
        if not self.require_allowed_origin():
            return
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        if self.path == "/health":
            send_json(self, {"status": "ok"})
            return

        if self.path == "/firebase-config":
            if not self.require_allowed_origin():
                return
            self.handle_firebase_config()
            return

        if self.path.startswith("/activities"):
            if not self.require_allowed_origin():
                return
            self.handle_activities()
            return

        super().do_GET()

    def handle_firebase_config(self):
        config = {
            "apiKey": os.getenv("EXPO_PUBLIC_FIREBASE_API_KEY", ""),
            "authDomain": os.getenv("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN", ""),
            "projectId": os.getenv("EXPO_PUBLIC_FIREBASE_PROJECT_ID", ""),
            "storageBucket": os.getenv("EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET", ""),
            "messagingSenderId": os.getenv("EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", ""),
            "appId": os.getenv("EXPO_PUBLIC_FIREBASE_APP_ID", ""),
            "measurementId": os.getenv("EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID", ""),
        }
        send_json(self, {"firebaseConfig": config})

    def do_POST(self):
        if not self.require_allowed_origin():
            return

        if self.path == "/chat":
            self.handle_chat()
            return

        if self.path == "/tts":
            self.handle_tts()
            return

        if self.path == "/tts/prewarm":
            self.handle_tts_prewarm()
            return

        if self.path == "/session/end":
            self.handle_end_session()
            return

        if self.path == "/activities/select":
            self.handle_activity_select()
            return

        if self.path == "/activities/step/complete":
            self.handle_complete_step()
            return

        if self.path == "/chat/stream":
            self.handle_chat_stream()
            return

        self.send_error(404)

    def handle_activities(self):
        params = parse_qs(urlparse(self.path).query)
        session_id = (params.get("session_id") or [""])[0].strip()

        if session_id:
            claims = self.require_auth()
            if not claims:
                return
            if not self.require_rate_limit("activities", claims["uid"]):
                return
            session = get_or_create_session(claims["uid"], session_id)
            payload = {
                "activities": serialize_activities(session),
                "active_step": build_step_payload(session),
            }
        else:
            payload = {
                "activities": [
                    {
                        "id": activity["id"],
                        "title": activity["title"],
                        "description": activity["description"],
                        "completed": False,
                    }
                    for activity in MINDFULNESS_ACTIVITIES
                ],
                "active_step": None,
            }

        send_json(self, payload)

    def handle_chat(self):
        claims = self.require_auth()
        if not claims:
            return
        if not self.require_rate_limit("chat", claims["uid"]):
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(content_length)
        try:
            payload = json.loads(body.decode("utf-8"))
            user_message = payload.get("message", "").strip()
            session_id = payload.get("session_id", "").strip()
            lang = payload.get("lang", "en").strip()
        except json.JSONDecodeError:
            send_error_json(self, 400, "Invalid JSON")
            return

        if not user_message:
            send_error_json(self, 400, "Missing message")
            return

        if not session_id:
            send_error_json(self, 400, "Missing session_id")
            return

        if len(user_message) > MAX_CHAT_MESSAGE_LENGTH:
            send_error_json(self, 413, "Message is too long.")
            return

        session = get_or_create_session(claims["uid"], session_id)
        session_snapshot = get_session_snapshot(claims["uid"], session_id)
        activity_context = None
        if session_snapshot["active_activity_id"] and session_snapshot["current_step_index"] is not None:
            activity_context = find_activity(session_snapshot["active_activity_id"])
        prompt = build_chat_prompt(
            user_message=user_message,
            history=session_snapshot["history"],
            summary=session_snapshot["summary"],
            activity_context=(
                {
                    **activity_context,
                    "current_step_index": session_snapshot["current_step_index"],
                }
                if activity_context
                else None
            ),
            language=lang,
        )

        try:
            result = call_gemini(prompt)
            content = result["choices"][0]["message"]["content"]
            update_session_memory(session, user_message, content)
        except Exception as exc:
            send_error_json(self, 500, f"Model error: {exc}")
            return

        updated_snapshot = get_session_snapshot(claims["uid"], session_id)
        send_json(
            self,
            {
                "reply": content,
                "session_id": session_id,
                "history_count": len(updated_snapshot["history"]),
                "has_summary": bool(updated_snapshot["summary"]),
                "activities": serialize_activities(session),
                "active_step": build_step_payload(session),
            },
        )

    def handle_tts(self):
        claims = self.require_auth()
        if not claims:
            return
        if not self.require_rate_limit("tts", claims["uid"]):
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(content_length)
        try:
            payload = json.loads(body.decode("utf-8"))
            text = payload.get("text", "").strip()
            voice_name = payload.get("voice_name", "").strip() or None
            include_lipsync = bool(payload.get("lipsync_metadata"))
        except json.JSONDecodeError:
            send_error_json(self, 400, "Invalid JSON")
            return

        if not text:
            send_error_json(self, 400, "Missing text")
            return

        if len(text) > MAX_TTS_TEXT_LENGTH:
            send_error_json(self, 413, "Text is too long for synthesis.")
            return

        try:
            result = (
                synthesize_edge_tts_with_lipsync(text=text, voice=voice_name)
                if include_lipsync
                else synthesize_edge_tts(text=text, voice=voice_name)
            )
        except Exception as exc:
            send_error_json(self, 500, f"TTS error: {exc}")
            return

        if include_lipsync:
            send_json(self, {
                "audio": base64.b64encode(result["audio_bytes"]).decode("ascii"),
                "content_type": result["content_type"],
                "voice_name": result["voice_name"],
                "word_boundaries": result["word_boundaries"],
                "rhubarb_mouth_cues": result.get("rhubarb_mouth_cues", []),
                "lipsync_source": result.get("lipsync_source", "word_boundaries"),
            })
            return

        send_bytes(
            self,
            payload=result["audio_bytes"],
            content_type=result["content_type"],
        )

    def handle_tts_prewarm(self):
        claims = self.require_auth()
        if not claims:
            return
        if not self.require_rate_limit("tts_prewarm", claims["uid"]):
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(content_length)
        try:
            payload = json.loads(body.decode("utf-8"))
            texts = payload.get("texts", [])
        except json.JSONDecodeError:
            send_error_json(self, 400, "Invalid JSON")
            return

        if not isinstance(texts, list):
            send_error_json(self, 400, "texts must be an array")
            return

        if len(texts) > MAX_PREWARM_ITEMS:
            send_error_json(self, 413, "Too many prewarm items.")
            return

        cleaned_texts = []
        total_chars = 0
        for item in texts:
            if not isinstance(item, str):
                continue
            value = item.strip()
            if not value:
                continue
            if len(value) > MAX_PREWARM_TEXT_LENGTH:
                send_error_json(self, 413, "A prewarm text is too long.")
                return
            cleaned_texts.append(value)
            total_chars += len(value)
            if total_chars > MAX_PREWARM_TOTAL_CHARS:
                send_error_json(self, 413, "Prewarm payload is too large.")
                return

        if not cleaned_texts:
            send_json(self, {"ok": True, "queued": 0})
            return

        def _warm():
            for text_value in cleaned_texts:
                try:
                    synthesize_edge_tts(text=text_value)
                except Exception:
                    pass

        Thread(target=_warm, daemon=True).start()
        send_json(self, {"ok": True, "queued": len(cleaned_texts)})

    def handle_activity_select(self):
        claims = self.require_auth()
        if not claims:
            return
        if not self.require_rate_limit("activity_select", claims["uid"]):
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(content_length)
        try:
            payload = json.loads(body.decode("utf-8"))
            session_id = payload.get("session_id", "").strip()
            activity_id = payload.get("activity_id", "").strip()
        except json.JSONDecodeError:
            send_error_json(self, 400, "Invalid JSON")
            return

        if not session_id or not activity_id:
            send_error_json(self, 400, "Missing session_id or activity_id")
            return

        activity = find_activity(activity_id)
        if not activity:
            send_error_json(self, 404, "Unknown activity")
            return

        session = get_or_create_session(claims["uid"], session_id)
        with SESSIONS_LOCK:
            session["active_activity_id"] = activity_id
            session["current_step_index"] = 0

        assistant_message = build_activity_step_message(activity, 0)
        update_session_memory(
            session,
            f"I chose the mindfulness activity: {activity['title']}.",
            assistant_message,
        )

        send_json(
            self,
            {
                "reply": assistant_message,
                "activities": serialize_activities(session),
                "active_step": build_step_payload(session),
            },
        )

    def handle_complete_step(self):
        claims = self.require_auth()
        if not claims:
            return
        if not self.require_rate_limit("activity_step", claims["uid"]):
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(content_length)
        try:
            payload = json.loads(body.decode("utf-8"))
            session_id = payload.get("session_id", "").strip()
        except json.JSONDecodeError:
            send_error_json(self, 400, "Invalid JSON")
            return

        if not session_id:
            send_error_json(self, 400, "Missing session_id")
            return

        session = get_or_create_session(claims["uid"], session_id)
        activity_id = session["active_activity_id"]
        current_step_index = session["current_step_index"]
        if not activity_id or current_step_index is None:
            send_error_json(self, 400, "No active activity")
            return

        activity = find_activity(activity_id)
        if not activity:
            send_error_json(self, 404, "Unknown activity")
            return

        completed_step_message = (
            f"I completed step {current_step_index + 1} of {activity['title']}."
        )

        if current_step_index + 1 < len(activity["steps"]):
            next_step_index = current_step_index + 1
            with SESSIONS_LOCK:
                session["current_step_index"] = next_step_index
            assistant_message = build_activity_step_message(activity, next_step_index)
            update_session_memory(session, completed_step_message, assistant_message)
            send_json(
                self,
                {
                    "reply": assistant_message,
                    "activities": serialize_activities(session),
                    "active_step": build_step_payload(session),
                    "activity_completed": False,
                },
            )
            return

        completion_message = (
            f"You completed {activity['title']}. Take a moment to notice how you feel now."
        )
        with SESSIONS_LOCK:
            if activity_id not in session["completed_activities"]:
                session["completed_activities"].append(activity_id)
            session["active_activity_id"] = None
            session["current_step_index"] = None
        update_session_memory(session, completed_step_message, completion_message)
        send_json(
            self,
            {
                "reply": completion_message,
                "activities": serialize_activities(session),
                "active_step": None,
                "activity_completed": True,
            },
        )

    def _write_sse(self, data_dict):
        line = "data: " + json.dumps(data_dict) + "\n\n"
        try:
            self.wfile.write(line.encode("utf-8"))
            self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            raise _ClientDisconnected()

    def handle_chat_stream(self):
        claims = self.require_auth()
        if not claims:
            return
        if not self.require_rate_limit("chat_stream", claims["uid"]):
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(content_length)
        try:
            payload = json.loads(body.decode("utf-8"))
            user_message = payload.get("message", "").strip()
            session_id = payload.get("session_id", "").strip()
            lang = payload.get("lang", "en").strip()
        except json.JSONDecodeError:
            send_error_json(self, 400, "Invalid JSON")
            return

        if not user_message:
            send_error_json(self, 400, "Missing message")
            return
        if not session_id:
            send_error_json(self, 400, "Missing session_id")
            return

        if len(user_message) > MAX_CHAT_MESSAGE_LENGTH:
            send_error_json(self, 413, "Message is too long.")
            return

        session = get_or_create_session(claims["uid"], session_id)
        session_snapshot = get_session_snapshot(claims["uid"], session_id)
        activity_context = None
        if session_snapshot["active_activity_id"] and session_snapshot["current_step_index"] is not None:
            activity_context = find_activity(session_snapshot["active_activity_id"])
        prompt = build_chat_prompt(
            user_message=user_message,
            history=session_snapshot["history"],
            summary=session_snapshot["summary"],
            activity_context=(
                {
                    **activity_context,
                    "current_step_index": session_snapshot["current_step_index"],
                }
                if activity_context
                else None
            ),
            language=lang,
        )

        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Accel-Buffering", "no")
        self.close_connection = True
        self.end_headers()

        # Each sentence from Gemini triggers a TTS worker that streams MP3
        # chunks immediately as they arrive from Edge TTS.  The client receives
        # audio_chunk events within ~300 ms of each sentence being extracted —
        # no waiting for the full sentence to synthesise before playback starts.
        event_q = queue.Queue()
        full_chunks = []

        def _tts_stream_worker(seq, text):
            try:
                for raw in synthesize_edge_tts_streaming(text=text):
                    event_q.put({"audio_chunk": base64.b64encode(raw).decode("ascii"), "seq": seq})
            except Exception:
                pass
            finally:
                event_q.put({"audio_end": True, "seq": seq})

        def _gemini_producer(pool):
            buf = ""
            seq = 0
            try:
                for fragment in call_gemini_stream(prompt):
                    buf += fragment
                    chunks, buf = extract_speakable_chunks(buf)
                    for chunk in chunks:
                        full_chunks.append(chunk)
                        event_q.put({"chunk": chunk, "seq": seq})
                        pool.submit(_tts_stream_worker, seq, chunk)
                        seq += 1
                if buf.strip():
                    full_chunks.append(buf.strip())
                    event_q.put({"chunk": buf.strip(), "seq": seq})
                    pool.submit(_tts_stream_worker, seq, buf.strip())
                    seq += 1
            except Exception as exc:
                event_q.put({"_error": str(exc)})
            finally:
                event_q.put({"_gemini_done": True, "total": seq})

        with ThreadPoolExecutor(max_workers=3) as pool:
            producer = Thread(target=_gemini_producer, args=(pool,), daemon=True)
            producer.start()

            gemini_done = False
            total_sentences = 0
            audio_ended = 0

            try:
                while True:
                    try:
                        evt = event_q.get(timeout=45)
                    except queue.Empty:
                        break

                    if "_gemini_done" in evt:
                        gemini_done = True
                        total_sentences = evt["total"]
                        if total_sentences == 0 or audio_ended >= total_sentences:
                            break
                    elif "_error" in evt:
                        self._write_sse({"error": evt["_error"]})
                        break
                    elif "audio_end" in evt:
                        self._write_sse(evt)
                        audio_ended += 1
                        if gemini_done and audio_ended >= total_sentences:
                            break
                    else:
                        self._write_sse(evt)
            except _ClientDisconnected:
                pass

            producer.join(timeout=5)

        complete_text = " ".join(full_chunks)
        if complete_text:
            update_session_memory(session, user_message, complete_text)
        try:
            self._write_sse({"done": True, "session_id": session_id})
        except _ClientDisconnected:
            pass

    def handle_end_session(self):
        claims = self.require_auth()
        if not claims:
            return
        if not self.require_rate_limit("session_end", claims["uid"]):
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(content_length)
        try:
            payload = json.loads(body.decode("utf-8"))
            session_id = payload.get("session_id", "").strip()
        except json.JSONDecodeError:
            send_error_json(self, 400, "Invalid JSON")
            return

        if not session_id:
            send_error_json(self, 400, "Missing session_id")
            return

        session_snapshot = get_session_snapshot(claims["uid"], session_id)
        if not session_snapshot["history"] and not session_snapshot["summary"]:
            remove_session(claims["uid"], session_id)
            send_json(self, {"summary": "This session ended before any messages were sent."})
            return

        try:
            recap = build_session_recap(
                summary=session_snapshot["summary"],
                history=session_snapshot["history"],
            )
        except Exception as exc:
            send_error_json(self, 500, f"Model error: {exc}")
            return

        remove_session(claims["uid"], session_id)
        send_json(self, {"summary": recap})


def _prewarm_gemini():
    """Run one tiny generate_content call so the model object, TLS, and
    auth handshake are ready before the first real user request.
    Executed in a daemon thread so it never blocks server startup."""
    try:
        call_gemini("ping", temperature=0.0)
        print("Gemini pre-warm complete.")
    except Exception as exc:
        print(f"Gemini pre-warm failed (will lazy-init on first request): {exc}")


def main():
    host = "0.0.0.0"
    port = int(os.getenv("PORT", "8000"))
    Thread(target=_prewarm_gemini, daemon=True).start()
    with ThreadingHTTPServer((host, port), ChatHandler) as httpd:
        print(f"Serving on http://{host}:{port}")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
