const API_BASE_URL = "https://multilingual-virtual-assistant.onrender.com";
const TOTAL_BREATHING_ROUNDS = 4;
const BOX_TRACE_SIDES = ["top", "right", "bottom", "left"];

const breathingPhases = [
  { badge: "Inhale", label: "Inhale", scale: 1.5, duration: 4000 },
  { badge: "Hold", label: "Hold", scale: 1.5, duration: 4000 },
  { badge: "Exhale", label: "Exhale", scale: 1, duration: 4000 },
  { badge: "Hold", label: "Hold", scale: 1, duration: 4000 }
];

const breathingSlides = [
  {
    key: "intro",
    stepLabel: "Introduction",
    title: "Breathe better,<br>feel calmer",
    titlePlain: "Breathe better, feel calmer",
    body:
      "A simple guide to conscious breathing. Works anytime at your desk, before a test, or when you feel overwhelmed."
  },
  {
    key: "comfort",
    stepLabel: "Step 1 of 4",
    title: "Get comfortable",
    titlePlain: "Get comfortable",
    body: "Before you start, set yourself up for success.",
    tips: [
      "Sit upright in a chair or on the floor",
      "Rest your hands loosely on your thighs",
      "Close your eyes or soften your gaze",
      "Relax your jaw and drop your shoulders"
    ],
    note: "You do not need a special place. A quiet corner works just fine."
  },
  {
    key: "rounds",
    stepLabel: "Step 2 of 4",
    title: "Breathe",
    titlePlain: "Breathe",
    body:
      "Complete 4 rounds of box breathing. Press Start Round to begin each round.",
    note: "Follow the circle and keep the breath steady and gentle."
  },
  {
    key: "pattern",
    stepLabel: "Step 3 of 4",
    title: "The 4-4-4-4 pattern",
    titlePlain: "The 4-4-4-4 pattern",
    body:
      "Inhale, hold, exhale, hold. Each side lasts 4 counts, and each round follows the same square path."
  },
  {
    key: "return",
    stepLabel: "Step 4 of 4",
    title: "Return slowly",
    titlePlain: "Return slowly",
    body:
      "After your rounds, let your breath return to normal and notice how you feel.",
    note:
      "Practice once a day. Even 2 minutes can build a steady habit before stressful moments."
  }
];

const sessionCatalog = [
  {
    id: "box-breathing",
    title: "Box Breathing",
    description: "A guided 5-slide breathing tutorial with a 4-round practice.",
    kind: "guided",
    duration: "5 slides"
  },
  {
    id: "body-scan",
    title: "Body Scan",
    description: "A guided check-in from head to toe.",
    kind: "placeholder",
    duration: "Coming soon"
  },
  {
    id: "five-senses",
    title: "Five Senses Grounding",
    description: "A grounding exercise to reconnect with the present moment.",
    kind: "placeholder",
    duration: "Coming soon"
  },
  {
    id: "gratitude-pause",
    title: "Gratitude Pause",
    description: "A moment to gently shift attention toward what is good.",
    kind: "placeholder",
    duration: "Coming soon"
  },
  {
    id: "loving-kindness",
    title: "Loving Kindness",
    description: "A compassion-focused mindfulness practice.",
    kind: "placeholder",
    duration: "Coming soon"
  },
  {
    id: "mindful-walking",
    title: "Mindful Walking",
    description: "A light movement practice with full attention on each step.",
    kind: "placeholder",
    duration: "Coming soon"
  },
  {
    id: "seated-stretch",
    title: "Seated Stretch Reset",
    description: "Gentle seated stretches to release tension.",
    kind: "placeholder",
    duration: "Coming soon"
  },
  {
    id: "mindful-listening",
    title: "Mindful Listening",
    description: "A practice that centers attention through sound.",
    kind: "placeholder",
    duration: "Coming soon"
  },
  {
    id: "affirmation-breath",
    title: "Affirmation Breath",
    description: "Pair a calming phrase with your breath.",
    kind: "placeholder",
    duration: "Coming soon"
  },
  {
    id: "stress-release",
    title: "Stress Release Check-In",
    description: "Notice, name, and soften what you are carrying.",
    kind: "placeholder",
    duration: "Coming soon"
  },
  {
    id: "morning-intention",
    title: "Morning Intention",
    description: "A simple intention-setting practice for the day.",
    kind: "placeholder",
    duration: "Coming soon"
  },
  {
    id: "sleep-wind-down",
    title: "Sleep Wind Down",
    description: "A quiet practice to prepare your body for rest.",
    kind: "placeholder",
    duration: "Coming soon"
  }
].map((session, index) => ({
  ...session,
  number: String(index + 1).padStart(2, "0")
}));

