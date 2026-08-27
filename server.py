import base64
import binascii
import hashlib
import hmac
import html
import json
import os
import queue
import re
import secrets
import time
from concurrent.futures import ThreadPoolExecutor
from threading import Lock, Thread
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse
from urllib.request import Request as UrlRequest, urlopen

from google.auth.transport.requests import Request as GoogleAuthRequest
from google.oauth2 import id_token as google_id_token

from chatbot import (
    build_activity_step_message,
    build_profile_update,
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
MAX_PROFILE_LENGTH = 2000
MAX_TTS_TEXT_LENGTH = 1200
MAX_PREWARM_ITEMS = 100
MAX_PREWARM_TEXT_LENGTH = 500
MAX_PREWARM_TOTAL_CHARS = 12000
TOKEN_CACHE_TTL_SECONDS = 300
ACCOUNT_DELETION_TOKEN_TTL_SECONDS = 30 * 60
ACCOUNT_DELETION_SECRET = os.getenv("ACCOUNT_DELETION_SECRET", "").strip()
ACCOUNT_DELETION_BASE_URL = os.getenv(
    "ACCOUNT_DELETION_BASE_URL",
    "https://mindfulness-avatar.onrender.com",
).strip().rstrip("/")
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "").strip()
ACCOUNT_DELETION_FROM_EMAIL = os.getenv("ACCOUNT_DELETION_FROM_EMAIL", "").strip()
FIREBASE_SERVICE_ACCOUNT_JSON = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()
FIREBASE_ADMIN_LOCK = Lock()
FIREBASE_ADMIN_SERVICES = None

RATE_LIMIT_POLICIES = {
    "activities": (60, 60),
    "chat": (12, 60),
    "chat_stream": (12, 60),
    "tts": (20, 60),
    "tts_prewarm": (2, 300),
    "session_end": (10, 60),
    "activity_select": (20, 60),
    "activity_step": (30, 60),
    "account_deletion_request": (3, 60 * 60),
    "account_deletion_confirm": (8, 60 * 60),
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


def send_html(handler, markup, status=200):
    payload = markup.encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "text/html; charset=utf-8")
    handler.send_header("Cache-Control", "no-store")
    handler.send_header("Content-Length", str(len(payload)))
    handler.end_headers()
    handler.wfile.write(payload)


def _base64url_encode(value):
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _base64url_decode(value):
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode((value + padding).encode("ascii"))


def create_account_deletion_token(user_id, email_address):
    if len(ACCOUNT_DELETION_SECRET) < 32:
        raise RuntimeError("Account deletion signing is not configured.")
    payload = {
        "purpose": "account-deletion",
        "uid": user_id,
        "email": email_address,
        "exp": int(time.time()) + ACCOUNT_DELETION_TOKEN_TTL_SECONDS,
        "jti": secrets.token_urlsafe(18),
    }
    encoded = _base64url_encode(
        json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    )
    signature = hmac.new(
        ACCOUNT_DELETION_SECRET.encode("utf-8"),
        encoded.encode("ascii"),
        hashlib.sha256,
    ).digest()
    return f"{encoded}.{_base64url_encode(signature)}"


def verify_account_deletion_token(token):
    if len(ACCOUNT_DELETION_SECRET) < 32:
        raise ValueError("Account deletion is not configured.")
    try:
        encoded, supplied_signature = token.split(".", 1)
        expected_signature = hmac.new(
            ACCOUNT_DELETION_SECRET.encode("utf-8"),
            encoded.encode("ascii"),
            hashlib.sha256,
        ).digest()
        if not hmac.compare_digest(
            expected_signature,
            _base64url_decode(supplied_signature),
        ):
            raise ValueError("Invalid token signature.")
        payload = json.loads(_base64url_decode(encoded).decode("utf-8"))
    except (
        ValueError,
        TypeError,
        AttributeError,
        binascii.Error,
        json.JSONDecodeError,
        UnicodeDecodeError,
    ) as exc:
        raise ValueError("Invalid deletion token.") from exc

    if not isinstance(payload, dict):
        raise ValueError("Invalid deletion token payload.")
    if payload.get("purpose") != "account-deletion":
        raise ValueError("Invalid deletion token purpose.")
    if not payload.get("uid") or not payload.get("email") or not payload.get("jti"):
        raise ValueError("Incomplete deletion token.")
    if int(payload.get("exp", 0)) < int(time.time()):
        raise ValueError("Deletion token has expired.")
    return payload


