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

const SESSION_SCRIPTS = {
  "caregiver-fatigue": [
    { key: "cf1",  text: "Thanks for joining me for this short meditation." },
    { key: "cf2",  text: "In this brief practice, we'll explore some simple steps to recharge when we're feeling burnt out or overwhelmed by our efforts to help others." },
    { key: "cf3",  text: "Go ahead and get comfortable. You can close your eyes if you like, or keep them gently open with a soft, relaxed gaze." },
    { key: "cf4",  text: "As you settle in, take a few slow, calming breaths. And notice how it feels to breathe." },
    { key: "cf5",  text: "Now let your breath return to its normal pace. Give yourself a few moments to rest and recharge as you bring yourself fully into the here and now." },
    { key: "cf6",  text: "Great. Now we'll shift gears and tap into our ability to hold the suffering of others in a healthy way." },
    { key: "cf7",  text: "Empathy can be a bridge to care and compassion, but it can also lead us into a state of overwhelm — what scientists call empathic distress." },
    { key: "cf8",  text: "One simple way to avoid this overwhelm is to ground yourself in a caring motivation. Let's give this a try." },
    { key: "cf9",  text: "Start by bringing to mind someone you care about. It could be your care recipient or anyone you care about." },
    { key: "cf10", text: "Take a moment to imagine that they're actually here with you, and see if you can sense the deep connection you share with them." },
    { key: "cf11", text: "As you tap into this sense of connection, see if you could notice your impulse to care for this individual, or perhaps your natural wish for them to be happy and free from suffering." },
    { key: "cf12", text: "If it helps, you can give voice to this in your mind. You may think to yourself: May you be free from suffering and hardship. May you have all the happiness in the world." },
    { key: "cf13", text: "Feel free to make up your own compassionate phrases and imagine sharing them with this person that you care about." },
    { key: "cf14", text: "Now bring others to mind — or perhaps groups of people, or even the Earth itself." },
    { key: "cf15", text: "Acknowledge their pain and suffering, and also the tremendous resilience that we all have." },
    { key: "cf16", text: "Imagine a world where they are free from suffering and free from adversity. See if you can picture them happy, at ease, healthy, and balanced." },
    { key: "cf17", text: "Let your mind roam here and continue to send kind, caring thoughts and phrases out into the world." },
    { key: "cf18", text: "Next, include yourself in this circle of compassion." },
    { key: "cf19", text: "Imagine the people in your life who care for you, or even strangers who are sending love and compassion out into the world, just like you are." },
    { key: "cf20", text: "Imagine that all this caring energy is flowing into you, and see if you can be open to receiving it." },
    { key: "cf21", text: "For these last few moments, notice how you feel right now without any judgment." },
    { key: "cf22", text: "Bring a sense of openness, curiosity, and care to your own thoughts and feelings, whatever they may be." },
    { key: "cf23", text: "When we feel the suffering of others and the suffering of the world in a very direct way, our own feelings and reactions can easily overwhelm us." },
    { key: "cf24", text: "Here we practice the skill of grounding ourselves in a caring motivation. With this motivation, we get a little more space to be with our feelings and reactions without getting swept away by them." },
    { key: "cf25", text: "Hopefully you found this helpful. If you did, see if you can keep practicing for short moments over the next day or two. Take care and good luck with your practice." }
  ],
  "mindful-breathing": [
    { key: "mb1",  text: "Hello and welcome back. Today we are going to focus on a fundamental practice: mindful breathing." },
    { key: "mb2",  text: "This is a tool you can use anywhere, at any time, to ground yourself and find a moment of calm." },
    { key: "mb3",  text: "Start by finding a comfortable seat. Allow your back to be straight but not stiff." },
    { key: "mb4",  text: "Let your hands rest gently in your lap or on your knees. If it feels okay, go ahead and close your eyes, or simply lower your gaze and let it soften." },
    { key: "mb5",  text: "Now, take a deep breath in through your nose, feeling your lungs expand. And exhale slowly through your mouth." },
    { key: "mb6",  text: "Do that one more time — deep breath in... and a long breath out." },
    { key: "mb7",  text: "Now, let your breath settle into its natural rhythm. You don't need to change it or control it. Just observe it." },
    { key: "mb8",  text: "Notice where you feel the breath most clearly. It might be the cool air at the tip of your nose, the rise and fall of your chest, or the expansion and contraction of your belly." },
    { key: "mb9",  text: "As you sit here, you may notice your mind starting to wander. This is perfectly normal. That's just what minds do." },
    { key: "mb10", text: "When you realize your thoughts have drifted to the past, the future, or a to-do list, simply acknowledge the thought without judgment." },
    { key: "mb11", text: "Think of it like a cloud passing through the sky. Then, gently and kindly, escort your attention back to the physical sensation of your breath." },
    { key: "mb12", text: "Back to the inhale... and the exhale." },
    { key: "mb13", text: "Let's stay with this for a few moments in silence. Following each breath from the beginning of the inhalation, through the brief pause, to the end of the exhalation." },
    { key: "mb14", text: "If you get distracted ten times, just bring yourself back ten times. Every time you return to the breath, you are strengthening your mindfulness muscle." },
    { key: "mb15", text: "As we bring this practice to a close, take a moment to notice how you feel. Is there a sense of stillness? A bit more space in your mind?" },
    { key: "mb16", text: "Know that this breath is always available to you as an anchor." },
    { key: "mb17", text: "When you're ready, gently wiggle your fingers and toes, and slowly open your eyes." },
    { key: "mb18", text: "Thank you for practicing with me today. Take this sense of presence with you as you move into the rest of your day." }
  ]
};

