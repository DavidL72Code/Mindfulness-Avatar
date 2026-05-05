const API_BASE_URL =
  window.location.protocol === "http:" || window.location.protocol === "https:"
    ? window.location.origin
    : "https://multilingual-virtual-assistant.onrender.com";
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
    description: "",
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

const translations = {
  en: {
    signInWelcome: "Welcome back",
    signInSubtitle: "Sign in to continue your mindfulness practice.",
    email: "Email",
    password: "Password",
    signInButton: "Sign In",
    signUpPrompt: "Create an account",
    signInFooter: "Multilingual mindfulness support for calmer daily routines.",
    headerTitle: "Mindfulness Assistant",
    logoutBtn: "Logout",
    chatHeader: "Mindfulness Virtual Assistant",
    card1Title: "About the Assistant",
    card1Text: "Our AI is trained to guide you through mindfulness exercises.",
    card3Title: "Recent Updates",
    card3Text: "We improved the Korean processing features recently.",
    card4Title: "Quick Settings",
    card4Text: "Customize your interface and accessibility options here.",
    supportBtn: "Support Ticket",
    language: "Language",
    start: "Start",
    firstName: "First Name",
    lastName: "Last Name",
    dateOfBirth: "Date of Birth",
    confirmPassword: "Confirm Password",
    signUpHeader: "Create Account",
    signUpSubmit: "Create Account",
    backToSignIn: "Already have an account? Sign in",
  },
  ko: {
    signInWelcome: "다시 오신 것을 환영합니다",
    signInSubtitle: "명상 연습을 계속하려면 로그인하세요.",
    email: "이메일",
    password: "비밀번호",
    signInButton: "로그인",
    signUpPrompt: "계정 만들기",
    signInFooter: "차분한 일상을 위한 다국어 명상 지원.",
    headerTitle: "명상 보조 도구",
    logoutBtn: "로그아웃",
    chatHeader: "명상 가상 비서",
    card1Title: "비서 정보",
    card1Text: "저희 AI는 명상 연습을 안내하도록 교육되었습니다.",
    card3Title: "최신 업데이트",
    card3Text: "최근 한국어 처리 기능을 개선했습니다.",
    card4Title: "빠른 설정",
    card4Text: "여기에서 인터페이스와 접근성 설정을 사용자 정의하십시오.",
    supportBtn: "지원 티켓",
    language: "Language",
    start: "Start",
    firstName: "이름",
    lastName: "성",
    dateOfBirth: "생년월일",
    confirmPassword: "비밀번호 확인",
    signUpHeader: "계정 만들기",
    signUpSubmit: "계정 만들기",
    backToSignIn: "이미 계정이 있으신가요? 로그인",
  }
};

const appEl = document.getElementById("app");
const roundTimeouts = [];
const boxTimeouts = [];