const initialChatMessage =
  "Hi, I can answer general mindfulness questions and explain any session tile in the app. Open a session first if you want details about that specific practice.";

const appEl = document.getElementById("app");
const roundTimeouts = [];
const boxTimeouts = [];

const state = {
  screen: "home",
  selectedSessionId: sessionCatalog[0].id,
  chatSessionId: createSessionId(),
  chatMessages: [
    { id: "assistant-welcome", role: "assistant", content: initialChatMessage }
  ],
  chatDraft: "",
  chatBusy: false,
  chatStatus: "Ready",
  chatModalVisible: false,
  sessionActive: false,
  sessionStatus: "Not started",
  sessionStartTime: null,
  placeholderMessage: "",
  summaryModalVisible: false,
  sessionSummary: "",
  sessionDuration: "",
  slideIndex: 0,
  roundsDone: 0,
  roundRunning: false,
  phaseBadge: "Ready",
  phaseText: "Ready",
  phaseSubtext: breathingSlides[2].body,
  boxTraceSide: null,
  boxTraceStatus: "idle"
};

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
  const values = hours > 0 ? [hours, minutes, seconds] : [minutes, seconds];
  return values.map((value) => String(value).padStart(2, "0")).join(":");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getSelectedSession() {
  return (
    sessionCatalog.find((session) => session.id === state.selectedSessionId) ||
    sessionCatalog[0]
  );
}

function getSessionContext() {
  if (state.screen !== "session" && !state.sessionActive) {
    return null;
  }

  return {
    selectedSession: getSelectedSession(),
    sessionActive: state.sessionActive,
    slideIndex: state.slideIndex,
    roundsDone: state.roundsDone,
    phaseBadge: state.phaseBadge,
    sessionlanguage: "English"
  };
}

function buildChatPrompt(message, sessionContext) {
  if (!sessionContext?.selectedSession) {
    return [
      "App context: The web mindfulness app has 12 selectable session rectangles.",
      "Only Box Breathing currently includes a full breathing tutorial.",
      "The other 11 session pages are placeholders for future guided content.",
      `User message: ${message}`
    ].join("\n");
  }

  const lines = [
    "App context: The web mindfulness app has 12 selectable session rectangles.",
    `Current session title: ${sessionContext.selectedSession.title}`,
    `Session description: ${sessionContext.selectedSession.description}`,
    `Session status: ${sessionContext.sessionActive ? "active" : "not started"}`,
    `Session language: ${sessionContext.sessionlanguage}`
  ];

  if (sessionContext.selectedSession.id === "box-breathing") {
    const slide = breathingSlides[sessionContext.slideIndex] || breathingSlides[0];
    lines.push(
      "Box Breathing tutorial structure: Introduction, Get comfortable, Breathe, The 4-4-4-4 pattern, Return slowly."
    );
    lines.push(
      `Breathing progress: slide ${sessionContext.slideIndex + 1} of ${breathingSlides.length}, rounds completed ${sessionContext.roundsDone} of ${TOTAL_BREATHING_ROUNDS}, current phase ${sessionContext.phaseBadge}.`
    );
    lines.push(`Current slide title: ${slide.titlePlain}`);
  } else {
    lines.push("This session page is currently a placeholder with no guided content yet.");
  }

  lines.push(`User message: ${message}`);
  return lines.join("\n");
}

