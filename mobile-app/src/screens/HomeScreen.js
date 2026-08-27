import {
  createElement,
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
} from 'react';
import {
  AccessibilityInfo,
  Animated,
  BackHandler,
  Easing,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { WebView } from 'react-native-webview';
import * as Speech from 'expo-speech';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../config/firebaseConfig';
import { useLanguage } from '../context/LanguageContext';
import { LOCALIZED_CONTENT } from '../i18n/generated/content';
import { LanguageMenuButton } from '../components/LanguageSelector';
import { ThemeColor, ThemeRadius } from '../theme/appTheme';
import { recordCompletedSession } from '../utils/sessionTracking';
import {
  API_BASE_URL,
  WEBVIEW_ORIGIN_WHITELIST,
  isAllowedWebViewNavigation,
} from '../config/apiConfig';
import mindfulnessActivities from '../../mindfulness_activities.json';

// ─── Constants ────────────────────────────────────────────────────────────────


// ─── Session catalog ──────────────────────────────────────────────────────────

const PRACTICE_DETAILS = [
  ['caregiver-fatigue', 'Caregiver Fatigue', 'Set down the responsibility you have been carrying for a few minutes. This gentle practice helps you soften self-criticism, restore steadiness, and make room for your own needs.', 'Aries', '~4 min · 25 steps'],
  ['body-scan', 'Body Scan', 'Bring your attention slowly through the body, noticing pressure, warmth, tension, and ease without needing to change anything. A grounding choice when your mind feels busy or disconnected.', 'Taurus', '~7 min · 4 steps'],
  ['five-senses', 'Five Senses Grounding', 'Use sight, sound, touch, smell, and taste to return to what is happening right now. This short sensory reset can help interrupt spiraling thoughts and settle an overwhelmed nervous system.', 'Gemini', '~6 min · 4 steps'],
  ['mindful-breathing', 'Mindful Breathing', 'Follow the natural rhythm of your inhale and exhale without forcing it into a pattern. A simple practice for creating a little space before a meeting, conversation, or difficult moment.', 'Cancer', '~5 min · 18 steps'],
  ['loving-kindness', 'Loving Kindness', 'Repeat quiet wishes of safety, ease, and care for yourself and the people in your life. Use it when you feel hardened, lonely, or in need of a kinder inner voice.', 'Leo', '~7 min · 4 steps'],
  ['mindful-walking', 'Mindful Walking', 'Let the pace of your steps become an anchor as you notice balance, movement, and the space around you. A good reset when sitting still feels difficult or restless energy needs somewhere to go.', 'Virgo', '~6 min · 4 steps'],
  ['seated-stretch', 'Seated Stretch Reset', 'Ease common tension in the shoulders, neck, back, and hips with movements that can be done from a chair. Designed for a quiet desk break or a low-energy afternoon reset.', 'Libra', '~6 min · 4 steps'],
  ['mindful-listening', 'Mindful Listening', 'Notice near and distant sounds without judging or chasing them. This listening practice can help widen your attention when thoughts feel loud and bring you back into your surroundings.', 'Scorpio', '~6 min · 4 steps'],
  ['affirmation-breath', 'Affirmation Breath', 'Match a steady breath with a phrase that gives you support, such as “I can take this one moment at a time.” A small ritual for building reassurance before the day gathers speed.', 'Sagittarius', '~5 min · 4 steps'],
  ['stress-release', 'Stress Release Check-In', 'Pause long enough to identify what is asking for your attention instead of holding it as one undifferentiated weight. This reflective reset helps you name the pressure and choose a gentler next step.', 'Capricorn', '~6 min · 4 steps'],
  ['morning-intention', 'Morning Intention', 'Start with a quality you want to bring into the next few hours—patience, focus, openness, or care. This is a brief way to choose how you want to meet the day rather than rush straight into it.', 'Aquarius', '~5 min · 4 steps'],
  ['sleep-wind-down', 'Sleep Wind Down', 'Slow the transition from a full day into a softer, quieter state. Gentle body awareness and unhurried breathing help you release the urge to solve anything before sleep.', 'Pisces', '~7 min · 4 steps'],
];

const BASE_SESSION_CATALOG = PRACTICE_DETAILS.map(([id, title, previewDescription, zodiac, duration], index) => ({
  id,
  title,
  previewDescription,
  zodiac,
  duration,
  kind: 'scripted',
  number: String(index + 1).padStart(2, '0'),
}));

const SESSION_GRID_GAP = 10;

const MOOD_OPTIONS = [
  { key: 'low', emoji: '😔', label: 'Low', value: 1, prompt: 'What’s weighing on you today? You don’t have to solve it all at once.' },
  { key: 'tender', emoji: '😕', label: 'Tender', value: 2, prompt: 'What feels a little harder than usual today?' },
  { key: 'steady', emoji: '😐', label: 'Steady', value: 3, prompt: 'Steady is enough. What would help you stay grounded today?' },
  { key: 'good', emoji: '🙂', label: 'Good', value: 4, prompt: 'What’s one thing that helped you feel good today?' },
  { key: 'bright', emoji: '😊', label: 'Bright', value: 5, prompt: 'What happened that you want to remember from today?' },
];

const DAILY_FORTUNES = [
  'A small pause will reveal the next right step.',
  'Your attention is a form of care—place it somewhere gentle today.',
  'Something ordinary will feel quietly meaningful when you slow down for it.',
  'You do not need a perfect day to make room for one good moment.',
  'Let ease be useful. You are allowed to move at a kinder pace.',
  'The feeling you make space for today will have less power over you tomorrow.',
  'A conversation today may be kinder than you expect.',
  'The answer may arrive after you stop forcing it.',
  'Protecting your energy is also a form of progress.',
  'One honest breath can change the tone of the next hour.',
  'Leave a little room in your plans for something delightful.',
  'A task you have been avoiding may be lighter once you begin.',
  'Someone will appreciate the care you bring to a small moment.',
  'Your quiet effort is building something you cannot see yet.',
  'Choose the next kind step, not the entire staircase.',
  'A clear boundary will create room for something better.',
  'Today favors curiosity over certainty.',
  'The ordinary path may hold the surprise you need.',
  'Rest will return more to you than rushing will.',
  'A simple choice made calmly will carry you forward.',
  'Notice what becomes easier when you stop judging the moment.',
  'You may already know what deserves your attention first.',
  'A familiar place will offer a new perspective today.',
  'Let one unfinished thing remain unfinished without guilt.',
  'A sincere question can open a door that effort cannot.',
  'Give today one small memory worth keeping.',
  'Your pace does not need to match anyone else’s.',
  'Something you release will make the rest feel lighter.',
  'Trust the progress that looks quiet from the outside.',
  'A moment of play may restore more than another hour of work.',
];

const SPEECH_RECOGNITION_LOCALES = {
  en: 'en-US', ko: 'ko-KR', es: 'es-ES', fr: 'fr-FR', ja: 'ja-JP',
  zh: 'zh-CN', ar: 'ar-SA', pt: 'pt-BR', hi: 'hi-IN', de: 'de-DE', vi: 'vi-VN',
};

const ZODIAC_CONSTELLATIONS = {
  Aries: { points: [[12,42],[27,25],[43,38],[58,18],[78,30]], edges: [[0,1],[1,2],[2,3],[3,4]] },
  Taurus: { points: [[10,28],[24,16],[40,27],[55,12],[72,23],[88,39]], edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[1,4]] },
  Gemini: { points: [[18,12],[20,42],[38,25],[58,14],[60,46],[78,28]], edges: [[0,1],[0,2],[2,3],[3,4],[3,5],[4,5]] },
  Cancer: { points: [[14,28],[30,15],[48,25],[64,12],[82,30],[61,45],[39,41]], edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0]] },
  Leo: { points: [[12,32],[25,18],[42,24],[58,14],[77,20],[68,39],[48,43],[34,34]], edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0],[2,7]] },
  Virgo: { points: [[10,42],[20,22],[34,31],[42,12],[55,26],[69,17],[84,31]], edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]] },
  Libra: { points: [[12,36],[28,20],[44,34],[60,20],[78,36],[44,47]], edges: [[0,1],[1,2],[2,3],[3,4],[2,5]] },
  Scorpio: { points: [[10,18],[25,26],[39,16],[52,30],[64,20],[76,35],[88,25],[78,45]], edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7]] },
  Sagittarius: { points: [[14,43],[30,30],[45,37],[41,16],[58,27],[70,12],[85,24]], edges: [[0,1],[1,2],[1,3],[3,4],[4,5],[5,6],[2,4]] },
  Capricorn: { points: [[10,25],[25,15],[42,29],[56,18],[70,36],[88,23],[73,47]], edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[4,6]] },
  Aquarius: { points: [[10,18],[24,32],[38,19],[53,38],[67,22],[84,34],[72,48]], edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]] },
  Pisces: { points: [[12,17],[27,29],[42,20],[55,34],[70,22],[86,12],[78,44]], edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[4,6]] },
};

// ─── Scripted session content ─────────────────────────────────────────────────

const SESSION_SCRIPTS = {
  'caregiver-fatigue': [
    { key: 'cf1',  text: "Thanks for joining me for this short meditation." },
    { key: 'cf2',  text: "In this brief practice, we'll explore some simple steps to recharge when we're feeling burnt out or overwhelmed by our efforts to help others." },
    { key: 'cf3',  text: "Go ahead and get comfortable. You can close your eyes if you like, or keep them gently open with a soft, relaxed gaze." },
    { key: 'cf4',  text: "As you settle in, take a few slow, calming breaths. And notice how it feels to breathe." },
    { key: 'cf5',  text: "Now let your breath return to its normal pace. Give yourself a few moments to rest and recharge as you bring yourself fully into the here and now." },
    { key: 'cf6',  text: "Great. Now we'll shift gears and tap into our ability to hold the suffering of others in a healthy way." },
    { key: 'cf7',  text: "Empathy can be a bridge to care and compassion, but it can also lead us into a state of overwhelm — what scientists call empathic distress." },
    { key: 'cf8',  text: "One simple way to avoid this overwhelm is to ground yourself in a caring motivation. Let's give this a try." },
    { key: 'cf9',  text: "Start by bringing to mind someone you care about. It could be your care recipient or anyone you care about." },
    { key: 'cf10', text: "Take a moment to imagine that they're actually here with you, and see if you can sense the deep connection you share with them." },
    { key: 'cf11', text: "As you tap into this sense of connection, see if you could notice your impulse to care for this individual, or perhaps your natural wish for them to be happy and free from suffering." },
    { key: 'cf12', text: "If it helps, you can give voice to this in your mind. You may think to yourself: May you be free from suffering and hardship. May you have all the happiness in the world." },
    { key: 'cf13', text: "Feel free to make up your own compassionate phrases and imagine sharing them with this person that you care about." },
    { key: 'cf14', text: "Now bring others to mind — or perhaps groups of people, or even the Earth itself." },
    { key: 'cf15', text: "Acknowledge their pain and suffering, and also the tremendous resilience that we all have." },
    { key: 'cf16', text: "Imagine a world where they are free from suffering and free from adversity. See if you can picture them happy, at ease, healthy, and balanced." },
    { key: 'cf17', text: "Let your mind roam here and continue to send kind, caring thoughts and phrases out into the world." },
    { key: 'cf18', text: "Next, include yourself in this circle of compassion." },
    { key: 'cf19', text: "Imagine the people in your life who care for you, or even strangers who are sending love and compassion out into the world, just like you are." },
    { key: 'cf20', text: "Imagine that all this caring energy is flowing into you, and see if you can be open to receiving it." },
    { key: 'cf21', text: "For these last few moments, notice how you feel right now without any judgment." },
    { key: 'cf22', text: "Bring a sense of openness, curiosity, and care to your own thoughts and feelings, whatever they may be." },
    { key: 'cf23', text: "When we feel the suffering of others and the suffering of the world in a very direct way, our own feelings and reactions can easily overwhelm us." },
    { key: 'cf24', text: "Here we practice the skill of grounding ourselves in a caring motivation. With this motivation, we get a little more space to be with our feelings and reactions without getting swept away by them." },
    { key: 'cf25', text: "Hopefully you found this helpful. If you did, see if you can keep practicing for short moments over the next day or two. Take care and good luck with your practice." },
  ],
  'mindful-breathing': [
    { key: 'mb1',  text: "Hello and welcome back. Today we are going to focus on a fundamental practice: mindful breathing." },
    { key: 'mb2',  text: "This is a tool you can use anywhere, at any time, to ground yourself and find a moment of calm." },
    { key: 'mb3',  text: "Start by finding a comfortable seat. Allow your back to be straight but not stiff." },
    { key: 'mb4',  text: "Let your hands rest gently in your lap or on your knees. If it feels okay, go ahead and close your eyes, or simply lower your gaze and let it soften." },
    { key: 'mb5',  text: "Now, take a deep breath in through your nose, feeling your lungs expand. And exhale slowly through your mouth." },
    { key: 'mb6',  text: "Do that one more time — deep breath in... and a long breath out." },
    { key: 'mb7',  text: "Now, let your breath settle into its natural rhythm. You don't need to change it or control it. Just observe it." },
    { key: 'mb8',  text: "Notice where you feel the breath most clearly. It might be the cool air at the tip of your nose, the rise and fall of your chest, or the expansion and contraction of your belly." },
    { key: 'mb9',  text: "As you sit here, you may notice your mind starting to wander. This is perfectly normal. That's just what minds do." },
    { key: 'mb10', text: "When you realize your thoughts have drifted to the past, the future, or a to-do list, simply acknowledge the thought without judgment." },
    { key: 'mb11', text: "Think of it like a cloud passing through the sky. Then, gently and kindly, escort your attention back to the physical sensation of your breath." },
    { key: 'mb12', text: "Back to the inhale... and the exhale." },
    { key: 'mb13', text: "Let's stay with this for a few moments in silence. Following each breath from the beginning of the inhalation, through the brief pause, to the end of the exhalation." },
    { key: 'mb14', text: "If you get distracted ten times, just bring yourself back ten times. Every time you return to the breath, you are strengthening your mindfulness muscle." },
    { key: 'mb15', text: "As we bring this practice to a close, take a moment to notice how you feel. Is there a sense of stillness? A bit more space in your mind?" },
    { key: 'mb16', text: "Know that this breath is always available to you as an anchor." },
    { key: 'mb17', text: "When you're ready, gently wiggle your fingers and toes, and slowly open your eyes." },
    { key: 'mb18', text: "Thank you for practicing with me today. Take this sense of presence with you as you move into the rest of your day." },
  ],
};