const state = {
  authenticated: false,
  locale: "en",
  signInEmail: "",
  signInPassword: "",
  signInError: "",
  authScreen: "signin",
  signUpFirstName: "",
  signUpLastName: "",
  signUpDob: "",
  signUpEmail: "",
  signUpPassword: "",
  signUpConfirmPassword: "",
  signUpError: "",
  currentUser: null,
  languageModalVisible: true,
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
  avatarConversationId: createSessionId(),
  homeAvatarAutostarted: false,
  slideIndex: 0,
  roundsDone: 0,
  roundRunning: false,
  phaseBadge: "Ready",
  phaseText: "Ready",
  phaseSubtext: breathingSlides[2].body,
  boxTraceSide: null,
  boxTraceStatus: "idle",
  avatarDockVisible: true,
  avatarDockX: null,
  avatarDockY: null
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

function t(key) {
  return translations[state.locale]?.[key] || translations.en[key] || key;
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

let avatarDockEl = null;
let avatarDockHeaderEl = null;
let avatarDockIframeEl = null;
let avatarDockTitleEl = null;
let avatarDockDrag = null;
let avatarSessionEl = null;
let avatarSessionIframeEl = null;

const AVATAR_HOST_HOME = "home-dock";
const AVATAR_HOST_SESSION = "session-panel";
const avatarReadyState = {
  [AVATAR_HOST_HOME]: false,
  [AVATAR_HOST_SESSION]: false
};
const avatarCommandQueue = {
  [AVATAR_HOST_HOME]: [],
  [AVATAR_HOST_SESSION]: []
};

function getAvatarTargetOrigin() {
  return window.location.protocol === "http:" || window.location.protocol === "https:"
    ? window.location.origin
    : "*";
}

function buildAvatarFrameSrc({ host, sessionId = "", autostart = false, conversationId = "" }) {
  const params = new URLSearchParams({
    compact: "1",
    controlled: "1",
    host
  });

  if (autostart) {
    params.set("autostart", "1");
  }

  if (sessionId) {
    params.set("session", sessionId);
  }

  if (conversationId) {
    params.set("chat_id", conversationId);
  }

  return `avatar.html?${params.toString()}`;
}

function getAvatarIframe(host) {
  return host === AVATAR_HOST_SESSION ? avatarSessionIframeEl : avatarDockIframeEl;
}

function queueAvatarCommand(host, command) {
  avatarCommandQueue[host].push(command);
  flushAvatarCommands(host);
}

function flushAvatarCommands(host) {
  const iframe = getAvatarIframe(host);
  if (!iframe || !iframe.contentWindow || !avatarReadyState[host]) {
    return;
  }

  while (avatarCommandQueue[host].length) {
    iframe.contentWindow.postMessage(
      {
        source: "mindfulness-host",
        ...avatarCommandQueue[host].shift()
      },
      getAvatarTargetOrigin()
    );
  }
}

function buildSessionAvatarWelcomePrompt(sessionTitle) {
  return [
    `You are opening the ${sessionTitle} mindfulness session.`,
    "Reply with a short, warm welcome only.",
    "Say that you are the user's mindfulness assistant and that you are here to assist them.",
    "Ask how they are doing today.",
    "Do not start guiding Box Breathing steps or any exercise unless the user asks for that specifically."
  ].join(" ");
}

function buildGuidedAvatarStartPrompt(sessionTitle) {
  return [
    `We are starting the ${sessionTitle} mindfulness session.`,
    "You are the guide for this exercise.",
    "Guide the user through these 5 steps in order: Introduction, Get comfortable, Breathe, The 4-4-4-4 pattern, and Return slowly.",
    "Start with the Introduction step right now.",
    "Introduce Box Breathing warmly in 2 to 3 short sentences, then invite the user to press Next when they are ready for the following step."
  ].join(" ");
}

function startAvatarGuidance() {
  const selectedSession = getSelectedSession();
  if (!selectedSession) {
    return;
  }

  const prompt =
    selectedSession.kind === "guided"
      ? buildGuidedAvatarStartPrompt(selectedSession.title)
      : buildSessionAvatarWelcomePrompt(selectedSession.title);

  queueAvatarCommand(AVATAR_HOST_SESSION, {
    type: "host-start-session",
    prompt,
    announce: false
  });
}

function endHomeDockAvatar() {
  queueAvatarCommand(AVATAR_HOST_HOME, {
    type: "host-pause-session"
  });
}

function advanceAvatarGuidance() {
  const selectedSession = getSelectedSession();
  if (!state.sessionActive || !selectedSession || selectedSession.kind !== "guided") {
    return;
  }

  queueAvatarCommand(AVATAR_HOST_SESSION, {
    type: "host-send-text",
    text: "next"
  });
}

function endAvatarGuidance() {
  queueAvatarCommand(AVATAR_HOST_SESSION, {
    type: "host-end-session"
  });
}

function getAvatarDockSize() {
  return {
    width: window.innerWidth <= 760 ? Math.min(window.innerWidth - 24, 320) : 340,
    height: window.innerWidth <= 760 ? Math.min(window.innerHeight - 120, 460) : 500
  };
}

function clampAvatarDockPosition(x, y) {
  const { width, height } = getAvatarDockSize();
  const maxX = Math.max(12, window.innerWidth - width - 12);
  const maxY = Math.max(12, window.innerHeight - height - 12);

  return {
    x: Math.min(Math.max(12, x), maxX),
    y: Math.min(Math.max(12, y), maxY)
  };
}

function getDefaultAvatarDockPosition() {
  const { width, height } = getAvatarDockSize();
  return clampAvatarDockPosition(
    window.innerWidth - width - 20,
    Math.max(96, window.innerHeight - height - 24)
  );
}

function applyAvatarDockPosition() {
  if (!avatarDockEl) {
    return;
  }

  const position =
    state.avatarDockX == null || state.avatarDockY == null
      ? getDefaultAvatarDockPosition()
      : clampAvatarDockPosition(state.avatarDockX, state.avatarDockY);

  state.avatarDockX = position.x;
  state.avatarDockY = position.y;
  avatarDockEl.style.left = `${position.x}px`;
  avatarDockEl.style.top = `${position.y}px`;
}

function handleAvatarDockPointerMove(event) {
  if (!avatarDockDrag) {
    return;
  }

  const position = clampAvatarDockPosition(
    event.clientX - avatarDockDrag.offsetX,
    event.clientY - avatarDockDrag.offsetY
  );

  state.avatarDockX = position.x;
  state.avatarDockY = position.y;
  applyAvatarDockPosition();
}

function handleAvatarDockPointerUp() {
  avatarDockDrag = null;
  document.body.classList.remove("avatar-dragging");
}

function ensureAvatarDock() {
  if (avatarDockEl) {
    return;
  }

  avatarDockEl = document.createElement("section");
  avatarDockEl.className = "avatar-dock hidden";
  avatarDockEl.innerHTML = `
    <div class="avatar-dock-header">
      <div class="avatar-dock-copy">
        <p class="avatar-dock-kicker">Mini Guide</p>
        <p class="avatar-dock-title"></p>
      </div>
      <button class="avatar-dock-close" type="button" aria-label="Hide mini guide">Hide</button>
    </div>
    <div class="avatar-dock-frame-wrap">
      <iframe
        class="avatar-dock-frame"
        title="Mindfulness avatar guide"
        loading="lazy"
        allow="autoplay"
      ></iframe>
    </div>
  `;

  document.body.appendChild(avatarDockEl);

  avatarDockHeaderEl = avatarDockEl.querySelector(".avatar-dock-header");
  avatarDockIframeEl = avatarDockEl.querySelector(".avatar-dock-frame");
  avatarDockTitleEl = avatarDockEl.querySelector(".avatar-dock-title");

  avatarDockEl
    .querySelector(".avatar-dock-close")
    .addEventListener("click", () => {
      state.avatarDockVisible = false;
      render();
    });

  avatarDockHeaderEl.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".avatar-dock-close")) {
      return;
    }

    const rect = avatarDockEl.getBoundingClientRect();
    avatarDockDrag = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    };
    document.body.classList.add("avatar-dragging");
    avatarDockHeaderEl.setPointerCapture?.(event.pointerId);
  });

  window.addEventListener("pointermove", handleAvatarDockPointerMove);
  window.addEventListener("pointerup", handleAvatarDockPointerUp);
}