function buildScriptSegmentPrompt(segment) {
  return `Read the following meditation script passage aloud, word for word. Do not add, omit, or change anything:\n\n${segment.text}`;
}

const sessionCatalog = [
  {
    id: "caregiver-fatigue",
    title: "Caregiver Fatigue",
    description: "A compassion meditation to recharge when caring for others.",
    kind: "scripted",
    duration: "~4 min · 6 segments"
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
    id: "mindful-breathing",
    title: "Mindful Breathing",
    description: "A foundational breath awareness practice you can use anywhere.",
    kind: "scripted",
    duration: "~5 min · 5 segments"
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
    headerTitle: "Mindfulness Sessions",
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
    profileTitle: "Profile",
    personalInformation: "Personal Information",
    settings: "Settings",
    support: "Support",
    logOut: "Log Out",
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
    headerTitle: "마음챙김 세션",
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
    profileTitle: "프로필",
    personalInformation: "개인 정보",
    settings: "설정",
    support: "지원",
    logOut: "로그아웃",
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
  scriptSlideIndex: 0,
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
  avatarDockY: null,
  userStats: null,
  userStatsLoading: false,
  userStatsUnsubscribe: null,
  userSessions: [],
  userSessionsLoading: false,
  userSessionsUnsubscribe: null,
  settings: {
    notifications: false,
    theme: "light"
  },
  settingsBanner: { type: "", text: "" }
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

function formatMinutes(seconds) {
  if (!seconds || seconds <= 0) return "0 min";
  const totalMinutes = Math.floor(seconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins === 0 ? `${hours} hr` : `${hours} hr ${mins} min`;
}

const TRACKING_DAY_MS = 24 * 60 * 60 * 1000;

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDayDifference(previousDateKey, currentDateKey) {
  if (!previousDateKey) return null;
  const previous = new Date(`${previousDateKey}T00:00:00`);
  const current = new Date(`${currentDateKey}T00:00:00`);
  if (Number.isNaN(previous.getTime()) || Number.isNaN(current.getTime())) {
    return null;
  }
  return Math.round((current.getTime() - previous.getTime()) / TRACKING_DAY_MS);
}

function roundSessionMinutes(seconds) {
  return Math.round((seconds / 60) * 100) / 100;
}

async function recordSessionCompletion({ selectedSession, elapsedSeconds, completed, metadata = {} }) {
  if (!window._fb || !selectedSession || elapsedSeconds <= 0) return;
  try {
    await window._fb.recordCompletedSession({
      sessionId: selectedSession.id,
      sessionTitle: selectedSession.title,
      durationSeconds: elapsedSeconds,
      completed,
      metadata,
    });
  } catch (error) {
    console.warn("Failed to record session tracking data", error);
  }
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
    scriptSlideIndex: state.scriptSlideIndex,
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

  if (sessionContext.selectedSession.kind === "scripted") {
    const segments = SESSION_SCRIPTS[sessionContext.selectedSession.id] || [];
    lines.push(`This is a scripted session with ${segments.length} passages.`);
    lines.push(`Current passage: ${sessionContext.scriptSlideIndex + 1} of ${segments.length}.`);
  } else {
    lines.push("This session page is currently a placeholder with no guided content yet.");
  }

  lines.push(`User message: ${message}`);
  return lines.join("\n");
}

function buildLocalChatFallback(_message, sessionContext) {
  if (sessionContext?.selectedSession?.kind === "scripted") {
    const segments = SESSION_SCRIPTS[sessionContext.selectedSession.id] || [];
    return `${sessionContext.selectedSession.title} is a scripted session with ${segments.length} passages. You are on passage ${(sessionContext.scriptSlideIndex || 0) + 1}.`;
  }

  if (sessionContext?.selectedSession) {
    return `${sessionContext.selectedSession.title} is currently an empty placeholder session. The tile and session page are ready, but the guided exercise itself has not been filled in yet.`;
  }

  return "This app has 12 session tiles. Sessions 1 and 4 have scripted content; the other 10 are placeholders for future exercises.";
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
  state.scriptSlideIndex = 0;
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

  if (selectedSession.kind === "scripted") {
    const segments = SESSION_SCRIPTS[selectedSession.id] || [];
    const segment  = segments[state.scriptSlideIndex] || segments[0];
    if (segment) {
      queueAvatarCommand(AVATAR_HOST_SESSION, {
        type: "host-speak-script",
        text: segment.text
      });
      return;
    }
  }

  const prompt = selectedSession.kind === "guided"
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
    autostart: true,
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
  avatarSessionEl.style.left   = rect.left   + "px";
  avatarSessionEl.style.top    = rect.top    + "px";
  avatarSessionEl.style.width  = rect.width  + "px";
  avatarSessionEl.style.height = rect.height + "px";

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
  if (avatarSessionEl) avatarSessionEl.classList.add("hidden");
  render();
}

function goProfile() {
  endHomeDockAvatar();
  state.screen = "profile";
  if (avatarSessionEl) avatarSessionEl.classList.add("hidden");
  render();
}

function goStats() {
  endHomeDockAvatar();
  state.screen = "stats";
  if (avatarSessionEl) avatarSessionEl.classList.add("hidden");
  render();
}

function goSubpage(screen) {
  endHomeDockAvatar();
  state.screen = screen;
  state.settingsBanner = { type: "", text: "" };
  if (avatarSessionEl) avatarSessionEl.classList.add("hidden");
  render();
}

const SETTINGS_STORAGE_KEY = "mc_settings_v1";

function loadLocalSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      state.settings = { ...state.settings, ...parsed };
    }
  } catch {}
  applyTheme(state.settings.theme);
}