function buildLocalChatFallback(message, sessionContext) {
  const lower = message.toLowerCase();

  if (sessionContext?.selectedSession?.id === "box-breathing") {
    if (lower.includes("round") || lower.includes("breath") || lower.includes("pattern")) {
      return `Box Breathing uses 4 rounds of a 4-4-4-4 pattern: inhale for 4, hold for 4, exhale for 4, then hold for 4. You are currently on slide ${sessionContext.slideIndex + 1} of ${breathingSlides.length} and have completed ${sessionContext.roundsDone} of ${TOTAL_BREATHING_ROUNDS} rounds.`;
    }

    return "Box Breathing is the live tutorial in this app. It walks through 5 slides: introduction, setup, breathing rounds, pattern explanation, and return slowly.";
  }

  if (sessionContext?.selectedSession) {
    return `${sessionContext.selectedSession.title} is currently an empty placeholder session. The tile and session page are ready, but the guided exercise itself has not been filled in yet.`;
  }

  return "This app has 12 session tiles. Box Breathing is the current live tutorial, and the other 11 session pages are placeholders for future mindfulness exercises.";
}

function buildGuidedSessionSummary(slideIndex, roundsDone) {
  const slide = breathingSlides[slideIndex] || breathingSlides[0];

  if (roundsDone >= TOTAL_BREATHING_ROUNDS && slideIndex === breathingSlides.length - 1) {
    return "You completed the full box breathing tutorial, including all 4 rounds and the return-to-rest step.";
  }

  if (roundsDone >= TOTAL_BREATHING_ROUNDS) {
    return `You completed all 4 breathing rounds and ended on the "${slide.titlePlain}" screen.`;
  }

  if (roundsDone > 0) {
    return `You ended the breathing tutorial after ${roundsDone} of ${TOTAL_BREATHING_ROUNDS} rounds while viewing "${slide.titlePlain}".`;
  }

  return `You ended the breathing tutorial during "${slide.titlePlain}" before the breathing rounds were completed.`;
}

function clearRoundTimers() {
  while (roundTimeouts.length) {
    clearTimeout(roundTimeouts.pop());
  }
}

function clearBoxTimers() {
  while (boxTimeouts.length) {
    clearTimeout(boxTimeouts.pop());
  }
}

function scheduleRoundTimeout(callback, delay) {
  roundTimeouts.push(setTimeout(callback, delay));
}

function scheduleBoxTimeout(callback, delay) {
  boxTimeouts.push(setTimeout(callback, delay));
}

function resetBreathingTutorial() {
  clearRoundTimers();
  clearBoxTimers();
  state.slideIndex = 0;
  state.roundsDone = 0;
  state.roundRunning = false;
  state.phaseBadge = "Ready";
  state.phaseText = "Ready";
  state.phaseSubtext = breathingSlides[2].body;
  state.boxTraceSide = null;
  state.boxTraceStatus = "idle";
}

function clearExerciseState() {
  state.sessionActive = false;
  state.sessionStatus = "Not started";
  state.sessionStartTime = null;
  state.placeholderMessage = "";
  resetBreathingTutorial();
}

function openSession(sessionId) {
  if (state.sessionActive && state.selectedSessionId !== sessionId) {
    return;
  }

  state.selectedSessionId = sessionId;
  state.screen = "session";
  render();
}

function goHome() {
  state.screen = "home";
  render();
}

function goToPreviousSlide() {
  if (state.slideIndex === 3) {
    clearBoxTimers();
    state.boxTraceSide = null;
    state.boxTraceStatus = "idle";
  }

  state.slideIndex = Math.max(0, state.slideIndex - 1);
  render();
}

function goToNextSlide() {
  if (state.slideIndex === 3) {
    clearBoxTimers();
    state.boxTraceSide = null;
    state.boxTraceStatus = "idle";
  }

  state.slideIndex = Math.min(breathingSlides.length - 1, state.slideIndex + 1);
  render();
}