function syncAvatarDock() {
  ensureAvatarDock();

  const shouldShow = state.screen === "home" && state.avatarDockVisible;
  avatarDockEl.classList.toggle("hidden", !shouldShow);

  if (!shouldShow) {
    return;
  }

  avatarDockTitleEl.textContent = "Mindfulness guide";

  applyAvatarDockPosition();

  const src = buildAvatarFrameSrc({
    host: AVATAR_HOST_HOME,
    autostart: !state.homeAvatarAutostarted,
    conversationId: state.avatarConversationId
  });
  if (avatarDockIframeEl.dataset.src !== src) {
    avatarReadyState[AVATAR_HOST_HOME] = false;
    avatarDockIframeEl.dataset.src = src;
    avatarDockIframeEl.src = src;
    state.homeAvatarAutostarted = true;
  }
}

function ensureSessionAvatarPanel() {
  if (avatarSessionEl) {
    return;
  }

  avatarSessionEl = document.createElement("section");
  avatarSessionEl.className = "session-avatar-panel hidden";
  avatarSessionEl.innerHTML = `
    <iframe
      class="session-avatar-frame"
      title="Mindfulness session guide"
      loading="lazy"
      allow="autoplay"
    ></iframe>
  `;

  document.body.appendChild(avatarSessionEl);
  avatarSessionIframeEl = avatarSessionEl.querySelector(".session-avatar-frame");
}

