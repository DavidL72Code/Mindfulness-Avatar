import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from "react-native";
import AvatarStage from "./components/AvatarStage";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "https://multilingual-virtual-assistant.onrender.com";
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
    title: "Breathe better,\nfeel calmer",
    body:
      "A simple guide to conscious breathing. Works anytime - at your desk, before a test, or when you feel overwhelmed."
  },
  {
    key: "comfort",
    stepLabel: "Step 1 of 4",
    title: "Get comfortable",
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
    body:
      "Complete 4 rounds of box breathing. Press Start Round to begin each round.",
    note: "Follow the circle and keep the breath steady and gentle."
  },
  {
    key: "pattern",
    stepLabel: "Step 3 of 4",
    title: "The 4-4-4-4 pattern",
    body:
      "Inhale, hold, exhale, hold. Each side lasts 4 counts, and each round follows the same square path."
  },
  {
    key: "return",
    stepLabel: "Step 4 of 4",
    title: "Return slowly",
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

const initialAvatarMessage =
  "Hi, I am your avatar guide. Ask about mindfulness, the current session, or what to do next, and I will talk through it with you.";

function createSessionId() {
  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const values = hours > 0 ? [hours, minutes, seconds] : [minutes, seconds];
  return values.map((value) => String(value).padStart(2, "0")).join(":");
}

function buildChatPrompt(message, sessionContext) {
  if (!sessionContext?.selectedSession) {
    return [
      "App context: The mobile mindfulness app has 12 selectable session rectangles.",
      "Only Box Breathing currently includes a full breathing tutorial.",
      "The other 11 session pages are placeholders for future guided content.",
      `User message: ${message}`
    ].join("\n");
  }

  const lines = [
    "App context: The mobile mindfulness app has 12 selectable session rectangles.",
    `Current session title: ${sessionContext.selectedSession.title}`,
    `Session description: ${sessionContext.selectedSession.description}`,
    `Session status: ${sessionContext.sessionActive ? "active" : "not started"}`,
    `Session Language: ${sessionContext.sessionlanguage}`
  ];

  if (sessionContext.selectedSession.id === "box-breathing") {
    const slide = breathingSlides[sessionContext.slideIndex] || breathingSlides[0];
    lines.push(
      "Box Breathing tutorial structure: Introduction, Get comfortable, Breathe, The 4-4-4-4 pattern, Return slowly."
    );
    lines.push(
      `Breathing progress: slide ${sessionContext.slideIndex + 1} of ${breathingSlides.length}, rounds completed ${sessionContext.roundsDone} of ${TOTAL_BREATHING_ROUNDS}, current phase ${sessionContext.phaseBadge}.`
    );
    lines.push(`Current slide title: ${slide.title.replace("\n", " ")}`);
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

    return `Box Breathing is the live tutorial in this app. It walks through 5 slides: introduction, setup, breathing rounds, pattern explanation, and return slowly. You can start or end the session at any time, and the popup chat stays available throughout.`;
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
    return `You completed all 4 breathing rounds and ended on the "${slide.title.replace("\n", " ")}" screen.`;
  }

  if (roundsDone > 0) {
    return `You ended the breathing tutorial after ${roundsDone} of ${TOTAL_BREATHING_ROUNDS} rounds while viewing "${slide.title.replace("\n", " ")}".`;
  }

  return `You ended the breathing tutorial during "${slide.title.replace("\n", " ")}" before the breathing rounds were completed.`;
}

function MessageBubble({ role, content }) {
  const isUser = role === "user";

  return (
    <View
      style={[
        styles.messageBubble,
        isUser ? styles.userBubble : styles.assistantBubble
      ]}
    >
      <Text style={[styles.messageText, isUser ? styles.userBubbleText : null]}>{content}</Text>
    </View>
  );
}

function SessionTile({ session, disabled, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.sessionTile,
        session.kind === "guided" ? styles.sessionTileGuided : styles.sessionTilePlaceholder,
        selected ? styles.sessionTileSelected : null,
        disabled ? styles.sessionTileDisabled : null,
        pressed && !disabled ? styles.buttonPressed : null
      ]}
    >
      <View style={styles.sessionTileTopRow}>
        <Text style={styles.sessionNumber}>{session.number}</Text>
        <View
          style={[
            styles.sessionPill,
            session.kind === "guided" ? styles.sessionPillGuided : styles.sessionPillPlaceholder
          ]}
        >
          <Text
            style={[
              styles.sessionPillText,
              session.kind === "guided"
                ? styles.sessionPillTextGuided
                : styles.sessionPillTextPlaceholder
            ]}
          >
            {session.kind === "guided" ? "Ready" : "Empty"}
          </Text>
        </View>
      </View>

      <Text style={styles.sessionTileTitle}>{session.title}</Text>
      <Text style={styles.sessionTileDescription}>{session.description}</Text>
      <Text style={styles.sessionTileMeta}>{session.duration}</Text>
    </Pressable>
  );
}

function ProgressDots({ total, activeIndex }) {
  return (
    <View style={styles.progressDots}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={`progress-dot-${index}`}
          style={[styles.progressDot, index === activeIndex ? styles.progressDotActive : null]}
        />
      ))}
    </View>
  );
}

function RoundPips({ total, filled }) {
  return (
    <View style={styles.roundPips}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={`round-pip-${index}`}
          style={[styles.roundPip, index < filled ? styles.roundPipFilled : null]}
        />
      ))}
    </View>
  );
}

function IntroGraphic() {
  return (
    <View style={styles.introGraphic}>
      <View style={styles.introRingOuter} />
      <View style={styles.introRingMiddle} />
      <View style={styles.introCore}>
        <Text style={styles.introCoreText}>Calm</Text>
      </View>
    </View>
  );
}

function ReturnGraphic() {
  return (
    <View style={styles.returnGraphic}>
      <View style={styles.returnOuterCircle} />
      <View style={styles.returnInnerCircle}>
        <Text style={styles.returnInnerText}>Rest</Text>
      </View>
    </View>
  );
}