function tracePattern() {
  if (state.boxTraceStatus === "running") {
    return;
  }

  clearBoxTimers();
  state.boxTraceStatus = "running";
  state.boxTraceSide = null;
  render();

  BOX_TRACE_SIDES.forEach((side, index) => {
    scheduleBoxTimeout(() => {
      state.boxTraceSide = side;
      render();
    }, index * 4000);
  });

  scheduleBoxTimeout(() => {
    state.boxTraceSide = null;
    state.boxTraceStatus = "done";
    render();
  }, 16500);
}

function startRound() {
  if (state.roundRunning || state.roundsDone >= TOTAL_BREATHING_ROUNDS) {
    return;
  }

  clearRoundTimers();
  state.roundRunning = true;
  state.phaseSubtext = "Follow the circle and keep the breath easy.";
  render();

  let elapsed = 0;

  breathingPhases.forEach((phase) => {
    scheduleRoundTimeout(() => {
      state.phaseBadge = phase.badge;
      state.phaseText = phase.label;
      render();
    }, elapsed);

    elapsed += phase.duration;
  });

  const nextRoundCount = state.roundsDone + 1;

  scheduleRoundTimeout(() => {
    state.roundRunning = false;
    state.roundsDone = nextRoundCount;
    state.phaseText = "Done";

    if (nextRoundCount < TOTAL_BREATHING_ROUNDS) {
      state.phaseBadge = "Rest";
      state.phaseSubtext = `Great. Take a natural breath, then start round ${nextRoundCount + 1}.`;
    } else {
      state.phaseBadge = "Complete";
      state.phaseSubtext = "You finished all 4 rounds. Continue to the next step.";
    }

    render();
  }, elapsed + 100);
}

async function sendChatMessage() {
  const trimmedMessage = state.chatDraft.trim();
  if (!trimmedMessage || state.chatBusy) {
    return;
  }

  const userMessage = {
    id: `user-${Date.now()}`,
    role: "user",
    content: trimmedMessage
  };

  state.chatMessages = [...state.chatMessages, userMessage];
  state.chatDraft = "";
  state.chatBusy = true;
  state.chatStatus = "Thinking...";
  render();

  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: buildChatPrompt(trimmedMessage, getSessionContext()),
        session_id: state.chatSessionId
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Request failed");
    }

    const data = await response.json();
    state.chatMessages = [
      ...state.chatMessages,
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.reply || "(No response text returned.)"
      }
    ];
    state.chatStatus = "Ready";
  } catch (error) {
    state.chatMessages = [
      ...state.chatMessages,
      {
        id: `assistant-fallback-${Date.now()}`,
        role: "assistant",
        content: buildLocalChatFallback(trimmedMessage, getSessionContext())
      }
    ];
    state.chatStatus = `Offline fallback (${error.message})`;
  } finally {
    state.chatBusy = false;
    render();
  }
}

function startSelectedSession() {
  const selectedSession = getSelectedSession();
  if (!selectedSession || state.sessionActive) {
    return;
  }

  state.summaryModalVisible = false;
  state.sessionSummary = "";
  state.sessionDuration = "";
  state.sessionStartTime = Date.now();
  state.sessionActive = true;
  state.sessionStatus = "Session active";

  if (selectedSession.kind === "guided") {
    state.placeholderMessage = "";
    resetBreathingTutorial();
  } else {
    state.placeholderMessage = `${selectedSession.title} is intentionally empty right now. This page is reserved for the guided content you want to add later.`;
  }

  render();
}

function endSelectedSession() {
  const selectedSession = getSelectedSession();
  if (!state.sessionActive) {
    return;
  }

  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - (state.sessionStartTime || Date.now())) / 1000)
  );

  state.sessionDuration = formatDuration(elapsedSeconds);

  if (selectedSession.kind === "guided") {
    state.sessionSummary = buildGuidedSessionSummary(state.slideIndex, state.roundsDone);
  } else {
    state.sessionSummary = `${selectedSession.title} ended. This session page is still empty for now, but the layout is ready for future guided content.`;
  }

  state.summaryModalVisible = true;
  clearExerciseState();
  render();
}