def send_transactional_email(to_address, subject, html_body, text_body):
    if not RESEND_API_KEY or not ACCOUNT_DELETION_FROM_EMAIL:
        raise RuntimeError("Account deletion email is not configured.")
    payload = json.dumps({
        "from": ACCOUNT_DELETION_FROM_EMAIL,
        "to": [to_address],
        "subject": subject,
        "html": html_body,
        "text": text_body,
    }).encode("utf-8")
    request = UrlRequest(
        "https://api.resend.com/emails",
        data=payload,
        headers={
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": "MindfulnessConnected/1.0",
        },
        method="POST",
    )
    with urlopen(request, timeout=15) as response:
        if response.status < 200 or response.status >= 300:
            raise RuntimeError("Email provider rejected the request.")


def get_firebase_admin_services():
    global FIREBASE_ADMIN_SERVICES
    with FIREBASE_ADMIN_LOCK:
        if FIREBASE_ADMIN_SERVICES is not None:
            return FIREBASE_ADMIN_SERVICES

        import firebase_admin
        from firebase_admin import auth as admin_auth
        from firebase_admin import credentials, firestore

        if not firebase_admin._apps:
            if FIREBASE_SERVICE_ACCOUNT_JSON:
                credential_data = json.loads(FIREBASE_SERVICE_ACCOUNT_JSON)
                firebase_admin.initialize_app(credentials.Certificate(credential_data))
            else:
                firebase_admin.initialize_app(options={"projectId": FIREBASE_PROJECT_ID})
        FIREBASE_ADMIN_SERVICES = (admin_auth, firestore.client(), firestore)
        return FIREBASE_ADMIN_SERVICES


def delete_firebase_account_data(user_id):
    admin_auth, database, firestore_module = get_firebase_admin_services()
    user_ref = database.collection("users").document(user_id)
    # Block still-valid client ID tokens from recreating data during deletion.
    database.collection("_account_deletions").document(user_id).set({
        "deletedAt": firestore_module.SERVER_TIMESTAMP,
    })
    if hasattr(database, "recursive_delete"):
        database.recursive_delete(user_ref)
    else:
        for session in user_ref.collection("sessions").stream():
            session.reference.delete()
        user_ref.delete()
    try:
        admin_auth.delete_user(user_id)
    except admin_auth.UserNotFoundError:
        pass
    with SESSIONS_LOCK:
        stale_keys = [key for key in SESSIONS if key.startswith(f"{user_id}:")]
        for key in stale_keys:
            SESSIONS.pop(key, None)
    with TOKEN_CACHE_LOCK:
        stale_tokens = [
            token for token, entry in TOKEN_CACHE.items()
            if entry.get("claims", {}).get("uid") == user_id
        ]
        for token in stale_tokens:
            TOKEN_CACHE.pop(token, None)