function persistLocalSettings() {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state.settings));
  } catch {}
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";
}

async function persistRemoteSettings(patch) {
  if (!window._fb || !state.currentUser || typeof firebase === "undefined") return;
  try {
    const db = firebase.firestore();
    const payload = {};
    if (Object.prototype.hasOwnProperty.call(patch, "locale")) {
      payload.locale = patch.locale;
    }
    const settingsKeys = ["notifications", "theme"];
    const settingsPatch = {};
    let hasSettings = false;
    settingsKeys.forEach((k) => {
      if (Object.prototype.hasOwnProperty.call(patch, k)) {
        settingsPatch[k] = patch[k];
        hasSettings = true;
      }
    });
    if (hasSettings) {
      payload.settings = { ...state.settings, ...settingsPatch };
    }
    payload.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    await db.collection("users").doc(state.currentUser.uid).set(payload, { merge: true });
  } catch (err) {
    console.warn("Failed to save settings", err);
  }
}

function showSettingsBanner(type, text) {
  state.settingsBanner = { type, text };
  render();
  setTimeout(() => {
    if (state.settingsBanner.text === text) {
      state.settingsBanner = { type: "", text: "" };
      if (state.screen === "settings") render();
    }
  }, 4000);
}

async function handleToggleNotifications() {
  const next = !state.settings.notifications;
  if (next) {
    if (!("Notification" in window)) {
      showSettingsBanner("error", "Notifications are not supported in this browser.");
      return;
    }
    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }
    if (permission !== "granted") {
      showSettingsBanner("error", "Notification permission was denied. Enable it in your browser settings.");
      return;
    }
    state.settings.notifications = true;
    persistLocalSettings();
    persistRemoteSettings({ notifications: true });
    try { new Notification("Mindfulness Connected", { body: "Notifications are on. We'll nudge you gently." }); } catch {}
    showSettingsBanner("ok", "Notifications enabled.");
  } else {
    state.settings.notifications = false;
    persistLocalSettings();
    persistRemoteSettings({ notifications: false });
    showSettingsBanner("ok", "Notifications disabled.");
  }
  render();
}

function handleToggleTheme() {
  state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
  applyTheme(state.settings.theme);
  persistLocalSettings();
  persistRemoteSettings({ theme: state.settings.theme });
  render();
}