function renderSessionTile(session) {
  const disabled = state.sessionActive && state.selectedSessionId !== session.id;
  const selected = state.selectedSessionId === session.id;

  return `
    <button
      class="session-tile ${session.kind === "guided" ? "session-tile-guided" : "session-tile-placeholder"} ${selected ? "session-tile-selected" : ""}"
      data-action="open-session"
      data-session-id="${session.id}"
      ${disabled ? "disabled" : ""}
    >
      <div class="session-tile-top">
        <span class="session-number">${session.number}</span>
        <span class="pill ${session.kind === "guided" ? "pill-guided" : "pill-placeholder"}">
          ${session.kind === "guided" ? "Ready" : "Empty"}
        </span>
      </div>
      <div>
        <p class="session-title">${escapeHtml(session.title)}</p>
        <p class="session-description">${escapeHtml(session.description)}</p>
      </div>
      <p class="session-meta">${escapeHtml(session.duration)}</p>
    </button>
  `;
}

function renderProgressDots(total, activeIndex) {
  return Array.from({ length: total })
    .map(
      (_, index) =>
        `<span class="progress-dot ${index === activeIndex ? "progress-dot-active" : ""}"></span>`
    )
    .join("");
}

function renderRoundPips(total, filled) {
  return Array.from({ length: total })
    .map(
      (_, index) =>
        `<span class="round-pip ${index < filled ? "round-pip-filled" : ""}"></span>`
    )
    .join("");
}

function renderTutorialCard() {
  const slide = breathingSlides[state.slideIndex];
  const nextDisabled =
    state.slideIndex === breathingSlides.length - 1 ||
    state.roundRunning ||
    state.boxTraceStatus === "running" ||
    (slide.key === "rounds" && state.roundsDone < TOTAL_BREATHING_ROUNDS);
  const prevDisabled =
    state.slideIndex === 0 || state.roundRunning || state.boxTraceStatus === "running";
  const roundButtonLabel =
    state.roundsDone >= TOTAL_BREATHING_ROUNDS
      ? "All rounds complete"
      : state.roundRunning
        ? "Breathing..."
        : `Start Round ${state.roundsDone + 1}`;
  const patternButtonLabel =
    state.boxTraceStatus === "running"
      ? "Tracing..."
      : state.boxTraceStatus === "done"
        ? "Trace again"
        : "Trace the pattern";
  const currentScale =
    state.phaseBadge === "Inhale" || state.phaseBadge === "Hold" ? 1.5 : 1;

  return `
    <section class="tutorial-card">
      <div class="tutorial-slide">
        <span class="slide-label">${escapeHtml(slide.stepLabel)}</span>
        <h2 class="slide-title">${slide.title}</h2>
        <p class="slide-body">${escapeHtml(slide.body)}</p>

        ${
          slide.key === "intro"
            ? `
              <div class="intro-graphic">
                <span class="intro-ring-outer"></span>
                <span class="intro-ring-middle"></span>
                <span class="intro-core">Calm</span>
              </div>
            `
            : ""
        }

        ${
          slide.key === "comfort"
            ? `
              <div class="steps-list">
                ${slide.tips
                  .map(
                    (tip) => `
                      <div class="step-row">
                        <span class="step-dot"></span>
                        <p class="step-row-text">${escapeHtml(tip)}</p>
                      </div>
                    `
                  )
                  .join("")}
              </div>
              <div class="tip-card">
                <span class="tip-label">Tip</span>
                <p class="tip-body">${escapeHtml(slide.note)}</p>
              </div>
            `
            : ""
        }

        ${
          slide.key === "rounds"
            ? `
              <span class="phase-badge">${escapeHtml(state.phaseBadge)}</span>
              <p class="phase-subtext">${escapeHtml(state.phaseSubtext)}</p>
              <div class="breath-ring">
                <span class="breath-ring-outer"></span>
                <div class="breath-inner" style="transform: scale(${currentScale});">
                  ${escapeHtml(state.phaseText)}
                </div>
              </div>
              <div class="round-pips">${renderRoundPips(TOTAL_BREATHING_ROUNDS, state.roundsDone)}</div>
              <p class="round-label">Round ${state.roundsDone} of ${TOTAL_BREATHING_ROUNDS}</p>
              <button class="round-button" data-action="start-round" ${state.roundRunning || state.roundsDone >= TOTAL_BREATHING_ROUNDS ? "disabled" : ""}>
                ${escapeHtml(roundButtonLabel)}
              </button>
            `
            : ""
        }

        ${
          slide.key === "pattern"
            ? `
              <div class="pattern-box-wrap">
                <span class="pattern-label pattern-label-top">Inhale 4</span>
                <span class="pattern-label pattern-label-right">Hold 4</span>
                <span class="pattern-label pattern-label-bottom">Exhale 4</span>
                <span class="pattern-label pattern-label-left">Hold 4</span>
                <div class="pattern-square">
                  <span class="pattern-line pattern-line-top"></span>
                  <span class="pattern-line pattern-line-right"></span>
                  <span class="pattern-line pattern-line-bottom"></span>
                  <span class="pattern-line pattern-line-left"></span>
                  ${
                    state.boxTraceSide
                      ? `<span class="pattern-active pattern-active-${state.boxTraceSide}"></span>`
                      : ""
                  }
                  <span class="pattern-center">4-4-4-4</span>
                </div>
              </div>
              <button class="pattern-button" data-action="start-round" ${state.boxTraceStatus === "running" ? "disabled" : ""}>
                ${escapeHtml(patternButtonLabel)}
              </button>
            `
            : ""
        }

        ${
          slide.key === "return"
            ? `
              <div class="return-graphic">
                <span class="return-outer"></span>
                <span class="return-inner">Rest</span>
              </div>
              <div class="tip-card">
                <span class="tip-label">You did it</span>
                <p class="tip-body">${escapeHtml(slide.note)}</p>
              </div>
            `
            : ""
        }
      </div>

      <div class="tutorial-nav">
        <button class="nav-button" data-action="prev-slide" ${prevDisabled ? "disabled" : ""}>Back</button>
        <div class="progress-dots">${renderProgressDots(breathingSlides.length, state.slideIndex)}</div>
        <button class="nav-button nav-button-primary" data-action="next-slide" ${nextDisabled ? "disabled" : ""}>
          ${state.slideIndex === breathingSlides.length - 1 ? "Done" : "Next"}
        </button>
      </div>
    </section>
  `;
}

