import json
import os
from threading import Lock
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

from chatbot import build_chat_prompt, build_session_recap, call_gemini, summarize_history


WEB_DIR = os.path.join(os.path.dirname(__file__), "web")
MAX_HISTORY_MESSAGES = 20
SUMMARY_BATCH_SIZE = 2
SESSIONS = {}
SESSIONS_LOCK = Lock()


def get_or_create_session(session_id):
    with SESSIONS_LOCK:
        session = SESSIONS.get(session_id)
        if session is None:
            session = {"history": [], "summary": ""}
            SESSIONS[session_id] = session
        return session


def get_session_snapshot(session_id):
    session = get_or_create_session(session_id)
    with SESSIONS_LOCK:
        return {
            "history": list(session["history"]),
            "summary": session["summary"],
        }


def remove_session(session_id):
    with SESSIONS_LOCK:
        return SESSIONS.pop(session_id, None)


def update_session_memory(session, user_message, assistant_message):
    with SESSIONS_LOCK:
        session["history"].append({"role": "user", "content": user_message})
        session["history"].append({"role": "assistant", "content": assistant_message})

        if len(session["history"]) > MAX_HISTORY_MESSAGES:
            overflow = len(session["history"]) - MAX_HISTORY_MESSAGES
            batch_size = max(SUMMARY_BATCH_SIZE, overflow)
            batch_to_summarize = session["history"][:batch_size]
            session["summary"] = summarize_history(batch_to_summarize, session["summary"])
            session["history"] = session["history"][batch_size:]


class ChatHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_DIR, **kwargs)

    def do_POST(self):
        if self.path == "/chat":
            self.handle_chat()
            return

        if self.path == "/session/end":
            self.handle_end_session()
            return

        self.send_error(404)

    def handle_chat(self):
        content_length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(content_length)
        try:
            payload = json.loads(body.decode("utf-8"))
            user_message = payload.get("message", "").strip()
            session_id = payload.get("session_id", "").strip()
        except json.JSONDecodeError:
            self.send_error(400, "Invalid JSON")
            return

        if not user_message:
            self.send_error(400, "Missing message")
            return

        if not session_id:
            self.send_error(400, "Missing session_id")
            return

        session = get_or_create_session(session_id)
        session_snapshot = get_session_snapshot(session_id)
        prompt = build_chat_prompt(
            user_message=user_message,
            history=session_snapshot["history"],
            summary=session_snapshot["summary"],
        )

        try:
            result = call_gemini(prompt)
            content = result["choices"][0]["message"]["content"]
            update_session_memory(session, user_message, content)
        except Exception as exc:
            self.send_error(500, f"Model error: {exc}")
            return

        updated_snapshot = get_session_snapshot(session_id)
        response = json.dumps(
            {
                "reply": content,
                "session_id": session_id,
                "history_count": len(updated_snapshot["history"]),
                "has_summary": bool(updated_snapshot["summary"]),
            }
        ).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(response)))
        self.end_headers()
        self.wfile.write(response)

    def handle_end_session(self):
        content_length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(content_length)
        try:
            payload = json.loads(body.decode("utf-8"))
            session_id = payload.get("session_id", "").strip()
        except json.JSONDecodeError:
            self.send_error(400, "Invalid JSON")
            return

        if not session_id:
            self.send_error(400, "Missing session_id")
            return

        session_snapshot = get_session_snapshot(session_id)
        if not session_snapshot["history"] and not session_snapshot["summary"]:
            remove_session(session_id)
            response = json.dumps(
                {"summary": "This session ended before any messages were sent."}
            ).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(response)))
            self.end_headers()
            self.wfile.write(response)
            return

        try:
            recap = build_session_recap(
                summary=session_snapshot["summary"],
                history=session_snapshot["history"],
            )
        except Exception as exc:
            self.send_error(500, f"Model error: {exc}")
            return

        remove_session(session_id)
        response = json.dumps({"summary": recap}).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(response)))
        self.end_headers()
        self.wfile.write(response)


def main():
    host = "127.0.0.1"
    port = 8000
    with ThreadingHTTPServer((host, port), ChatHandler) as httpd:
        print(f"Serving on http://{host}:{port}")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