function syncSessionAvatarPanel() {
  ensureSessionAvatarPanel();

  const hostEl = document.getElementById("session-avatar-host");
  const shouldShow = state.screen === "session" && Boolean(hostEl);
  avatarSessionEl.classList.toggle("hidden", !shouldShow);

  if (!shouldShow) {
    return;
  }

  const rect = hostEl.getBoundingClientRect();
  avatarSessionEl.style.left = `${rect.left}px`;
  avatarSessionEl.style.top = `${rect.top}px`;
  avatarSessionEl.style.width = `${rect.width}px`;
  avatarSessionEl.style.height = `${rect.height}px`;

  const selectedSession = getSelectedSession();
  const src = buildAvatarFrameSrc({
    host: AVATAR_HOST_SESSION,
    sessionId: selectedSession.id,
    autostart: false,
    conversationId: state.avatarConversationId
  });

  if (avatarSessionIframeEl.dataset.src !== src) {
    avatarReadyState[AVATAR_HOST_SESSION] = false;
    avatarSessionIframeEl.dataset.src = src;
    avatarSessionIframeEl.src = src;
  }
}

function openSession(sessionId) {
  if (state.sessionActive && state.selectedSessionId !== sessionId) {
    return;
  }

  endHomeDockAvatar();
  state.selectedSessionId = sessionId;
  state.screen = "session";
  state.avatarDockVisible = true;
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
  if (state.slideIndex === breathingSlides.length - 1) {
    endSelectedSession();
    return;
  }

  if (state.slideIndex === 3) {
    clearBoxTimers();
    state.boxTraceSide = null;
    state.boxTraceStatus = "idle";
  }

  const nextIndex = Math.min(breathingSlides.length - 1, state.slideIndex + 1);
  const changed = nextIndex !== state.slideIndex;
  state.slideIndex = nextIndex;
  render();

  if (changed) {
    advanceAvatarGuidance();
  }
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

  const msgId = `assistant-${Date.now()}`;
  const body = JSON.stringify({
    message: buildChatPrompt(trimmedMessage, getSessionContext()),
    session_id: state.chatSessionId
  });

  try {
    // Try streaming first so text appears as it generates
    let gotChunk = false;
    try {
      const res = await fetch(`${API_BASE_URL}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let fullText = "";

      state.chatMessages = [...state.chatMessages, { id: msgId, role: "assistant", content: "" }];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop();
        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          const evt = JSON.parse(part.slice(6));
          if (evt.error) throw new Error(evt.error);
          if (evt.done) break;
          if (evt.chunk) {
            gotChunk = true;
            fullText += (fullText ? " " : "") + evt.chunk;
            state.chatMessages = state.chatMessages.map(m =>
              m.id === msgId ? { ...m, content: fullText } : m
            );
            state.chatStatus = "Typing...";
            render();
          }
        }
      }
    } catch (streamErr) {
      if (gotChunk) throw streamErr;
      // Stream unavailable — fall back to full response
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Request failed");
      }
      const data = await response.json();
      const content = data.reply || "(No response text returned.)";
      state.chatMessages = [
        ...state.chatMessages,
        { id: msgId, role: "assistant", content }
      ];
    }

    state.chatStatus = "Ready";
  } catch (error) {
    state.chatMessages = [
      ...state.chatMessages.filter(m => m.id !== msgId),
      {
        id: msgId,
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
  startAvatarGuidance();
}

function endSelectedSession() {
  const selectedSession = getSelectedSession();
  if (!state.sessionActive) {
    return;
  }

  endAvatarGuidance();

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

async function handleWebSignIn() {
  const email = state.signInEmail.trim();
  const password = state.signInPassword.trim();
  if (!email || !password) {
    state.signInError = "Please enter both email and password.";
    render();
    return;
  }
  // BYPASS: accept any credentials for testing — remove when Firebase env vars are configured
  state.authenticated = true;
  state.currentUser = { email };
  state.authScreen = "signin";
  render();
}

async function handleWebSignUp() {
  const firstName = state.signUpFirstName.trim();
  const lastName  = state.signUpLastName.trim();
  const email     = state.signUpEmail.trim();
  const password  = state.signUpPassword;
  const confirm   = state.signUpConfirmPassword;
  if (!firstName || !lastName || !email || !password || !confirm) {
    state.signUpError = "Please fill in all required fields.";
    render();
    return;
  }
  if (password !== confirm) {
    state.signUpError = "Passwords do not match.";
    render();
    return;
  }
  if (password.length < 8) {
    state.signUpError = "Password must be at least 8 characters.";
    render();
    return;
  }
  state.signUpError = "Creating account…";
  render();
  try {
    if (!window._fb) throw new Error("not-ready");
    const credential = await window._fb.signUp(email, password);
    await window._fb.saveUserProfile(credential.user.uid, {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email,
      dateOfBirth: state.signUpDob || "",
      languagePreference: state.locale,
      createdAt: new Date(),
      totalSessionTime: 0,
    });
  } catch (err) {
    const code = err.code || "";
    state.signUpError =
      code === "auth/email-already-in-use"
        ? "An account with this email already exists."
        : code === "not-ready"
        ? "Still connecting — please try again in a moment."
        : "Account creation failed. Please try again.";
    render();
  }
}

async function handleLogout() {
  clearExerciseState();
  if (window._fb) {
    try { await window._fb.signOut(); } catch {}
  }
  state.authenticated = false;
  state.currentUser = null;
  state.authScreen = "signin";
  state.screen = "home";
  state.languageModalVisible = true;
  state.avatarDockVisible = true;
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
        ${
          session.description
            ? `<p class="session-description">${escapeHtml(session.description)}</p>`
            : ""
        }
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
    <section class="tutorial-card tutorial-card-simple">
      <div class="tutorial-slide tutorial-slide-simple">
        <span class="slide-label">${escapeHtml(slide.stepLabel)}</span>
        <h2 class="slide-title slide-title-left">${slide.title}</h2>
        <p class="slide-body slide-body-left">${escapeHtml(slide.body)}</p>

        ${
          slide.key === "comfort"
            ? `
              <div class="steps-list steps-list-simple">
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
              <div class="session-step-status">
                <span class="phase-badge">${escapeHtml(state.phaseBadge)}</span>
                <p class="phase-subtext phase-subtext-left">${escapeHtml(state.phaseSubtext)}</p>
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
              <div class="tip-card">
                <span class="tip-label">Pattern</span>
                <p class="tip-body">Inhale for 4, hold for 4, exhale for 4, then hold for 4.</p>
              </div>
            `
            : ""
        }

        ${
          slide.key === "return"
            ? `
              <div class="tip-card">
                <span class="tip-label">You did it</span>
                <p class="tip-body">${escapeHtml(slide.note)}</p>
              </div>
            `
            : ""
        }
      </div>
    </section>
  `;
}

function renderSignInScreen() {
  const cornerLabel = state.locale === "en" ? "한국어" : "English";

  return `
    <main class="signin-screen">
      <div class="signin-lang-corner">
        <button class="signin-lang-btn" data-action="toggle-language" type="button">
          ${escapeHtml(cornerLabel)}
        </button>
      </div>

      <section class="signin-card" aria-label="Sign in">
        <img
          class="signin-logo"
          src="../assets/multi-lang-wellness.png"
          alt="Multilingual wellness"
        >
        <h1 class="signin-title">${escapeHtml(t("signInWelcome"))}</h1>
        <p class="signin-subtitle">${escapeHtml(t("signInSubtitle"))}</p>

        <label class="signin-field">
          <span class="signin-icon" aria-hidden="true">✉</span>
          <input
            id="signin-email"
            type="email"
            autocomplete="email"
            placeholder="${escapeHtml(t("email"))}"
            value="${escapeHtml(state.signInEmail)}"
          >
        </label>

        <label class="signin-field">
          <span class="signin-icon" aria-hidden="true">●</span>
          <input
            id="signin-password"
            type="password"
            autocomplete="current-password"
            placeholder="${escapeHtml(t("password"))}"
            value="${escapeHtml(state.signInPassword)}"
          >
        </label>

        ${state.signInError ? `<p class="signin-error">${escapeHtml(state.signInError)}</p>` : ""}

        <button class="signin-submit" data-action="sign-in" type="button">
          <span>${escapeHtml(t("signInButton"))}</span>
          <span aria-hidden="true">›</span>
        </button>

        <button class="signin-link" data-action="sign-up-placeholder" type="button">
          + ${escapeHtml(t("signUpPrompt"))}
        </button>
      </section>

      <p class="signin-footer">${escapeHtml(t("signInFooter"))}</p>
    </main>
  `;
}

function renderSignUpScreen() {
  const cornerLabel = state.locale === "en" ? "한국어" : "English";
  return `
    <main class="signin-screen">
      <div class="signin-lang-corner">
        <button class="signin-lang-btn" data-action="toggle-language" type="button">
          ${escapeHtml(cornerLabel)}
        </button>
      </div>

      <section class="signin-card signup-card" aria-label="Create account">
        <h1 class="signin-title">${escapeHtml(t("signUpHeader"))}</h1>

        <div class="signup-name-row">
          <label class="signin-field signup-half">
            <input
              id="signup-firstname"
              type="text"
              autocomplete="given-name"
              placeholder="${escapeHtml(t("firstName"))}"
              value="${escapeHtml(state.signUpFirstName)}"
            >
          </label>
          <label class="signin-field signup-half">
            <input
              id="signup-lastname"
              type="text"
              autocomplete="family-name"
              placeholder="${escapeHtml(t("lastName"))}"
              value="${escapeHtml(state.signUpLastName)}"
            >
          </label>
        </div>

        <label class="signin-field">
          <input
            id="signup-dob"
            type="date"
            autocomplete="bday"
            placeholder="${escapeHtml(t("dateOfBirth"))}"
            value="${escapeHtml(state.signUpDob)}"
          >
        </label>

        <label class="signin-field">
          <span class="signin-icon" aria-hidden="true">✉</span>
          <input
            id="signup-email"
            type="email"
            autocomplete="email"
            placeholder="${escapeHtml(t("email"))}"
            value="${escapeHtml(state.signUpEmail)}"
          >
        </label>

        <label class="signin-field">
          <span class="signin-icon" aria-hidden="true">●</span>
          <input
            id="signup-password"
            type="password"
            autocomplete="new-password"
            placeholder="${escapeHtml(t("password"))}"
            value="${escapeHtml(state.signUpPassword)}"
          >
        </label>

        <label class="signin-field">
          <span class="signin-icon" aria-hidden="true">●</span>
          <input
            id="signup-confirm"
            type="password"
            autocomplete="new-password"
            placeholder="${escapeHtml(t("confirmPassword"))}"
            value="${escapeHtml(state.signUpConfirmPassword)}"
          >
        </label>

        ${state.signUpError ? `<p class="signin-error">${escapeHtml(state.signUpError)}</p>` : ""}

        <button class="signin-submit" data-action="sign-up" type="button">
          <span>${escapeHtml(t("signUpSubmit"))}</span>
          <span aria-hidden="true">›</span>
        </button>

        <button class="signin-link" data-action="go-sign-in" type="button">
          ${escapeHtml(t("backToSignIn"))}
        </button>
      </section>

      <p class="signin-footer">${escapeHtml(t("signInFooter"))}</p>
    </main>
  `;
}

function renderHomeScreen() {
  const selectedSession = getSelectedSession();

  return `
    ${
      state.languageModalVisible
        ? `
          <div class="home-modal-overlay">
            <section class="home-modal">
              <h2 class="home-modal-title">Language / 언어</h2>
              <div class="home-language-choices">
                <button class="home-language-choice ${state.locale === "en" ? "selected" : ""}" data-action="set-language" data-locale="en" type="button">English</button>
                <button class="home-language-choice ${state.locale === "ko" ? "selected" : ""}" data-action="set-language" data-locale="ko" type="button">한국어</button>
              </div>
              <button class="home-start-btn" data-action="close-language-modal" type="button">${escapeHtml(t("start"))}</button>
            </section>
          </div>
        `
        : ""
    }

    <section class="connected-hero" style="border-radius:12px;">
      <div class="connected-hero-copy">
        <span class="hero-eyebrow">Mindfulness Sessions</span>
        <h1 class="connected-hero-title">Mindfulness, guided with calm.</h1>
        <p class="connected-hero-body">
          Explore a softer session space where your avatar guide greets visitors on the selection page,
          then supports each mindfulness exercise when you are ready to begin.
        </p>
        <div class="hero-actions">
          ${
            !state.avatarDockVisible
              ? `<button class="action-button action-button-primary" data-action="open-avatar-dock">Open Chat</button>`
              : `<button class="action-button action-button-primary" data-action="open-session" data-session-id="${selectedSession.id}">Start With Box Breathing</button>`
          }
          <button class="action-button action-button-secondary" data-action="open-session" data-session-id="${selectedSession.id}" style="background:rgba(255,255,255,0.18);color:#fff;border:1px solid rgba(255,255,255,0.35);">
            Explore Sessions
          </button>
        </div>
      </div>
      <div class="connected-guide-card">
        <span class="hero-stat-pill">Sessions</span>
        <strong>12 mindful spaces</strong>
        <p>Choose a practice and let the guide lead the pace.</p>
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

    <section class="home-card-grid">
      <article class="home-info-card">
        <h2>${escapeHtml(t("card1Title"))}</h2>
        <p>${escapeHtml(t("card1Text"))}</p>
      </article>
      <article class="home-info-card">
        <h2>${escapeHtml(t("card3Title"))}</h2>
        <p>${escapeHtml(t("card3Text"))}</p>
      </article>
      <article class="home-info-card">
        <h2>${escapeHtml(t("card4Title"))}</h2>
        <p>${escapeHtml(t("card4Text"))}</p>
      </article>
    </section>

    <button class="home-support-btn" type="button">${escapeHtml(t("supportBtn"))}</button>
  `;
}

function renderSessionScreen() {
  const selectedSession = getSelectedSession();
  const currentSlide = breathingSlides[state.slideIndex] || breathingSlides[0];
  const nextStepDisabled =
    state.roundRunning ||
    (currentSlide.key === "rounds" && state.roundsDone < TOTAL_BREATHING_ROUNDS);

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
      ${
        selectedSession.description
          ? `<p class="detail-description">${escapeHtml(selectedSession.description)}</p>`
          : ""
      }
      <p class="detail-meta">Status: ${escapeHtml(state.sessionStatus)}</p>
    </section>

    <section class="control-row">
      <button class="action-button action-button-primary" data-action="start-session" ${state.sessionActive ? "disabled" : ""}>
        Start Session
      </button>
      <button class="action-button action-button-secondary" data-action="end-session" ${!state.sessionActive ? "disabled" : ""}>
        End Session
      </button>
    </section>

    <div class="session-avatar-copy">
      <p class="panel-title">Avatar Guide</p>
    </div>
    <section class="panel-card session-avatar-shell">
      <div class="session-avatar-host" id="session-avatar-host"></div>
      ${
        state.sessionActive && selectedSession.kind === "guided"
          ? `
            <div class="session-avatar-controls">
              <button
                class="action-button action-button-primary"
                data-action="next-slide"
                ${nextStepDisabled ? "disabled" : ""}
              >
                ${state.slideIndex === breathingSlides.length - 1 ? "Finish" : "Next"}
              </button>
            </div>
          `
          : ""
      }
    </section>

    ${
      selectedSession.kind === "guided"
        ? state.sessionActive
          ? renderTutorialCard()
          : ""
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

    ${
      selectedSession.kind === "guided"
        ? ""
        : `
            <section class="panel-card">
              <p class="panel-title">Placeholder Notes</p>
              <p class="panel-body">
                ${escapeHtml(
                  state.placeholderMessage ||
                    "Start Session if you want to test the empty placeholder flow for this tile."
                )}
              </p>
            </section>
          `
    }
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
  if (!state.authenticated) {
    appEl.innerHTML = state.authScreen === "signup" ? renderSignUpScreen() : renderSignInScreen();
    attachInputHandlers();
    if (avatarDockEl) {
      avatarDockEl.classList.add("hidden");
    }
    if (avatarSessionEl) {
      avatarSessionEl.classList.add("hidden");
    }
    return;
  }

  appEl.innerHTML = `
    <main class="home-container">
      <header class="home-header">
        <div class="home-lang-container">
          <span class="home-lang-label">${escapeHtml(t("language"))}</span>
          <button class="home-header-lang-btn" data-action="toggle-language" type="button">
            ${escapeHtml(state.locale.toUpperCase())}
          </button>
        </div>
        <h1 class="home-header-title">${escapeHtml(t("headerTitle"))}</h1>
        <button class="home-logout-btn" data-action="logout" type="button">${escapeHtml(t("logoutBtn"))}</button>
      </header>

      <div class="home-scroll-body content-stack">
        ${state.screen === "home" ? renderHomeScreen() : renderSessionScreen()}
      </div>
    </main>
    ${renderSummaryModal()}
  `;

  attachInputHandlers();
  scrollChatToBottom();
  syncAvatarDock();
  syncSessionAvatarPanel();
}

function attachInputHandlers() {
  const signInEmail = document.getElementById("signin-email");
  if (signInEmail) {
    signInEmail.addEventListener("input", (event) => {
      state.signInEmail = event.target.value;
      state.signInError = "";
    });
    signInEmail.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("signin-password")?.focus();
      }
    });
  }

  const signInPassword = document.getElementById("signin-password");
  if (signInPassword) {
    signInPassword.addEventListener("input", (event) => {
      state.signInPassword = event.target.value;
      state.signInError = "";
    });
    signInPassword.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleWebSignIn();
      }
    });
  }

  const bindSignup = (id, key) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", (e) => { state[key] = e.target.value; state.signUpError = ""; });
  };
  bindSignup("signup-firstname", "signUpFirstName");
  bindSignup("signup-lastname",  "signUpLastName");
  bindSignup("signup-dob",       "signUpDob");
  bindSignup("signup-email",     "signUpEmail");
  bindSignup("signup-password",  "signUpPassword");
  bindSignup("signup-confirm",   "signUpConfirmPassword");

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
    case "toggle-language":
      state.locale = state.locale === "en" ? "ko" : "en";
      render();
      break;
    case "set-language":
      state.locale = actionEl.dataset.locale === "ko" ? "ko" : "en";
      render();
      break;
    case "close-language-modal":
      state.languageModalVisible = false;
      render();
      break;
    case "sign-in":
      handleWebSignIn();
      break;
    case "sign-up-placeholder":
    case "go-sign-up":
      state.authScreen = "signup";
      state.signUpError = "";
      render();
      break;
    case "go-sign-in":
      state.authScreen = "signin";
      state.signInError = "";
      render();
      break;
    case "sign-up":
      handleWebSignUp();
      break;
    case "logout":
      handleLogout();
      break;
    case "open-session":
      openSession(actionEl.dataset.sessionId);
      break;
    case "resume-session":
      state.screen = "session";
      render();
      break;
    case "open-avatar-dock":
      state.avatarDockVisible = true;
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