function renderHomeScreen() {
  const selectedSession = getSelectedSession();

  return `
    <section class="hero-card">
      <span class="hero-eyebrow">Mindfulness Sessions</span>
      <h1 class="hero-title">Choose one of 12 session spaces</h1>
      <p class="hero-body">
        Tap any rectangle to open its session page. Box Breathing follows your breathing tutorial,
        the other 11 tiles stay ready as empty placeholders, and the chatbot stays available anytime.
      </p>
      <div class="hero-actions">
        <a class="action-button action-button-primary" href="avatar.html?autostart=1">Talk To Avatar</a>
        <button class="action-button action-button-secondary" data-action="open-chat">Open Chat</button>
      </div>
    </section>

    ${
      state.sessionActive
        ? `
          <section class="resume-card">
            <div class="resume-copy">
              <p class="resume-title">Session in progress</p>
              <p class="resume-body">${escapeHtml(selectedSession.title)} is still active. Reopen it to continue or end it.</p>
            </div>
            <button class="action-button action-button-primary" data-action="resume-session">Resume</button>
          </section>
        `
        : ""
    }

    <section>
      <h2 class="section-title">Session Selection</h2>
      <div class="session-grid">
        ${sessionCatalog.map(renderSessionTile).join("")}
      </div>
    </section>

    <section class="helper-card">
      <p class="helper-title">Popup Chat Available Anytime</p>
      <p class="helper-body">
        The chatbot is no longer tied to Start Session. Use the floating button for general questions,
        or open a session first so the chat can explain that specific practice.
      </p>
    </section>
  `;
}