async function handlePasswordReset() {
  if (!window._fb || !state.currentUser || !state.currentUser.email) {
    showSettingsBanner("error", "You must be signed in with an email to reset your password.");
    return;
  }
  try {
    const auth = firebase.auth();
    await auth.sendPasswordResetEmail(state.currentUser.email);
    showSettingsBanner("ok", `Password reset email sent to ${state.currentUser.email}.`);
  } catch (err) {
    showSettingsBanner("error", err.message || "Could not send reset email.");
  }
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

function goToNextScriptSegment() {
  const segments = SESSION_SCRIPTS[state.selectedSessionId] || [];
  if (state.scriptSlideIndex >= segments.length - 1) {
    endSelectedSession();
    return;
  }
  state.scriptSlideIndex += 1;
  render();
  const segment = segments[state.scriptSlideIndex];
  queueAvatarCommand(AVATAR_HOST_SESSION, {
    type: "host-speak-script",
    text: segment.text
  });
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
  } else if (selectedSession.kind === "scripted") {
    state.scriptSlideIndex = 0;
    state.placeholderMessage = "";
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
  let completed = true;
  const trackingMetadata = { kind: selectedSession.kind };

  if (selectedSession.kind === "guided") {
    state.sessionSummary = buildGuidedSessionSummary(state.slideIndex, state.roundsDone);
    completed = state.slideIndex === breathingSlides.length - 1 || state.roundsDone >= TOTAL_BREATHING_ROUNDS;
    trackingMetadata.slideIndex = state.slideIndex;
    trackingMetadata.roundsDone = state.roundsDone;
    trackingMetadata.totalRounds = TOTAL_BREATHING_ROUNDS;
  } else if (selectedSession.kind === "scripted") {
    const segments = SESSION_SCRIPTS[selectedSession.id] || [];
    completed = segments.length > 0 && state.scriptSlideIndex >= segments.length - 1;
    trackingMetadata.scriptSlideIndex = state.scriptSlideIndex;
    trackingMetadata.scriptSegments = segments.length;
    state.sessionSummary = completed
      ? `You completed the full ${selectedSession.title} session.`
      : `You ended ${selectedSession.title} after passage ${state.scriptSlideIndex + 1} of ${segments.length}.`;
  } else {
    state.sessionSummary = `${selectedSession.title} ended. This session page is still empty for now, but the layout is ready for future guided content.`;
  }

  void recordSessionCompletion({
    selectedSession,
    elapsedSeconds,
    completed,
    metadata: { ...trackingMetadata, summary: state.sessionSummary },
  });

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
  state.signInError = "Signing in…";
  render();
  try {
    if (!window._fb) throw new Error("not-ready");
    await window._fb.signIn(email, password);
  } catch (err) {
    const code = err.code || "";
    state.signInError =
      code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential"
        ? "Email or password is incorrect."
        : code === "auth/too-many-requests"
        ? "Too many attempts. Please wait a moment and try again."
        : err.message === "not-ready"
        ? "Firebase is not configured yet. Add EXPO_PUBLIC_FIREBASE_* values to .env and restart the server."
        : "Sign in failed. Please try again.";
    render();
  }
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
      sessionsFinished: 0,
      totalSessionSeconds: 0,
      totalSessionMinutes: 0,
      totalSessionTime: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalActiveDays: 0,
      totalDays: 0,
      lastActiveDate: null,
    });
  } catch (err) {
    const code = err.code || "";
    state.signUpError =
      code === "auth/email-already-in-use"
        ? "An account with this email already exists."
        : code === "auth/invalid-email"
        ? "Please enter a valid email address."
        : code === "auth/weak-password"
        ? "Password is too weak. Please use at least 8 characters."
        : err.message === "not-ready"
        ? "Firebase is not configured yet. Add EXPO_PUBLIC_FIREBASE_* values to .env and restart the server."
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
  if (avatarSessionEl) avatarSessionEl.classList.add("hidden");
  render();
}

function renderSessionTile(session) {
  const disabled = state.sessionActive && state.selectedSessionId !== session.id;
  const selected = state.selectedSessionId === session.id;

  return `
    <button
      class="session-tile ${session.kind !== "placeholder" ? "session-tile-guided" : "session-tile-placeholder"} ${selected ? "session-tile-selected" : ""}"
      data-action="open-session"
      data-session-id="${session.id}"
      ${disabled ? "disabled" : ""}
    >
      <div class="session-tile-top">
        <span class="session-number">${session.number}</span>
        <span class="pill ${session.kind !== "placeholder" ? "pill-guided" : "pill-placeholder"}">
          ${session.kind !== "placeholder" ? "Ready" : "Empty"}
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

  `;
}

