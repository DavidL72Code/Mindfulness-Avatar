const chat = document.getElementById("chat");
const statusEl = document.getElementById("status");
const messageEl = document.getElementById("message");
const sendBtn = document.getElementById("send");
const startBtn = document.getElementById("start-session");
const endBtn = document.getElementById("end-session");
const modalEl = document.getElementById("session-modal");
const sessionDurationEl = document.getElementById("session-duration");
const sessionSummaryEl = document.getElementById("session-summary");
const closeModalBtn = document.getElementById("close-modal");

let activeSessionId = null;
let sessionActive = false;
let sessionStartTime = null;
let timerIntervalId = null;

function createSessionId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, seconds]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  }

  return [minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function renderTimer() {
  if (!sessionStartTime) {
    return "00:00";
  }

  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - sessionStartTime) / 1000)
  );
  return formatDuration(elapsedSeconds);
}

function startTimer() {
  stopTimer();
  renderTimer();
  timerIntervalId = window.setInterval(() => {
    renderTimer();
  }, 1000);
}

function stopTimer() {
  if (timerIntervalId) {
    window.clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
}

function setStatus(text, busy = false) {
  statusEl.textContent = text;
  sendBtn.disabled = busy || !sessionActive;
  endBtn.disabled = busy || !sessionActive;
  startBtn.disabled = busy || sessionActive;
  messageEl.disabled = busy || !sessionActive;
}

function clearChat() {
  chat.innerHTML = "";
  chat.classList.add("empty");
}

function addMessage(text, who) {
  const div = document.createElement("div");
  div.className = `message ${who}`;
  div.textContent = text;
  chat.appendChild(div);
  chat.classList.remove("empty");
  chat.scrollTop = chat.scrollHeight;
}

function showIdleState() {
  clearChat();
  addMessage("Press Start Session when you are ready to begin.", "system");
  messageEl.value = "";
  messageEl.placeholder = "Press Start Session to begin";
  setStatus("Session not started", false);
}

function openModal(durationText, summaryText) {
  sessionDurationEl.textContent = `Session length: ${durationText}`;
  sessionSummaryEl.textContent = summaryText;
  modalEl.classList.remove("hidden");
  modalEl.setAttribute("aria-hidden", "false");
}

function closeModal() {
  modalEl.classList.add("hidden");
  modalEl.setAttribute("aria-hidden", "true");
}

function startSession() {
  activeSessionId = createSessionId();
  sessionActive = true;
  sessionStartTime = Date.now();
  clearChat();
  addMessage("Type a message to start your session.", "assistant");
  messageEl.placeholder = "Type your message...";
  setStatus("Session active", false);
  startTimer();
  messageEl.focus();
}

async function sendMessage() {
  if (!sessionActive) {
    return;
  }

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
        session_id: activeSessionId
      })
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(text || "Request failed");
    }

    const data = await resp.json();
    addMessage(data.reply || "(No response text returned.)", "assistant");
    setStatus("Session active", false);
  } catch (err) {
    addMessage(`(Error) ${err.message}`, "assistant");
    setStatus("Session active", false);
  }
}

async function endSession() {
  if (!sessionActive || !activeSessionId) {
    return;
  }

  setStatus("Ending session...", true);
  stopTimer();

  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - sessionStartTime) / 1000)
  );
  const durationText = formatDuration(elapsedSeconds);

  try {
    const resp = await fetch("/session/end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: activeSessionId })
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(text || "Failed to end session");
    }

    const data = await resp.json();
    const summaryText = data.summary || "No session summary was generated.";
    openModal(durationText, summaryText);
  } catch (err) {
    openModal(durationText, `The session ended, but the recap could not be loaded: ${err.message}`);
  } finally {
    activeSessionId = null;
    sessionActive = false;
    sessionStartTime = null;
    showIdleState();
  }
}

startBtn.addEventListener("click", startSession);
sendBtn.addEventListener("click", sendMessage);
endBtn.addEventListener("click", endSession);
closeModalBtn.addEventListener("click", closeModal);
modalEl.addEventListener("click", (event) => {
  if (event.target === modalEl) {
    closeModal();
  }
});

messageEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

showIdleState();