function renderSessionScreen() {
  const selectedSession = getSelectedSession();

  return `
    <button class="action-button action-button-secondary" data-action="go-home">Back to sessions</button>

    <section class="detail-hero">
      <div class="detail-hero-top">
        <span class="detail-number">${selectedSession.number}</span>
        <span class="detail-pill ${selectedSession.kind === "guided" ? "detail-pill-guided" : "detail-pill-placeholder"}">
          ${selectedSession.kind === "guided" ? "Guided session" : "Empty session"}
        </span>
      </div>
      <h1 class="detail-title">${escapeHtml(selectedSession.title)}</h1>
      <p class="detail-description">${escapeHtml(selectedSession.description)}</p>
      <p class="detail-meta">Status: ${escapeHtml(state.sessionStatus)}</p>
    </section>

    <section class="control-row">
      <button class="action-button action-button-primary" data-action="start-session" ${state.sessionActive ? "disabled" : ""}>
        Start Session
      </button>
      <button class="action-button action-button-secondary" data-action="end-session" ${!state.sessionActive ? "disabled" : ""}>
        End Session
      </button>
      <a class="action-button action-button-secondary" href="avatar.html?autostart=1">Open Avatar Guide</a>
    </section>

    ${
      selectedSession.kind === "guided"
        ? state.sessionActive
          ? renderTutorialCard()
          : `
              <section class="preview-card">
                <p class="preview-title">Breathing Tutorial Preview</p>
                <p class="preview-body">
                  This session follows the 5-slide example you shared: introduction, setup, breathing rounds,
                  the 4-4-4-4 pattern, and return slowly.
                </p>
                <div class="preview-list">
                  ${breathingSlides
                    .map(
                      (slide, index) => `
                        <div class="preview-list-row">
                          <span class="preview-list-number">${index + 1}</span>
                          <p class="preview-list-text">${escapeHtml(slide.titlePlain)}</p>
                        </div>
                      `
                    )
                    .join("")}
                </div>
              </section>
            `
        : `
            <section class="placeholder-card">
              <p class="placeholder-title">Template Reserved</p>
              <p class="placeholder-body">
                This screen is intentionally empty for now. When you are ready, this is where the guided content,
                timer, and visuals for ${escapeHtml(selectedSession.title)} can be added.
              </p>
            </section>
          `
    }

    <section class="panel-card">
      <p class="panel-title">${selectedSession.kind === "guided" ? "Session Support" : "Placeholder Notes"}</p>
      <p class="panel-body">
        ${
          selectedSession.kind === "guided"
            ? "You can stop the breathing session at any time with End Session, and the popup chat can still answer questions about the current step."
            : escapeHtml(
                state.placeholderMessage ||
                  "Start Session if you want to test the empty placeholder flow for this tile."
              )
        }
      </p>
    </section>
  `;
}

function renderMessages(messages) {
  return messages
    .map(
      (message) => `
        <article class="message message-${message.role}">
          <p class="message-text">${escapeHtml(message.content)}</p>
        </article>
      `
    )
    .join("");
}

function renderChatModal() {
  const selectedSession = getSelectedSession();
  return `
    <div class="overlay ${state.chatModalVisible ? "" : "hidden"}" data-action="close-chat">
      <section class="chat-sheet">
        <div class="sheet-header">
          <div class="sheet-header-copy">
            <h2 class="sheet-title">Mindfulness Chat</h2>
            <p class="sheet-subtitle">
              ${
                state.screen === "session"
                  ? `Current context: ${escapeHtml(selectedSession.title)}`
                  : "Current context: general app help"
              }
            </p>
          </div>
          <button class="close-button" data-action="close-chat">Close</button>
        </div>

        <div class="chat-frame">
          <div class="status-row">Assistant status: ${escapeHtml(state.chatStatus)}</div>
          <div class="chat-window" id="chat-window">
            ${renderMessages(state.chatMessages)}
          </div>
          <div class="composer">
            <textarea
              class="chat-input"
              id="chat-input"
              placeholder="Ask about mindfulness, app features, or this session..."
              ${state.chatBusy ? "disabled" : ""}
            >${escapeHtml(state.chatDraft)}</textarea>
            <button class="composer-send" data-action="send-chat" ${!state.chatDraft.trim() || state.chatBusy ? "disabled" : ""}>Send</button>
          </div>
        </div>
      </section>
    </div>
  `;
}

