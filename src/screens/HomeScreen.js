import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
} from 'react';
import {
  Alert,
  Animated,
  BackHandler,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import { auth } from '../config/firebaseConfig';
import { useLanguage } from '../context/LanguageContext';
import { ThemeColor, ThemeRadius } from '../theme/appTheme';

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE_URL     = 'https://multilingual-virtual-assistant.onrender.com';
const TOTAL_BREATHING_ROUNDS = 4;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DOCK_WIDTH           = Math.min(SCREEN_WIDTH - 32, 320);
const DOCK_HEIGHT          = 480;
const SESSION_AVATAR_HEIGHT = Math.max(320, Math.round(SCREEN_HEIGHT * 0.62));

// ─── Session catalog ──────────────────────────────────────────────────────────

const sessionCatalog = [
  { id: 'box-breathing',      title: 'Box Breathing',            description: '',                                                            kind: 'guided',      duration: '5 slides'   },
  { id: 'body-scan',          title: 'Body Scan',                 description: 'A guided check-in from head to toe.',                        kind: 'placeholder', duration: 'Coming soon' },
  { id: 'five-senses',        title: 'Five Senses Grounding',     description: 'A grounding exercise to reconnect with the present moment.',  kind: 'placeholder', duration: 'Coming soon' },
  { id: 'gratitude-pause',    title: 'Gratitude Pause',           description: 'A moment to gently shift attention toward what is good.',    kind: 'placeholder', duration: 'Coming soon' },
  { id: 'loving-kindness',    title: 'Loving Kindness',           description: 'A compassion-focused mindfulness practice.',                 kind: 'placeholder', duration: 'Coming soon' },
  { id: 'mindful-walking',    title: 'Mindful Walking',           description: 'A light movement practice with full attention on each step.', kind: 'placeholder', duration: 'Coming soon' },
  { id: 'seated-stretch',     title: 'Seated Stretch Reset',      description: 'Gentle seated stretches to release tension.',                kind: 'placeholder', duration: 'Coming soon' },
  { id: 'mindful-listening',  title: 'Mindful Listening',         description: 'A practice that centers attention through sound.',            kind: 'placeholder', duration: 'Coming soon' },
  { id: 'affirmation-breath', title: 'Affirmation Breath',        description: 'Pair a calming phrase with your breath.',                    kind: 'placeholder', duration: 'Coming soon' },
  { id: 'stress-release',     title: 'Stress Release Check-In',   description: 'Notice, name, and soften what you are carrying.',            kind: 'placeholder', duration: 'Coming soon' },
  { id: 'morning-intention',  title: 'Morning Intention',         description: 'A simple intention-setting practice for the day.',           kind: 'placeholder', duration: 'Coming soon' },
  { id: 'sleep-wind-down',    title: 'Sleep Wind Down',           description: 'A quiet practice to prepare your body for rest.',            kind: 'placeholder', duration: 'Coming soon' },
].map((s, i) => ({ ...s, number: String(i + 1).padStart(2, '0') }));

// ─── Breathing data ───────────────────────────────────────────────────────────

const breathingSlides = [
  { key: 'intro',   stepLabel: 'Introduction', titlePlain: 'Breathe better, feel calmer',  body: 'A simple guide to conscious breathing. Works anytime at your desk, before a test, or when you feel overwhelmed.' },
  { key: 'comfort', stepLabel: 'Step 1 of 4',  titlePlain: 'Get comfortable',              body: 'Before you start, set yourself up for success.', tips: ['Sit upright in a chair or on the floor', 'Rest your hands loosely on your thighs', 'Close your eyes or soften your gaze', 'Relax your jaw and drop your shoulders'], note: 'You do not need a special place. A quiet corner works just fine.' },
  { key: 'rounds',  stepLabel: 'Step 2 of 4',  titlePlain: 'Breathe',                      body: 'Complete 4 rounds of box breathing. Press Start Round to begin each round.', note: 'Follow the circle and keep the breath steady and gentle.' },
  { key: 'pattern', stepLabel: 'Step 3 of 4',  titlePlain: 'The 4-4-4-4 pattern',          body: 'Inhale, hold, exhale, hold. Each side lasts 4 counts, and each round follows the same square path.' },
  { key: 'return',  stepLabel: 'Step 4 of 4',  titlePlain: 'Return slowly',                body: 'After your rounds, let your breath return to normal and notice how you feel.', note: 'Practice once a day. Even 2 minutes can build a steady habit before stressful moments.' },
];

// What the avatar should say when the user advances to each slide
const SLIDE_AVATAR_PROMPTS = {
  intro:   'Introduce Box Breathing warmly in 2-3 sentences. Explain what it is and when it helps. Invite the user to press Next when ready.',
  comfort: 'Guide the user to get comfortable: sit upright, relax hands on thighs, close or soften the gaze, relax the jaw and drop the shoulders. Keep it calm and brief, then invite them to press Next.',
  rounds:  'Tell the user they are about to do 4 rounds of box breathing. Ask them to follow the circle on screen and press "Start Round" when they are ready to begin each round.',
  pattern: 'Explain the 4-4-4-4 pattern clearly: inhale for 4 counts, hold for 4, exhale for 4, then hold for 4. Reassure them it becomes natural quickly.',
  return:  'Congratulate the user on completing Box Breathing. Ask them to let their breath return to normal and take a quiet moment to notice how they feel.',
};

// Applied as the injectedJavaScript PROP on every WebView (runs after DOM is ready,
// before user interaction — more reliable than the injectJavaScript() method):
//   1. Forces textarea/input font-size to 16px  →  prevents iOS WKWebView auto-zoom
//      (WKWebView zooms in whenever a focused input has computed font-size < 16px)
//   2. Sets maximum-scale=1 on the viewport meta  →  belt-and-suspenders for zoom
//   3. Hides the avatar.html built-in Start/End Session buttons (.sr container)
const WEBVIEW_STATIC_JS = `(function(){try{
  var s=document.createElement('style');
  s.textContent=
    'textarea,input{font-size:16px!important;-webkit-text-size-adjust:none!important}' +
    'body.compact .ch{display:none!important}' +
    'body.compact .layout{grid-template-rows:minmax(160px,40%) 1fr!important}' +
    '@media(max-width:860px){.layout{grid-template-rows:minmax(160px,40%) 1fr!important}}';
  document.head.appendChild(s);
  var vm=document.querySelector('meta[name="viewport"]');
  if(vm)vm.setAttribute('content','width=device-width,initial-scale=1,maximum-scale=1');
  var sr=document.querySelector('.sr');
  if(sr)sr.style.cssText='display:none!important';
  /* Warm up the Render server so TTS isn't slow on first use */
  setTimeout(function(){try{fetch('https://multilingual-virtual-assistant.onrender.com/health',{method:'GET'}).catch(function(){});}catch(e){}},1000);
}catch(e){}})();true;`;

// Keep the old name as an alias so existing injectJavaScript() call-sites still compile
const HIDE_CONTROLS_JS = WEBVIEW_STATIC_JS;

const breathingPhases = [
  { badge: 'Inhale', duration: 4000 },
  { badge: 'Hold',   duration: 4000 },
  { badge: 'Exhale', duration: 4000 },
  { badge: 'Hold',   duration: 4000 },
];

const INITIAL_CHAT_MESSAGE = {
  id: 'assistant-welcome',
  role: 'assistant',
  content: 'Hi, I can answer general mindfulness questions and explain any session tile in the app. Open a session first if you want details about that specific practice.',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createSessionId() {
  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDuration(totalSeconds) {
  const hours   = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts   = hours > 0 ? [hours, minutes, seconds] : [minutes, seconds];
  return parts.map((v) => String(v).padStart(2, '0')).join(':');
}

function buildGuidedSessionSummary(slideIndex, roundsDone) {
  const slide = breathingSlides[slideIndex] || breathingSlides[0];
  if (roundsDone >= TOTAL_BREATHING_ROUNDS && slideIndex === breathingSlides.length - 1) {
    return 'You completed the full box breathing tutorial, including all 4 rounds and the return-to-rest step.';
  }
  if (roundsDone >= TOTAL_BREATHING_ROUNDS) {
    return `You completed all 4 breathing rounds and ended on the "${slide.titlePlain}" screen.`;
  }
  if (roundsDone > 0) {
    return `You ended the breathing tutorial after ${roundsDone} of ${TOTAL_BREATHING_ROUNDS} rounds.`;
  }
  return `You ended the breathing tutorial during "${slide.titlePlain}" before the breathing rounds were completed.`;
}

// Build the session avatar start prompt — used on fresh start and on resume
function buildSessionStartPrompt(session, slideIndex, roundsDone, isResume) {
  if (session.kind !== 'guided') {
    return [
      `You are opening the ${session.title} mindfulness session.`,
      'Reply with a short, warm welcome only.',
      'Say you are the user\'s mindfulness assistant and you are here to help.',
      'Ask how they are doing today.',
    ].join(' ');
  }

  if (isResume) {
    const slide = breathingSlides[slideIndex] || breathingSlides[0];
    return [
      `We are resuming the Box Breathing session.`,
      `The user is currently on slide ${slideIndex + 1} of ${breathingSlides.length}: "${slide.titlePlain}".`,
      roundsDone > 0 ? `They have completed ${roundsDone} of ${TOTAL_BREATHING_ROUNDS} breathing rounds.` : '',
      'Continue guiding from this step without re-introducing yourself.',
      SLIDE_AVATAR_PROMPTS[slide.key] || 'Continue from where we left off.',
    ].filter(Boolean).join(' ');
  }

  return [
    'We are starting the Box Breathing mindfulness session. You are the guide.',
    'You will guide the user through 5 steps in order: Introduction, Get comfortable, Breathe, The 4-4-4-4 pattern, and Return slowly.',
    'Start now with the Introduction step.',
    SLIDE_AVATAR_PROMPTS['intro'],
  ].join(' ');
}

function buildChatPrompt(message, sessionContext) {
  if (!sessionContext?.selectedSession) {
    return [
      'App context: The mobile mindfulness app has 12 selectable session tiles.',
      'Only Box Breathing currently includes a full breathing tutorial.',
      `User message: ${message}`,
    ].join('\n');
  }
  const lines = [
    'App context: The mobile mindfulness app has 12 selectable session tiles.',
    `Current session title: ${sessionContext.selectedSession.title}`,
    `Session status: ${sessionContext.sessionActive ? 'active' : 'not started'}`,
  ];
  if (sessionContext.selectedSession.id === 'box-breathing') {
    const slide = breathingSlides[sessionContext.slideIndex] || breathingSlides[0];
    lines.push(`Breathing progress: slide ${sessionContext.slideIndex + 1} of ${breathingSlides.length}, rounds completed ${sessionContext.roundsDone} of ${TOTAL_BREATHING_ROUNDS}.`);
    lines.push(`Current slide: ${slide.titlePlain}`);
  }
  lines.push(`User message: ${message}`);
  return lines.join('\n');
}

function buildLocalChatFallback(_message, sessionContext) {
  if (sessionContext?.selectedSession?.id === 'box-breathing') {
    return 'Box Breathing walks through 5 slides: introduction, setup, breathing rounds, pattern explanation, and return slowly.';
  }
  if (sessionContext?.selectedSession) {
    return `${sessionContext.selectedSession.title} is currently a placeholder session.`;
  }
  return 'This app has 12 session tiles. Box Breathing is the current live tutorial.';
}

// ─── Avatar URI builder ───────────────────────────────────────────────────────

function buildAvatarUri(baseUri, params) {
  if (!baseUri) return null;
  const qs = Object.entries(params)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  return qs ? `${baseUri}?${qs}` : baseUri;
}

// ─── Floating Avatar Dock ─────────────────────────────────────────────────────
// Always mounted — opacity:0 + pointerEvents:none when not visible so the
// WebView keeps running and localStorage / chat state survives screen transitions.

function FloatingAvatarDock({ avatarUri, expanded, visible, onToggle, webViewRef, onLoad }) {
  const hiddenStyle = !visible && styles.floatingHidden;

  if (!expanded) {
    return (
      <View pointerEvents={visible ? 'auto' : 'none'} style={[styles.floatingBtnWrap, hiddenStyle]}>
        <Pressable style={styles.floatingBtn} onPress={onToggle} accessibilityRole="button" accessibilityLabel="Open avatar guide">
          <View style={styles.floatingBtnOrb} />
          <Text style={styles.floatingBtnLabel}>Guide</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View pointerEvents={visible ? 'auto' : 'none'} style={[styles.floatingDock, hiddenStyle]}>
      <View style={styles.floatingDockHeader}>
        <View>
          <Text style={styles.floatingDockKicker}>Mini Guide</Text>
          <Text style={styles.floatingDockTitle}>Mindfulness guide</Text>
        </View>
        <Pressable onPress={onToggle} hitSlop={10}>
          <Text style={styles.floatingDockHideText}>Hide</Text>
        </Pressable>
      </View>
      {avatarUri ? (
        <WebView
          ref={webViewRef}
          source={{ uri: avatarUri }}
          style={styles.dockWebView}
          originWhitelist={['*', 'file://']}
          allowFileAccess
          allowUniversalAccessFromFileURLs
          allowFileAccessFromFileURLs
          mixedContentMode="always"
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          bounces={false}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          injectedJavaScript={WEBVIEW_STATIC_JS}
          onLoad={onLoad}
        />
      ) : (
        <View style={styles.avatarLoading}>
          <View style={styles.loadingOrb} />
          <Text style={styles.loadingText}>Loading avatar…</Text>
        </View>
      )}
    </View>
  );
}

// ─── Session Avatar Panel ─────────────────────────────────────────────────────

function SessionAvatarPanel({ avatarUri, webViewRef, onLoad }) {
  return (
    <View style={styles.sessionAvatarPanel}>
      {avatarUri ? (
        <WebView
          ref={webViewRef}
          source={{ uri: avatarUri }}
          style={styles.sessionWebView}
          originWhitelist={['*', 'file://']}
          allowFileAccess
          allowUniversalAccessFromFileURLs
          allowFileAccessFromFileURLs
          mixedContentMode="always"
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          bounces={false}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          injectedJavaScript={WEBVIEW_STATIC_JS}
          onLoad={onLoad}
        />
      ) : (
        <View style={styles.avatarLoading}>
          <View style={styles.loadingOrb} />
          <Text style={styles.loadingText}>Loading avatar…</Text>
        </View>
      )}
    </View>
  );
}

// ─── Breathing Orb ────────────────────────────────────────────────────────────

function BreathingOrb({ badge }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.spring(scale, {
      toValue: badge === 'Inhale' || badge === 'Hold' ? 1.5 : 1,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();
  }, [badge, scale]);
  return (
    <View style={styles.orbContainer}>
      <Animated.View style={[styles.orb, { transform: [{ scale }] }]}>
        <Text style={styles.orbBadge}>{badge}</Text>
      </Animated.View>
    </View>
  );
}

// ─── Tutorial Card ────────────────────────────────────────────────────────────

function TutorialCard({ slide, roundsDone, roundRunning, phaseBadge, phaseSubtext, onStartRound }) {
  const roundBtnLabel =
    roundsDone >= TOTAL_BREATHING_ROUNDS ? 'All rounds complete'
    : roundRunning ? 'Breathing…'
    : `Start Round ${roundsDone + 1}`;

  return (
    <View style={styles.tutorialCard}>
      <Text style={styles.slideLabel}>{slide.stepLabel}</Text>
      <Text style={styles.slideTitle}>{slide.titlePlain}</Text>
      <Text style={styles.slideBody}>{slide.body}</Text>

      {slide.key === 'comfort' && (
        <>
          {slide.tips.map((tip) => (
            <View key={tip} style={styles.tipRow}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
          <View style={styles.tipCard}>
            <Text style={styles.tipCardLabel}>Tip</Text>
            <Text style={styles.tipCardBody}>{slide.note}</Text>
          </View>
        </>
      )}

      {slide.key === 'rounds' && (
        <>
          <BreathingOrb badge={phaseBadge} />
          <Text style={styles.phaseSubtext}>{phaseSubtext}</Text>
          <View style={styles.roundPips}>
            {Array.from({ length: TOTAL_BREATHING_ROUNDS }).map((_, i) => (
              <View key={i} style={[styles.roundPip, i < roundsDone && styles.roundPipFilled]} />
            ))}
          </View>
          <Text style={styles.roundLabel}>Round {roundsDone} of {TOTAL_BREATHING_ROUNDS}</Text>
          <Pressable
            style={({ pressed }) => [
              styles.roundBtn,
              (roundRunning || roundsDone >= TOTAL_BREATHING_ROUNDS) && styles.btnDisabled,
              pressed && styles.btnPressed,
            ]}
            onPress={onStartRound}
            disabled={roundRunning || roundsDone >= TOTAL_BREATHING_ROUNDS}
          >
            <Text style={styles.roundBtnText}>{roundBtnLabel}</Text>
          </Pressable>
        </>
      )}

      {slide.key === 'pattern' && (
        <View style={styles.tipCard}>
          <Text style={styles.tipCardLabel}>Pattern</Text>
          <Text style={styles.tipCardBody}>Inhale for 4, hold for 4, exhale for 4, then hold for 4.</Text>
        </View>
      )}

      {slide.key === 'return' && (
        <View style={styles.tipCard}>
          <Text style={styles.tipCardLabel}>You did it</Text>
          <Text style={styles.tipCardBody}>{slide.note}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Summary Modal ────────────────────────────────────────────────────────────

function SummaryModal({ visible, duration, summary, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.summaryCard} onPress={() => {}}>
          <Text style={styles.summaryTitle}>Session Complete</Text>
          <Text style={styles.summaryDuration}>Session length: {duration}</Text>
          <Text style={styles.summaryBody}>{summary}</Text>
          <Pressable
            style={({ pressed }) => [styles.summaryCloseBtn, pressed && styles.btnPressed]}
            onPress={onClose}
          >
            <Text style={styles.summaryCloseBtnText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Chat Modal ───────────────────────────────────────────────────────────────

function ChatModal({ visible, onClose, sessionContext }) {
  const [messages, setMessages] = useState([INITIAL_CHAT_MESSAGE]);
  const [draft, setDraft]       = useState('');
  const [busy, setBusy]         = useState(false);
  const [status, setStatus]     = useState('Ready');
  const chatSessionId           = useRef(createSessionId()).current;
  const scrollRef               = useRef(null);

  useEffect(() => {
    if (visible) setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [visible, messages]);

  const send = useCallback(async () => {
    const trimmed = draft.trim();
    if (!trimmed || busy) return;
    setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: 'user', content: trimmed }]);
    setDraft('');
    setBusy(true);
    setStatus('Thinking…');
    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: buildChatPrompt(trimmed, sessionContext), session_id: chatSessionId }),
      });
      if (!res.ok) throw new Error(await res.text() || 'Request failed');
      const data = await res.json();
      setMessages((prev) => [...prev, { id: `assistant-${Date.now()}`, role: 'assistant', content: data.reply || '(No response.)' }]);
      setStatus('Ready');
    } catch {
      setMessages((prev) => [...prev, { id: `fallback-${Date.now()}`, role: 'assistant', content: buildLocalChatFallback(trimmed, sessionContext) }]);
      setStatus('Offline fallback');
    } finally {
      setBusy(false);
    }
  }, [draft, busy, chatSessionId, sessionContext]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView style={styles.overlay} behavior="padding">
        <Pressable style={styles.overlayDismiss} onPress={onClose}>
          <Pressable style={styles.chatSheet} onPress={() => {}}>
            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Mindfulness Chat</Text>
                <Text style={styles.sheetSubtitle}>
                  {sessionContext?.selectedSession
                    ? `Context: ${sessionContext.selectedSession.title}`
                    : 'Context: general app help'}
                </Text>
              </View>
              <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            {/* Status */}
            <Text style={styles.chatStatus}>Assistant: {status}</Text>

            {/* Messages — tall scrollable area */}
            <ScrollView
              ref={scrollRef}
              style={styles.chatWindow}
              contentContainerStyle={styles.chatWindowContent}
              showsVerticalScrollIndicator
            >
              {messages.map((msg) => (
                <View key={msg.id} style={[styles.messageBubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}>
                  <Text style={[styles.messageText, msg.role === 'user' ? styles.messageTextUser : styles.messageTextAssistant]}>
                    {msg.content}
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* Composer */}
            <View style={styles.composer}>
              <TextInput
                style={styles.chatInput}
                value={draft}
                onChangeText={setDraft}
                placeholder="Type a message…"
                placeholderTextColor={ThemeColor.PLACEHOLDER}
                editable={!busy}
                multiline
                onSubmitEditing={send}
                returnKeyType="send"
              />
              <Pressable
                style={({ pressed }) => [styles.sendBtn, (!draft.trim() || busy) && styles.btnDisabled, pressed && styles.btnPressed]}
                onPress={send}
                disabled={!draft.trim() || busy}
              >
                <Text style={styles.sendBtnText}>Send</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }) {
  const { locale, setLocale, t } = useLanguage();

  // ── Screen ──
  const [screen, setScreen]                       = useState('home');
  const [selectedSessionId, setSelectedSessionId] = useState(sessionCatalog[0].id);

  // ── Avatar ──
  const avatarConversationId                      = useRef(createSessionId()).current;
  const [avatarHtmlBase, setAvatarHtmlBase]       = useState(null);
  const [dockExpanded, setDockExpanded]           = useState(true);
  const sessionWebViewRef                         = useRef(null);
  const homeDockWebViewRef                        = useRef(null);
  const homeDockLoadCount                         = useRef(0);

  // ── Session state ──
  const [sessionActive, setSessionActive]         = useState(false);
  const [sessionStatus, setSessionStatus]         = useState('Not started');
  const [sessionStartTime, setSessionStartTime]   = useState(null);
  const [placeholderMessage, setPlaceholderMessage] = useState('');

  // ── Breathing state ──
  const [slideIndex, setSlideIndex]     = useState(0);
  const [roundsDone, setRoundsDone]     = useState(0);
  const [roundRunning, setRoundRunning] = useState(false);
  const [phaseBadge, setPhaseBadge]     = useState('Ready');
  const [phaseSubtext, setPhaseSubtext] = useState('Follow the circle and keep the breath easy.');
  const roundTimers                     = useRef([]);

  // ── Modals ──
  const [summaryVisible, setSummaryVisible]   = useState(false);
  const [sessionSummary, setSessionSummary]   = useState('');
  const [sessionDuration, setSessionDuration] = useState('');
  const [chatVisible, setChatVisible]         = useState(false);

  const selectedSession = sessionCatalog.find((s) => s.id === selectedSessionId) || sessionCatalog[0];
  const slide           = breathingSlides[slideIndex] || breathingSlides[0];
  const sessionContext  = screen === 'session' || sessionActive
    ? { selectedSession, sessionActive, slideIndex, roundsDone, phaseBadge }
    : null;

  // ── Avatar URIs — same chat_id for shared server-side conversation thread ──
  const homeDockUri = useMemo(() => buildAvatarUri(avatarHtmlBase, {
    compact: '1', host: 'home-dock', chat_id: avatarConversationId,
  }), [avatarHtmlBase, avatarConversationId]);

  const sessionAvatarUri = useMemo(() => buildAvatarUri(avatarHtmlBase, {
    compact: '1', host: 'session-panel', session: selectedSessionId, chat_id: avatarConversationId,
  }), [avatarHtmlBase, selectedSessionId, avatarConversationId]);

  // ── Load avatar.html asset ──
  useEffect(() => {
    (async () => {
      try {
        const asset = Asset.fromModule(require('../../assets/avatar.html'));
        await asset.downloadAsync();
        setAvatarHtmlBase(asset.localUri);
      } catch { /* avatar unavailable */ }
    })();
  }, []);

  // ── Inject a postMessage event into the session avatar WebView ──
  // avatar.html listens for { source: 'mindfulness-host', type, ... } on window.
  const injectAvatarCommand = useCallback((command) => {
    const payload = JSON.stringify({ source: 'mindfulness-host', ...command });
    sessionWebViewRef.current?.injectJavaScript(
      `(function(){try{window._nativeHostCommand(${payload});}catch(e){}})();true;`
    );
  }, []);

  // ── Called after the session WebView finishes loading ──
  // Always hides the avatar's built-in Start/End buttons.
  // Only re-injects context when returning to an already-active session (resume).
  const handleSessionAvatarLoad = useCallback(() => {
    setTimeout(() => {
      sessionWebViewRef.current?.injectJavaScript(HIDE_CONTROLS_JS);
    }, 300);
    if (sessionActive) {
      setTimeout(() => {
        const session  = sessionCatalog.find((s) => s.id === selectedSessionId) || sessionCatalog[0];
        const isResume = slideIndex > 0;
        const prompt   = buildSessionStartPrompt(session, slideIndex, roundsDone, isResume);
        injectAvatarCommand({ type: 'host-start-session', prompt, announce: false });
      }, 700);
    }
  }, [selectedSessionId, sessionActive, slideIndex, roundsDone, injectAvatarCommand]);

  const handleHomeDockLoad = useCallback(() => {
    setTimeout(() => {
      homeDockWebViewRef.current?.injectJavaScript(HIDE_CONTROLS_JS);
    }, 300);
    homeDockLoadCount.current += 1;
    if (homeDockLoadCount.current === 1) {
      // First load only — send the welcome prompt via host-start-session
      // so it fires once and doesn't re-trigger on any subsequent reload
      setTimeout(() => {
        const payload = JSON.stringify({
          source: 'mindfulness-host', type: 'host-start-session', prompt: null, announce: false,
        });
        homeDockWebViewRef.current?.injectJavaScript(
          `(function(){try{window._nativeHostCommand(${payload});}catch(e){}})();true;`
        );
      }, 600);
    }
  }, []);

  // ── Navigation guards ──
  useLayoutEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      if (!BackHandler?.addEventListener) return undefined;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (screen === 'session') { setScreen('home'); return true; }
        return true;
      });
      return () => sub.remove();
    }, [screen]),
  );

  // ── Auth ──
  const handleLogout = useCallback(async () => {
    try { await signOut(auth); } catch { /* ignore */ }
    navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
  }, [navigation]);

  const toggleLanguage = useCallback(() => {
    void setLocale(locale === 'en' ? 'ko' : 'en');
  }, [locale, setLocale]);

  const handleSettings = useCallback(() => {
    Alert.alert(t('cardSettingsTitle'), 'Coming soon.');
  }, [t]);

  // ── Breathing logic ──
  const clearRoundTimers = useCallback(() => {
    roundTimers.current.forEach(clearTimeout);
    roundTimers.current = [];
  }, []);

  const resetBreathing = useCallback(() => {
    clearRoundTimers();
    setSlideIndex(0);
    setRoundsDone(0);
    setRoundRunning(false);
    setPhaseBadge('Ready');
    setPhaseSubtext('Follow the circle and keep the breath easy.');
  }, [clearRoundTimers]);

  const startRound = useCallback(() => {
    if (roundRunning || roundsDone >= TOTAL_BREATHING_ROUNDS) return;
    clearRoundTimers();
    setRoundRunning(true);
    setPhaseSubtext('Follow the circle and keep the breath easy.');
    let elapsed = 0;
    breathingPhases.forEach((phase) => {
      roundTimers.current.push(setTimeout(() => setPhaseBadge(phase.badge), elapsed));
      elapsed += phase.duration;
    });
    const nextCount = roundsDone + 1;
    roundTimers.current.push(
      setTimeout(() => {
        setRoundRunning(false);
        setRoundsDone(nextCount);
        if (nextCount < TOTAL_BREATHING_ROUNDS) {
          setPhaseBadge('Rest');
          setPhaseSubtext(`Great. Take a natural breath, then start round ${nextCount + 1}.`);
        } else {
          setPhaseBadge('Complete');
          setPhaseSubtext('You finished all 4 rounds. Continue to the next step.');
        }
      }, elapsed + 100)
    );
  }, [roundRunning, roundsDone, clearRoundTimers]);

  useEffect(() => () => clearRoundTimers(), [clearRoundTimers]);

  // ── Session logic ──
  const openSession = useCallback((id) => {
    setSelectedSessionId(id);
    setScreen('session');
    // If switching to a different session while one is active, clear it silently
    if (sessionActive && selectedSessionId !== id) {
      setSessionActive(false);
      setSessionStatus('Not started');
      setSessionStartTime(null);
      setPlaceholderMessage('');
      resetBreathing();
      injectAvatarCommand({ type: 'host-end-session' });
    }
  }, [sessionActive, selectedSessionId, resetBreathing, injectAvatarCommand]);

  // Called when the user explicitly presses Start Session
  const startSession = useCallback(() => {
    const session = sessionCatalog.find((s) => s.id === selectedSessionId) || sessionCatalog[0];
    setSummaryVisible(false);
    setSessionStartTime(Date.now());
    setSessionActive(true);
    setSessionStatus('Session active');
    if (session.kind === 'guided') {
      resetBreathing();
    } else {
      setPlaceholderMessage(`${session.title} is intentionally empty right now.`);
    }
    setTimeout(() => {
      const prompt = buildSessionStartPrompt(session, 0, 0, false);
      injectAvatarCommand({ type: 'host-start-session', prompt, announce: false });
    }, 200);
  }, [selectedSessionId, resetBreathing, injectAvatarCommand]);

  const endSession = useCallback(() => {
    if (!sessionActive) return;
    const elapsed = Math.max(0, Math.floor((Date.now() - (sessionStartTime || Date.now())) / 1000));
    setSessionDuration(formatDuration(elapsed));
    const session = sessionCatalog.find((s) => s.id === selectedSessionId) || sessionCatalog[0];
    setSessionSummary(
      session.kind === 'guided'
        ? buildGuidedSessionSummary(slideIndex, roundsDone)
        : `${session.title} ended.`
    );
    setSummaryVisible(true);
    setSessionActive(false);
    setSessionStatus('Not started');
    setSessionStartTime(null);
    setPlaceholderMessage('');
    resetBreathing();
    // Tell avatar the session ended — it posts a closing message in chat
    injectAvatarCommand({ type: 'host-end-session' });
  }, [sessionActive, sessionStartTime, selectedSessionId, slideIndex, roundsDone, resetBreathing, injectAvatarCommand]);

  // "Next" advances the slide AND tells the avatar to narrate the next step
  const goToNextSlide = useCallback(() => {
    if (slideIndex === breathingSlides.length - 1) {
      endSession();
      return;
    }
    const nextIndex = Math.min(breathingSlides.length - 1, slideIndex + 1);
    setSlideIndex(nextIndex);
    // Send step prompt via host-start-session so it goes to the AI behind the scenes
    // without appearing as a user message in the avatar chat UI
    const nextKey    = breathingSlides[nextIndex]?.key;
    const stepPrompt = SLIDE_AVATAR_PROMPTS[nextKey] || 'Continue guiding the user through the next step.';
    injectAvatarCommand({ type: 'host-start-session', prompt: stepPrompt, announce: false });
  }, [slideIndex, endSession, injectAvatarCommand]);

  const goToPrevSlide = useCallback(() => {
    setSlideIndex((i) => Math.max(0, i - 1));
  }, []);

  const nextStepDisabled = roundRunning || (slide.key === 'rounds' && roundsDone < TOTAL_BREATHING_ROUNDS);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.langContainer}>
          <Text style={styles.globeText}>Language</Text>
          <Pressable
            onPress={toggleLanguage}
            style={({ pressed }) => [styles.langBtn, pressed && styles.topBtnPressed]}
            accessibilityRole="button"
          >
            <Text style={styles.langBtnText}>{locale.toUpperCase()}</Text>
          </Pressable>
        </View>
        <Text style={styles.headerTitle}>{t('homeTitle')}</Text>
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [styles.logoutBtn, pressed && styles.topBtnPressed]}
          accessibilityRole="button"
        >
          <Text style={styles.logoutText}>{t('logOut')}</Text>
        </Pressable>
      </View>

      {/* ══ HOME SCREEN — full scrollable ══ */}
      {screen === 'home' && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <Text style={styles.heroEyebrow}>Mindfulness Sessions</Text>
            <Text style={styles.heroTitle}>Mindfulness,{'\n'}guided with calm.</Text>
            <Text style={styles.heroBody}>
              Explore a softer session space where your avatar guide greets you,
              then supports each mindfulness exercise when you are ready to begin.
            </Text>
            <View style={styles.heroActions}>
              {!dockExpanded ? (
                <Pressable style={({ pressed }) => [styles.heroBtnPrimary, pressed && styles.btnPressed]} onPress={() => setDockExpanded(true)}>
                  <Text style={styles.heroBtnPrimaryText}>Open Guide</Text>
                </Pressable>
              ) : (
                <Pressable style={({ pressed }) => [styles.heroBtnPrimary, pressed && styles.btnPressed]} onPress={() => openSession('box-breathing')}>
                  <Text style={styles.heroBtnPrimaryText}>Start With Box Breathing</Text>
                </Pressable>
              )}
              <Pressable style={({ pressed }) => [styles.heroBtnSecondary, pressed && styles.btnPressed]} onPress={() => openSession(selectedSessionId)}>
                <Text style={styles.heroBtnSecondaryText}>Explore Sessions</Text>
              </Pressable>
            </View>
          </View>

          {sessionActive && (
            <View style={styles.resumeCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.resumeTitle}>Session in progress</Text>
                <Text style={styles.resumeBody}>{selectedSession.title} is still active.</Text>
              </View>
              <Pressable style={({ pressed }) => [styles.heroBtnPrimary, { marginTop: 0 }, pressed && styles.btnPressed]} onPress={() => setScreen('session')}>
                <Text style={styles.heroBtnPrimaryText}>Resume</Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.sectionTitle}>Session Selection</Text>
          <View style={styles.sessionGrid}>
            {sessionCatalog.map((s) => {
              const isGuided = s.kind === 'guided';
              const selected = selectedSessionId === s.id;
              const disabled = sessionActive && selectedSessionId !== s.id;
              return (
                <Pressable
                  key={s.id}
                  style={({ pressed }) => [
                    styles.sessionTile,
                    isGuided ? styles.sessionTileGuided : styles.sessionTilePlaceholder,
                    selected && styles.sessionTileSelected,
                    disabled && styles.btnDisabled,
                    pressed && !disabled && styles.btnPressed,
                  ]}
                  onPress={() => openSession(s.id)}
                  disabled={disabled}
                >
                  <View style={styles.sessionTileTop}>
                    <Text style={styles.sessionNumber}>{s.number}</Text>
                    <View style={[styles.pill, isGuided ? styles.pillGuided : styles.pillEmpty]}>
                      <Text style={[styles.pillText, isGuided ? styles.pillTextGuided : styles.pillTextEmpty]}>
                        {isGuided ? 'Ready' : 'Empty'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.sessionTileTitle}>{s.title}</Text>
                  {!!s.description && <Text style={styles.sessionTileDesc} numberOfLines={2}>{s.description}</Text>}
                  <Text style={styles.sessionTileMeta}>{s.duration}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('cardAboutTitle')}</Text>
            <Text style={styles.cardText}>{t('cardAboutText')}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('cardUpdatesTitle')}</Text>
            <Text style={styles.cardText}>{t('cardUpdatesText')}</Text>
          </View>
          <Pressable onPress={handleSettings} style={({ pressed }) => [styles.card, pressed && styles.btnPressed]}>
            <Text style={styles.cardTitle}>{t('cardSettingsTitle')}</Text>
            <Text style={styles.cardText}>{t('cardSettingsText')}</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.supportBtn, pressed && styles.btnPressed]} onPress={() => Alert.alert(t('supportTicket'), 'Coming soon.')}>
            <Text style={styles.supportBtnText}>{t('supportTicket')}</Text>
          </Pressable>
        </ScrollView>
      )}

      {/* ══ SESSION SCREEN — fully scrollable so nothing gets compressed ══ */}
      {screen === 'session' && (
        <ScrollView
          style={styles.sessionLayout}
          contentContainerStyle={styles.sessionScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
        >
          <View style={styles.sessionTopRow}>
            <Pressable style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]} onPress={() => setScreen('home')}>
              <Text style={styles.backBtnText}>← Sessions</Text>
            </Pressable>
            {sessionActive && (
              <Pressable style={({ pressed }) => [styles.endBtn, pressed && styles.btnPressed]} onPress={endSession}>
                <Text style={styles.endBtnText}>End Session</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.detailHero}>
            <View style={styles.detailTopRow}>
              <Text style={styles.detailNumber}>{selectedSession.number}</Text>
              <View style={[styles.pill, selectedSession.kind === 'guided' ? styles.pillGuided : styles.pillEmpty]}>
                <Text style={[styles.pillText, selectedSession.kind === 'guided' ? styles.pillTextGuided : styles.pillTextEmpty]}>
                  {selectedSession.kind === 'guided' ? 'Guided session' : 'Empty session'}
                </Text>
              </View>
              <Text style={styles.detailTitle}>{selectedSession.title}</Text>
              {!sessionActive ? (
                <Pressable
                  style={({ pressed }) => [styles.startBtn, pressed && styles.btnPressed]}
                  onPress={startSession}
                >
                  <Text style={styles.startBtnText}>Start</Text>
                </Pressable>
              ) : (
                <Text style={styles.detailStatus}>{sessionStatus}</Text>
              )}
            </View>
          </View>

          <SessionAvatarPanel
            avatarUri={sessionAvatarUri}
            webViewRef={sessionWebViewRef}
            onLoad={handleSessionAvatarLoad}
          />

          {sessionActive && selectedSession.kind === 'guided' && (
            <View style={styles.slideNav}>
              <Pressable
                style={({ pressed }) => [styles.navBtn, styles.navBtnSecondary, slideIndex === 0 && styles.btnDisabled, pressed && slideIndex > 0 && styles.btnPressed]}
                onPress={goToPrevSlide}
                disabled={slideIndex === 0}
              >
                <Text style={styles.navBtnSecondaryText}>← Prev</Text>
              </Pressable>
              <Text style={styles.slideProgress}>{slideIndex + 1} / {breathingSlides.length}</Text>
              <Pressable
                style={({ pressed }) => [styles.navBtn, styles.navBtnPrimary, nextStepDisabled && styles.btnDisabled, pressed && !nextStepDisabled && styles.btnPressed]}
                onPress={goToNextSlide}
                disabled={nextStepDisabled}
              >
                <Text style={styles.navBtnPrimaryText}>
                  {slideIndex === breathingSlides.length - 1 ? 'Finish →' : 'Next →'}
                </Text>
              </Pressable>
            </View>
          )}

          {selectedSession.kind === 'guided' && sessionActive && (
            <TutorialCard
              slide={slide}
              roundsDone={roundsDone}
              roundRunning={roundRunning}
              phaseBadge={phaseBadge}
              phaseSubtext={phaseSubtext}
              onStartRound={startRound}
            />
          )}

          {selectedSession.kind !== 'guided' && !!placeholderMessage && (
            <View style={styles.placeholderCard}>
              <Text style={styles.placeholderTitle}>Template Reserved</Text>
              <Text style={styles.placeholderBody}>{placeholderMessage}</Text>
            </View>
          )}

          <View style={styles.chatFabArea}>
            <Pressable style={({ pressed }) => [styles.chatFab, pressed && styles.btnPressed]} onPress={() => setChatVisible(true)}>
              <Text style={styles.chatFabText}>Chat</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {/* ── Floating avatar dock — always mounted, hidden on session screen ── */}
      <FloatingAvatarDock
        avatarUri={homeDockUri}
        expanded={dockExpanded}
        visible={screen === 'home'}
        onToggle={() => setDockExpanded((v) => !v)}
        webViewRef={homeDockWebViewRef}
        onLoad={handleHomeDockLoad}
      />

      <SummaryModal
        visible={summaryVisible}
        duration={sessionDuration}
        summary={sessionSummary}
        onClose={() => { setSummaryVisible(false); setScreen('home'); }}
      />

      <ChatModal
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        sessionContext={sessionContext}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const cardShadow = Platform.select({
  ios:     { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 10 },
  android: { elevation: 4 },
  default: {},
});

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: ThemeColor.SCREEN_BG },
  scroll:    { flex: 1 },
  container: { padding: 16, paddingBottom: 100, maxWidth: 520, width: '100%', alignSelf: 'center' },

  // Header
  header:        { backgroundColor: ThemeColor.BRAND, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 14 },
  headerTitle:   { flex: 1, color: ThemeColor.WHITE, fontSize: 18, fontWeight: '700', textAlign: 'center', paddingHorizontal: 8 },
  langContainer: { width: 92, flexDirection: 'row', alignItems: 'center', gap: 6 },
  globeText:     { color: ThemeColor.WHITE, fontSize: 11, fontWeight: '700' },
  langBtn:       { minWidth: 34, minHeight: 30, alignItems: 'center', justifyContent: 'center', borderRadius: ThemeRadius.SM, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  langBtnText:   { color: ThemeColor.WHITE, fontSize: 13, fontWeight: '700' },
  logoutBtn:     { width: 92, alignItems: 'flex-end', paddingVertical: 6 },
  logoutText:    { color: ThemeColor.WHITE, fontWeight: '700', fontSize: 14 },

  // Hero
  hero:                { borderRadius: 16, backgroundColor: ThemeColor.BRAND, padding: 22, marginBottom: 16, gap: 10 },
  heroEyebrow:         { color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  heroTitle:           { color: ThemeColor.WHITE, fontSize: 28, fontWeight: '900', lineHeight: 32 },
  heroBody:            { color: 'rgba(255,255,255,0.84)', fontSize: 14, lineHeight: 21 },
  heroActions:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  heroBtnPrimary:      { backgroundColor: ThemeColor.WHITE, borderRadius: 10, paddingVertical: 11, paddingHorizontal: 16 },
  heroBtnPrimaryText:  { color: ThemeColor.BRAND, fontWeight: '800', fontSize: 14 },
  heroBtnSecondary:    { borderRadius: 10, paddingVertical: 11, paddingHorizontal: 16, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)' },
  heroBtnSecondaryText:{ color: ThemeColor.WHITE, fontWeight: '700', fontSize: 14 },

  // Resume banner
  resumeCard:  { backgroundColor: ThemeColor.WHITE, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, ...cardShadow },
  resumeTitle: { fontSize: 14, fontWeight: '800', color: ThemeColor.TEXT_PRIMARY, marginBottom: 2 },
  resumeBody:  { fontSize: 13, color: ThemeColor.HOME_CARD_TEXT, lineHeight: 18 },

  // ── Floating dock (home screen) ──
  floatingBtnWrap: { position: 'absolute', bottom: 28, right: 18, zIndex: 200 },
  floatingBtn: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: ThemeColor.BRAND,
    alignItems: 'center', justifyContent: 'center', gap: 4,
    ...Platform.select({
      ios:     { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  floatingBtnOrb:   { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.85)' },
  floatingBtnLabel: { color: ThemeColor.WHITE, fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },

  floatingDock: {
    position: 'absolute', bottom: 28, right: 16,
    width: DOCK_WIDTH, height: DOCK_HEIGHT,
    borderRadius: 18, overflow: 'hidden', backgroundColor: '#0d1b36', zIndex: 200,
    ...Platform.select({
      ios:     { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 18 },
      android: { elevation: 10 },
    }),
  },
  floatingHidden:      { opacity: 0 },
  floatingDockHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#172861' },
  floatingDockKicker:  { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  floatingDockTitle:   { color: ThemeColor.WHITE, fontSize: 14, fontWeight: '700', marginTop: 2 },
  floatingDockHideText:{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600' },
  dockWebView:         { flex: 1 },

  // Avatar loading state
  avatarLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#0d1b36' },
  loadingOrb:    { width: 48, height: 48, borderRadius: 24, backgroundColor: ThemeColor.BRAND, opacity: 0.5 },
  loadingText:   { color: 'rgba(255,255,255,0.5)', fontSize: 13 },

  // ── Session avatar (inline) ──
  sessionAvatarPanel: { height: SESSION_AVATAR_HEIGHT, borderRadius: 18, overflow: 'hidden', marginBottom: 16, backgroundColor: '#0d1b36', ...cardShadow },
  sessionWebView:     { flex: 1 },

  // Session grid
  sectionTitle:           { fontSize: 20, fontWeight: '800', color: ThemeColor.TEXT_PRIMARY, marginBottom: 12, marginTop: 4 },
  sessionGrid:            { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  sessionTile:            { width: (SCREEN_WIDTH - 42) / 2, borderRadius: 14, padding: 14, gap: 6, borderWidth: 1.5, minHeight: 140 },
  sessionTileGuided:      { backgroundColor: '#e8edf7', borderColor: 'rgba(31,60,136,0.2)' },
  sessionTilePlaceholder: { backgroundColor: ThemeColor.WHITE, borderColor: 'rgba(31,60,136,0.1)' },
  sessionTileSelected:    { borderColor: ThemeColor.BRAND, borderWidth: 2 },
  sessionTileTop:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sessionNumber:          { fontSize: 20, fontWeight: '900', color: ThemeColor.BRAND },
  sessionTileTitle:       { fontSize: 14, fontWeight: '700', color: ThemeColor.TEXT_PRIMARY },
  sessionTileDesc:        { fontSize: 12, color: ThemeColor.HOME_CARD_TEXT, lineHeight: 17 },
  sessionTileMeta:        { fontSize: 11, color: ThemeColor.HOME_SUBTITLE, fontWeight: '600' },

  // Pills
  pill:           { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  pillGuided:     { backgroundColor: ThemeColor.BRAND },
  pillEmpty:      { backgroundColor: '#e8edf7' },
  pillText:       { fontSize: 10, fontWeight: '800' },
  pillTextGuided: { color: ThemeColor.WHITE },
  pillTextEmpty:  { color: ThemeColor.HOME_SUBTITLE },

  // Info cards
  card:          { backgroundColor: ThemeColor.WHITE, padding: 20, borderRadius: 8, borderTopWidth: 4, borderTopColor: ThemeColor.BRAND, marginBottom: 14, ...cardShadow },
  cardTitle:     { fontSize: 18, fontWeight: '700', color: ThemeColor.BRAND, marginBottom: 5 },
  cardText:      { color: ThemeColor.HOME_CARD_TEXT, lineHeight: 22 },
  supportBtn:    { backgroundColor: '#2ecc71', padding: 15, borderRadius: 8, marginTop: 4, alignItems: 'center' },
  supportBtnText:{ color: ThemeColor.WHITE, fontWeight: '700', fontSize: 16 },

  // Chat FAB
  chatFabArea: { alignItems: 'flex-end', marginTop: 12 },
  chatFab:     { backgroundColor: ThemeColor.BRAND, borderRadius: 24, paddingVertical: 12, paddingHorizontal: 24 },
  chatFabText: { color: ThemeColor.WHITE, fontWeight: '800', fontSize: 15 },

  // Session screen — single scrollable column, nothing gets compressed
  sessionLayout:       { flex: 1, backgroundColor: ThemeColor.SCREEN_BG },
  sessionScrollContent:{ padding: 16, paddingBottom: 100 },

  // Session screen
  sessionTopRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  backBtn:          { paddingVertical: 6 },
  backBtnText:      { color: ThemeColor.BRAND, fontWeight: '700', fontSize: 15 },
  endBtn:           { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(180,40,40,0.35)', backgroundColor: 'rgba(220,50,50,0.06)' },
  endBtnText:       { color: '#c0392b', fontWeight: '700', fontSize: 13 },
  startBtn:         { backgroundColor: ThemeColor.BRAND, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14, marginLeft: 'auto' },
  startBtnText:     { color: ThemeColor.WHITE, fontWeight: '800', fontSize: 13 },
  detailHero:       { backgroundColor: ThemeColor.WHITE, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10, ...cardShadow },
  detailTopRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  detailNumber:     { fontSize: 28, fontWeight: '900', color: ThemeColor.BRAND },
  detailStatus:     { fontSize: 11, color: ThemeColor.HOME_SUBTITLE, fontWeight: '600', marginLeft: 'auto' },
  detailTitle:      { flex: 1, fontSize: 16, fontWeight: '800', color: ThemeColor.TEXT_PRIMARY },
  detailDescription:{ fontSize: 14, color: ThemeColor.HOME_CARD_TEXT, lineHeight: 21 },

  // Slide nav
  slideNav:            { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  slideProgress:       { flex: 1, textAlign: 'center', color: ThemeColor.HOME_CARD_TEXT, fontWeight: '700', fontSize: 13 },
  navBtn:              { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  navBtnPrimary:       { backgroundColor: ThemeColor.BRAND },
  navBtnPrimaryText:   { color: ThemeColor.WHITE, fontWeight: '800', fontSize: 14 },
  navBtnSecondary:     { backgroundColor: ThemeColor.WHITE, borderWidth: 1.5, borderColor: ThemeColor.BRAND },
  navBtnSecondaryText: { color: ThemeColor.BRAND, fontWeight: '800', fontSize: 14 },

  // Tutorial card
  tutorialCard:  { backgroundColor: ThemeColor.WHITE, borderRadius: 16, padding: 20, gap: 12, marginBottom: 16, ...cardShadow },
  slideLabel:    { fontSize: 12, fontWeight: '800', color: ThemeColor.HOME_SUBTITLE, letterSpacing: 0.8, textTransform: 'uppercase' },
  slideTitle:    { fontSize: 22, fontWeight: '800', color: ThemeColor.TEXT_PRIMARY },
  slideBody:     { fontSize: 15, color: ThemeColor.HOME_CARD_TEXT, lineHeight: 22 },
  tipRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tipDot:        { width: 7, height: 7, borderRadius: 4, backgroundColor: ThemeColor.BRAND, marginTop: 7 },
  tipText:       { flex: 1, fontSize: 14, color: ThemeColor.TEXT_PRIMARY, lineHeight: 21 },
  tipCard:       { backgroundColor: '#e8edf7', borderRadius: 12, padding: 14, gap: 4 },
  tipCardLabel:  { fontSize: 11, fontWeight: '800', color: ThemeColor.BRAND, letterSpacing: 0.6, textTransform: 'uppercase' },
  tipCardBody:   { fontSize: 14, color: ThemeColor.TEXT_PRIMARY, lineHeight: 21 },
  orbContainer:  { alignItems: 'center', paddingVertical: 14 },
  orb:           { width: 90, height: 90, borderRadius: 45, backgroundColor: ThemeColor.BRAND, alignItems: 'center', justifyContent: 'center' },
  orbBadge:      { color: ThemeColor.WHITE, fontWeight: '800', fontSize: 16 },
  phaseSubtext:  { fontSize: 14, color: ThemeColor.HOME_CARD_TEXT, textAlign: 'center', lineHeight: 21 },
  roundPips:     { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  roundPip:      { width: 12, height: 12, borderRadius: 6, backgroundColor: '#d9e2f1' },
  roundPipFilled:{ backgroundColor: ThemeColor.BRAND },
  roundLabel:    { textAlign: 'center', fontSize: 13, color: ThemeColor.HOME_CARD_TEXT, fontWeight: '600' },
  roundBtn:      { backgroundColor: ThemeColor.BRAND, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  roundBtnText:  { color: ThemeColor.WHITE, fontWeight: '800', fontSize: 15 },
  placeholderCard:  { backgroundColor: ThemeColor.WHITE, borderRadius: 16, padding: 18, gap: 8, marginBottom: 16, ...cardShadow },
  placeholderTitle: { fontSize: 17, fontWeight: '800', color: ThemeColor.TEXT_PRIMARY },
  placeholderBody:  { fontSize: 14, color: ThemeColor.HOME_CARD_TEXT, lineHeight: 21 },

  // Summary modal
  overlay:             { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  summaryCard:         { width: '100%', maxWidth: 380, backgroundColor: ThemeColor.WHITE, borderRadius: 20, padding: 24, gap: 10 },
  summaryTitle:        { fontSize: 20, fontWeight: '800', color: ThemeColor.TEXT_PRIMARY, textAlign: 'center' },
  summaryDuration:     { fontSize: 14, color: ThemeColor.HOME_CARD_TEXT, textAlign: 'center' },
  summaryBody:         { fontSize: 15, color: ThemeColor.TEXT_PRIMARY, lineHeight: 22 },
  summaryCloseBtn:     { backgroundColor: ThemeColor.BRAND, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 8 },
  summaryCloseBtnText: { color: ThemeColor.WHITE, fontWeight: '800', fontSize: 15 },

  // Chat modal — tall sheet so messages and composer are both visible
  overlayDismiss:  { flex: 1, justifyContent: 'flex-end' },
  chatSheet: {
    backgroundColor: ThemeColor.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: Math.round(SCREEN_HEIGHT * 0.82),
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  sheetHeader:  { flexDirection: 'row', alignItems: 'flex-start', padding: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: ThemeColor.INPUT_BORDER },
  sheetTitle:   { fontSize: 18, fontWeight: '800', color: ThemeColor.TEXT_PRIMARY },
  sheetSubtitle:{ fontSize: 13, color: ThemeColor.HOME_CARD_TEXT, marginTop: 2 },
  closeBtn:     { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0f2f5', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  closeBtnText: { fontSize: 16, color: ThemeColor.TEXT_PRIMARY, fontWeight: '700' },
  chatStatus:   { fontSize: 11, color: ThemeColor.HOME_CHAT_MUTED, paddingHorizontal: 16, paddingVertical: 5, backgroundColor: '#f7f8fa' },
  // Messages area — flex:1 so it fills remaining space between header and composer
  chatWindow:        { flex: 1 },
  chatWindowContent: { padding: 16, gap: 12, flexGrow: 1 },
  messageBubble:     { borderRadius: 16, padding: 13, maxWidth: '86%' },
  bubbleUser:        { backgroundColor: ThemeColor.BRAND, alignSelf: 'flex-end' },
  bubbleAssistant:   { backgroundColor: '#e8edf7', alignSelf: 'flex-start' },
  messageText:           { fontSize: 15, lineHeight: 21 },
  messageTextUser:       { color: ThemeColor.WHITE },
  messageTextAssistant:  { color: ThemeColor.TEXT_PRIMARY },
  // Composer — fixed at bottom
  composer:  { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 14, paddingVertical: 12, gap: 10, borderTopWidth: 1, borderTopColor: ThemeColor.INPUT_BORDER, backgroundColor: ThemeColor.WHITE },
  chatInput: { flex: 1, backgroundColor: ThemeColor.INPUT_BG, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: ThemeColor.TEXT_PRIMARY, minHeight: 46, maxHeight: 120 },
  sendBtn:     { backgroundColor: ThemeColor.BRAND, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 18, minHeight: 46, justifyContent: 'center' },
  sendBtnText: { color: ThemeColor.WHITE, fontWeight: '800', fontSize: 15 },

  // Shared
  btnDisabled:   { opacity: 0.4 },
  btnPressed:    { opacity: 0.85 },
  topBtnPressed: { opacity: 0.82 },
});