function PatternBox({ activeSide }) {
  return (
    <View style={styles.patternBoxWrap}>
      <Text style={[styles.patternLabel, styles.patternLabelTop]}>Inhale 4</Text>
      <Text style={[styles.patternLabel, styles.patternLabelRight]}>Hold 4</Text>
      <Text style={[styles.patternLabel, styles.patternLabelBottom]}>Exhale 4</Text>
      <Text style={[styles.patternLabel, styles.patternLabelLeft]}>Hold 4</Text>

      <View style={styles.patternSquareBase}>
        <View style={[styles.patternSegment, styles.patternSegmentTop]} />
        <View style={[styles.patternSegment, styles.patternSegmentRight]} />
        <View style={[styles.patternSegment, styles.patternSegmentBottom]} />
        <View style={[styles.patternSegment, styles.patternSegmentLeft]} />

        <View
          style={[
            styles.patternActiveSegment,
            activeSide === "top" ? styles.patternActiveTop : null,
            activeSide === "right" ? styles.patternActiveRight : null,
            activeSide === "bottom" ? styles.patternActiveBottom : null,
            activeSide === "left" ? styles.patternActiveLeft : null
          ]}
        />

        <View style={styles.patternCenterBadge}>
          <Text style={styles.patternCenterText}>4-4-4-4</Text>
        </View>
      </View>
    </View>
  );
}