function renderSummaryModal() {
  return `
    <div class="overlay ${state.summaryModalVisible ? "" : "hidden"}" data-action="close-summary">
      <section class="modal-card">
        <h2 class="modal-title">Session Complete</h2>
        <div class="modal-duration">Session length: ${escapeHtml(state.sessionDuration)}</div>
        <div class="modal-summary">${escapeHtml(state.sessionSummary)}</div>
        <button class="summary-close" data-action="close-summary">Close</button>
      </section>
    </div>
  `;
}

function render() {
  appEl.innerHTML = `
    <main class="app-shell">
      <header class="topbar">
        <div class="topbar-brand">
          <span class="topbar-eyebrow">Mindfulness App</span>
          <span class="topbar-title">Same session layout as mobile, now on web</span>
        </div>
        <a class="topbar-link" href="avatar.html?autostart=1">Avatar Experience</a>
      </header>

      <div class="content-stack">
        ${state.screen === "home" ? renderHomeScreen() : renderSessionScreen()}
      </div>
    </main>

    <div class="floating-stack">
      <a class="chat-launcher chat-launcher-secondary" href="avatar.html?autostart=1">Talk To Avatar</a>
      <button class="chat-launcher" data-action="open-chat">Open Chat</button>
    </div>

    ${renderChatModal()}
    ${renderSummaryModal()}
  `;

  attachInputHandlers();
  scrollChatToBottom();
}

function attachInputHandlers() {
  const chatInput = document.getElementById("chat-input");
  if (chatInput) {
    chatInput.addEventListener("input", (event) => {
      state.chatDraft = event.target.value;
      const sendButton = appEl.querySelector('[data-action="send-chat"]');
      if (sendButton) {
        sendButton.disabled = !state.chatDraft.trim() || state.chatBusy;
      }
    });

    chatInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendChatMessage();
      }
    });
  }
}

function scrollChatToBottom() {
  const chatWindow = document.getElementById("chat-window");
  if (chatWindow) {
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
}

appEl.addEventListener("click", (event) => {
  const actionEl = event.target.closest("[data-action]");
  if (!actionEl) {
    return;
  }

  const { action } = actionEl.dataset;
  const isOverlay = actionEl.classList.contains("overlay");

  if ((action === "close-chat" || action === "close-summary") && isOverlay && event.target !== actionEl) {
    return;
  }

  switch (action) {
    case "open-session":
      openSession(actionEl.dataset.sessionId);
      break;
    case "resume-session":
      state.screen = "session";
      render();
      break;
    case "go-home":
      goHome();
      break;
    case "start-session":
      startSelectedSession();
      break;
    case "end-session":
      endSelectedSession();
      break;
    case "prev-slide":
      goToPreviousSlide();
      break;
    case "next-slide":
      goToNextSlide();
      break;
    case "start-round":
      if (state.slideIndex === 3) {
        tracePattern();
      } else {
        startRound();
      }
      break;
    case "open-chat":
      state.chatModalVisible = true;
      render();
      break;
    case "close-chat":
      state.chatModalVisible = false;
      render();
      break;
    case "send-chat":
      sendChatMessage();
      break;
    case "close-summary":
      state.summaryModalVisible = false;
      render();
      break;
    default:
      break;
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (state.chatModalVisible) {
      state.chatModalVisible = false;
    }
    if (state.summaryModalVisible) {
      state.summaryModalVisible = false;
    }
    render();
  }
});

window.addEventListener("beforeunload", () => {
  clearRoundTimers();
  clearBoxTimers();
});

fetch(`${API_BASE_URL}/health`, {
  method: "GET",
  cache: "no-store"
}).catch(() => {
  // Keep the interface usable even if the Render instance is still waking up.
});

render();