def account_deletion_page(title, body, form_token=None, success=False):
    safe_title = html.escape(title)
    safe_body = html.escape(body)
    form = ""
    if form_token:
        safe_token = html.escape(form_token, quote=True)
        form = f"""
          <form method="post" action="/account-deletion/confirm">
            <input type="hidden" name="token" value="{safe_token}">
            <button type="submit">Permanently delete my account</button>
          </form>
        """
    icon = (
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>'
        if success
        else '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4.5 6v5c0 4.8 3.2 8.4 7.5 10 4.3-1.6 7.5-5.2 7.5-10V6L12 3Z"/><path d="M9 12h6M12 9v6"/></svg>'
    )
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{safe_title} · Mindfulness Connected</title>
<style>
*{{box-sizing:border-box}}body{{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#f0f5f3;color:#152a43;font-family:ui-rounded,"Avenir Next",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}}
main{{width:min(100%,560px);padding:clamp(28px,7vw,52px);background:#fff;border:1px solid #dbe6e2;border-radius:24px;box-shadow:0 20px 60px rgba(34,64,62,.1)}}
.icon{{width:52px;height:52px;display:grid;place-items:center;border-radius:17px;background:#e7f1ed;color:#2d6b62}}.icon svg{{width:27px;height:27px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}}h1{{margin:22px 0 12px;font-size:clamp(2rem,7vw,3rem);line-height:1.05;letter-spacing:-.04em}}p{{color:#586d7c;line-height:1.65}}.notice{{margin:22px 0;padding:15px;border-radius:14px;background:#fff4f2;color:#7c3a38;font-size:.9rem}}button{{width:100%;min-height:52px;border:0;border-radius:14px;background:#9b3b3b;color:#fff;font:inherit;font-weight:800;cursor:pointer}}button:hover{{background:#812f2f}}button:focus-visible{{outline:3px solid #e2aaa4;outline-offset:3px}}a{{color:#245d71}}
</style></head><body><main><div class="icon">{icon}</div><h1>{safe_title}</h1><p>{safe_body}</p>{'<p class="notice">This action cannot be undone. Your profile, session history, activity statistics, and sign-in account will be removed.</p>' if form_token else ''}{form}<p><a href="https://mindfulness-avatar.vercel.app/privacy">Privacy policy</a></p></main></body></html>"""


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
        # 'wasm-unsafe-eval' lets the meshopt decoder compile its WebAssembly.
        # It permits WASM only — it does NOT enable eval() of JavaScript strings,
        # which 'unsafe-eval' would.
        "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://www.gstatic.com https://translate.google.com https://translate.googleapis.com",
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

    def guess_type(self, path):
        # Keep module responses compatible with strict MIME checking in browsers.
        if path.endswith((".js", ".mjs")):
            return "application/javascript"
        return super().guess_type(path)

    def log_message(self, format_string, *args):
        # Confirmation tokens are credentials and must never appear in request logs.
        sanitized = list(args)
        if sanitized and isinstance(sanitized[0], str):
            sanitized[0] = re.sub(
                r"([?&]token=)[^& ]+",
                r"\1[redacted]",
                sanitized[0],
            )
        super().log_message(format_string, *sanitized)

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
        parsed_path = urlparse(self.path)
        if parsed_path.path == "/account-deletion/confirm":
            self.handle_account_deletion_confirmation(parsed_path)
            return

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

        parsed_path = urlparse(self.path).path

        if parsed_path == "/account-deletion/request":
            self.handle_account_deletion_request()
            return

        if parsed_path == "/account-deletion/confirm":
            self.handle_account_deletion_commit()
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

        if self.path == "/profile/summarize":
            self.handle_profile_summarize()
            return

        if self.path == "/chat/stream":
            self.handle_chat_stream()
            return

        self.send_error(404)

    def handle_account_deletion_request(self):
        claims = self.require_auth()
        if not claims:
            return
        if not self.require_rate_limit("account_deletion_request", claims["uid"]):
            return

        email_address = str(claims.get("email") or "").strip().lower()
        if not email_address or "@" not in email_address:
            send_error_json(self, 400, "The account does not have a valid email address.")
            return

        try:
            if not ACCOUNT_DELETION_BASE_URL.startswith("https://"):
                raise RuntimeError("Account deletion URL must use HTTPS.")
            token = create_account_deletion_token(claims["uid"], email_address)
            confirmation_url = (
                f"{ACCOUNT_DELETION_BASE_URL}/account-deletion/confirm?token={token}"
            )
            safe_url = html.escape(confirmation_url, quote=True)
            safe_email = html.escape(email_address)
            send_transactional_email(
                email_address,
                "Confirm your Mindfulness Connected account deletion",
                f"""<div style="font-family:'Avenir Next',Avenir,sans-serif;line-height:1.6;color:#162846;max-width:560px;margin:auto">
                <h1 style="font-size:28px">Confirm account deletion</h1>
                <p>A request was made to delete the Mindfulness Connected account for {safe_email}.</p>
                <p><a href="{safe_url}" style="display:inline-block;background:#9b3b3b;color:white;padding:13px 18px;border-radius:10px;text-decoration:none;font-weight:bold">Review deletion request</a></p>
                <p>This link expires in 30 minutes. Opening it does not immediately delete your account; you must confirm on the page.</p>
                <p>If you did not request this, ignore this email and your account will remain unchanged.</p></div>""",
                "Confirm your Mindfulness Connected account deletion:\n\n"
                f"{confirmation_url}\n\nThis link expires in 30 minutes. "
                "If you did not request this, ignore this email.",
            )
        except Exception as exc:
            print(f"Account deletion email failed: {type(exc).__name__}")
            send_error_json(self, 503, "Deletion email could not be sent right now.")
            return

        send_json(
            self,
            {"sent": True, "expires_in": ACCOUNT_DELETION_TOKEN_TTL_SECONDS},
            status=202,
        )

    def handle_account_deletion_confirmation(self, parsed_path):
        token = (parse_qs(parsed_path.query).get("token") or [""])[0].strip()
        try:
            payload = verify_account_deletion_token(token)
        except ValueError:
            send_html(
                self,
                account_deletion_page(
                    "This link is no longer valid",
                    "Request a new deletion email from the mobile app. Your account has not been changed.",
                ),
                status=400,
            )
            return
        masked_email = payload["email"][:2] + "…@" + payload["email"].split("@", 1)[1]
        send_html(
            self,
            account_deletion_page(
                "Confirm account deletion",
                f"You are deleting the Mindfulness Connected account for {masked_email}.",
                form_token=token,
            ),
        )

    def handle_account_deletion_commit(self):
        if not self.require_rate_limit("account_deletion_confirm", self.get_client_ip()):
            return
        if not self.headers.get("Content-Type", "").lower().startswith(
            "application/x-www-form-urlencoded"
        ):
            send_error_json(self, 415, "Unsupported form submission.")
            return
        try:
            content_length = max(
                0,
                min(int(self.headers.get("Content-Length", "0")), 8192),
            )
        except ValueError:
            send_error_json(self, 400, "Invalid content length.")
            return
        body = self.rfile.read(content_length).decode("utf-8", errors="replace")
        token = (parse_qs(body).get("token") or [""])[0].strip()
        try:
            payload = verify_account_deletion_token(token)
        except ValueError:
            send_html(
                self,
                account_deletion_page(
                    "This link is no longer valid",
                    "Request a new deletion email from the mobile app. Your account has not been changed.",
                ),
                status=400,
            )
            return

        try:
            delete_firebase_account_data(payload["uid"])
        except Exception as exc:
            print(f"Account deletion failed: {type(exc).__name__}")
            send_html(
                self,
                account_deletion_page(
                    "We could not finish deletion",
                    "No additional action is needed right now. Please try the link again or contact support.",
                ),
                status=503,
            )
            return

        try:
            send_transactional_email(
                payload["email"],
                "Your Mindfulness Connected account was deleted",
                "<div style=\"font-family:'Avenir Next',Avenir,sans-serif;line-height:1.6;color:#162846;max-width:560px;margin:auto\"><h1>Account deleted</h1><p>Your Mindfulness Connected account and account-linked activity data were deleted.</p><p>If you did not authorize this, contact support@mindfulnessconnected.app.</p></div>",
                "Your Mindfulness Connected account and account-linked activity data were deleted. If you did not authorize this, contact support@mindfulnessconnected.app.",
            )
        except Exception as exc:
            print(f"Account deletion receipt failed: {type(exc).__name__}")

        send_html(
            self,
            account_deletion_page(
                "Your account was deleted",
                "Your sign-in account and account-linked mindfulness data have been removed. You can close this page.",
                success=True,
            ),
        )

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
            profile = str(payload.get("profile", ""))[:MAX_PROFILE_LENGTH]
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
            profile=profile,
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

    def handle_profile_summarize(self):
        """Fold a finished conversation into the caller's durable profile.

        The server has no Firestore write access, so it returns the merged
        profile and the client persists it on the user document.
        """
        claims = self.require_auth()
        if not claims:
            return
        if not self.require_rate_limit("chat", claims["uid"]):
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(content_length)
        try:
            payload = json.loads(body.decode("utf-8"))
        except json.JSONDecodeError:
            send_error_json(self, 400, "Invalid JSON")
            return

        transcript = payload.get("transcript") or []
        if not isinstance(transcript, list):
            send_error_json(self, 400, "transcript must be a list")
            return
        prior = str(payload.get("profile", ""))[:MAX_PROFILE_LENGTH]

        clean = []
        for item in transcript[-80:]:
            if not isinstance(item, dict):
                continue
            text = str(item.get("text") or item.get("content") or "")[:1000]
            if text:
                clean.append({"role": item.get("role", "user"), "text": text})

        try:
            updated = build_profile_update(clean, prior)
        except Exception as exc:  # noqa: BLE001
            send_error_json(self, 500, f"Model error: {exc}")
            return

        send_json(self, {"profile": (updated or "")[:MAX_PROFILE_LENGTH]})

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
            profile = str(payload.get("profile", ""))[:MAX_PROFILE_LENGTH]
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
            profile=profile,
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