function BreathingTutorial({
  slideIndex,
  roundsDone,
  phaseBadge,
  phaseText,
  phaseSubtext,
  roundRunning,
  breathScale,
  boxTraceSide,
  boxTraceStatus,
  onStartRound,
  onPrevSlide,
  onNextSlide
}) {
  const slide = breathingSlides[slideIndex];
  const nextDisabled =
    slideIndex === breathingSlides.length - 1 ||
    roundRunning ||
    boxTraceStatus === "running" ||
    (slide.key === "rounds" && roundsDone < TOTAL_BREATHING_ROUNDS);
  const prevDisabled = slideIndex === 0 || roundRunning || boxTraceStatus === "running";
  const roundButtonLabel =
    roundsDone >= TOTAL_BREATHING_ROUNDS
      ? "All rounds complete"
      : roundRunning
        ? "Breathing..."
        : `Start Round ${roundsDone + 1}`;
  const patternButtonLabel =
    boxTraceStatus === "running"
      ? "Tracing..."
      : boxTraceStatus === "done"
        ? "Trace again"
        : "Trace the pattern";

  return (
    <View style={styles.tutorialCard}>
      <View style={styles.tutorialSlide}>
        <Text style={styles.slideLabel}>{slide.stepLabel}</Text>
        <Text style={styles.slideTitle}>{slide.title}</Text>
        <Text style={styles.slideBody}>{slide.body}</Text>

        {slide.key === "intro" ? (
          <IntroGraphic />
        ) : null}

        {slide.key === "comfort" ? (
          <>
            <View style={styles.stepsList}>
              {slide.tips.map((tip) => (
                <View key={tip} style={styles.stepRow}>
                  <View style={styles.stepDot} />
                  <Text style={styles.stepRowText}>{tip}</Text>
                </View>
              ))}
            </View>

            <View style={styles.tipCard}>
              <Text style={styles.tipLabel}>Tip</Text>
              <Text style={styles.tipBody}>{slide.note}</Text>
            </View>
          </>
        ) : null}

        {slide.key === "rounds" ? (
          <>
            <View style={styles.phaseBadge}>
              <Text style={styles.phaseBadgeText}>{phaseBadge}</Text>
            </View>

            <Text style={styles.phaseSubtext}>{phaseSubtext}</Text>

            <View style={styles.breathRingFrame}>
              <View style={styles.breathRingOuter} />
              <Animated.View
                style={[
                  styles.breathInnerCircle,
                  {
                    transform: [{ scale: breathScale }]
                  }
                ]}
              >
                <Text style={styles.breathInnerText}>{phaseText}</Text>
              </Animated.View>
            </View>

            <RoundPips total={TOTAL_BREATHING_ROUNDS} filled={roundsDone} />
            <Text style={styles.roundLabel}>
              Round {roundsDone} of {TOTAL_BREATHING_ROUNDS}
            </Text>

            <Pressable
              onPress={onStartRound}
              disabled={roundRunning || roundsDone >= TOTAL_BREATHING_ROUNDS}
              style={({ pressed }) => [
                styles.roundButton,
                roundRunning || roundsDone >= TOTAL_BREATHING_ROUNDS
                  ? styles.disabledButton
                  : null,
                pressed && !(roundRunning || roundsDone >= TOTAL_BREATHING_ROUNDS)
                  ? styles.buttonPressed
                  : null
              ]}
            >
              <Text style={styles.roundButtonText}>{roundButtonLabel}</Text>
            </Pressable>
          </>
        ) : null}

        {slide.key === "pattern" ? (
          <>
            <PatternBox activeSide={boxTraceSide} />
            <Pressable
              onPress={boxTraceStatus === "running" ? undefined : onStartRound}
              disabled={boxTraceStatus === "running"}
              style={({ pressed }) => [
                styles.patternButton,
                boxTraceStatus === "running" ? styles.disabledButton : null,
                pressed && boxTraceStatus !== "running" ? styles.buttonPressed : null
              ]}
            >
              <Text style={styles.patternButtonText}>{patternButtonLabel}</Text>
            </Pressable>
          </>
        ) : null}

        {slide.key === "return" ? (
          <>
            <ReturnGraphic />
            <View style={styles.tipCard}>
              <Text style={styles.tipLabel}>You did it</Text>
              <Text style={styles.tipBody}>{slide.note}</Text>
            </View>
          </>
        ) : null}
      </View>

      <View style={styles.tutorialNav}>
        <Pressable
          onPress={onPrevSlide}
          disabled={prevDisabled}
          style={({ pressed }) => [
            styles.navButton,
            prevDisabled ? styles.disabledButton : null,
            pressed && !prevDisabled ? styles.buttonPressed : null
          ]}
        >
          <Text style={styles.navButtonText}>Back</Text>
        </Pressable>

        <ProgressDots total={breathingSlides.length} activeIndex={slideIndex} />

        <Pressable
          onPress={onNextSlide}
          disabled={nextDisabled}
          style={({ pressed }) => [
            styles.navButton,
            styles.navButtonPrimary,
            nextDisabled ? styles.disabledButton : null,
            pressed && !nextDisabled ? styles.buttonPressed : null
          ]}
        >
          <Text style={styles.navButtonPrimaryText}>
            {slideIndex === breathingSlides.length - 1 ? "Done" : "Next"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function App() {
  const chatScrollRef = useRef(null);
  const avatarScrollRef = useRef(null);
  const roundTimeoutsRef = useRef([]);
  const boxTimeoutsRef = useRef([]);
  const breathScale = useRef(new Animated.Value(1)).current;
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const [screen, setScreen] = useState("home");
  const [selectedSessionId, setSelectedSessionId] = useState(sessionCatalog[0].id);

  const [chatSessionId] = useState(() => createSessionId());
  const [chatMessages, setChatMessages] = useState([
    { id: "assistant-welcome", role: "assistant", content: initialChatMessage }
  ]);
  const [chatDraft, setChatDraft] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatStatus, setChatStatus] = useState("Ready");
  const [chatModalVisible, setChatModalVisible] = useState(false);

  const [avatarSessionId] = useState(() => createSessionId());
  const [avatarMessages, setAvatarMessages] = useState([
    { id: "avatar-welcome", role: "assistant", content: initialAvatarMessage }
  ]);
  const [avatarDraft, setAvatarDraft] = useState("");
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarStatus, setAvatarStatus] = useState("Ready");
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [avatarSpeechText, setAvatarSpeechText] = useState("");
  const [avatarIntroPlayed, setAvatarIntroPlayed] = useState(false);

  const [sessionActive, setSessionActive] = useState(false);
  const [sessionStatus, setSessionStatus] = useState("Not started");
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [placeholderMessage, setPlaceholderMessage] = useState("");
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [sessionSummary, setSessionSummary] = useState("");
  const [sessionDuration, setSessionDuration] = useState("");

  const [slideIndex, setSlideIndex] = useState(0);
  const [roundsDone, setRoundsDone] = useState(0);
  const [roundRunning, setRoundRunning] = useState(false);
  const [phaseBadge, setPhaseBadge] = useState("Ready");
  const [phaseText, setPhaseText] = useState("Ready");
  const [phaseSubtext, setPhaseSubtext] = useState(breathingSlides[2].body);
  const [boxTraceSide, setBoxTraceSide] = useState(null);
  const [boxTraceStatus, setBoxTraceStatus] = useState("idle");

  const selectedSession =
    sessionCatalog.find((session) => session.id === selectedSessionId) || sessionCatalog[0];
  const canSendChat = !chatBusy && chatDraft.trim().length > 0;
  const canSendAvatar = !avatarBusy && avatarDraft.trim().length > 0;
  const chatSheetWidth = Math.min(windowWidth - 28, 430);
  const chatSheetHeight = Math.min(Math.max(windowHeight * 0.72, 470), 620);
  const isCompactChatLayout = windowHeight < 780;
  const avatarSheetWidth = Math.min(windowWidth - 20, 760);
  const avatarSheetHeight = Math.min(Math.max(windowHeight * 0.82, 620), 780);
  const isCompactAvatarLayout = windowWidth < 470 || windowHeight < 760;
  const sessionContext =
    screen === "session" || sessionActive
      ? {
          selectedSession,
          sessionActive,
          slideIndex,
          roundsDone,
          phaseBadge
        }
      : null;

  useEffect(() => {
    chatScrollRef.current?.scrollToEnd({ animated: true });
  }, [chatMessages, chatModalVisible]);

  useEffect(() => {
    avatarScrollRef.current?.scrollToEnd({ animated: true });
  }, [avatarMessages, avatarModalVisible]);

  useEffect(() => {
    if (avatarModalVisible && !avatarIntroPlayed) {
      setAvatarSpeechText(initialAvatarMessage);
      setAvatarIntroPlayed(true);
    }
  }, [avatarIntroPlayed, avatarModalVisible]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      cache: "no-store"
    }).catch(() => {
      // Ignore warm-up failures and keep the local experience usable.
    });
  }, []);

  useEffect(() => {
    return () => {
      clearRoundTimers();
      clearBoxTimers();
      breathScale.stopAnimation();
    };
  }, [breathScale]);

  function clearRoundTimers() {
    roundTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    roundTimeoutsRef.current = [];
  }

  function clearBoxTimers() {
    boxTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    boxTimeoutsRef.current = [];
  }

  function scheduleRoundTimeout(callback, delay) {
    const timeoutId = setTimeout(callback, delay);
    roundTimeoutsRef.current.push(timeoutId);
  }

  function scheduleBoxTimeout(callback, delay) {
    const timeoutId = setTimeout(callback, delay);
    boxTimeoutsRef.current.push(timeoutId);
  }

  function animateBreath(targetScale, duration) {
    Animated.timing(breathScale, {
      toValue: targetScale,
      duration,
      useNativeDriver: true
    }).start();
  }

  function resetBreathingTutorial() {
    clearRoundTimers();
    clearBoxTimers();
    breathScale.stopAnimation();
    breathScale.setValue(1);
    setSlideIndex(0);
    setRoundsDone(0);
    setRoundRunning(false);
    setPhaseBadge("Ready");
    setPhaseText("Ready");
    setPhaseSubtext(breathingSlides[2].body);
    setBoxTraceSide(null);
    setBoxTraceStatus("idle");
  }

  function clearExerciseState() {
    setSessionActive(false);
    setSessionStatus("Not started");
    setSessionStartTime(null);
    setPlaceholderMessage("");
    resetBreathingTutorial();
  }

  function openSession(session) {
    if (sessionActive && selectedSessionId !== session.id) {
      return;
    }

    setSelectedSessionId(session.id);
    setScreen("session");
  }

  function goHome() {
    setScreen("home");
  }

  function goToPreviousSlide() {
    if (slideIndex === 3) {
      clearBoxTimers();
      setBoxTraceSide(null);
      setBoxTraceStatus("idle");
    }

    setSlideIndex((current) => Math.max(0, current - 1));
  }

  function goToNextSlide() {
    if (slideIndex === 3) {
      clearBoxTimers();
      setBoxTraceSide(null);
      setBoxTraceStatus("idle");
    }

    setSlideIndex((current) => Math.min(breathingSlides.length - 1, current + 1));
  }

  function tracePattern() {
    if (boxTraceStatus === "running") {
      return;
    }

    clearBoxTimers();
    setBoxTraceStatus("running");
    setBoxTraceSide(null);

    BOX_TRACE_SIDES.forEach((side, index) => {
      scheduleBoxTimeout(() => {
        setBoxTraceSide(side);
      }, index * 4000);
    });

    scheduleBoxTimeout(() => {
      setBoxTraceSide(null);
      setBoxTraceStatus("done");
    }, 16500);
  }

  function startRound() {
    if (roundRunning || roundsDone >= TOTAL_BREATHING_ROUNDS) {
      return;
    }

    clearRoundTimers();
    setRoundRunning(true);
    setPhaseSubtext("Follow the circle and keep the breath easy.");

    let elapsed = 0;

    breathingPhases.forEach((phase) => {
      scheduleRoundTimeout(() => {
        setPhaseBadge(phase.badge);
        setPhaseText(phase.label);
        animateBreath(phase.scale, phase.duration);
      }, elapsed);

      elapsed += phase.duration;
    });

    const nextRoundCount = roundsDone + 1;

    scheduleRoundTimeout(() => {
      setRoundRunning(false);
      setRoundsDone(nextRoundCount);
      setPhaseText("Done");
      animateBreath(1, 300);

      if (nextRoundCount < TOTAL_BREATHING_ROUNDS) {
        setPhaseBadge("Rest");
        setPhaseSubtext(
          `Great. Take a natural breath, then start round ${nextRoundCount + 1}.`
        );
      } else {
        setPhaseBadge("Complete");
        setPhaseSubtext("You finished all 4 rounds. Continue to the next step.");
      }
    }, elapsed + 100);
  }

  async function sendChatMessage() {
    if (!canSendChat) {
      return;
    }

    const trimmedMessage = chatDraft.trim();
    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedMessage
    };

    setChatMessages((current) => [...current, userMessage]);
    setChatDraft("");
    setChatBusy(true);
    setChatStatus("Thinking...");

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: buildChatPrompt(trimmedMessage, sessionContext),
          session_id: chatSessionId
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Request failed");
      }

      const data = await response.json();
      setChatMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.reply || "(No response text returned.)"
        }
      ]);
      setChatStatus("Ready");
    } catch (error) {
      setChatMessages((current) => [
        ...current,
        {
          id: `assistant-fallback-${Date.now()}`,
          role: "assistant",
          content: buildLocalChatFallback(trimmedMessage, sessionContext)
        }
      ]);
      setChatStatus(`Offline fallback (${error.message})`);
    } finally {
      setChatBusy(false);
    }
  }

  function handleAvatarStageStatus(status) {
    if (status === "speaking") {
      setAvatarStatus("Speaking...");
      return;
    }

    if (status === "ready" || status === "idle") {
      if (!avatarBusy) {
        setAvatarStatus("Ready");
      }
      return;
    }

    if (status === "error") {
      setAvatarStatus("Voice unavailable");
    }
  }

  async function sendAvatarMessage() {
    const trimmedMessage = avatarDraft.trim();
    if (!trimmedMessage || avatarBusy) {
      return;
    }

    const userMessage = {
      id: `avatar-user-${Date.now()}`,
      role: "user",
      content: trimmedMessage
    };

    setAvatarMessages((current) => [...current, userMessage]);
    setAvatarDraft("");
    setAvatarBusy(true);
    setAvatarStatus("Thinking...");

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: buildChatPrompt(trimmedMessage, sessionContext),
          session_id: avatarSessionId
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Request failed");
      }

      const data = await response.json();
      const reply = data.reply || "(No response text returned.)";
      setAvatarMessages((current) => [
        ...current,
        {
          id: `avatar-assistant-${Date.now()}`,
          role: "assistant",
          content: reply
        }
      ]);
      setAvatarSpeechText(reply);
      setAvatarStatus("Reply ready");
    } catch (error) {
      const fallbackReply = buildLocalChatFallback(trimmedMessage, sessionContext);
      setAvatarMessages((current) => [
        ...current,
        {
          id: `avatar-fallback-${Date.now()}`,
          role: "assistant",
          content: fallbackReply
        }
      ]);
      setAvatarSpeechText(fallbackReply);
      setAvatarStatus(`Offline fallback (${error.message})`);
    } finally {
      setAvatarBusy(false);
    }
  }

  function startSelectedSession() {
    if (!selectedSession || sessionActive) {
      return;
    }

    setSummaryModalVisible(false);
    setSessionSummary("");
    setSessionDuration("");
    setSessionStartTime(Date.now());
    setSessionActive(true);
    setSessionStatus("Session active");

    if (selectedSession.kind === "guided") {
      setPlaceholderMessage("");
      resetBreathingTutorial();
      return;
    }

    setPlaceholderMessage(
      `${selectedSession.title} is intentionally empty right now. This page is reserved for the guided content you want to add later.`
    );
  }

  function endSelectedSession() {
    if (!sessionActive) {
      return;
    }

    const elapsedSeconds = Math.max(
      0,
      Math.floor((Date.now() - (sessionStartTime || Date.now())) / 1000)
    );
    const durationText = formatDuration(elapsedSeconds);

    if (selectedSession.kind === "guided") {
      setSessionSummary(buildGuidedSessionSummary(slideIndex, roundsDone));
    } else {
      setSessionSummary(
        `${selectedSession.title} ended. This session page is still empty for now, but the layout is ready for future guided content.`
      );
    }

    setSessionDuration(durationText);
    setSummaryModalVisible(true);
    clearExerciseState();
  }

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {screen === "home" ? (
          <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.heroCard}>
              <Text style={styles.heroEyebrow}>Mindfulness Sessions</Text>
              <Text style={styles.heroTitle}>Choose one of 12 session spaces</Text>
              <Text style={styles.heroBody}>
                Tap any rectangle to open its session page. Box Breathing now follows your example
                breathing tutorial, and the other 11 tiles stay open as empty placeholders.
              </Text>
            </View>

            {sessionActive ? (
              <View style={styles.resumeCard}>
                <View style={styles.resumeCopy}>
                  <Text style={styles.resumeTitle}>Session in progress</Text>
                  <Text style={styles.resumeBody}>
                    {selectedSession.title} is still active. Reopen it to continue or end it.
                  </Text>
                </View>
                <Pressable
                  onPress={() => setScreen("session")}
                  style={({ pressed }) => [
                    styles.resumeButton,
                    pressed ? styles.buttonPressed : null
                  ]}
                >
                  <Text style={styles.resumeButtonText}>Resume</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.gridSection}>
              <Text style={styles.sectionTitle}>Session Selection</Text>
              <View style={styles.sessionGrid}>
                {sessionCatalog.map((session) => (
                  <SessionTile
                    key={session.id}
                    session={session}
                    selected={selectedSessionId === session.id}
                    disabled={sessionActive && selectedSessionId !== session.id}
                    onPress={() => openSession(session)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.helperCard}>
              <Text style={styles.helperTitle}>Popup Chat Available Anytime</Text>
              <Text style={styles.helperBody}>
                The chatbot is no longer tied to Start Session. Use the floating button to ask
                general questions, or open a session first so the chat can explain that specific
                practice. The avatar button now opens an in-app speaking guide instead of sending
                you to a website.
              </Text>
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <Pressable
              onPress={goHome}
              style={({ pressed }) => [
                styles.backButton,
                pressed ? styles.buttonPressed : null
              ]}
            >
              <Text style={styles.backButtonText}>Back to sessions</Text>
            </Pressable>

            <View style={styles.detailHero}>
              <View style={styles.detailHeroTopRow}>
                <Text style={styles.detailNumber}>{selectedSession.number}</Text>
                <View
                  style={[
                    styles.detailPill,
                    selectedSession.kind === "guided"
                      ? styles.detailPillGuided
                      : styles.detailPillPlaceholder
                  ]}
                >
                  <Text
                    style={[
                      styles.detailPillText,
                      selectedSession.kind === "guided"
                        ? styles.detailPillTextGuided
                        : styles.detailPillTextPlaceholder
                    ]}
                  >
                    {selectedSession.kind === "guided" ? "Guided session" : "Empty session"}
                  </Text>
                </View>
              </View>

              <Text style={styles.detailTitle}>{selectedSession.title}</Text>
              <Text style={styles.detailDescription}>{selectedSession.description}</Text>
              <Text style={styles.detailMeta}>Status: {sessionStatus}</Text>
            </View>

            <View style={styles.controlRow}>
              <Pressable
                onPress={startSelectedSession}
                disabled={sessionActive}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.primaryButton,
                  sessionActive ? styles.disabledButton : null,
                  pressed && !sessionActive ? styles.buttonPressed : null
                ]}
              >
                <Text style={styles.primaryButtonText}>Start Session</Text>
              </Pressable>

              <Pressable
                onPress={endSelectedSession}
                disabled={!sessionActive}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.secondaryButton,
                  !sessionActive ? styles.disabledButton : null,
                  pressed && sessionActive ? styles.buttonPressed : null
                ]}
              >
                <Text style={styles.secondaryButtonText}>End Session</Text>
              </Pressable>
            </View>

            {selectedSession.kind === "guided" ? (
              sessionActive ? (
                <BreathingTutorial
                  slideIndex={slideIndex}
                  roundsDone={roundsDone}
                  phaseBadge={phaseBadge}
                  phaseText={phaseText}
                  phaseSubtext={phaseSubtext}
                  roundRunning={roundRunning}
                  breathScale={breathScale}
                  boxTraceSide={boxTraceSide}
                  boxTraceStatus={boxTraceStatus}
                  onStartRound={slideIndex === 3 ? tracePattern : startRound}
                  onPrevSlide={goToPreviousSlide}
                  onNextSlide={goToNextSlide}
                />
              ) : (
                <View style={styles.previewCard}>
                  <Text style={styles.previewTitle}>Breathing Tutorial Preview</Text>
                  <Text style={styles.previewBody}>
                    This session follows the 5-slide example you shared: introduction, setup,
                    breathing rounds, the 4-4-4-4 pattern, and return slowly.
                  </Text>
                  <View style={styles.previewList}>
                    {breathingSlides.map((slide, index) => (
                      <View key={slide.key} style={styles.previewListRow}>
                        <Text style={styles.previewListNumber}>{index + 1}</Text>
                        <Text style={styles.previewListText}>{slide.title.replace("\n", " ")}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )
            ) : (
              <View style={styles.placeholderCard}>
                <Text style={styles.placeholderTitle}>Template Reserved</Text>
                <Text style={styles.placeholderBody}>
                  This screen is intentionally empty for now. When you are ready, this is where the
                  guided content, timer, and visuals for {selectedSession.title} can be added.
                </Text>
              </View>
            )}

            <View style={styles.panelCard}>
              <Text style={styles.panelTitle}>
                {selectedSession.kind === "guided" ? "Session Support" : "Placeholder Notes"}
              </Text>
              <Text style={styles.panelBody}>
                {selectedSession.kind === "guided"
                  ? "You can stop the breathing session at any time with End Session, and both the popup chat and avatar guide can still answer questions about the current step."
                  : placeholderMessage || "Start Session if you want to test the empty placeholder flow for this tile."}
              </Text>
            </View>
          </ScrollView>
        )}

        <View style={styles.floatingActionStack}>
          <Pressable
            onPress={() => setAvatarModalVisible(true)}
            style={({ pressed }) => [
              styles.avatarLauncher,
              pressed ? styles.buttonPressed : null
            ]}
          >
            <Text style={styles.avatarLauncherLabel}>Open Avatar</Text>
          </Pressable>

          <Pressable
            onPress={() => setChatModalVisible(true)}
            style={({ pressed }) => [
              styles.chatLauncher,
              pressed ? styles.buttonPressed : null
            ]}
          >
            <Text style={styles.chatLauncherLabel}>Open Chat</Text>
          </Pressable>
        </View>

        <Modal
          visible={avatarModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setAvatarModalVisible(false)}
        >
          <View style={styles.sheetBackdrop}>
            <Pressable
              style={styles.sheetDismissOverlay}
              onPress={() => setAvatarModalVisible(false)}
            />

            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
              style={styles.sheetKeyboardFrame}
            >
              <View
                style={[
                  styles.avatarSheet,
                  isCompactAvatarLayout ? styles.avatarSheetCompact : null,
                  {
                    width: avatarSheetWidth,
                    maxHeight: avatarSheetHeight
                  }
                ]}
              >
                <View style={styles.chatSheetHeader}>
                  <View style={styles.chatSheetHeaderCopy}>
                    <Text style={styles.chatSheetTitle}>Mindfulness Avatar</Text>
                    <Text style={styles.chatSheetSubtitle}>
                      {screen === "session"
                        ? `Current context: ${selectedSession.title}`
                        : "Current context: general app help"}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => setAvatarModalVisible(false)}
                    style={({ pressed }) => [
                      styles.closeButton,
                      pressed ? styles.buttonPressed : null
                    ]}
                  >
                    <Text style={styles.closeButtonText}>Close</Text>
                  </Pressable>
                </View>

                <View
                  style={[
                    styles.avatarFrame,
                    isCompactAvatarLayout ? styles.avatarFrameCompact : null
                  ]}
                >
                  <View style={styles.avatarStagePanel}>
                    <AvatarStage
                      speechText={avatarSpeechText}
                      onStatusChange={handleAvatarStageStatus}
                    />
                  </View>

                  <View style={styles.avatarConversation}>
                    <View style={styles.chatStatusRow}>
                      <Text style={styles.chatStatusText}>Avatar status: {avatarStatus}</Text>
                    </View>

                    <ScrollView
                      ref={avatarScrollRef}
                      style={styles.avatarTranscript}
                      contentContainerStyle={styles.chatWindowContent}
                      keyboardShouldPersistTaps="handled"
                    >
                      {avatarMessages.map((message) => (
                        <MessageBubble
                          key={message.id}
                          role={message.role}
                          content={message.content}
                        />
                      ))}
                    </ScrollView>

                    <View style={styles.composerCard}>
                      <TextInput
                        value={avatarDraft}
                        onChangeText={setAvatarDraft}
                        placeholder="Ask the avatar about mindfulness or this session..."
                        placeholderTextColor="#6d7a80"
                        editable={!avatarBusy}
                        multiline
                        style={[
                          styles.chatInput,
                          styles.avatarInput,
                          isCompactAvatarLayout ? styles.chatInputCompact : null,
                          avatarBusy ? styles.textInputDisabled : null
                        ]}
                      />

                      <Pressable
                        onPress={sendAvatarMessage}
                        disabled={!canSendAvatar}
                        style={({ pressed }) => [
                          styles.sendButton,
                          !canSendAvatar ? styles.disabledButton : null,
                          pressed && canSendAvatar ? styles.buttonPressed : null
                        ]}
                      >
                        <Text style={styles.sendButtonText}>Send</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        <Modal
          visible={chatModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setChatModalVisible(false)}
        >
          <View style={styles.sheetBackdrop}>
            <Pressable
              style={styles.sheetDismissOverlay}
              onPress={() => setChatModalVisible(false)}
            />

            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
              style={styles.sheetKeyboardFrame}
            >
              <View
                style={[
                  styles.chatSheet,
                  isCompactChatLayout ? styles.chatSheetCompact : null
                ]}
              >
                <View style={styles.chatSheetHeader}>
                  <View style={styles.chatSheetHeaderCopy}>
                    <Text style={styles.chatSheetTitle}>Mindfulness Chat</Text>
                    <Text style={styles.chatSheetSubtitle}>
                      {screen === "session"
                        ? `Current context: ${selectedSession.title}`
                        : "Current context: general app help"}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => setChatModalVisible(false)}
                    style={({ pressed }) => [
                      styles.closeButton,
                      pressed ? styles.buttonPressed : null
                    ]}
                  >
                    <Text style={styles.closeButtonText}>Close</Text>
                  </Pressable>
                </View>

                <View style={styles.chatFrame}>
                  <View style={styles.chatStatusRow}>
                    <Text style={styles.chatStatusText}>Assistant status: {chatStatus}</Text>
                  </View>

                  <ScrollView
                    ref={chatScrollRef}
                    style={[
                      styles.chatWindow,
                      chatMessages.length <= 1 ? styles.chatWindowSparse : null,
                      isCompactChatLayout ? styles.chatWindowCompact : null
                    ]}
                    contentContainerStyle={styles.chatWindowContent}
                    keyboardShouldPersistTaps="handled"
                  >
                    {chatMessages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        role={message.role}
                        content={message.content}
                      />
                    ))}
                  </ScrollView>

                  <View style={styles.composerCard}>
                    <TextInput
                      value={chatDraft}
                      onChangeText={setChatDraft}
                      placeholder="Ask about mindfulness, app features, or this session..."
                      placeholderTextColor="#6d7a80"
                      editable={!chatBusy}
                      multiline
                      style={[
                        styles.chatInput,
                        isCompactChatLayout ? styles.chatInputCompact : null,
                        chatBusy ? styles.textInputDisabled : null
                      ]}
                    />

                    <Pressable
                      onPress={sendChatMessage}
                      disabled={!canSendChat}
                      style={({ pressed }) => [
                        styles.sendButton,
                        !canSendChat ? styles.disabledButton : null,
                        pressed && canSendChat ? styles.buttonPressed : null
                      ]}
                    >
                      <Text style={styles.sendButtonText}>Send</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        <Modal
          visible={summaryModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setSummaryModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Session Complete</Text>
              <Text style={styles.modalDuration}>Session length: {sessionDuration}</Text>
              <Text style={styles.modalSummary}>{sessionSummary}</Text>
              <Pressable
                onPress={() => setSummaryModalVisible(false)}
                style={({ pressed }) => [
                  styles.modalButton,
                  pressed ? styles.buttonPressed : null
                ]}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f6f2e8"
  },
  screen: {
    flex: 1
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 120,
    gap: 18
  },
  heroCard: {
    backgroundColor: "#f3e3c8",
    borderRadius: 30,
    padding: 22,
    gap: 10
  },
  heroEyebrow: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: "#7a4d21"
  },
  heroTitle: {
    fontSize: 31,
    fontWeight: "800",
    color: "#2d2417"
  },
  heroBody: {
    fontSize: 16,
    lineHeight: 24,
    color: "#5d4a37"
  },
  resumeCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    shadowColor: "#3a2e1f",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  resumeCopy: {
    flex: 1,
    gap: 6
  },
  resumeTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#23392d"
  },
  resumeBody: {
    fontSize: 14,
    lineHeight: 21,
    color: "#58635e"
  },
  resumeButton: {
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: "#214f43",
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center"
  },
  resumeButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff"
  },
  gridSection: {
    gap: 14
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2a231a"
  },
  sessionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  sessionTile: {
    width: "48%",
    minHeight: 164,
    borderRadius: 24,
    padding: 16,
    justifyContent: "space-between",
    overflow: "hidden",
    shadowColor: "#332718",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  sessionTileGuided: {
    backgroundColor: "#dceadf"
  },
  sessionTilePlaceholder: {
    backgroundColor: "#ffffff"
  },
  sessionTileSelected: {
    borderWidth: 2,
    borderColor: "#9d6329"
  },
  sessionTileDisabled: {
    opacity: 0.45
  },
  sessionTileTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  sessionNumber: {
    fontSize: 24,
    fontWeight: "900",
    color: "#2d2417"
  },
  sessionPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  sessionPillGuided: {
    backgroundColor: "#214f43"
  },
  sessionPillPlaceholder: {
    backgroundColor: "#f3ede2"
  },
  sessionPillText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  sessionPillTextGuided: {
    color: "#ffffff"
  },
  sessionPillTextPlaceholder: {
    color: "#7a5c3c"
  },
  sessionTileTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2d2417",
    flexShrink: 1
  },
  sessionTileDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#5a534c",
    flexShrink: 1
  },
  sessionTileMeta: {
    fontSize: 13,
    fontWeight: "700",
    color: "#7a4d21"
  },
  helperCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 18,
    gap: 8,
    marginBottom: 12
  },
  helperTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#24352a"
  },
  helperBody: {
    fontSize: 14,
    lineHeight: 22,
    color: "#5f6662"
  },
  backButton: {
    alignSelf: "flex-start",
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    justifyContent: "center"
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#4f3d28"
  },
  detailHero: {
    backgroundColor: "#fff8ec",
    borderRadius: 28,
    padding: 22,
    gap: 10
  },
  detailHeroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  detailNumber: {
    fontSize: 34,
    fontWeight: "900",
    color: "#a86828"
  },
  detailPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  detailPillGuided: {
    backgroundColor: "#20483f"
  },
  detailPillPlaceholder: {
    backgroundColor: "#f1e8d7"
  },
  detailPillText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7
  },
  detailPillTextGuided: {
    color: "#ffffff"
  },
  detailPillTextPlaceholder: {
    color: "#7d623f"
  },
  detailTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: "#2f2418",
    flexShrink: 1
  },
  detailDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: "#5f4f3f"
  },
  detailMeta: {
    fontSize: 14,
    fontWeight: "700",
    color: "#20483f"
  },
  controlRow: {
    flexDirection: "row",
    gap: 10
  },
  actionButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center"
  },
  primaryButton: {
    backgroundColor: "#214f43"
  },
  secondaryButton: {
    backgroundColor: "#efe7da"
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff"
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#4a3a25"
  },
  disabledButton: {
    opacity: 0.45
  },
  previewCard: {
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 20,
    gap: 14
  },
  previewTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#22382e"
  },
  previewBody: {
    fontSize: 15,
    lineHeight: 23,
    color: "#5b655f"
  },
  previewList: {
    gap: 10
  },
  previewListRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center"
  },
  previewListNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#efe3c9",
    textAlign: "center",
    lineHeight: 28,
    fontSize: 13,
    fontWeight: "800",
    color: "#8a5a24"
  },
  previewListText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: "#4d5d57"
  },
  tutorialCard: {
    backgroundColor: "#ffffff",
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#332718",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  tutorialSlide: {
    minHeight: 470,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: "center",
    gap: 12
  },
  slideLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.3,
    textTransform: "uppercase",
    color: "#7a7d75"
  },
  slideTitle: {
    textAlign: "center",
    fontSize: 31,
    lineHeight: 38,
    fontWeight: "700",
    color: "#2a231a",
    flexShrink: 1
  },
  slideBody: {
    maxWidth: 340,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 24,
    color: "#5b655f"
  },
  introGraphic: {
    width: 140,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4
  },
  introRingOuter: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: "#9fe1cb"
  },
  introRingMiddle: {
    position: "absolute",
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 1,
    borderColor: "#5dcaa5"
  },
  introCore: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#e1f5ee",
    borderWidth: 1.5,
    borderColor: "#1d9e75",
    justifyContent: "center",
    alignItems: "center"
  },
  introCoreText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f6e56"
  },
  stepsList: {
    width: "100%",
    gap: 8,
    marginTop: 4
  },
  stepRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start"
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1d9e75",
    marginTop: 7
  },
  stepRowText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: "#59615d"
  },
  tipCard: {
    width: "100%",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e2ddd2",
    backgroundColor: "#f7f3ea",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6
  },
  tipLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: "#7a7d75"
  },
  tipBody: {
    fontSize: 14,
    lineHeight: 22,
    color: "#59615d"
  },
  phaseBadge: {
    borderRadius: 999,
    backgroundColor: "#e1f5ee",
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 2
  },
  phaseBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f6e56"
  },
  phaseSubtext: {
    maxWidth: 320,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 23,
    color: "#5b655f"
  },
  breathRingFrame: {
    width: 168,
    height: 168,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 4
  },
  breathRingOuter: {
    position: "absolute",
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 1,
    borderColor: "#9fe1cb"
  },
  breathInnerCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#e1f5ee",
    borderWidth: 2,
    borderColor: "#1d9e75",
    justifyContent: "center",
    alignItems: "center"
  },
  breathInnerText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f6e56"
  },
  roundPips: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center"
  },
  roundPip: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#1d9e75",
    backgroundColor: "transparent"
  },
  roundPipFilled: {
    backgroundColor: "#1d9e75"
  },
  roundLabel: {
    fontSize: 12,
    color: "#7a7d75"
  },
  roundButton: {
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: "#1d9e75",
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center"
  },
  roundButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff"
  },
  patternBoxWrap: {
    width: 220,
    height: 220,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 6
  },
  patternSquareBase: {
    width: 132,
    height: 132,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#9fe1cb",
    justifyContent: "center",
    alignItems: "center"
  },
  patternSegment: {
    position: "absolute",
    backgroundColor: "#9fe1cb"
  },
  patternSegmentTop: {
    top: -1,
    left: 0,
    width: 132,
    height: 2
  },
  patternSegmentRight: {
    top: 0,
    right: -1,
    width: 2,
    height: 132
  },
  patternSegmentBottom: {
    bottom: -1,
    left: 0,
    width: 132,
    height: 2
  },
  patternSegmentLeft: {
    top: 0,
    left: -1,
    width: 2,
    height: 132
  },
  patternActiveSegment: {
    position: "absolute",
    backgroundColor: "#1d9e75"
  },
  patternActiveTop: {
    top: -2,
    left: 0,
    width: 132,
    height: 4
  },
  patternActiveRight: {
    top: 0,
    right: -2,
    width: 4,
    height: 132
  },
  patternActiveBottom: {
    bottom: -2,
    left: 0,
    width: 132,
    height: 4
  },
  patternActiveLeft: {
    top: 0,
    left: -2,
    width: 4,
    height: 132
  },
  patternCenterBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#e1f5ee",
    borderWidth: 1,
    borderColor: "#1d9e75",
    justifyContent: "center",
    alignItems: "center"
  },
  patternCenterText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0f6e56"
  },
  patternLabel: {
    position: "absolute",
    fontSize: 11,
    fontWeight: "700",
    color: "#0f6e56"
  },
  patternLabelTop: {
    top: 12
  },
  patternLabelRight: {
    right: 4
  },
  patternLabelBottom: {
    bottom: 12
  },
  patternLabelLeft: {
    left: 4
  },
  patternButton: {
    minHeight: 44,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#d7d4ce",
    backgroundColor: "#ffffff",
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center"
  },
  patternButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2f3d37"
  },
  returnGraphic: {
    width: 136,
    height: 136,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 8
  },
  returnOuterCircle: {
    position: "absolute",
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor: "#e1f5ee",
    borderWidth: 1,
    borderColor: "#9fe1cb"
  },
  returnInnerCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#1d9e75",
    justifyContent: "center",
    alignItems: "center"
  },
  returnInnerText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f6e56"
  },
  tutorialNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#e6e1d7",
    backgroundColor: "#fbf7ef"
  },
  navButton: {
    minWidth: 74,
    minHeight: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d7d4ce",
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12
  },
  navButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#2f3d37"
  },
  navButtonPrimary: {
    backgroundColor: "#1d9e75",
    borderColor: "#1d9e75"
  },
  navButtonPrimaryText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#ffffff"
  },
  progressDots: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center"
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#d0cdc5"
  },
  progressDotActive: {
    backgroundColor: "#1d9e75",
    transform: [{ scale: 1.4 }]
  },
  placeholderCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: "#eadfce"
  },
  placeholderTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#443423"
  },
  placeholderBody: {
    fontSize: 15,
    lineHeight: 23,
    color: "#665948"
  },
  panelCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 18,
    gap: 10
  },
  panelTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#263a31"
  },
  panelBody: {
    fontSize: 15,
    lineHeight: 23,
    color: "#53605b",
    flexShrink: 1
  },
  floatingActionStack: {
    position: "absolute",
    right: 18,
    bottom: 24,
    gap: 10,
    alignItems: "flex-end"
  },
  avatarLauncher: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(23, 59, 49, 0.14)",
    shadowColor: "#10241e",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6
  },
  avatarLauncherLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#173b31"
  },
  chatLauncher: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: "#173b31",
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10241e",
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8
  },
  chatLauncherLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff"
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(20, 20, 20, 0.42)",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 40
  },
  sheetDismissOverlay: {
    ...StyleSheet.absoluteFillObject
  },
  sheetKeyboardFrame: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    width: "100%"
  },
  chatSheet: {
    width: "100%",
    maxWidth:420,
    alignSelf: "center",
    backgroundColor: "#fbf7ef",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#e4dbc9",
    paddingTop: 26,
    paddingHorizontal: 20,
    paddingBottom: 18,
    gap: 14,
    overflow: "hidden",
    shadowColor: "#10241e",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 3, height: 12 },
    elevation: 10
  },
  chatSheetCompact: {
    paddingTop: 22,
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12
  },
  avatarSheet: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    backgroundColor: "#fbf7ef",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#e4dbc9",
    paddingTop: 24,
    paddingHorizontal: 18,
    paddingBottom: 18,
    gap: 14,
    overflow: "hidden",
    shadowColor: "#10241e",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 3, height: 12 },
    elevation: 10
  },
  avatarSheetCompact: {
    paddingTop: 20,
    paddingHorizontal: 14,
    paddingBottom: 14
  },
  chatSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    paddingTop: 2
  },
  chatSheetHeaderCopy: {
    flex: 1,
    gap: 4,
    minWidth: 1
  },
  chatSheetTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    color: "#2a231a",
    flexShrink: 1
  },
  chatSheetSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#64594d",
    flexShrink: 1
  },
  closeButton: {
    minHeight: 38,
    borderRadius: 12,
    backgroundColor: "#efe5d5",
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0
  },
  closeButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#4f3d28"
  },
  chatFrame: {
    flex: 1,
    borderWidth: 4,
    borderColor: "#ddd2bd",
    borderRadius: 24,
    backgroundColor: "#f8f1e4",
    padding: 15,
    gap: 12
  },
  avatarFrame: {
    flex: 1,
    borderWidth: 4,
    borderColor: "#ddd2bd",
    borderRadius: 24,
    backgroundColor: "#f8f1e4",
    padding: 15,
    gap: 12,
    flexDirection: "row",
    alignItems: "stretch"
  },
  avatarFrameCompact: {
    flexDirection: "column"
  },
  avatarStagePanel: {
    flex: 1,
    minHeight: 280,
    borderRadius: 24,
    overflow: "hidden"
  },
  avatarConversation: {
    flex: 1.08,
    gap: 12
  },
  chatStatusRow: {
    borderRadius: 14,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 15
  },
  chatStatusText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: "#52645d",
    flexShrink: 1
  },
  chatWindow: {
    flex: 1,
    minHeight: 200,
    maxHeight:320,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    borderWidth: 5,
    borderColor: "#eadfce",
    overflow: "hidden"
  },
  chatWindowSparse: {
    flex: 0,
    minHeight: 260,
    maxHeight: 300
  },
  chatWindowCompact: {
    minHeight: 180
  },
  avatarTranscript: {
    flex: 1,
    minHeight: 240,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    borderWidth: 5,
    borderColor: "#eadfce",
    overflow: "hidden"
  },
  chatWindowContent: {
    padding: 14,
    gap: 10
  },
  messageBubble: {
    maxWidth: "88%",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    overflow: "hidden"
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#eef2ea"
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#214f43"
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#33433d",
    flexShrink: 1
  },
  userBubbleText: {
    color: "#ffffff"
  },
  composerCard: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-end",
    paddingBottom: 2
  },
  chatInput: {
    flex: 1,
    minHeight: 76,
    maxHeight: 132,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d7d4ce",
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#2a2f2d",
    textAlignVertical: "top"
  },
  chatInputCompact: {
    minHeight: 64,
    maxHeight: 108
  },
  avatarInput: {
    minHeight: 72
  },
  textInputDisabled: {
    backgroundColor: "#f2f0eb"
  },
  sendButton: {
    minWidth: 78,
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: "#173b31",
    justifyContent: "center",
    alignItems: "center"
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff"
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 18, 17, 0.4)",
    justifyContent: "center",
    padding: 20
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 26,
    padding: 22,
    gap: 12
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#2a231a"
  },
  modalDuration: {
    fontSize: 15,
    fontWeight: "800",
    color: "#214f43"
  },
  modalSummary: {
    fontSize: 15,
    lineHeight: 23,
    color: "#55615c"
  },
  modalButton: {
    marginTop: 6,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "#173b31",
    justifyContent: "center",
    alignItems: "center"
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff"
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }]
  }
});
