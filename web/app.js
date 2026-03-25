const chat = document.getElementById("chat");
const statusEl = document.getElementById("status");
const messageEl = document.getElementById("message");
const sendBtn = document.getElementById("send");
const SESSION_STORAGE_KEY = "mindfulness_session_id";

function createSessionId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getSessionId() {
  let sessionId = window.localStorage.getItem(SESSION_STORAGE_KEY);

  if (!sessionId) {
    sessionId = createSessionId();
    window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }

  return sessionId;
}

function setStatus(text, busy) {
  statusEl.textContent = text;
  sendBtn.disabled = !!busy;
  messageEl.disabled = !!busy;
}

function addMessage(text, who) {
  const div = document.createElement("div");
  div.className = `message ${who}`;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

async function sendMessage() {
  const message = messageEl.value.trim();
  if (!message) return;

  messageEl.value = "";
  addMessage(message, "user");
  setStatus("Thinking...", true);

  try {
    const resp = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        session_id: getSessionId()
      })
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(text || "Request failed");
    }

    const data = await resp.json();
    addMessage(data.reply || "(No response text returned.)", "assistant");
  } catch (err) {
    addMessage(`(Error) ${err.message}`, "assistant");
  } finally {
    setStatus("Ready", false);
  }
}

sendBtn.addEventListener("click", sendMessage);
messageEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

addMessage("Ready. Type a message to start your session", "assistant");