function formatSessionTimestamp(createdAt, localDate) {
  if (createdAt instanceof Date && !Number.isNaN(createdAt.getTime())) {
    return createdAt.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }
  if (localDate) {
    const parsed = new Date(`${localDate}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return localDate;
  }
  return "";
}

function formatSessionLength(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m < 60) return rem ? `${m}m ${rem}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const mins = m % 60;
  return mins ? `${h}h ${mins}m` : `${h}h`;
}

function renderSessionHistory() {
  if (!state.currentUser) return "";
  if (state.userSessionsLoading && state.userSessions.length === 0) {
    return `
      <section class="history-section">
        <h2 class="history-title">Session history</h2>
        <p class="history-empty">Loading your sessions…</p>
      </section>
    `;
  }
  if (!state.userSessions.length) {
    return `
      <section class="history-section">
        <h2 class="history-title">Session history</h2>
        <p class="history-empty">No completed sessions yet. Finish a session and it will appear here.</p>
      </section>
    `;
  }
  return `
    <section class="history-section">
      <h2 class="history-title">Session history</h2>
      <ul class="history-list">
        ${state.userSessions
          .map((entry) => {
            const when = formatSessionTimestamp(entry.createdAt, entry.localDate);
            const length = formatSessionLength(entry.durationSeconds);
            const status = entry.completed ? "Completed" : "Ended early";
            return `
              <li class="history-item">
                <div class="history-item-head">
                  <p class="history-item-title">${escapeHtml(entry.sessionTitle)}</p>
                  <span class="history-item-pill ${entry.completed ? "history-pill-ok" : "history-pill-partial"}">${escapeHtml(status)}</span>
                </div>
                <p class="history-item-meta">
                  ${when ? `<span>${escapeHtml(when)}</span>` : ""}
                  ${when && length ? `<span class="history-dot">•</span>` : ""}
                  ${length ? `<span>${escapeHtml(length)}</span>` : ""}
                </p>
                ${entry.summary ? `<p class="history-item-summary">${escapeHtml(entry.summary)}</p>` : ""}
              </li>
            `;
          })
          .join("")}
      </ul>
    </section>
  `;
}

function renderStatsScreen() {
  const data = state.userStats || {};
  const totalSessionSeconds = data.totalSessionSeconds ?? data.totalSessionTime ?? 0;
  const currentStreak = data.currentStreak ?? 0;
  const longestStreak = data.longestStreak ?? 0;
  const totalActiveDays = data.totalActiveDays ?? data.totalDays ?? 0;
  const sessionsFinished = data.sessionsFinished ?? 0;

  const subtitle = state.userStatsLoading
    ? "Loading your activity…"
    : !state.currentUser
      ? "Sign in to see your activity."
      : "Your mindfulness activity across all sessions.";

  const longestHint =
    longestStreak > 0
      ? `Longest: ${longestStreak} day${longestStreak === 1 ? "" : "s"}`
      : "";
  const activeHint = totalActiveDays > 0 ? "Total unique days" : "";

  return `
    <h1 class="stats-title">Active Stats</h1>
    <p class="stats-subtitle">${escapeHtml(subtitle)}</p>

    <section class="stats-grid">
      <div class="stat-card">
        <p class="stat-card-value">${escapeHtml(String(currentStreak))}</p>
        <p class="stat-card-label">Day streak</p>
        ${longestHint ? `<p class="stat-card-hint">${escapeHtml(longestHint)}</p>` : ""}
      </div>
      <div class="stat-card">
        <p class="stat-card-value">${escapeHtml(String(totalActiveDays))}</p>
        <p class="stat-card-label">Days active</p>
        ${activeHint ? `<p class="stat-card-hint">${escapeHtml(activeHint)}</p>` : ""}
      </div>
      <div class="stat-card">
        <p class="stat-card-value">${escapeHtml(formatMinutes(totalSessionSeconds))}</p>
        <p class="stat-card-label">Time in sessions</p>
      </div>
      <div class="stat-card">
        <p class="stat-card-value">${escapeHtml(String(sessionsFinished))}</p>
        <p class="stat-card-label">Sessions completed</p>
      </div>
    </section>

    ${renderSessionHistory()}
  `;
}

function renderProfileScreen() {
  return `
    <h1 class="profile-title">${escapeHtml(t("profileTitle"))}</h1>

    <section class="profile-section">
      <button class="profile-row" data-action="go-personal-info" type="button">
        <span class="profile-row-label">${escapeHtml(t("personalInformation"))}</span>
        <span class="profile-arrow">›</span>
      </button>
      <button class="profile-row" data-action="go-settings" type="button">
        <span class="profile-row-label">${escapeHtml(t("settings"))}</span>
        <span class="profile-arrow">›</span>
      </button>
      <button class="profile-row" data-action="go-support" type="button">
        <span class="profile-row-label">${escapeHtml(t("support"))}</span>
        <span class="profile-arrow">›</span>
      </button>
      <button class="profile-row" data-action="logout" type="button">
        <span class="profile-row-label profile-danger-text">${escapeHtml(t("logOut"))}</span>
        <span class="profile-arrow">›</span>
      </button>
    </section>
  `;
}

function renderBackBar() {
  return `
    <div class="back-row">
      <button class="back-btn" data-action="go-profile" type="button">‹ Profile</button>
    </div>
  `;
}

function formatDob(dob) {
  if (!dob) return "—";
  const parsed = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dob;
  return parsed.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function renderPersonalInfoScreen() {
  const user = state.currentUser;
  const data = state.userStats || {};
  const email = (user && user.email) || data.email || "—";
  const firstName = data.firstName || "—";
  const lastName = data.lastName || "—";
  const dob = formatDob(data.dob);
  const language = (data.locale || state.locale) === "ko" ? "한국어" : "English";
  const creationTime = user && user.metadata && user.metadata.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
    : "—";

  return `
    ${renderBackBar()}
    <h1 class="profile-title">${escapeHtml(t("personalInformation"))}</h1>
    <p class="stats-subtitle">Account details linked to your sign-in.</p>

    <section class="subpage-section">
      <p class="subpage-section-title">Account</p>
      <div class="info-card">
        <div class="info-row">
          <span class="info-row-label">Email</span>
          <span class="info-row-value">${escapeHtml(email)}</span>
        </div>
        <div class="info-row">
          <span class="info-row-label">Account created</span>
          <span class="info-row-value">${escapeHtml(creationTime)}</span>
        </div>
      </div>
    </section>

    <section class="subpage-section">
      <p class="subpage-section-title">Profile</p>
      <div class="info-card">
        <div class="info-row">
          <span class="info-row-label">First name</span>
          <span class="info-row-value">${escapeHtml(firstName)}</span>
        </div>
        <div class="info-row">
          <span class="info-row-label">Last name</span>
          <span class="info-row-value">${escapeHtml(lastName)}</span>
        </div>
        <div class="info-row">
          <span class="info-row-label">Date of birth</span>
          <span class="info-row-value">${escapeHtml(dob)}</span>
        </div>
        <div class="info-row">
          <span class="info-row-label">Language</span>
          <span class="info-row-value">${escapeHtml(language)}</span>
        </div>
      </div>
    </section>
  `;
}

function renderSettingsScreen() {
  const banner = state.settingsBanner;
  const notifText = !("Notification" in window)
    ? "Not supported in this browser"
    : Notification.permission === "denied"
      ? "Blocked — change in browser settings"
      : state.settings.notifications ? "On" : "Off";

  return `
    ${renderBackBar()}
    <h1 class="profile-title">${escapeHtml(t("settings"))}</h1>
    <p class="stats-subtitle">Personalize the way the app feels and sounds.</p>

    ${banner.text ? `<div class="settings-banner ${banner.type === "error" ? "error" : ""}">${escapeHtml(banner.text)}</div>` : ""}

    <section class="subpage-section">
      <p class="subpage-section-title">Preferences</p>
      <div class="info-card">
        <div class="settings-row">
          <div class="settings-row-copy">
            <p class="settings-row-label">Language</p>
            <p class="settings-row-hint">Used across the app.</p>
          </div>
          <div class="lang-chip-group">
            <button class="lang-chip ${state.locale === "en" ? "active" : ""}" data-action="set-language" data-locale="en" type="button">English</button>
            <button class="lang-chip ${state.locale === "ko" ? "active" : ""}" data-action="set-language" data-locale="ko" type="button">한국어</button>
          </div>
        </div>

        <div class="settings-row">
          <div class="settings-row-copy">
            <p class="settings-row-label">Theme</p>
            <p class="settings-row-hint">${state.settings.theme === "dark" ? "Dark mode is on." : "Light mode."}</p>
          </div>
          <button class="toggle-switch ${state.settings.theme === "dark" ? "on" : ""}" data-action="toggle-theme" type="button" aria-label="Toggle theme"></button>
        </div>

        <div class="settings-row">
          <div class="settings-row-copy">
            <p class="settings-row-label">Notifications</p>
            <p class="settings-row-hint">${escapeHtml(notifText)}</p>
          </div>
          <button class="toggle-switch ${state.settings.notifications ? "on" : ""}" data-action="toggle-notifications" type="button" aria-label="Toggle notifications"></button>
        </div>

      </div>
    </section>

    <section class="subpage-section">
      <p class="subpage-section-title">Account</p>
      <div class="info-card">
        <div class="settings-row">
          <div class="settings-row-copy">
            <p class="settings-row-label">Password</p>
            <p class="settings-row-hint">Send a reset link to your email.</p>
          </div>
          <button class="settings-action" data-action="reset-password" type="button">Reset password</button>
        </div>
        <div class="settings-row">
          <div class="settings-row-copy">
            <p class="settings-row-label">Sign out</p>
            <p class="settings-row-hint">End your session on this device.</p>
          </div>
          <button class="settings-action danger" data-action="logout" type="button">Log out</button>
        </div>
      </div>
    </section>
  `;
}

function renderSupportScreen() {
  const appVersion = "1.0.0";
  return `
    ${renderBackBar()}
    <h1 class="profile-title">${escapeHtml(t("support"))}</h1>
    <p class="support-blurb">We're here to help. Reach out anytime or browse common questions below.</p>

    <section class="subpage-section">
      <p class="subpage-section-title">Contact</p>
      <div class="info-card">
        <div class="info-row support-contact">
          <span class="info-row-label">Email</span>
          <span class="info-row-value"><a href="mailto:support@mindfulnessconnected.app">support@mindfulnessconnected.app</a></span>
        </div>
        <div class="info-row">
          <span class="info-row-label">App version</span>
          <span class="info-row-value">${escapeHtml(appVersion)}</span>
        </div>
        <div class="info-row">
          <span class="info-row-label">Signed in as</span>
          <span class="info-row-value">${escapeHtml((state.currentUser && state.currentUser.email) || "—")}</span>
        </div>
      </div>
    </section>

    <section class="subpage-section">
      <p class="subpage-section-title">Frequently asked</p>
      <details class="faq-item">
        <summary>How do I start a meditation session?</summary>
        <div class="faq-body">From the Home tab, pick any of the 12 session tiles and tap Start Session. Guided and scripted sessions play through the avatar; placeholder tiles are reserved for upcoming content.</div>
      </details>
      <details class="faq-item">
        <summary>How are my stats tracked?</summary>
        <div class="faq-body">When you finish a session, your duration, streak, and totals are written to your account. They live on the My Stats tab and stay in sync between the web app and the mobile app.</div>
      </details>
      <details class="faq-item">
        <summary>I'm not hearing the meditation guide.</summary>
        <div class="faq-body">Open Settings and raise the Volume slider. If audio still doesn't play, make sure your browser tab isn't muted and that your system output device is correct.</div>
      </details>
      <details class="faq-item">
        <summary>How do I change my language?</summary>
        <div class="faq-body">Use the language chip in the header, or open Settings → Preferences → Language. The choice is saved to your account so it follows you everywhere.</div>
      </details>
      <details class="faq-item">
        <summary>I forgot my password.</summary>
        <div class="faq-body">Go to Settings → Account → Reset password. We'll email a reset link to the address on your account.</div>
      </details>
    </section>
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
        <span class="detail-pill ${selectedSession.kind !== "placeholder" ? "detail-pill-guided" : "detail-pill-placeholder"}">
          ${selectedSession.kind === "guided" ? "Guided session" : selectedSession.kind === "scripted" ? "Scripted session" : "Empty session"}
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
          : state.sessionActive && selectedSession.kind === "scripted"
            ? (() => {
                const segs  = SESSION_SCRIPTS[selectedSession.id] || [];
                const isLast = state.scriptSlideIndex >= segs.length - 1;
                return `
                  <div class="session-avatar-controls">
                    <button class="action-button action-button-primary" data-action="next-script-segment">
                      ${isLast ? "Finish" : "Next"}
                    </button>
                  </div>
                `;
              })()
            : ""
      }
    </section>

    ${
      selectedSession.kind === "guided"
        ? state.sessionActive
          ? renderTutorialCard()
          : ""
        : selectedSession.kind === "scripted"
          ? ""
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
      selectedSession.kind === "guided" || selectedSession.kind === "scripted"
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
        <div class="home-header-actions">
          <button class="home-profile-btn ${state.screen === "home" ? "active" : ""}" data-action="go-home" type="button">Home</button>
          <button class="home-profile-btn ${state.screen === "stats" ? "active" : ""}" data-action="go-stats" type="button">My Stats</button>
          <button class="home-profile-btn ${["profile","personal-info","settings","support"].includes(state.screen) ? "active" : ""}" data-action="go-profile" type="button">Profile</button>
          <button class="home-logout-btn" data-action="logout" type="button">${escapeHtml(t("logoutBtn"))}</button>
        </div>
      </header>

      <div class="home-scroll-body content-stack">
        ${
          state.screen === "home"
            ? renderHomeScreen()
            : state.screen === "stats"
              ? renderStatsScreen()
              : state.screen === "profile"
                ? renderProfileScreen()
                : state.screen === "personal-info"
                  ? renderPersonalInfoScreen()
                  : state.screen === "settings"
                    ? renderSettingsScreen()
                    : state.screen === "support"
                      ? renderSupportScreen()
                      : renderSessionScreen()
        }
      </div>
    </main>
    ${
      state.screen === "home" && !state.avatarDockVisible
        ? `<button class="avatar-dock-launcher" data-action="open-avatar-dock" type="button" aria-label="Open mindfulness chat">Chat</button>`
        : ""
    }
    ${renderSummaryModal()}
  `;

  attachInputHandlers();
  scrollChatToBottom();
  syncAvatarDock();
  requestAnimationFrame(() => requestAnimationFrame(syncSessionAvatarPanel));
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
      persistRemoteSettings({ locale: state.locale });
      render();
      break;
    case "set-language":
      state.locale = actionEl.dataset.locale === "ko" ? "ko" : "en";
      persistRemoteSettings({ locale: state.locale });
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
    case "go-profile":
      goProfile();
      break;
    case "go-stats":
      goStats();
      break;
    case "go-personal-info":
      goSubpage("personal-info");
      break;
    case "go-settings":
      goSubpage("settings");
      break;
    case "go-support":
      goSubpage("support");
      break;
    case "toggle-theme":
      handleToggleTheme();
      break;
    case "toggle-notifications":
      handleToggleNotifications();
      break;
    case "reset-password":
      handlePasswordReset();
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
    case "next-script-segment":
      goToNextScriptSegment();
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
  if (avatarSessionEl && !avatarSessionEl.classList.contains("hidden")) {
    syncSessionAvatarPanel();
  }
});

window.addEventListener("scroll", () => {
  if (avatarSessionEl && !avatarSessionEl.classList.contains("hidden")) {
    syncSessionAvatarPanel();
  }
}, { passive: true });


fetch(`${API_BASE_URL}/health`, {
  method: "GET",
  cache: "no-store"
}).catch(() => {
  // Keep the interface usable even if the Render instance is still waking up.
});

window._fb = null;

loadLocalSettings();

(async function initApp() {
  let fbReady = false;
  try {
    const res = await fetch("/firebase-config");
    const { firebaseConfig } = await res.json();
    if (firebaseConfig && firebaseConfig.apiKey) {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      const auth = firebase.auth();
      const db = firebase.firestore();
      const fieldValue = firebase.firestore.FieldValue;
      window._fb = {
        signIn:           (email, pw) => auth.signInWithEmailAndPassword(email, pw),
        signUp:           (email, pw) => auth.createUserWithEmailAndPassword(email, pw),
        signOut:          ()          => auth.signOut(),
        saveUserProfile:  (uid, data) => db.collection("users").doc(uid).set(data),
        subscribeToUserDoc: (uid, onData, onError) =>
          db.collection("users").doc(uid).onSnapshot(
            (snap) => onData(snap.exists ? snap.data() : {}),
            (err) => { if (onError) onError(err); }
          ),
        subscribeToUserSessions: (uid, onData, onError) =>
          db.collection("users").doc(uid).collection("sessions")
            .orderBy("createdAt", "desc")
            .limit(50)
            .onSnapshot(
              (snap) => {
                const sessions = [];
                snap.forEach((doc) => {
                  const data = doc.data() || {};
                  const created = data.createdAt && typeof data.createdAt.toDate === "function"
                    ? data.createdAt.toDate()
                    : null;
                  sessions.push({
                    id: doc.id,
                    sessionId: data.sessionId || "",
                    sessionTitle: data.sessionTitle || "Session",
                    durationSeconds: data.durationSeconds || 0,
                    completed: data.completed !== false,
                    localDate: data.localDate || "",
                    summary: (data.metadata && data.metadata.summary) || "",
                    createdAt: created,
                  });
                });
                onData(sessions);
              },
              (err) => { if (onError) onError(err); }
            ),
        recordCompletedSession: async ({ sessionId, sessionTitle, durationSeconds, completed = true, metadata = {} }) => {
          const user = auth.currentUser;
          const elapsedSeconds = Math.max(0, Math.floor(durationSeconds || 0));
          if (!user || elapsedSeconds <= 0) return;

          const todayKey = getLocalDateKey();
          const sessionMinutes = roundSessionMinutes(elapsedSeconds);
          const userRef = db.collection("users").doc(user.uid);
          const sessionRef = userRef.collection("sessions").doc();

          await db.runTransaction(async (transaction) => {
            const snapshot = await transaction.get(userRef);
            const data = snapshot.exists ? snapshot.data() : {};
            const lastActiveDate = data.lastActiveDate || null;
            const diff = getDayDifference(lastActiveDate, todayKey);
            const isNewActiveDay = lastActiveDate !== todayKey;
            const currentStreak = !isNewActiveDay
              ? data.currentStreak || 1
              : diff === 1
                ? (data.currentStreak || 0) + 1
                : 1;
            const longestStreak = Math.max(data.longestStreak || 0, currentStreak);
            const totalActiveDays = (data.totalActiveDays ?? data.totalDays ?? 0) + (isNewActiveDay ? 1 : 0);
            const totalSessionSeconds = (data.totalSessionSeconds || 0) + elapsedSeconds;
            const totalSessionMinutes = roundSessionMinutes(totalSessionSeconds);
            const sessionsFinished = (data.sessionsFinished || 0) + 1;

            transaction.set(sessionRef, {
              sessionId,
              sessionTitle,
              durationSeconds: elapsedSeconds,
              durationMinutes: sessionMinutes,
              completed,
              localDate: todayKey,
              userId: user.uid,
              userEmail: user.email || "",
              metadata,
              createdAt: fieldValue.serverTimestamp(),
            });

            transaction.set(userRef, {
              email: user.email || data.email || "",
              sessionsFinished,
              totalSessionSeconds,
              totalSessionMinutes,
              totalSessionTime: totalSessionSeconds,
              currentStreak,
              longestStreak,
              totalActiveDays,
              totalDays: totalActiveDays,
              lastActiveDate: todayKey,
              lastSessionAt: fieldValue.serverTimestamp(),
              updatedAt: fieldValue.serverTimestamp(),
            }, { merge: true });
          });
        },
      };
      fbReady = true;
      auth.onAuthStateChanged((user) => {
        state.authenticated = !!user;
        state.currentUser = user || null;
        if (user) state.authScreen = "signin";
        if (typeof state.userStatsUnsubscribe === "function") {
          state.userStatsUnsubscribe();
          state.userStatsUnsubscribe = null;
        }
        if (typeof state.userSessionsUnsubscribe === "function") {
          state.userSessionsUnsubscribe();
          state.userSessionsUnsubscribe = null;
        }
        if (user) {
          state.userStatsLoading = true;
          state.userStats = null;
          state.userStatsUnsubscribe = window._fb.subscribeToUserDoc(
            user.uid,
            (data) => {
              state.userStats = data;
              state.userStatsLoading = false;
              if (data && data.settings && typeof data.settings === "object") {
                const incoming = data.settings;
                const merged = { ...state.settings };
                if (typeof incoming.notifications === "boolean") merged.notifications = incoming.notifications;
                if (incoming.theme === "dark" || incoming.theme === "light") merged.theme = incoming.theme;
                state.settings = merged;
                applyTheme(merged.theme);
                persistLocalSettings();
              }
              if (data && (data.locale === "en" || data.locale === "ko")) {
                state.locale = data.locale;
              }
              if (state.screen === "stats" || state.screen === "settings" || state.screen === "personal-info") render();
            },
            () => {
              state.userStats = {};
              state.userStatsLoading = false;
              if (state.screen === "stats") render();
            }
          );
          state.userSessionsLoading = true;
          state.userSessions = [];
          state.userSessionsUnsubscribe = window._fb.subscribeToUserSessions(
            user.uid,
            (sessions) => {
              state.userSessions = sessions;
              state.userSessionsLoading = false;
              if (state.screen === "stats") render();
            },
            () => {
              state.userSessions = [];
              state.userSessionsLoading = false;
              if (state.screen === "stats") render();
            }
          );
        } else {
          state.userStats = null;
          state.userStatsLoading = false;
          state.userSessions = [];
          state.userSessionsLoading = false;
        }
        render();
      });
    } else {
      state.signInError = "Firebase is not configured yet. Add EXPO_PUBLIC_FIREBASE_* values to .env and restart the server.";
    }
  } catch (err) {
    state.signInError = "Firebase failed to initialize. Check your Firebase config and restart the server.";
    console.error("Firebase initialization failed", err);
  }
  if (!fbReady) render();
})();