window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin) {
    return;
  }

  const data = event.data;
  if (!data || data.source !== "mindfulness-avatar" || data.type !== "avatar-ready") {
    return;
  }

  if (!avatarReadyState[data.host]) {
    avatarReadyState[data.host] = true;
  }

  flushAvatarCommands(data.host);
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

window.addEventListener("resize", () => {
  if (avatarDockEl && !avatarDockEl.classList.contains("hidden")) {
    applyAvatarDockPosition();
  }

  syncSessionAvatarPanel();
});

window.addEventListener("scroll", () => {
  syncSessionAvatarPanel();
});

fetch(`${API_BASE_URL}/health`, {
  method: "GET",
  cache: "no-store"
}).catch(() => {
  // Keep the interface usable even if the Render instance is still waking up.
});

window._fb = null;

(async function initApp() {
  let fbReady = false;
  try {
    const res = await fetch("/firebase-config");
    const { firebaseConfig } = await res.json();
    if (firebaseConfig && firebaseConfig.apiKey) {
      firebase.initializeApp(firebaseConfig);
      const auth = firebase.auth();
      const db = firebase.firestore();
      window._fb = {
        signIn:           (email, pw) => auth.signInWithEmailAndPassword(email, pw),
        signUp:           (email, pw) => auth.createUserWithEmailAndPassword(email, pw),
        signOut:          ()          => auth.signOut(),
        saveUserProfile:  (uid, data) => db.collection("users").doc(uid).set(data),
      };
      fbReady = true;
      auth.onAuthStateChanged((user) => {
        state.authenticated = !!user;
        state.currentUser = user || null;
        if (user) state.authScreen = "signin";
        render();
      });
    }
  } catch (_) {
    // Firebase unavailable — fall through to plain render
  }
  if (!fbReady) render();
})();