const ACTIVITY_SCRIPTS = Object.fromEntries(
  mindfulnessActivities.map((activity) => [
    activity.id,
    activity.steps.map((text, index) => ({
      key: `${activity.id}-${index + 1}`,
      text,
    })),
  ]),
);

Object.assign(SESSION_SCRIPTS, ACTIVITY_SCRIPTS);

function buildScriptPlaybackCommand(sessionId, segments, index) {
  const segment = segments[index];
  if (!segment) return null;
  const nextSegment = segments[index + 1] || null;
  return {
    type: 'host-speak-script',
    text: segment.text,
    sessionId,
    segmentKey: segment.key,
    nextSegmentKey: nextSegment?.key || '',
    nextSegmentText: nextSegment?.text || '',
  };
}

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
  if(vm)vm.setAttribute('content','width=device-width,initial-scale=1');
  var sr=document.querySelector('.sr');
  if(sr)sr.style.cssText='display:none!important';
  var mic=document.getElementById('bmic');
  if(window.ReactNativeWebView&&mic&&!mic.dataset.nativeVoiceBound){
    mic.dataset.nativeVoiceBound='1';
    mic.title='Tap to talk';
    mic.setAttribute('aria-label','Start voice input');
    mic.addEventListener('click',function(event){
      event.preventDefault();
      event.stopImmediatePropagation();
      var recording=mic.dataset.nativeRecording==='1';
      if(!recording){
        mic.dataset.nativeRecording='1';
        mic.classList.add('recording');
        mic.setAttribute('aria-label','Stop voice input');
      }
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type:'native-voice-input',
        action:recording?'stop':'start',
        host:new URLSearchParams(window.location.search).get('host')||'home-dock'
      }));
    },true);
  }
  /* Warm up the Render server so TTS isn't slow on first use */
  setTimeout(function(){try{fetch('${API_BASE_URL}/health',{method:'GET'}).catch(function(){});}catch(e){}},1000);
}catch(e){}})();true;`;

// Keep the old name as an alias so existing injectJavaScript() call-sites still compile
const HIDE_CONTROLS_JS = WEBVIEW_STATIC_JS;

const INITIAL_CHAT_MESSAGE = {
  id: 'assistant-welcome',
  role: 'assistant',
  content: 'Hi, I can answer general mindfulness questions and explain any session tile in the app. Open a session first if you want details about that specific practice.',
};

const PROD_MIXED_CONTENT_MODE = 'never';
const DEV_MIXED_CONTENT_MODE = 'always';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createSessionId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  const randomPart = Math.random().toString(16).slice(2);
  return `session-${Date.now()}-${randomPart}`;
}

function formatDuration(totalSeconds) {
  const hours   = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts   = hours > 0 ? [hours, minutes, seconds] : [minutes, seconds];
  return parts.map((v) => String(v).padStart(2, '0')).join(':');
}

// Build the session avatar start prompt — used on fresh start and on resume
function getLocalizedSessionScripts(locale, sessionId) {
  return LOCALIZED_CONTENT[locale]?.sessions?.[sessionId]
    || LOCALIZED_CONTENT.en.sessions[sessionId]
    || SESSION_SCRIPTS[sessionId]
    || [];
}

function buildSessionStartPrompt(session, scriptSlideIndex = 0, locale = 'en') {
  if (session.kind === 'scripted') {
    const segments = getLocalizedSessionScripts(locale, session.id);
    const segment  = segments[scriptSlideIndex] || segments[0];
    if (!segment) return `Welcome to the ${session.title} session.`;
    return segment.text;
  }

  return [
    `You are opening the ${session.title} mindfulness session.`,
    'Reply with a short, warm welcome only.',
    'Say you are the user\'s mindfulness assistant and you are here to help.',
    'Ask how they are doing today.',
  ].join(' ');
}

function buildChatPrompt(message, sessionContext) {
  const conversationStyle = [
    'Response style: Sound like a warm, natural conversation, not a lesson or a prepared script.',
    'Use 1 to 3 short sentences and stay under 70 words unless the user explicitly asks for more detail or a guided exercise.',
    'Answer directly and ask no more than one brief follow-up question.',
  ];
  if (!sessionContext?.selectedSession) {
    return [
      ...conversationStyle,
      'App context: The mobile mindfulness app has 12 selectable mindfulness sessions.',
      'Each of the 12 sessions has its own prepared guided steps from the mindfulness activity catalog.',
      `User message: ${message}`,
    ].join('\n');
  }
  const lines = [
    ...conversationStyle,
    'App context: The mobile mindfulness app has 12 selectable mindfulness sessions.',
    `Current session title: ${sessionContext.selectedSession.title}`,
    `Session status: ${sessionContext.sessionActive ? 'active' : 'not started'}`,
  ];
  if (sessionContext.selectedSession.kind === 'scripted') {
    const segments = getLocalizedSessionScripts(sessionContext.locale || 'en', sessionContext.selectedSession.id);
    lines.push(`This is a scripted session with ${segments.length} passages. Current passage: ${(sessionContext.scriptSlideIndex || 0) + 1}.`);
  }
  lines.push(`User message: ${message}`);
  return lines.join('\n');
}

function buildLocalChatFallback(_message, sessionContext) {
  if (sessionContext?.selectedSession?.kind === 'scripted') {
    const segments = getLocalizedSessionScripts(sessionContext.locale || 'en', sessionContext.selectedSession.id);
    return `${sessionContext.selectedSession.title} is a guided mindfulness session with ${segments.length} passages.`;
  }
  if (sessionContext?.selectedSession) {
    return `${sessionContext.selectedSession.title} is an available mindfulness session led by your assistant.`;
  }
  return 'This app has 12 selectable mindfulness sessions. Choose any session to begin.';
}

// ─── Avatar URI builder ───────────────────────────────────────────────────────

function buildAvatarUri(baseUri, params) {
  if (!baseUri) return null;
  const qs = Object.entries(params)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  if (!qs) return baseUri;
  return `${baseUri}${baseUri.includes('?') ? '&' : '?'}${qs}`;
}

function firstWhitespaceToken(text) {
  const s = typeof text === 'string' ? text.trim() : '';
  if (!s) return '';
  return s.split(/\s+/)[0] || '';
}

/** Prefer `users/{uid}.firstName`, else first word of `fullName` (sign-up stores both). */
function greetingFirstNameFromUserDoc(data) {
  if (!data || typeof data !== 'object') return '';
  const fn = typeof data.firstName === 'string' ? data.firstName.trim() : '';
  if (fn) return fn;
  return firstWhitespaceToken(
    typeof data.fullName === 'string' ? data.fullName : '',
  );
}

function firstNameFromAuthDisplayName(displayName) {
  return firstWhitespaceToken(
    typeof displayName === 'string' ? displayName : '',
  );
}

function Constellation({ sign, light = false, compact = false }) {
  const data = ZODIAC_CONSTELLATIONS[sign] || ZODIAC_CONSTELLATIONS.Aries;
  const width = compact ? 112 : 150;
  const height = compact ? 68 : 88;
  const sx = width / 100;
  const sy = height / 60;
  return (
    <View style={[styles.constellation, { width, height }]} accessibilityLabel={`${sign} constellation`}>
      {data.edges.map(([from, to], index) => {
        const [x1, y1] = data.points[from];
        const [x2, y2] = data.points[to];
        const dx = (x2 - x1) * sx;
        const dy = (y2 - y1) * sy;
        const length = Math.sqrt((dx * dx) + (dy * dy));
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        return (
          <View
            key={`edge-${index}`}
            style={[
              styles.constellationLine,
              light && styles.constellationLineLight,
              { left: x1 * sx, top: y1 * sy, width: length, transform: [{ rotate: `${angle}deg` }] },
            ]}
          />
        );
      })}
      {data.points.map(([x, y], index) => (
        <View
          key={`star-${index}`}
          style={[
            styles.constellationStar,
            light && styles.constellationStarLight,
            { left: (x * sx) - (index % 3 === 0 ? 3 : 2), top: (y * sy) - (index % 3 === 0 ? 3 : 2), width: index % 3 === 0 ? 6 : 4, height: index % 3 === 0 ? 6 : 4 },
          ]}
        />
      ))}
      <Text style={[styles.constellationLabel, light && styles.constellationLabelLight]}>{sign}</Text>
    </View>
  );
}

function dispatchAvatarCommand(ref, command) {
  if (!ref?.current) return;
  const payload = { source: 'mindfulness-host', ...command };
  if (Platform.OS === 'web') {
    const avatarOrigin = new URL(ref.current.src, window.location.href).origin;
    ref.current.contentWindow?.postMessage(payload, avatarOrigin);
    return;
  }
  const serialized = JSON.stringify(payload);
  ref.current.injectJavaScript(
    `(function(){try{window._nativeHostCommand(${serialized});}catch(e){}})();true;`,
  );
}

function runAvatarJavaScript(ref, script) {
  if (Platform.OS !== 'web') ref?.current?.injectJavaScript(script);
}

function AvatarSurface({ avatarUri, webViewRef, style, onLoad, onError, onMessage }) {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;
    const avatarOrigin = new URL(avatarUri, window.location.href).origin;
    const listener = (event) => {
      if (event.origin !== avatarOrigin) return;
      onMessage?.({ nativeEvent: { data: typeof event.data === 'string' ? event.data : JSON.stringify(event.data) } });
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [avatarUri, onMessage]);

  if (Platform.OS === 'web') {
    return createElement('iframe', {
      ref: webViewRef,
      src: avatarUri,
      title: 'Mindfulness guide',
      allow: 'microphone; autoplay',
      onLoad,
      onError,
      style: { width: '100%', height: '100%', border: 0, display: 'block', backgroundColor: '#292541' },
    });
  }

  return (
    <WebView
      ref={webViewRef}
      source={{ uri: avatarUri }}
      style={style}
      originWhitelist={WEBVIEW_ORIGIN_WHITELIST}
      onShouldStartLoadWithRequest={(request) => isAllowedWebViewNavigation(request.url)}
      allowFileAccess={false}
      allowUniversalAccessFromFileURLs={false}
      allowFileAccessFromFileURLs={false}
      mixedContentMode={__DEV__ ? DEV_MIXED_CONTENT_MODE : PROD_MIXED_CONTENT_MODE}
      javaScriptEnabled
      domStorageEnabled
      scrollEnabled={false}
      bounces={false}
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      injectedJavaScript={WEBVIEW_STATIC_JS}
      onLoad={onLoad}
      onError={onError}
      onHttpError={onError}
      onMessage={onMessage}
    />
  );
}

function InfoAccordion({ icon, title, body, expanded, onToggle }) {
  return (
    <View style={styles.infoAccordion}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        style={({ pressed }) => [styles.infoAccordionHeader, pressed && styles.btnPressed]}
      >
        <View style={styles.infoAccordionIcon}>
          <Ionicons name={icon} size={18} color={ThemeColor.BRAND} />
        </View>
        <Text style={styles.infoAccordionTitle}>{title}</Text>
        <Ionicons
          name={expanded ? 'remove-outline' : 'add-outline'}
          size={22}
          color={ThemeColor.BRAND}
          accessibilityLabel={expanded ? 'Collapse' : 'Expand'}
        />
      </Pressable>
      {expanded ? <Text style={styles.infoAccordionBody}>{body}</Text> : null}
    </View>
  );
}

// ─── Floating Avatar Dock ─────────────────────────────────────────────────────
// Only one avatar renderer is mounted at a time to avoid decoding the 3D model twice.

function FloatingAvatarDock({ avatarUri, avatarError, expanded, visible, interactionEnabled, onToggle, webViewRef, onLoad, onMessage, onError, dockStyle }) {
  const { t } = useLanguage();
  if (!visible) return null;
  const buttonHidden = expanded || !interactionEnabled;
  const dockHidden = !expanded || !interactionEnabled;
  return (
    <>
      <View
        pointerEvents={buttonHidden ? 'none' : 'auto'}
        accessibilityElementsHidden={buttonHidden}
        importantForAccessibility={buttonHidden ? 'no-hide-descendants' : 'auto'}
        style={[styles.floatingBtnWrap, buttonHidden && styles.floatingCollapsed]}
      >
        <Pressable style={styles.floatingBtn} onPress={onToggle} accessibilityRole="button" accessibilityLabel={t('openMindfulnessChat')}>
          <View style={styles.floatingBtnOrb} />
          <Text style={styles.floatingBtnLabel}>{t('guideButton')}</Text>
        </Pressable>
      </View>

      <View
        pointerEvents={dockHidden ? 'none' : 'auto'}
        accessibilityElementsHidden={dockHidden}
        importantForAccessibility={dockHidden ? 'no-hide-descendants' : 'auto'}
        style={[styles.floatingDock, dockStyle, dockHidden && styles.floatingCollapsed]}
      >
        <View style={styles.floatingDockHeader}>
          <Text style={styles.floatingDockTitle}>{t('mindfulnessAssistant')}</Text>
          <Pressable onPress={onToggle} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('hideGuide')}>
            <Text style={styles.floatingDockHideText}>{t('hideGuide')}</Text>
          </Pressable>
        </View>
        {avatarUri ? (
          <AvatarSurface avatarUri={avatarUri} webViewRef={webViewRef} style={styles.dockWebView} onLoad={onLoad} onError={onError} onMessage={onMessage} />
        ) : (
          <View style={styles.avatarLoading}>
            <View style={styles.loadingOrb} />
            <Text style={styles.loadingText}>{avatarError || t('loadingAvatar')}</Text>
            {!!avatarError && !!avatarUri && (
              <Text style={styles.loadingDetailText} numberOfLines={3}>
                uri: {String(avatarUri).slice(0, 200)}
              </Text>
            )}
          </View>
        )}
      </View>
    </>
  );
}

// ─── Session Avatar Panel ─────────────────────────────────────────────────────

function SessionAvatarPanel({ avatarUri, avatarError, webViewRef, onLoad, onMessage, onError, panelStyle }) {
  const { t } = useLanguage();
  return (
    <View style={[styles.sessionAvatarPanel, panelStyle]}>
      {avatarUri ? (
        <AvatarSurface avatarUri={avatarUri} webViewRef={webViewRef} style={styles.sessionWebView} onLoad={onLoad} onError={onError} onMessage={onMessage} />
      ) : (
        <View style={styles.avatarLoading}>
          <View style={styles.loadingOrb} />
          <Text style={styles.loadingText}>{avatarError || t('loadingAvatar')}</Text>
          {!!avatarError && !!avatarUri && (
            <Text style={styles.loadingDetailText} numberOfLines={3}>
              uri: {String(avatarUri).slice(0, 200)}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Summary Modal ────────────────────────────────────────────────────────────

function SummaryModal({ visible, duration, summary, onClose }) {
  const { t } = useLanguage();
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.summaryCard} onPress={() => {}}>
          <Text style={styles.summaryTitle}>{t('sessionCompleteTitle')}</Text>
          <Text style={styles.summaryDuration}>{t('sessionLength', { duration })}</Text>
          <Text style={styles.summaryBody}>{summary}</Text>
          <Text style={styles.summaryReflection}>{t('sessionReflection')}</Text>
          <Pressable
            style={({ pressed }) => [styles.summaryCloseBtn, pressed && styles.btnPressed]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('returnHome')}
          >
            <Text style={styles.summaryCloseBtnText}>{t('returnHome')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Chat Modal ───────────────────────────────────────────────────────────────

function ChatModal({ visible, onClose, sessionContext, buildApiHeaders }) {
  const { t } = useLanguage();
  const { height: windowHeight } = useWindowDimensions();
  const [messages, setMessages] = useState([INITIAL_CHAT_MESSAGE]);
  const [draft, setDraft]       = useState('');
  const [busy, setBusy]         = useState(false);
  const [status, setStatus]     = useState('ready');
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
    setStatus('thinking');
    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: await buildApiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          message: buildChatPrompt(trimmed, sessionContext),
          session_id: chatSessionId,
        }),
      });
      if (!res.ok) throw new Error(await res.text() || 'Request failed');
      const data = await res.json();
      setMessages((prev) => [...prev, { id: `assistant-${Date.now()}`, role: 'assistant', content: data.reply || '(No response.)' }]);
      setStatus('ready');
    } catch {
      setMessages((prev) => [...prev, { id: `fallback-${Date.now()}`, role: 'assistant', content: buildLocalChatFallback(trimmed, sessionContext) }]);
      setStatus('offlineFallback');
    } finally {
      setBusy(false);
    }
  }, [draft, busy, chatSessionId, sessionContext, buildApiHeaders]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView style={styles.overlay} behavior="padding">
        <Pressable style={styles.overlayDismiss} onPress={onClose}>
          <Pressable style={[styles.chatSheet, { height: Math.round(windowHeight * 0.82) }]} onPress={() => {}}>
            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>{t('mindfulnessChat')}</Text>
                <Text style={styles.sheetSubtitle}>
                  {sessionContext?.selectedSession
                    ? t('contextSession', { title: sessionContext.selectedSession.title })
                    : t('contextGeneral')}
                </Text>
              </View>
              <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            {/* Status */}
            <Text style={styles.chatStatus}>{t('assistantStatus', { status: t(status) })}</Text>

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
                maxLength={4000}
                placeholder={t('typeMessage')}
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
                accessibilityRole="button"
                accessibilityLabel={t('supportSend')}
                accessibilityState={{ disabled: !draft.trim() || busy, busy }}
              >
                <Text style={styles.sendBtnText}>{t('send')}</Text>
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
  const isFocused = useIsFocused();
  const { locale, setLocale, t } = useLanguage();
  const sessionCatalog = useMemo(() => BASE_SESSION_CATALOG.map((session) => ({
    ...session,
    ...(LOCALIZED_CONTENT[locale]?.catalog?.[session.id] || LOCALIZED_CONTENT.en.catalog[session.id] || {}),
  })), [locale]);
  const sessionOfTheDay = sessionCatalog[0];
  const dailyFortunes = LOCALIZED_CONTENT[locale]?.fortunes || LOCALIZED_CONTENT.en.fortunes || DAILY_FORTUNES;
  const moodOptions = useMemo(() => MOOD_OPTIONS.map((mood) => ({
    ...mood,
    label: t(`mood${mood.key[0].toUpperCase()}${mood.key.slice(1)}`),
    prompt: t(`moodPrompt${mood.key[0].toUpperCase()}${mood.key.slice(1)}`),
  })), [locale, t]);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const contentWidth = Math.max(280, Math.min(windowWidth, 760) - 32);
  const dockStyle = {
    width: Math.min(Math.max(280, windowWidth - 32), 420),
    height: Math.min(520, Math.max(320, windowHeight - 72)),
  };
  const sessionPanelStyle = {
    height: Math.min(620, Math.max(300, Math.round(windowHeight * 0.58))),
  };
  const homeContentStyle = Platform.OS === 'web' && windowWidth >= 1100
    ? { alignSelf: 'flex-start', marginLeft: Math.max(24, (windowWidth - 1200) / 2) }
    : null;
  const compactWellbeing = windowWidth < 620;

  // ── Screen ──
  const [screen, setScreen]                       = useState('home');
  const [selectedSessionId, setSelectedSessionId] = useState(BASE_SESSION_CATALOG[0].id);
  const [expandedPracticeId, setExpandedPracticeId] = useState(null);

  // ── Avatar ──
  const avatarConversationId                      = useRef(createSessionId()).current;
  const avatarHtmlBase                            = Platform.OS === 'web' && typeof window !== 'undefined'
    ? `${window.location.origin}/mobile-avatar.html`
    : `${API_BASE_URL}/avatar.html`;
  const [avatarLoadError, setAvatarLoadError]     = useState('');
  const [dockExpanded, setDockExpanded]           = useState(true);
  const sessionWebViewRef                         = useRef(null);
  const homeDockWebViewRef                        = useRef(null);
  const homeAvatarReadyRef                        = useRef(false);
  const pendingHomeGuideCommandRef                = useRef(null);
  const avatarVoiceId                             = useRef(null);
  const authTokenRef                              = useRef('');
  const nativeVoiceTargetRef                      = useRef(null);
  const nativeVoiceTranscriptRef                  = useRef('');
  const nativeVoiceSentRef                        = useRef(false);

  // ── Session state ──
  const [sessionActive, setSessionActive]         = useState(false);
  const [sessionStatus, setSessionStatus]         = useState('statusNotStarted');
  const [sessionStartTime, setSessionStartTime]   = useState(null);
  const [placeholderMessage, setPlaceholderMessage] = useState('');

  // ── Script state (scripted sessions) ──
  const [scriptSlideIndex, setScriptSlideIndex] = useState(0);

  // ── Modals ──
  const [summaryVisible, setSummaryVisible]   = useState(false);
  const [sessionSummary, setSessionSummary]   = useState('');
  const [sessionDuration, setSessionDuration] = useState('');

  // ── Completed-session tracking (Firestore) ──
  const [completedSessionIds, setCompletedSessionIds] = useState(() => new Set());
  const [homeGreetingName, setHomeGreetingName] = useState('');
  const [homeStats, setHomeStats] = useState({ currentStreak: 0, activeDays: 0 });
  const [moodTodayKey, setMoodTodayKey] = useState('');
  const [moodPrompt, setMoodPrompt] = useState('');
  const [dailyFortuneIndex, setDailyFortuneIndex] = useState(null);
  const [fortuneSpinning, setFortuneSpinning] = useState(false);
  const [fortuneReelIndex, setFortuneReelIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const fortuneMotion = useRef(new Animated.Value(0)).current;
  const fortuneTickerRef = useRef(null);
  const fortuneStopRef = useRef(null);
  const fortuneAnimationRef = useRef(null);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduceMotion);
    return () => subscription?.remove?.();
  }, []);

  useEffect(() => () => {
    if (fortuneTickerRef.current) clearInterval(fortuneTickerRef.current);
    if (fortuneStopRef.current) clearTimeout(fortuneStopRef.current);
    fortuneAnimationRef.current?.stop?.();
  }, []);

  useEffect(() => {
    let unsubUser = null;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubUser) {
        unsubUser();
        unsubUser = null;
      }
      if (!user) {
        setCompletedSessionIds(new Set());
        setHomeGreetingName('');
        setHomeStats({ currentStreak: 0, activeDays: 0 });
        return;
      }
      setHomeGreetingName(firstNameFromAuthDisplayName(user.displayName));
      const userRef = doc(db, 'users', user.uid);
      void (async () => {
        try {
          const snap = await getDoc(userRef);
          const data = snap.exists() ? snap.data() : null;
          if (data && typeof data.guideProfile === 'string' && data.guideProfile) {
            guideProfileRef.current = data.guideProfile;
            const carry = { type: 'host-guide-profile', profile: data.guideProfile };
            dispatchAvatarCommand(homeDockWebViewRef, carry);
            dispatchAvatarCommand(sessionWebViewRef, carry);
          }
          const fromDoc = greetingFirstNameFromUserDoc(data);
          if (fromDoc) {
            setHomeGreetingName(fromDoc);
          }
          const full =
            data &&
            typeof data.fullName === 'string' &&
            data.fullName.trim();
          const built =
            full ||
            [data?.firstName, data?.lastName]
              .filter((v) => typeof v === 'string' && v.trim())
              .join(' ')
              .trim();
          if (built && !user.displayName?.trim()) {
            void updateProfile(user, { displayName: built }).catch(() => {});
          }
        } catch {
          // Firestore rules or network — keep displayName-based greeting
        }
      })();
      unsubUser = onSnapshot(
        userRef,
        (snap) => {
          const data = snap.exists() ? snap.data() : null;
          const ids = data?.completedSessionIds;
          setCompletedSessionIds(new Set(Array.isArray(ids) ? ids : []));
          setHomeStats({
            currentStreak: Number(data?.currentStreak) || 0,
            activeDays: Number(data?.totalActiveDays ?? data?.totalDays) || 0,
          });
          const fromDoc = greetingFirstNameFromUserDoc(data);
          setHomeGreetingName(
            fromDoc || firstNameFromAuthDisplayName(user.displayName) || '',
          );
        },
        () => {
          setCompletedSessionIds(new Set());
          setHomeStats({ currentStreak: 0, activeDays: 0 });
          setHomeGreetingName(
            firstNameFromAuthDisplayName(user.displayName) || '',
          );
        },
      );
    });
    return () => {
      if (unsubUser) unsubUser();
      unsubAuth();
    };
  }, []);

  useEffect(() => {
    const userKey = auth.currentUser?.uid || auth.currentUser?.email || 'guest';
    const storageKey = `mindfulness-moods-${userKey}`;
    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        const saved = raw ? JSON.parse(raw) : null;
        const today = new Date().toISOString().slice(0, 10);
        const entry = Array.isArray(saved?.entries) ? saved.entries.find((item) => item.dateKey === today) : null;
        if (entry?.mood) setMoodTodayKey(entry.mood);
      })
      .catch(() => {});
  }, [auth.currentUser?.uid]);

  const selectedSession = sessionCatalog.find((s) => s.id === selectedSessionId) || sessionCatalog[0];
  const sessionContext  = screen === 'session' || sessionActive
    ? { selectedSession, sessionActive, scriptSlideIndex, locale }
    : null;
  const avatarBackendUri = Platform.OS === 'web' && typeof window !== 'undefined'
    ? `${window.location.origin}/avatar-api`
    : API_BASE_URL;
  const homeWelcomeText = homeGreetingName
    ? t('welcomeGuideNamed', { name: homeGreetingName })
    : t('welcomeGuide');
  const avatarUi = useMemo(() => {
    const ui = LOCALIZED_CONTENT[locale]?.ui || LOCALIZED_CONTENT.en.ui;
    const keys = ['mindfulnessAssistant', 'loadingAvatar', 'start', 'endSession', 'statusNotStarted', 'voicePlayback', 'enterSendHint', 'startVoiceInput', 'stopRecording', 'supportSend', 'typeMessage', 'listening', 'generatingVoice', 'speaking', 'thinking', 'voiceUnavailable', 'preparingVoice', 'typing', 'preparingWelcome', 'tapToTalk', 'loadingTexture', 'cachingGeometry', 'loadError', 'compactGuideSubtitle'];
    return JSON.stringify(Object.fromEntries(keys.map((key) => [key, ui[key]])));
  }, [locale]);

  // ── Avatar URIs — same chat_id for shared server-side conversation thread ──
  const homeDockUri = useMemo(() => buildAvatarUri(avatarHtmlBase, {
    compact: '1', controlled: '1', autostart: '1', host: 'home-dock', chat_id: avatarConversationId, tts_base: avatarBackendUri, welcome: homeWelcomeText, locale, ui: avatarUi,
  }), [avatarHtmlBase, avatarConversationId, avatarBackendUri, homeWelcomeText, locale, avatarUi]);

  const sessionAvatarUri = useMemo(() => buildAvatarUri(avatarHtmlBase, {
    compact: '1', controlled: '1', host: 'session-panel', session: selectedSessionId, chat_id: avatarConversationId, tts_base: avatarBackendUri, locale, ui: avatarUi,
  }), [avatarHtmlBase, selectedSessionId, avatarConversationId, avatarBackendUri, locale, avatarUi]);

  const handleAvatarWebViewError = useCallback((event) => {
    const native = event?.nativeEvent;
    const detail =
      (native && (native.description || native.statusCode || native.url)) ||
      'unknown WebView error';
    setAvatarLoadError(`Avatar failed to load: ${detail}`);
  }, []);

  // What the guide remembers about this person, carried between sessions.
  // Mirrors the web host so both clients behave the same on one account.
  const guideProfileRef = useRef('');

  const injectAuthIntoWebView = useCallback((ref, token, uid) => {
    if (!ref?.current) return;
    dispatchAvatarCommand(ref, {
      type: 'host-auth-token',
      token: token || '',
      uid: uid || '',
      profile: guideProfileRef.current || '',
    });
  }, []);

  const persistGuideProfile = useCallback(async (profile) => {
    const next = String(profile || '').trim();
    if (!next || next === guideProfileRef.current) return;
    guideProfileRef.current = next;
    const user = auth.currentUser;
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), { guideProfile: next }, { merge: true });
    } catch (error) {
      console.warn('Could not save the guide profile', error);
    }
  }, []);

  const buildApiHeaders = useCallback(async (headers = {}) => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Not authenticated');
    }
    const token = await user.getIdToken();
    authTokenRef.current = token;
    injectAuthIntoWebView(sessionWebViewRef, token, user.uid);
    injectAuthIntoWebView(homeDockWebViewRef, token, user.uid);
    return {
      ...headers,
      Authorization: `Bearer ${token}`,
    };
  }, [injectAuthIntoWebView]);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      if (!user) {
        authTokenRef.current = '';
        injectAuthIntoWebView(sessionWebViewRef, '', '');
        injectAuthIntoWebView(homeDockWebViewRef, '', '');
        return;
      }
      try {
        const token = await user.getIdToken();
        if (!active) return;
        authTokenRef.current = token;
        injectAuthIntoWebView(sessionWebViewRef, token, user.uid);
        injectAuthIntoWebView(homeDockWebViewRef, token, user.uid);
      } catch {
        if (active) authTokenRef.current = '';
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [injectAuthIntoWebView]);

  // ── Pick a male English voice for native TTS ──
  useEffect(() => {
    const MALE_NAMES = ['alex', 'daniel', 'tom', 'evan', 'gordon', 'fred', 'rishi', 'aaron', 'lee', 'arthur'];
    Speech.getAvailableVoicesAsync()
      .then((voices) => {
        const en = voices.filter((v) => v.language?.startsWith('en'));
        const male = en.find((v) =>
          MALE_NAMES.some((n) => v.identifier?.toLowerCase().includes(n) || v.name?.toLowerCase().includes(n))
        );
        if (male) avatarVoiceId.current = male.identifier;
      })
      .catch(() => {});
  }, []);

  const sendNativeVoiceState = useCallback((command) => {
    const target = nativeVoiceTargetRef.current;
    if (!target) return;
    if (Platform.OS === 'web') {
      dispatchAvatarCommand(target, command);
      return;
    }
    const payload = JSON.stringify(command);
    runAvatarJavaScript(target, `(function(){try{
      var command=${payload};
      var mic=document.getElementById('bmic');
      var input=document.getElementById('inp');
      var send=document.getElementById('bsend');
      if(mic){
        var recording=command.state==='recording';
        mic.dataset.nativeRecording=recording?'1':'0';
        mic.classList.toggle('recording',recording);
        mic.setAttribute('aria-label',recording?'Stop voice input':'Start voice input');
        mic.title=recording?'Tap to stop':'Tap to talk';
      }
      if(command.type==='host-voice-result'&&command.text&&input&&send){
        input.value=command.text;
        input.disabled=false;
        send.disabled=false;
        send.click();
      }else if(command.state==='error'&&command.message){
        var messages=document.getElementById('msgs');
        if(messages){
          var note=document.createElement('div');
          note.className='msg system';
          note.textContent=command.message;
          messages.appendChild(note);
          messages.scrollTop=messages.scrollHeight;
        }
      }
    }catch(e){}})();true;`);
  }, []);

  const deliverNativeVoiceTranscript = useCallback(() => {
    if (nativeVoiceSentRef.current) return;
    const transcript = nativeVoiceTranscriptRef.current.trim();
    nativeVoiceSentRef.current = true;
    sendNativeVoiceState(transcript
      ? { type: 'host-voice-result', text: transcript }
      : { type: 'host-voice-state', state: 'idle' });
  }, [sendNativeVoiceState]);

  /* ---- hands-free, native side -------------------------------------
     WKWebView has no Web Speech API, so the same turn-taking rules the web
     build uses are implemented here against expo-speech-recognition:
     an adaptive end-of-turn pause, and a loudness gate so a conversation
     across the room is not mistaken for the user.
     Volume from the native module runs roughly -2 (silence) to 10 (loud);
     the module's own guidance is that below 0 is inaudible.
  ------------------------------------------------------------------- */
  const handsFreeRef = useRef(false);
  const handsFreeHostRef = useRef('home-dock');
  const hfFinalRef = useRef('');
  const hfSilenceTimer = useRef(null);
  const hfPeakRef = useRef(-2);
  const hfGuideSpeakingRef = useRef(false);
  const HF_SILENCE_MS = 1200;
  const HF_AUDIBLE_MIN = 1.2;

  const hfTargetRef = useCallback(
    () => (handsFreeHostRef.current === 'session-panel' ? sessionWebViewRef : homeDockWebViewRef),
    [],
  );

  const hfSetTurn = useCallback((state, label) => {
    runAvatarJavaScript(
      hfTargetRef(),
      `(function(){try{window.__hostTurn&&window.__hostTurn(${JSON.stringify(state)},${JSON.stringify(label)});}catch(e){}})();true;`,
    );
  }, [hfTargetRef]);

  const hfClearSilence = useCallback(() => {
    if (hfSilenceTimer.current) {
      clearTimeout(hfSilenceTimer.current);
      hfSilenceTimer.current = null;
    }
  }, []);

  // Same heuristics as the web build: an unfinished-sounding turn waits longer.
  const hfSilenceFor = useCallback((text) => {
    const t = String(text || '').trim();
    if (!t) return HF_SILENCE_MS;
    if (/(^|\s)(um+|uh+|er+|hmm+|and|but|so|because|like|maybe|well|or|then|that|i|to|the|a|of|for|with|think|feel|guess|wonder|mean|know|kinda|sort)\s*$/i.test(t)) {
      return HF_SILENCE_MS + 1300;
    }
    if (/\?$/.test(t)) return 750;
    if (t.split(/\s+/).length <= 2) return HF_SILENCE_MS + 600;
    return HF_SILENCE_MS;
  }, []);

  const hfFinalise = useCallback(() => {
    hfClearSilence();
    const text = hfFinalRef.current.trim();
    hfFinalRef.current = '';
    if (!text) {
      hfSetTurn('you', 'Your turn');
      return;
    }
    if (hfPeakRef.current < HF_AUDIBLE_MIN) {
      // Heard something, but the room never got loud enough for it to be you.
      hfPeakRef.current = -2;
      hfSetTurn('you', 'Your turn');
      return;
    }
    hfPeakRef.current = -2;
    hfSetTurn('guide', 'Guide is replying');
    runAvatarJavaScript(
      hfTargetRef(),
      `(function(){try{window.__hostVoiceText&&window.__hostVoiceText(${JSON.stringify(text)});}catch(e){}})();true;`,
    );
  }, [hfClearSilence, hfSetTurn, hfTargetRef]);

  const startHandsFreeListening = useCallback(() => {
    if (Platform.OS === 'web' || !handsFreeRef.current || hfGuideSpeakingRef.current) return;
    try {
      ExpoSpeechRecognitionModule.start({
        lang: SPEECH_RECOGNITION_LOCALES[locale] || 'en-US',
        interimResults: true,
        continuous: true,
        maxAlternatives: 1,
        addsPunctuation: true,
        iosVoiceProcessingEnabled: true,
        volumeChangeEventOptions: { enabled: true, intervalMillis: 100 },
      });
      hfSetTurn('you', 'Your turn');
    } catch {
      /* the recogniser refused; the end listener will retry */
    }
  }, [locale, hfSetTurn]);

  const stopHandsFree = useCallback((silent = false) => {
    handsFreeRef.current = false;
    hfClearSilence();
    hfFinalRef.current = '';
    hfPeakRef.current = -2;
    try { ExpoSpeechRecognitionModule.abort(); } catch {}
    if (!silent) {
      runAvatarJavaScript(
        hfTargetRef(),
        '(function(){try{window.__hostHandsFree&&window.__hostHandsFree(false);}catch(e){}})();true;',
      );
    }
  }, [hfClearSilence, hfTargetRef]);

  const startHandsFree = useCallback(async (host) => {
    if (Platform.OS === 'web') return;
    handsFreeHostRef.current = host === 'session-panel' ? 'session-panel' : 'home-dock';
    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        sendNativeVoiceState({
          type: 'host-voice-state',
          state: 'error',
          message: 'Microphone and speech recognition access are needed for hands-free. Enable them in Settings and try again.',
        });
        return;
      }
    } catch {
      return;
    }
    handsFreeRef.current = true;
    runAvatarJavaScript(
      hfTargetRef(),
      '(function(){try{window.__hostHandsFree&&window.__hostHandsFree(true);}catch(e){}})();true;',
    );
    startHandsFreeListening();
  }, [hfTargetRef, sendNativeVoiceState, startHandsFreeListening]);

  const beginNativeVoiceInput = useCallback(async (host) => {
    if (Platform.OS === 'web') return;
    nativeVoiceTargetRef.current = host === 'session-panel' ? sessionWebViewRef : homeDockWebViewRef;
    nativeVoiceTranscriptRef.current = '';
    nativeVoiceSentRef.current = false;
    Speech.stop();
    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        sendNativeVoiceState({
          type: 'host-voice-state',
          state: 'error',
          message: 'Microphone and speech recognition access are needed for voice input. Enable them in Settings and try again.',
        });
        return;
      }
      ExpoSpeechRecognitionModule.start({
        lang: SPEECH_RECOGNITION_LOCALES[locale] || 'en-US',
        interimResults: true,
        continuous: false,
        maxAlternatives: 1,
        addsPunctuation: true,
        iosVoiceProcessingEnabled: true,
      });
      sendNativeVoiceState({ type: 'host-voice-state', state: 'recording' });
    } catch {
      sendNativeVoiceState({
        type: 'host-voice-state',
        state: 'error',
        message: 'Voice input is unavailable on this build. Install a development or store build and try again.',
      });
    }
  }, [locale, sendNativeVoiceState]);

  useEffect(() => {
    if (Platform.OS === 'web') return undefined;
    const resultSubscription = ExpoSpeechRecognitionModule.addListener('result', (event) => {
      const transcript = (event.results || [])
        .map((result) => result?.transcript || '')
        .join(' ')
        .trim();
      if (handsFreeRef.current) {
        if (!transcript) return;
        if (event.isFinal) {
          hfFinalRef.current = `${hfFinalRef.current} ${transcript}`.trim();
        }
        const shown = event.isFinal ? hfFinalRef.current : `${hfFinalRef.current} ${transcript}`.trim();
        hfSetTurn('speaking', 'Listening…');
        hfClearSilence();
        hfSilenceTimer.current = setTimeout(hfFinalise, hfSilenceFor(shown));
        return;
      }
      if (transcript) nativeVoiceTranscriptRef.current = transcript;
      if (event.isFinal) deliverNativeVoiceTranscript();
    });
    const volumeSubscription = ExpoSpeechRecognitionModule.addListener('volumechange', (event) => {
      if (!handsFreeRef.current) return;
      const value = typeof event?.value === 'number' ? event.value : -2;
      if (value > hfPeakRef.current) hfPeakRef.current = value;
    });
    const endSubscription = ExpoSpeechRecognitionModule.addListener('end', () => {
      if (handsFreeRef.current) {
        // iOS ends the session periodically; keep the ear open.
        if (!hfGuideSpeakingRef.current) setTimeout(startHandsFreeListening, 350);
        return;
      }
      deliverNativeVoiceTranscript();
    });
    const errorSubscription = ExpoSpeechRecognitionModule.addListener('error', (event) => {
      if (handsFreeRef.current) {
        if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
          stopHandsFree();
        }
        return;
      }
      if (event?.error === 'aborted') {
        sendNativeVoiceState({ type: 'host-voice-state', state: 'idle' });
        return;
      }
      nativeVoiceSentRef.current = true;
      sendNativeVoiceState({
        type: 'host-voice-state',
        state: 'error',
        message: event?.error === 'no-speech'
          ? 'I did not hear anything. Tap the microphone and try again.'
          : 'Voice input stopped. Check microphone access and try again.',
      });
    });
    return () => {
      resultSubscription.remove();
      volumeSubscription.remove();
      endSubscription.remove();
      errorSubscription.remove();
      ExpoSpeechRecognitionModule.abort();
    };
  }, [deliverNativeVoiceTranscript, sendNativeVoiceState]);

  // ── Handle messages sent from avatar.html via ReactNativeWebView.postMessage ──
  const handleWebViewMessage = useCallback((event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'native-handsfree') {
        if (msg.action === 'start') void startHandsFree(msg.host);
        else stopHandsFree();
        return;
      }
      if (msg.type === 'profile-updated') {
        void persistGuideProfile(msg.profile);
        return;
      }
      if (msg.type === 'native-speak') {
        const speechText = typeof msg.text === 'string' ? msg.text.trim().slice(0, 1200) : '';
        if (!speechText) return;
        // Suspend the WebView AudioContext so iOS doesn't block AVSpeechSynthesizer
        const suspendJs = `(function(){try{if(typeof audioState!=='undefined'&&audioState.ctx&&audioState.ctx.state==='running')audioState.ctx.suspend();}catch(e){}})();true;`;
        runAvatarJavaScript(sessionWebViewRef, suspendJs);
        runAvatarJavaScript(homeDockWebViewRef, suspendJs);
        const resumeJs = `(function(){try{if(typeof audioState!=='undefined'&&audioState.ctx&&audioState.ctx.state==='suspended')audioState.ctx.resume();}catch(e){}})();true;`;
        const resumeCtx = () => {
          runAvatarJavaScript(sessionWebViewRef, resumeJs);
          runAvatarJavaScript(homeDockWebViewRef, resumeJs);
        };
        // Small delay so AudioContext fully releases the audio session before TTS starts
        // Hands-free must stand down while the guide talks, or the phone
        // speaker feeds straight back into the recogniser.
        if (handsFreeRef.current) {
          hfGuideSpeakingRef.current = true;
          hfClearSilence();
          hfFinalRef.current = '';
          try { ExpoSpeechRecognitionModule.abort(); } catch {}
          hfSetTurn('guide', 'Guide is speaking');
        }
        const resumeListening = () => {
          resumeCtx();
          if (!handsFreeRef.current) return;
          hfGuideSpeakingRef.current = false;
          hfPeakRef.current = -2;
          setTimeout(startHandsFreeListening, 500);
        };
        setTimeout(() => {
          Speech.stop();
          Speech.speak(speechText, {
            rate: 0.9,
            voice: avatarVoiceId.current ?? undefined,
            onDone: resumeListening,
            onStopped: resumeListening,
            onError: resumeListening,
          });
        }, 120);
      } else if (msg.type === 'native-stop-speech') {
        Speech.stop();
        const resumeJs = `(function(){try{if(typeof audioState!=='undefined'&&audioState.ctx&&audioState.ctx.state==='suspended')audioState.ctx.resume();}catch(e){}})();true;`;
        runAvatarJavaScript(sessionWebViewRef, resumeJs);
        runAvatarJavaScript(homeDockWebViewRef, resumeJs);
      } else if (msg.type === 'native-voice-input' && Platform.OS !== 'web') {
        if (msg.action === 'stop') ExpoSpeechRecognitionModule.stop();
        else beginNativeVoiceInput(msg.host);
      }
    } catch {}
  }, [beginNativeVoiceInput]);

  const flushHomeGuideCommand = useCallback(() => {
    if (!homeAvatarReadyRef.current) return;
    const pendingCommand = pendingHomeGuideCommandRef.current;
    if (!pendingCommand || !homeDockWebViewRef.current) return;
    pendingHomeGuideCommandRef.current = null;
    if (Platform.OS === 'web') {
      dispatchAvatarCommand(homeDockWebViewRef, pendingCommand);
      return;
    }
    dispatchAvatarCommand(homeDockWebViewRef, { type: 'host-pause-session' });
    setTimeout(() => dispatchAvatarCommand(homeDockWebViewRef, pendingCommand), 120);
  }, []);

  const scheduleHomeGuideReady = useCallback(() => {
    homeAvatarReadyRef.current = true;
    setTimeout(flushHomeGuideCommand, 200);
  }, [flushHomeGuideCommand]);

  const handleHomeDockMessage = useCallback((event) => {
    try {
      const message = JSON.parse(event?.nativeEvent?.data || '{}');
      if (message.type === 'avatar-ready' && (!message.host || message.host === 'home-dock')) {
        scheduleHomeGuideReady();
      }
    } catch {}
    handleWebViewMessage(event);
  }, [scheduleHomeGuideReady, handleWebViewMessage]);

  // ── Inject a postMessage event into the session avatar WebView ──
  // avatar.html listens for { source: 'mindfulness-host', type, ... } on window.
  const injectAvatarCommand = useCallback((command) => {
    dispatchAvatarCommand(sessionWebViewRef, command);
  }, []);

  // ── Called after the session WebView finishes loading ──
  // Always hides the avatar's built-in Start/End buttons.
  // Only re-injects context when returning to an already-active session (resume).
  const handleSessionAvatarLoad = useCallback(() => {
    setTimeout(() => {
      runAvatarJavaScript(sessionWebViewRef, HIDE_CONTROLS_JS);
      if (authTokenRef.current) {
        injectAuthIntoWebView(sessionWebViewRef, authTokenRef.current);
      }
    }, 300);
    if (sessionActive) {
      setTimeout(() => {
        const session  = sessionCatalog.find((s) => s.id === selectedSessionId) || sessionCatalog[0];
        if (session.kind === 'scripted') {
          const segments = getLocalizedSessionScripts(locale, session.id);
          const command = buildScriptPlaybackCommand(session.id, segments, scriptSlideIndex);
          if (command) {
            injectAvatarCommand(command);
            return;
          }
        }
        const prompt = buildSessionStartPrompt(session, scriptSlideIndex, locale);
        injectAvatarCommand({ type: 'host-start-session', prompt, announce: false });
      }, 700);
    }
  }, [selectedSessionId, sessionActive, scriptSlideIndex, injectAvatarCommand, injectAuthIntoWebView, locale, sessionCatalog]);

  const handleHomeDockLoad = useCallback(() => {
    setTimeout(() => {
      runAvatarJavaScript(homeDockWebViewRef, HIDE_CONTROLS_JS);
      if (authTokenRef.current) {
        injectAuthIntoWebView(homeDockWebViewRef, authTokenRef.current);
      }
    }, 300);
    // The hosted avatar currently targets its own origin when posting
    // `avatar-ready`, so cross-origin web previews cannot receive that event.
    // Treat the iframe/WebView load as the universal readiness fallback.
    setTimeout(scheduleHomeGuideReady, 650);
  }, [scheduleHomeGuideReady, injectAuthIntoWebView]);

  // ── Navigation guards ──
  useLayoutEffect(() => {
    navigation.setOptions({ gestureEnabled: true });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      if (!BackHandler?.addEventListener) return undefined;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (screen === 'session') { setScreen('home'); return true; }
        return false;
      });
      return () => sub.remove();
    }, [screen]),
  );

  // ── Session logic ──
  const openSession = useCallback((id) => {
    setSelectedSessionId(id);
    setScreen('session');
    // If switching to a different session while one is active, clear it silently
    if (sessionActive && selectedSessionId !== id) {
      setSessionActive(false);
      setSessionStatus('statusNotStarted');
      setSessionStartTime(null);
      setPlaceholderMessage('');
      setScriptSlideIndex(0);
      injectAvatarCommand({ type: 'host-end-session' });
    }
  }, [sessionActive, selectedSessionId, injectAvatarCommand]);

  // Called when the user explicitly presses Start Session
  const startSession = useCallback(() => {
    const session = sessionCatalog.find((s) => s.id === selectedSessionId) || sessionCatalog[0];
    setSummaryVisible(false);
    setSessionStartTime(Date.now());
    setSessionActive(true);
    setSessionStatus('sessionActive');
    if (session.kind === 'scripted') {
      setScriptSlideIndex(0);
    } else {
      setPlaceholderMessage(`${session.title} is intentionally empty right now.`);
    }
    setTimeout(() => {
      if (session.kind === 'scripted') {
        const segments = getLocalizedSessionScripts(locale, session.id);
        const command = buildScriptPlaybackCommand(session.id, segments, 0);
        if (command) {
          injectAvatarCommand(command);
          return;
        }
      }
      const prompt = buildSessionStartPrompt(session, 0, locale);
      injectAvatarCommand({ type: 'host-start-session', prompt, announce: false });
    }, 200);
  }, [selectedSessionId, injectAvatarCommand, locale, sessionCatalog]);

  const endSession = useCallback(() => {
    if (!sessionActive) return;
    const elapsed = Math.max(0, Math.floor((Date.now() - (sessionStartTime || Date.now())) / 1000));
    setSessionDuration(formatDuration(elapsed));
    const session = sessionCatalog.find((s) => s.id === selectedSessionId) || sessionCatalog[0];
    const segments = getLocalizedSessionScripts(locale, session.id);
    const completed =
      session.kind !== 'scripted' ||
      (segments.length > 0 && scriptSlideIndex >= segments.length - 1);
    setSessionSummary(
      session.kind === 'scripted'
        ? completed
          ? `You completed the full ${session.title} session.`
          : `You ended ${session.title} after passage ${scriptSlideIndex + 1} of ${segments.length}.`
        : `${session.title} ended.`
    );
    void recordCompletedSession({
      sessionId: session.id,
      sessionTitle: session.title,
      durationSeconds: elapsed,
      completed,
      metadata: {
        kind: session.kind,
        scriptSlideIndex,
        scriptSegments: segments.length,
      },
    }).catch((error) => {
      console.warn('Failed to record session tracking data', error);
    });
    setSummaryVisible(true);
    setSessionActive(false);
    setSessionStatus('statusNotStarted');
    setSessionStartTime(null);
    setPlaceholderMessage('');
    setScriptSlideIndex(0);
    // Tell avatar the session ended — it posts a closing message in chat
    injectAvatarCommand({ type: 'host-end-session' });
  }, [sessionActive, sessionStartTime, selectedSessionId, scriptSlideIndex, injectAvatarCommand, locale, sessionCatalog]);

  const goToNextScriptSegment = useCallback(() => {
    const segments = getLocalizedSessionScripts(locale, selectedSessionId);
    if (scriptSlideIndex >= segments.length - 1) {
      endSession();
      return;
    }
    const nextIndex = scriptSlideIndex + 1;
    setScriptSlideIndex(nextIndex);
    const command = buildScriptPlaybackCommand(selectedSessionId, segments, nextIndex);
    if (command) injectAvatarCommand(command);
  }, [scriptSlideIndex, selectedSessionId, endSession, injectAvatarCommand]);

  const selectMood = useCallback(async (mood) => {
    setMoodTodayKey(mood.key);
    setMoodPrompt(mood.prompt);
    const guideCommand = {
      type: 'host-send-text',
      text: `I’m feeling ${mood.label.toLowerCase()} today. Acknowledge that warmly, then ask exactly one short follow-up about why I feel this way today, such as “What’s making you feel ${mood.label.toLowerCase()} today?” Do not answer the question for me and do not give advice unless I ask.`,
    };
    pendingHomeGuideCommandRef.current = guideCommand;
    setDockExpanded(true);
    if (homeDockWebViewRef.current) {
      pendingHomeGuideCommandRef.current = null;
      if (Platform.OS === 'web') {
        dispatchAvatarCommand(homeDockWebViewRef, guideCommand);
      } else {
        dispatchAvatarCommand(homeDockWebViewRef, { type: 'host-pause-session' });
        setTimeout(() => dispatchAvatarCommand(homeDockWebViewRef, guideCommand), 120);
      }
    }
    const userKey = auth.currentUser?.uid || auth.currentUser?.email || 'guest';
    const storageKey = `mindfulness-moods-${userKey}`;
    const dateKey = new Date().toISOString().slice(0, 10);
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      const saved = raw ? JSON.parse(raw) : {};
      const entries = Array.isArray(saved.entries) ? saved.entries.filter((entry) => entry.dateKey !== dateKey) : [];
      entries.push({ dateKey, mood: mood.key });
      await AsyncStorage.setItem(storageKey, JSON.stringify({ entries: entries.slice(-365) }));
    } catch {}
  }, []);

  const spinFortune = useCallback(() => {
    if (fortuneSpinning) return;
    let winnerIndex = Math.floor(Math.random() * dailyFortunes.length);
    if (winnerIndex === dailyFortuneIndex) {
      winnerIndex = (winnerIndex + 1) % dailyFortunes.length;
    }
    if (reduceMotion) {
      setFortuneReelIndex(winnerIndex);
      setDailyFortuneIndex(winnerIndex);
      return;
    }
    setFortuneSpinning(true);
    fortuneMotion.setValue(0);
    const reelAnimation = Animated.loop(Animated.timing(fortuneMotion, {
      toValue: 1,
      duration: 150,
      easing: Easing.linear,
      useNativeDriver: Platform.OS !== 'web',
    }));
    fortuneAnimationRef.current = reelAnimation;
    reelAnimation.start();
    fortuneTickerRef.current = setInterval(() => {
      setFortuneReelIndex((current) => (current + 1) % dailyFortunes.length);
    }, 150);
    fortuneStopRef.current = setTimeout(() => {
      clearInterval(fortuneTickerRef.current);
      fortuneTickerRef.current = null;
      reelAnimation.stop();
      setFortuneReelIndex(winnerIndex);
      setDailyFortuneIndex(winnerIndex);
      fortuneMotion.setValue(0);
      Animated.sequence([
        Animated.timing(fortuneMotion, { toValue: 0.16, duration: 90, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(fortuneMotion, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }),
      ]).start(() => setFortuneSpinning(false));
    }, 1350);
  }, [dailyFortuneIndex, dailyFortunes, fortuneMotion, fortuneSpinning, reduceMotion]);

  const renderPracticeRow = useCallback((practice) => {
    const expanded = expandedPracticeId === practice.id;
    const completed = completedSessionIds.has(practice.id);
    const disabled = sessionActive && selectedSessionId !== practice.id;
    return (
      <View key={practice.id} style={[styles.practiceRow, expanded && styles.practiceRowExpanded, disabled && styles.btnDisabled]}>
        <Pressable
          onPress={() => setExpandedPracticeId((current) => current === practice.id ? null : practice.id)}
          style={({ pressed }) => [styles.practiceRowButton, pressed && styles.btnPressed]}
          accessibilityRole="button"
          accessibilityState={{ expanded, disabled }}
          disabled={disabled}
        >
          <Text style={styles.practiceNumber}>{practice.number}</Text>
          <View style={styles.practiceRowTitleWrap}>
            <Text style={styles.practiceRowTitle}>{practice.title}</Text>
            {completed ? <Text style={styles.practiceComplete}>{t('completed')}</Text> : null}
          </View>
          <Text style={styles.practiceZodiac}>{practice.zodiac}</Text>
          <Ionicons name={expanded ? 'remove' : 'add'} size={22} color={ThemeColor.BRAND} />
        </Pressable>
        {expanded ? (
          <View style={styles.practiceExpansion}>
            <Constellation sign={practice.zodiac} compact />
            <View style={styles.practiceExpansionCopy}>
              <Text style={styles.practiceDescription}>{practice.previewDescription}</Text>
              <Text style={styles.practiceDuration}>{practice.duration}</Text>
              <Pressable onPress={() => openSession(practice.id)} style={({ pressed }) => [styles.openPracticeButton, pressed && styles.btnPressed]}>
                <Text style={styles.openPracticeButtonText}>{t('homeOpenPractice')}</Text>
                <Ionicons name="arrow-forward" size={16} color={ThemeColor.WHITE} />
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    );
  }, [completedSessionIds, expandedPracticeId, openSession, selectedSessionId, sessionActive, t]);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/multi-lang-wellness.png')}
          style={styles.headerLogo}
          resizeMode="contain"
          accessibilityLabel={t('brandLogo')}
        />
        <View style={styles.headerLangAnchor} pointerEvents="box-none">
          <LanguageMenuButton value={locale} onChange={(code) => void setLocale(code)} light />
        </View>
      </View>

      {/* ══ HOME SCREEN — full scrollable ══ */}
      {screen === 'home' && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.container, homeContentStyle]}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient colors={['#e8e5ff', '#d9d4fb']} style={styles.commandPanel}>
            <View style={styles.commandCopy}>
              <Text style={styles.commandTitle}>
                {homeGreetingName ? t('welcomeBackNamed', { name: homeGreetingName }) : t('welcomeBack')}
              </Text>
              <Text style={styles.commandBody}>{t('homeWelcomeBody')}</Text>
              <View style={styles.commandActions}>
              <Pressable accessibilityRole="button" accessibilityLabel={t('beginPractice', { title: selectedSession.title })} onPress={() => openSession(selectedSessionId)} style={({ pressed }) => [styles.commandPrimary, pressed && styles.btnPressed]}>
                  <Text style={styles.commandPrimaryText}>{t('beginPractice', { title: selectedSession.title })}</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel={t('askGuide')} onPress={() => setDockExpanded(true)} style={({ pressed }) => [styles.commandSecondary, pressed && styles.btnPressed]}>
                  <Text style={styles.commandSecondaryText}>{t('askGuide')}</Text>
                  <Ionicons name="arrow-up-outline" size={16} color={ThemeColor.TEXT_PRIMARY} style={{ transform: [{ rotate: '45deg' }] }} />
                </Pressable>
              </View>
              <View style={styles.commandStats}>
                <View><Text style={styles.commandStatLabel}>{t('dayStreakValue', { count: homeStats.currentStreak })}</Text></View>
                <View style={styles.commandStatDivider} />
                <View><Text style={styles.commandStatLabel}>{t('activeDaysValue', { count: homeStats.activeDays })}</Text></View>
              </View>
            </View>
            <Image source={require('../../assets/meditating-person.png')} style={styles.meditatingImage} resizeMode="contain" accessibilityLabel={t('personMeditating')} />
          </LinearGradient>

          {sessionActive ? (
            <Pressable style={({ pressed }) => [styles.resumeStrip, pressed && styles.btnPressed]} onPress={() => setScreen('session')}>
              <View style={styles.resumeIcon}><Ionicons name="play" size={16} color={ThemeColor.WHITE} /></View>
              <View style={{ flex: 1 }}><Text style={styles.resumeTitle}>{t('continuePractice')}</Text><Text style={styles.resumeBody}>{t('practiceStillActive', { title: selectedSession.title })}</Text></View>
              <Ionicons name="arrow-forward" size={19} color={ThemeColor.BRAND} />
            </Pressable>
          ) : null}

          <View style={[styles.wellbeingGrid, compactWellbeing && styles.wellbeingGridCompact]}>
            <View style={[styles.checkInCard, compactWellbeing && styles.wellbeingCardCompact]}>
              <View style={styles.cardTitleRow}>
                <Text style={[styles.wellbeingTitle, compactWellbeing && styles.wellbeingTitleCompact]}>{t('quickCheckIn')}</Text>
                <Ionicons name="pulse-outline" size={compactWellbeing ? 17 : 20} color={ThemeColor.BRAND} />
              </View>
              <Text style={[styles.wellbeingBody, compactWellbeing && styles.wellbeingBodyCompact]}>{t('homeWelcomeQuestion')}</Text>
              <View style={styles.moodRow}>
                {moodOptions.map((mood) => (
                  <Pressable
                    key={mood.key}
                    onPress={() => selectMood(mood)}
                    accessibilityRole="button"
                    accessibilityLabel={t(`mood${mood.key[0].toUpperCase()}${mood.key.slice(1)}`)}
                    accessibilityState={{ selected: moodTodayKey === mood.key }}
                    style={({ pressed }) => [styles.moodButton, compactWellbeing && styles.moodButtonCompact, moodTodayKey === mood.key && styles.moodButtonSelected, pressed && styles.btnPressed]}
                  >
                    <Text style={[styles.moodEmoji, compactWellbeing && styles.moodEmojiCompact]}>{mood.emoji}</Text>
                    <Text style={[styles.moodLabel, compactWellbeing && styles.moodLabelCompact]}>{t(`mood${mood.key[0].toUpperCase()}${mood.key.slice(1)}`)}</Text>
                  </Pressable>
                ))}
              </View>
              {moodPrompt ? <Text style={[styles.moodPrompt, compactWellbeing && styles.moodPromptCompact]}>{t('guideFollowUpReady')}</Text> : <Text style={[styles.moodPrompt, compactWellbeing && styles.moodPromptCompact]}>{t('tapFeeling')}</Text>}
            </View>

            <View style={[styles.fortuneCard, compactWellbeing && styles.wellbeingCardCompact]}>
              <View style={styles.cardTitleRow}>
                <Text style={[styles.fortuneTitle, compactWellbeing && styles.wellbeingTitleCompact]}>{t('fortuneMachine')}</Text>
                <Ionicons name="sparkles-outline" size={compactWellbeing ? 17 : 20} color="#f2b8c2" />
              </View>
              <View style={[styles.fortuneWindow, compactWellbeing && styles.fortuneWindowCompact]}>
                <View style={styles.fortuneRivetLeft} />
                <View style={styles.fortuneRivetRight} />
                <View style={styles.fortunePayline} pointerEvents="none" />
                <View style={styles.fortuneReelViewport}>
                  <Animated.View style={[styles.fortuneReelTrack, {
                    transform: [{
                      translateY: fortuneMotion.interpolate({ inputRange: [0, 1], outputRange: [-27, -81] }),
                    }],
                  }]}
                  >
                    <View style={styles.fortuneReelRow}>
                      <Text numberOfLines={2} style={[styles.fortuneText, styles.fortuneTextGhost, compactWellbeing && styles.fortuneTextCompact]}>
                        {dailyFortunes[(fortuneReelIndex + dailyFortunes.length - 1) % dailyFortunes.length]}
                      </Text>
                    </View>
                    <View style={styles.fortuneReelRow}>
                      <Text numberOfLines={3} style={[styles.fortuneText, compactWellbeing && styles.fortuneTextCompact]}>
                        {fortuneSpinning ? dailyFortunes[fortuneReelIndex] : (dailyFortuneIndex === null ? t('fortuneDescription') : dailyFortunes[dailyFortuneIndex])}
                      </Text>
                    </View>
                    <View style={styles.fortuneReelRow}>
                      <Text numberOfLines={2} style={[styles.fortuneText, styles.fortuneTextGhost, compactWellbeing && styles.fortuneTextCompact]}>
                        {dailyFortunes[(fortuneReelIndex + 1) % dailyFortunes.length]}
                      </Text>
                    </View>
                  </Animated.View>
                </View>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={t('spinFortune')} accessibilityState={{ disabled: fortuneSpinning, busy: fortuneSpinning }} onPress={spinFortune} disabled={fortuneSpinning} style={({ pressed }) => [styles.fortuneButton, compactWellbeing && styles.fortuneButtonCompact, fortuneSpinning && styles.btnDisabled, pressed && styles.btnPressed]}>
                <Ionicons name="refresh" size={compactWellbeing ? 14 : 17} color={ThemeColor.TEXT_PRIMARY} />
                <Text style={[styles.fortuneButtonText, compactWellbeing && styles.fortuneButtonTextCompact]}>{fortuneSpinning ? '…' : t('spinFortune')}</Text>
              </Pressable>
            </View>
          </View>

          <Pressable accessibilityRole="button" accessibilityLabel={t('viewActivity')} onPress={() => navigation.navigate('My Stats')} style={({ pressed }) => [styles.activityLink, pressed && styles.btnPressed]}>
            <View><Text style={styles.activityLinkTitle}>{t('yourActivity')}</Text><Text style={styles.activityLinkBody}>{t('statsSubtitle')}</Text></View>
            <Ionicons name="arrow-forward" size={19} color={ThemeColor.BRAND} />
          </Pressable>

          <Pressable accessibilityRole="button" accessibilityLabel={`Open ${sessionOfTheDay.title}`} onPress={() => openSession(sessionOfTheDay.id)} style={({ pressed }) => [styles.featuredPractice, pressed && styles.btnPressed]}>
            <View style={styles.featuredCopy}>
              <Text style={styles.featuredTitle}>{sessionOfTheDay.title}</Text>
              <Text style={styles.featuredDescription}>{sessionOfTheDay.previewDescription}</Text>
              <Text style={styles.featuredDuration}>{sessionOfTheDay.duration}</Text>
              <View style={styles.featuredAction}><Text style={styles.featuredActionText}>{t('homeOpenPractice')}</Text><Ionicons name="arrow-forward" size={16} color="#292541" /></View>
            </View>
            <Constellation sign={sessionOfTheDay.zodiac} light />
          </Pressable>

          <View style={styles.practiceHeader}>
            <Text style={styles.practiceHeaderTitle}>{t('exploreAllPractices')}</Text>
            <Text style={styles.practiceHeaderHint}>{t('homeTapToChoose')}</Text>
          </View>
          <View style={styles.practiceList}>
            {sessionCatalog.filter((practice) => practice.id !== sessionOfTheDay.id).map(renderPracticeRow)}
          </View>
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
            <Pressable accessibilityRole="button" accessibilityLabel={t('backToSessions')} style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]} onPress={() => setScreen('home')}>
              <Text style={styles.backBtnText}>← {t('sessions')}</Text>
            </Pressable>
            {sessionActive && (
            <Pressable accessibilityRole="button" accessibilityLabel={t('endSession')} style={({ pressed }) => [styles.endBtn, pressed && styles.btnPressed]} onPress={endSession}>
                <Text style={styles.endBtnText}>{t('endSession')}</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.detailHero}>
            <View style={styles.detailTopRow}>
              <Text style={styles.detailNumber}>{selectedSession.number}</Text>
              <View style={[styles.pill, selectedSession.kind !== 'placeholder' ? styles.pillGuided : styles.pillEmpty]}>
                <Text style={[styles.pillText, selectedSession.kind !== 'placeholder' ? styles.pillTextGuided : styles.pillTextEmpty]}>
                  {selectedSession.kind === 'scripted' ? t('guidedSession') : t('assistantLedSession')}
                </Text>
              </View>
              <Text style={styles.detailTitle}>{selectedSession.title}</Text>
              {!sessionActive ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('startNamed', { title: selectedSession.title })}
                  style={({ pressed }) => [styles.startBtn, pressed && styles.btnPressed]}
                  onPress={startSession}
                >
                  <Text style={styles.startBtnText}>{t('start')}</Text>
                </Pressable>
              ) : (
                <Text style={styles.detailStatus}>{t(sessionStatus)}</Text>
              )}
            </View>
          </View>

          {selectedSession.kind === 'scripted' && sessionActive && (() => {
            const segments = getLocalizedSessionScripts(locale, selectedSession.id);
            const total    = segments.length;
            const current  = Math.min(scriptSlideIndex + 1, total);
            const pct      = total > 0 ? (current / total) * 100 : 0;
            const isLast   = scriptSlideIndex >= total - 1;
            return (
              <View style={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressCount}>{current} / {total}</Text>
                </View>
                <View style={styles.progressRow}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${pct}%` }]} />
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={isLast ? t('finishSession') : t('nextPassage')}
                    style={({ pressed }) => [styles.progressNextBtn, pressed && styles.btnPressed]}
                    onPress={goToNextScriptSegment}
                  >
                    <Text style={styles.startBtnText}>{isLast ? t('finish') : `${t('next')} →`}</Text>
                  </Pressable>
                </View>
              </View>
            );
          })()}

          <SessionAvatarPanel
            avatarUri={sessionAvatarUri}
            avatarError={avatarLoadError}
            webViewRef={sessionWebViewRef}
            onLoad={handleSessionAvatarLoad}
            onError={handleAvatarWebViewError}
            onMessage={handleWebViewMessage}
            panelStyle={sessionPanelStyle}
          />

          {selectedSession.kind !== 'scripted' && !!placeholderMessage && (
            <View style={styles.placeholderCard}>
              <Text style={styles.placeholderTitle}>{t('templateReserved')}</Text>
              <Text style={styles.placeholderBody}>{placeholderMessage}</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* ── Floating avatar dock — mounted only on the home screen ── */}
      <FloatingAvatarDock
        avatarUri={homeDockUri}
        avatarError={avatarLoadError}
        expanded={dockExpanded}
        visible={screen === 'home'}
        interactionEnabled={isFocused}
        onToggle={() => setDockExpanded((v) => !v)}
        webViewRef={homeDockWebViewRef}
        onLoad={handleHomeDockLoad}
        onError={handleAvatarWebViewError}
        onMessage={handleHomeDockMessage}
        dockStyle={dockStyle}
      />

      <SummaryModal
        visible={summaryVisible}
        duration={sessionDuration}
        summary={sessionSummary}
        onClose={() => { setSummaryVisible(false); setScreen('home'); }}
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
  container: { padding: 16, paddingBottom: 120, maxWidth: 760, width: '100%', alignSelf: 'center' },

  // Header
  header:              { backgroundColor: ThemeColor.WHITE, alignItems: 'center', justifyContent: 'center', minHeight: 52, paddingVertical: 6, paddingHorizontal: 88, borderBottomWidth: 2, borderBottomColor: ThemeColor.BRAND, overflow: 'visible' },
  headerLogo:          { height: 40, width: 180, maxWidth: '100%', transform: [{ scale: 1.45 }] },
  headerLangAnchor:    { position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center', zIndex: 2 },
  headerLangBtn:       { paddingVertical: 8, paddingHorizontal: 12, borderRadius: ThemeRadius.SM, backgroundColor: 'rgba(255,255,255,0.55)', borderWidth: 1, borderColor: 'rgba(37, 99, 235, 0.25)' },
  headerLangBtnPressed:{ opacity: 0.82 },
  headerLangBtnText:   { fontSize: 15, fontWeight: '700', color: ThemeColor.BRAND },
  homeGreeting:        { fontSize: 22, fontWeight: '700', color: ThemeColor.BRAND, marginBottom: 4, marginTop: 4 },
  homeSelectionIntro:  { fontSize: 14, lineHeight: 20, color: ThemeColor.HOME_CARD_TEXT, marginBottom: 8 },
  homeSelectionMeta:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18 },
  homeSelectionMetaText:{ fontSize: 12, color: ThemeColor.HOME_SUBTITLE, fontWeight: '700' },

  heroBtnPrimary:      { backgroundColor: ThemeColor.WHITE, borderRadius: 10, paddingVertical: 11, paddingHorizontal: 16 },
  heroBtnPrimaryText:  { color: ThemeColor.BRAND, fontWeight: '800', fontSize: 14 },

  // Home command panel and web-matched modules
  commandPanel:       { minHeight: 330, borderRadius: 28, padding: 24, marginBottom: 16, overflow: 'hidden', flexDirection: 'row', alignItems: 'stretch' },
  commandCopy:        { flex: 1, zIndex: 2, justifyContent: 'center', paddingRight: 4 },
  commandTitle:       { fontSize: 32, lineHeight: 36, letterSpacing: -0.8, fontWeight: '800', color: '#292541', marginBottom: 10, maxWidth: 420 },
  commandBody:        { fontSize: 16, lineHeight: 23, color: '#514c68', maxWidth: 410, marginBottom: 20 },
  commandActions:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 22 },
  commandPrimary:     { minHeight: 46, borderRadius: 23, backgroundColor: '#292541', paddingHorizontal: 18, justifyContent: 'center' },
  commandPrimaryText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  commandSecondary:   { minHeight: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.72)', paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', gap: 6 },
  commandSecondaryText:{ color: '#292541', fontSize: 14, fontWeight: '800' },
  commandStats:       { flexDirection: 'row', alignItems: 'center', gap: 18 },
  commandStatValue:   { fontSize: 22, lineHeight: 24, fontWeight: '850', color: '#292541', fontVariant: ['tabular-nums'] },
  commandStatLabel:   { fontSize: 12, color: '#625d79', marginTop: 2 },
  commandStatDivider: { width: 1, height: 34, backgroundColor: 'rgba(41,37,65,0.18)' },
  meditatingImage:    { width: '39%', height: '100%', minWidth: 120, alignSelf: 'flex-end', marginRight: -22, marginBottom: -26 },

  resumeStrip:        { minHeight: 72, backgroundColor: '#ffffff', borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, ...cardShadow },
  resumeIcon:         { width: 36, height: 36, borderRadius: 18, backgroundColor: ThemeColor.BRAND, alignItems: 'center', justifyContent: 'center' },

  wellbeingGrid:      { flexDirection: 'row', gap: 12, marginBottom: 16 },
  wellbeingGridCompact:{ gap: 8, alignItems: 'stretch' },
  checkInCard:        { flex: 1, minHeight: 236, borderRadius: 22, padding: 18, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e3dff1' },
  fortuneCard:        { flex: 1, minHeight: 236, borderRadius: 22, padding: 18, backgroundColor: '#292541' },
  wellbeingCardCompact:{ minWidth: 0, minHeight: 248, borderRadius: 18, padding: 12 },
  cardTitleRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  wellbeingTitle:     { fontSize: 20, fontWeight: '800', color: '#292541' },
  wellbeingTitleCompact:{ fontSize: 16, lineHeight: 19, letterSpacing: -0.2 },
  wellbeingBody:      { color: '#625d79', fontSize: 14, lineHeight: 20, marginBottom: 16 },
  wellbeingBodyCompact:{ fontSize: 11, lineHeight: 15, marginBottom: 12 },
  moodRow:            { flexDirection: 'row', justifyContent: 'space-between', gap: 2 },
  moodButton:         { flex: 1, minWidth: 48, minHeight: 60, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
  moodButtonCompact:  { minWidth: 0, minHeight: 52, borderRadius: 11, paddingHorizontal: 0 },
  moodButtonSelected: { backgroundColor: '#ece9ff', borderColor: '#6760d4' },
  moodEmoji:          { fontSize: 23, marginBottom: 3 },
  moodEmojiCompact:   { fontSize: 18, marginBottom: 2 },
  moodLabel:          { fontSize: 10, fontWeight: '700', color: '#625d79' },
  moodLabelCompact:   { fontSize: 8, letterSpacing: -0.2 },
  moodPrompt:         { color: '#746f88', fontSize: 12, lineHeight: 17, marginTop: 14 },
  moodPromptCompact:  { fontSize: 10, lineHeight: 14, marginTop: 11 },
  fortuneTitle:       { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  fortuneWindow:      { minHeight: 132, borderRadius: 16, padding: 12, backgroundColor: '#17142b', borderWidth: 1, borderColor: 'rgba(242,184,194,0.42)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginVertical: 8, position: 'relative' },
  fortuneWindowCompact:{ minHeight: 132, borderRadius: 13, padding: 9, marginVertical: 7 },
  fortuneReelViewport:{ width: '100%', height: 108, overflow: 'hidden' },
  fortuneReelTrack:   { width: '100%' },
  fortuneReelRow:     { height: 54, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  fortunePayline:     { position: 'absolute', left: 6, right: 6, top: 38, height: 54, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(242,184,194,0.46)', backgroundColor: 'rgba(242,184,194,0.055)', zIndex: 2 },
  fortuneRivetLeft:   { position: 'absolute', left: 8, top: 8, width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(242,184,194,0.55)' },
  fortuneRivetRight:  { position: 'absolute', right: 8, top: 8, width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(242,184,194,0.55)' },
  fortuneText:        { color: '#f9f6ff', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  fortuneTextGhost:   { color: 'rgba(216,211,230,0.36)', fontSize: 11, lineHeight: 15 },
  fortuneTextCompact: { fontSize: 11, lineHeight: 16 },
  fortuneButton:      { minHeight: 48, borderRadius: 24, backgroundColor: '#f2b8c2', alignSelf: 'center', paddingHorizontal: 16, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', marginTop: 7 },
  fortuneButtonCompact:{ minHeight: 48, borderRadius: 24, paddingHorizontal: 10, gap: 4, marginTop: 5 },
  fortuneButtonText:  { color: '#292541', fontSize: 13, fontWeight: '800' },
  fortuneButtonTextCompact:{ fontSize: 10 },

  activityLink:      { minHeight: 74, paddingHorizontal: 16, paddingVertical: 13, borderRadius: 18, backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderWidth: 1, borderColor: '#e3dff1' },
  activityLinkTitle: { color: '#292541', fontSize: 16, fontWeight: '800', marginBottom: 2 },
  activityLinkBody:  { color: '#746f88', fontSize: 12 },

  featuredPractice:    { borderRadius: 26, padding: 22, minHeight: 270, backgroundColor: '#292541', flexDirection: 'row', alignItems: 'center', marginBottom: 28, overflow: 'hidden' },
  featuredCopy:        { flex: 1, zIndex: 2, paddingRight: 8 },
  featuredTitle:       { color: '#ffffff', fontSize: 27, lineHeight: 31, letterSpacing: -0.5, fontWeight: '850', marginBottom: 12 },
  featuredDescription: { color: '#d8d3e6', fontSize: 14, lineHeight: 21, marginBottom: 12 },
  featuredDuration:    { color: '#b8b1ca', fontSize: 12, fontWeight: '700', marginBottom: 18 },
  featuredAction:      { alignSelf: 'flex-start', minHeight: 48, borderRadius: 24, backgroundColor: '#f2b8c2', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 7 },
  featuredActionText:  { color: '#292541', fontSize: 13, fontWeight: '800' },

  practiceHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  practiceHeaderTitle: { color: '#292541', fontSize: 23, letterSpacing: -0.3, fontWeight: '850' },
  practiceHeaderHint:  { color: '#746f88', fontSize: 12 },
  practiceList:        { borderTopWidth: 1, borderTopColor: '#dcd7ec' },
  practiceRow:         { borderBottomWidth: 1, borderBottomColor: '#dcd7ec', backgroundColor: 'transparent' },
  practiceRowExpanded: { backgroundColor: '#ffffff', borderRadius: 18, borderBottomColor: 'transparent', marginVertical: 6, overflow: 'hidden' },
  practiceRowButton:   { minHeight: 70, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  practiceNumber:      { width: 26, color: '#8b85a0', fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  practiceRowTitleWrap:{ flex: 1 },
  practiceRowTitle:    { color: '#292541', fontSize: 16, fontWeight: '800' },
  practiceComplete:    { color: '#397466', fontSize: 10, fontWeight: '700', marginTop: 2 },
  practiceZodiac:      { color: '#746f88', fontSize: 11, fontWeight: '700' },
  practiceExpansion:   { paddingHorizontal: 14, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  practiceExpansionCopy:{ flex: 1 },
  practiceDescription:{ color: '#625d79', fontSize: 13, lineHeight: 20, marginBottom: 8 },
  practiceDuration:   { color: '#8b85a0', fontSize: 11, fontWeight: '700', marginBottom: 12 },
  openPracticeButton: { minHeight: 48, borderRadius: 24, backgroundColor: ThemeColor.BRAND, paddingHorizontal: 14, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7 },
  openPracticeButtonText:{ color: '#ffffff', fontSize: 13, fontWeight: '800' },

  constellation:         { position: 'relative', flexShrink: 0 },
  constellationLine:     { position: 'absolute', height: 1, backgroundColor: 'rgba(103,96,212,0.58)', transformOrigin: 'left center' },
  constellationLineLight:{ backgroundColor: 'rgba(242,184,194,0.72)' },
  constellationStar:     { position: 'absolute', borderRadius: 99, backgroundColor: '#6760d4' },
  constellationStarLight:{ backgroundColor: '#f2b8c2' },
  constellationLabel:    { position: 'absolute', left: 0, top: 0, color: '#6760d4', fontSize: 11, fontWeight: '800' },
  constellationLabelLight:{ color: '#f2b8c2' },

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
    borderRadius: 18, overflow: 'hidden', backgroundColor: '#0d1b36', zIndex: 200,
    ...Platform.select({
      ios:     { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 18 },
      android: { elevation: 10 },
    }),
  },
  floatingCollapsed:   { opacity: 0, transform: [{ scale: 0.96 }] },
  floatingDockHeader:  { minHeight: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#172861' },
  floatingDockKicker:  { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  floatingDockTitle:   { color: ThemeColor.WHITE, fontSize: 14, fontWeight: '700', marginTop: 2 },
  floatingDockHideText:{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600' },
  dockWebView:         { flex: 1, backgroundColor: '#0d1b36' },

  // Avatar loading state
  avatarLoading:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#0d1b36', paddingHorizontal: 16 },
  loadingOrb:        { width: 48, height: 48, borderRadius: 24, backgroundColor: ThemeColor.BRAND, opacity: 0.5 },
  loadingText:       { color: 'rgba(255,255,255,0.85)', fontSize: 13, textAlign: 'center' },
  loadingDetailText: { color: 'rgba(255,255,255,0.5)', fontSize: 10, textAlign: 'center' },

  // ── Session avatar (inline) ──
  sessionAvatarPanel: { borderRadius: 18, overflow: 'hidden', marginBottom: 16, backgroundColor: '#0d1b36', ...cardShadow },
  sessionWebView:     { flex: 1, backgroundColor: '#0d1b36' },

  // Session grid
  sectionTitle:           { fontSize: 20, fontWeight: '800', color: ThemeColor.TEXT_PRIMARY, marginBottom: 12, marginTop: 4 },
  sectionTitleInline:     { marginBottom: 0 },
  sessionSectionHeader:   { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 },
  sessionSectionHint:     { fontSize: 11, color: ThemeColor.HOME_SUBTITLE, fontWeight: '700' },
  sectionSeparator:       { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(31,60,136,0.18)', marginBottom: 16 },
  sessionOfTheDayRow:       { marginBottom: 4 },
  sessionGrid:            { flexDirection: 'row', flexWrap: 'wrap', gap: SESSION_GRID_GAP, marginBottom: 20 },
  sessionTile:            { borderRadius: 16, padding: 14, gap: 7, borderWidth: 1.5, minHeight: 148 },
  sessionTileFeatured:    { minHeight: 174, padding: 18, borderRadius: 18 },
  sessionFeaturedLabel:   { color: '#397466', fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 2 },
  sessionTileGuided:      { backgroundColor: '#e8edf7', borderColor: 'rgba(31,60,136,0.2)' },
  sessionTileFeaturedReady:{ backgroundColor: '#eaf4ef', borderColor: '#bad9cb' },
  sessionTilePlaceholder: { backgroundColor: ThemeColor.WHITE, borderColor: 'rgba(31,60,136,0.1)' },
  sessionTileCompleted:   { backgroundColor: '#dcfce7', borderColor: '#16a34a' },
  sessionTileSelected:    { borderColor: ThemeColor.BRAND, borderWidth: 2 },
  sessionTileTop:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sessionNumberWrap:      { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sessionNumber:          { fontSize: 20, fontWeight: '900', color: ThemeColor.BRAND },
  sessionTileTitle:       { fontSize: 14, fontWeight: '700', color: ThemeColor.TEXT_PRIMARY },
  sessionTileDesc:        { fontSize: 12, color: ThemeColor.HOME_CARD_TEXT, lineHeight: 17 },
  sessionTileMeta:        { fontSize: 11, color: ThemeColor.HOME_SUBTITLE, fontWeight: '600' },
  sessionTileCta:         { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 'auto', paddingTop: 8 },
  sessionTileCtaText:     { color: ThemeColor.BRAND, fontSize: 12, fontWeight: '800' },

  // Pills
  pill:              { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  pillGuided:        { backgroundColor: ThemeColor.BRAND },
  pillEmpty:         { backgroundColor: '#e8edf7' },
  pillCompleted:     { backgroundColor: '#16a34a' },
  pillText:          { fontSize: 10, fontWeight: '800' },
  pillTextGuided:    { color: ThemeColor.WHITE },
  pillTextEmpty:     { color: ThemeColor.HOME_SUBTITLE },
  pillTextCompleted: { color: ThemeColor.WHITE },

  // Compact assistant information views
  infoSectionTitle:    { fontSize: 13, fontWeight: '800', color: ThemeColor.HOME_SUBTITLE, letterSpacing: 0.6, marginTop: 4, marginBottom: 9, textTransform: 'uppercase' },
  infoAccordionGroup:  { backgroundColor: ThemeColor.WHITE, borderRadius: 14, borderWidth: 1, borderColor: ThemeColor.INPUT_BORDER_SOFT, overflow: 'hidden', marginBottom: 24, ...cardShadow },
  infoAccordion:       { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e8ecf2' },
  infoAccordionHeader:  { minHeight: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  infoAccordionIcon:   { width: 34, height: 34, borderRadius: 11, backgroundColor: '#edf3fb', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  infoAccordionTitle:  { flex: 1, color: ThemeColor.TEXT_PRIMARY, fontSize: 15, fontWeight: '750' },
  infoAccordionBody:   { color: ThemeColor.HOME_CARD_TEXT, fontSize: 13, lineHeight: 20, paddingLeft: 59, paddingRight: 18, paddingBottom: 16 },

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

  placeholderCard:  { backgroundColor: ThemeColor.WHITE, borderRadius: 16, padding: 18, gap: 8, marginBottom: 16, ...cardShadow },
  placeholderTitle: { fontSize: 17, fontWeight: '800', color: ThemeColor.TEXT_PRIMARY },
  placeholderBody:  { fontSize: 14, color: ThemeColor.HOME_CARD_TEXT, lineHeight: 21 },
  progressCard:     { backgroundColor: ThemeColor.WHITE, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10, ...cardShadow },
  progressHeader:   { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 6 },
  progressLabel:    { fontSize: 13, fontWeight: '700', color: ThemeColor.TEXT_PRIMARY },
  progressCount:    { fontSize: 13, fontWeight: '800', color: ThemeColor.BRAND },
  progressRow:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressTrack:    { flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(31,60,136,0.12)', overflow: 'hidden' },
  progressFill:     { height: '100%', backgroundColor: ThemeColor.BRAND, borderRadius: 4 },
  progressNextBtn:  { backgroundColor: ThemeColor.BRAND, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14 },

  // Summary modal
  overlay:             { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  summaryCard:         { width: '100%', maxWidth: 380, backgroundColor: ThemeColor.WHITE, borderRadius: 20, padding: 24, gap: 10 },
  summaryTitle:        { fontSize: 20, fontWeight: '800', color: ThemeColor.TEXT_PRIMARY, textAlign: 'center' },
  summaryDuration:     { fontSize: 14, color: ThemeColor.HOME_CARD_TEXT, textAlign: 'center' },
  summaryBody:         { fontSize: 15, color: ThemeColor.TEXT_PRIMARY, lineHeight: 22 },
  summaryReflection:   { fontSize: 14, color: ThemeColor.HOME_CARD_TEXT, lineHeight: 20, textAlign: 'center' },
  summaryCloseBtn:     { backgroundColor: ThemeColor.BRAND, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 8 },
  summaryCloseBtnText: { color: ThemeColor.WHITE, fontWeight: '800', fontSize: 15 },

  // Chat modal — tall sheet so messages and composer are both visible
  overlayDismiss:  { flex: 1, justifyContent: 'flex-end' },
  chatSheet: {
    backgroundColor: ThemeColor.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
});
