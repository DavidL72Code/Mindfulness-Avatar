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
  AppState,
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
import { onAuthStateChanged, onIdTokenChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import * as Speech from 'expo-speech';
import { auth, db } from '../config/firebaseConfig';
import { useLanguage } from '../context/LanguageContext';
import { ThemeColor, ThemeRadius } from '../theme/appTheme';
import { recordCompletedSession } from '../utils/sessionTracking';

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE_URL     = 'https://multilingual-virtual-assistant.onrender.com';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DOCK_WIDTH           = Math.min(SCREEN_WIDTH - 32, 320);
const DOCK_HEIGHT          = 480;
const SESSION_AVATAR_HEIGHT = Math.max(320, Math.round(SCREEN_HEIGHT * 0.62));

// ─── Session catalog ──────────────────────────────────────────────────────────

const sessionCatalog = [
  { id: 'caregiver-fatigue',  title: 'Caregiver Fatigue',         description: 'A compassion meditation to recharge when caring for others.', kind: 'scripted',    duration: '~4 min · 6 segments' },
  { id: 'body-scan',          title: 'Body Scan',                 description: 'A guided check-in from head to toe.',                        kind: 'scripted', duration: '~7 min · 25 steps' },
  { id: 'five-senses',        title: 'Five Senses Grounding',     description: 'A grounding exercise to reconnect with the present moment.',  kind: 'scripted', duration: '~6 min · 24 steps' },
  { id: 'mindful-breathing',  title: 'Mindful Breathing',         description: 'A foundational breath awareness practice you can use anywhere.', kind: 'scripted', duration: '~5 min · 5 segments' },
  { id: 'loving-kindness',    title: 'Loving Kindness',           description: 'A compassion-focused mindfulness practice.',                 kind: 'scripted', duration: '~7 min · 25 steps' },
  { id: 'mindful-walking',    title: 'Mindful Walking',           description: 'A light movement practice with full attention on each step.', kind: 'scripted', duration: '~6 min · 22 steps' },
  { id: 'seated-stretch',     title: 'Seated Stretch Reset',      description: 'Gentle seated stretches to release tension.',                kind: 'scripted', duration: '~6 min · 22 steps' },
  { id: 'mindful-listening',  title: 'Mindful Listening',         description: 'A practice that centers attention through sound.',            kind: 'scripted', duration: '~6 min · 22 steps' },
  { id: 'affirmation-breath', title: 'Affirmation Breath',        description: 'Pair a calming phrase with your breath.',                    kind: 'scripted', duration: '~5 min · 20 steps' },
  { id: 'stress-release',     title: 'Stress Release Check-In',   description: 'Notice, name, and soften what you are carrying.',            kind: 'scripted', duration: '~6 min · 22 steps' },
  { id: 'morning-intention',  title: 'Morning Intention',         description: 'A simple intention-setting practice for the day.',           kind: 'scripted', duration: '~5 min · 20 steps' },
  { id: 'sleep-wind-down',    title: 'Sleep Wind Down',           description: 'A quiet practice to prepare your body for rest.',            kind: 'scripted', duration: '~7 min · 24 steps' },
].map((s, i) => ({ ...s, number: String(i + 1).padStart(2, '0') }));

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
  'body-scan': [
    { key: 'bs1',  text: "Welcome. Find a comfortable position — lying down if possible, or seated with your back gently supported." },
    { key: 'bs2',  text: "Allow your eyes to close, or let your gaze rest softly downward. Give yourself permission to arrive here." },
    { key: 'bs3',  text: "Take a deep breath in through your nose... and release it slowly through your mouth. Begin to let go." },
    { key: 'bs4',  text: "Let your breath return to its natural rhythm. In this practice, we will move attention slowly through the body — simply noticing, without trying to fix or change anything." },
    { key: 'bs5',  text: "Bring your awareness all the way down to your feet. Notice the soles of your feet — any warmth, coolness, tingling, or pressure. Just observe." },
    { key: 'bs6',  text: "Move your attention up to your ankles and calves. Are they holding any tension? You don't need to change it — simply be aware of it." },
    { key: 'bs7',  text: "Now bring your awareness to your knees and thighs. Feel the weight of your legs. Notice where they make contact with the surface beneath you." },
    { key: 'bs8',  text: "Let your attention travel to your hips and lower back. This area holds a lot for many of us. Breathe here for a moment." },
    { key: 'bs9',  text: "Notice your belly. With each breath in, feel it rise. With each breath out, feel it fall. Let it be soft and easy." },
    { key: 'bs10', text: "Bring awareness to your chest and the area around your heart. Notice the gentle rise and fall of your breathing. Feel your heartbeat if you can." },
    { key: 'bs11', text: "Shift your attention to your upper back and shoulders. Imagine any held tension beginning to ease and dissolve with each exhale." },
    { key: 'bs12', text: "Let awareness flow down through your arms — your elbows, forearms, wrists — all the way to your hands and fingertips. Notice any warmth or pulse here." },
    { key: 'bs13', text: "Now bring your attention to your neck and throat. Notice if there is any tightness. Breathe into it gently, and let it soften." },
    { key: 'bs14', text: "Shift your awareness to your jaw. Let it unclench. Let your tongue rest softly in your mouth, your lips part slightly." },
    { key: 'bs15', text: "Notice the muscles around your eyes and across your forehead. Allow them to smooth and relax, as if a gentle hand were resting there." },
    { key: 'bs16', text: "Now expand your awareness to take in your whole body at once — from the top of your head to the tips of your toes." },
    { key: 'bs17', text: "Your whole body, breathing. Resting. Alive." },
    { key: 'bs18', text: "If you noticed any areas of tension or discomfort, that is completely natural. The practice is to notice with kindness — not to judge." },
    { key: 'bs19', text: "Stay here in this whole-body awareness for a moment. Let your breath be easy. Let your body be held by whatever surface you are resting on." },
    { key: 'bs20', text: "You are exactly where you need to be, right now." },
    { key: 'bs21', text: "Take a slow, deep breath in... and let it all go." },
    { key: 'bs22', text: "Begin to gently deepen your breathing. Wiggle your fingers and toes to start reawakening the body." },
    { key: 'bs23', text: "Slowly roll your neck from side to side if it feels comfortable. Take your time." },
    { key: 'bs24', text: "When you are ready, gently open your eyes. There is no need to rush." },
    { key: 'bs25', text: "Thank you for taking this time to listen to your body. Carry this sense of ease with you into the rest of your day." },
  ],
  'five-senses': [
    { key: 'fs1',  text: "Welcome to this grounding practice. Whenever your mind feels scattered or anxious, this exercise can bring you back to the present moment." },
    { key: 'fs2',  text: "Find a comfortable position — seated, standing, or lying down. Feel your feet make contact with the floor." },
    { key: 'fs3',  text: "Take one slow breath in through your nose... and a long exhale out. Good. Let's begin." },
    { key: 'fs4',  text: "We are going to work through your five senses, one by one. Each one is an anchor to the present moment — to right here, right now." },
    { key: 'fs5',  text: "Begin with sight. Look around your environment and notice five things you can see. Take your time — really look at each one." },
    { key: 'fs6',  text: "Notice colors, textures, shadows, shapes. Let your eyes rest on each thing for a moment. One... Two... Three... Four... Five." },
    { key: 'fs7',  text: "Now bring your attention to touch. Notice four sensations you can physically feel — in your body or through your skin." },
    { key: 'fs8',  text: "Perhaps the weight of your hands in your lap. The temperature of the air. The pressure of the chair beneath you. A texture of fabric against your skin. Notice four." },
    { key: 'fs9',  text: "Now tune your attention to sound. Notice three sounds in your environment right now." },
    { key: 'fs10', text: "Let your hearing open up — near sounds and distant ones, loud and quiet. Simply notice three of them without judgment." },
    { key: 'fs11', text: "Now shift to smell. Bring your awareness to what you can smell — or simply to the quality of the air as you breathe in." },
    { key: 'fs12', text: "Take a slow inhale. Maybe you notice something faint — a scent in the room, the freshness of the air, or simply the warmth of your breath. Notice two things." },
    { key: 'fs13', text: "And finally, notice one thing you can taste. Perhaps a lingering flavor, or simply the neutral sensation of your mouth and tongue." },
    { key: 'fs14', text: "Now take a moment to bring all five senses together. You are seeing, feeling, hearing, smelling, and tasting — all at once." },
    { key: 'fs15', text: "You are fully, completely here. Right in this moment." },
    { key: 'fs16', text: "Notice how different this feels from when we started. That slight sense of steadiness, of being grounded — that is real." },
    { key: 'fs17', text: "This technique works by redirecting your nervous system from a stress response toward present-moment awareness." },
    { key: 'fs18', text: "You can use this anywhere — before a difficult meeting, in a moment of panic, or simply as a daily reset." },
    { key: 'fs19', text: "Let's close with three slow, intentional breaths. Breathe in through your nose... and out through your mouth." },
    { key: 'fs20', text: "Again. In through the nose... and slowly out." },
    { key: 'fs21', text: "One more. A long inhale... and a complete exhale." },
    { key: 'fs22', text: "When you feel unsteady, return to your senses. Five things you see, four you feel, three you hear, two you smell, one you taste." },
    { key: 'fs23', text: "The present moment is always here, waiting for you." },
    { key: 'fs24', text: "Well done. Thank you for practicing today." },
  ],
  'loving-kindness': [
    { key: 'lk1',  text: "Welcome to this loving kindness meditation, sometimes called Metta practice." },
    { key: 'lk2',  text: "In this practice, we gently cultivate feelings of warmth and goodwill — toward ourselves first, and then outward toward others." },
    { key: 'lk3',  text: "Find a comfortable seat. Let your hands rest in your lap, and allow your eyes to close." },
    { key: 'lk4',  text: "Take a few slow, natural breaths. Let each exhale release a little of whatever you are carrying today." },
    { key: 'lk5',  text: "We begin with ourselves — not out of selfishness, but because genuine compassion must include ourselves to be whole." },
    { key: 'lk6',  text: "Picture yourself as you are right now. You may find this easy, or it may feel a little uncomfortable. Either is fine." },
    { key: 'lk7',  text: "Silently repeat these phrases for yourself: May I be safe. May I be healthy. May I be happy. May I live with ease." },
    { key: 'lk8',  text: "Allow the words to settle without forcing any particular feeling. Simply planting the intention is enough." },
    { key: 'lk9',  text: "Once more: May I be safe. May I be healthy. May I be happy. May I live with ease." },
    { key: 'lk10', text: "Now bring to mind someone you love easily — a close friend, a family member, a child, or a pet whose presence fills you with warmth." },
    { key: 'lk11', text: "Picture them clearly. Let yourself feel the natural affection you have for them." },
    { key: 'lk12', text: "Send them these same wishes: May you be safe. May you be healthy. May you be happy. May you live with ease." },
    { key: 'lk13', text: "Feel that warmth flowing from your heart toward them, like a gentle light reaching across the distance between you." },
    { key: 'lk14', text: "Now bring to mind a neutral person — someone you encounter in daily life but don't know well. A neighbor, a cashier, a stranger on the street." },
    { key: 'lk15', text: "This person, like you, has a full inner life — joys and sorrows, hopes and fears. Offer them the same kindness: May you be safe. May you be healthy. May you be happy. May you live with ease." },
    { key: 'lk16', text: "Now, if you feel ready, bring to mind someone who has been difficult for you. You don't need to condone anything they have done." },
    { key: 'lk17', text: "Simply recognize that they too carry suffering. They too wish to be free from pain. As best you can, offer: May you be safe. May you be healthy. May you be happy. May you live with ease." },
    { key: 'lk18', text: "If this feels too hard today, simply return to yourself. Compassion is a practice, not a test." },
    { key: 'lk19', text: "Finally, let your awareness expand to include all beings everywhere — every person, every creature on this Earth." },
    { key: 'lk20', text: "May all beings be safe. May all beings be healthy. May all beings be happy. May all beings live with ease." },
    { key: 'lk21', text: "Feel the full circle of this compassion — beginning with your own heart, rippling outward to all of life." },
    { key: 'lk22', text: "Rest in this for a moment. Breathing. Open. Kind." },
    { key: 'lk23', text: "Notice how you feel. Perhaps there is a gentle warmth, or a sense of openness, or simply quiet." },
    { key: 'lk24', text: "Take a slow, full breath in... and release it softly." },
    { key: 'lk25', text: "The kindness you offered today is real. Carry it with you. Thank you for practicing." },
  ],
  'mindful-walking': [
    { key: 'mw1',  text: "Welcome to this mindful walking practice. You will need a quiet space to walk slowly — even just a few steps back and forth is enough." },
    { key: 'mw2',  text: "Before you begin moving, stand still for a moment. Feel your feet firmly on the ground." },
    { key: 'mw3',  text: "Take a slow breath in... and release. Let your body arrive here." },
    { key: 'mw4',  text: "Become aware of your posture. Stand gently tall, with your shoulders relaxed and your gaze soft — looking slightly ahead and downward." },
    { key: 'mw5',  text: "Now bring your full attention to your feet. Notice the weight of your body flowing down through your legs and into the ground beneath you." },
    { key: 'mw6',  text: "Begin to walk very slowly. Much slower than you normally would. With each step, notice the subtle movements involved." },
    { key: 'mw7',  text: "As you lift your foot — feel the heel rise, then the ball of the foot, then the toes." },
    { key: 'mw8',  text: "As you place your foot down — feel the heel make contact first, then the arch, then the toes settling." },
    { key: 'mw9',  text: "Lift. Move. Place. That is all. Lift. Move. Place." },
    { key: 'mw10', text: "If your mind wanders — to tasks, to worries, to the feeling of awkwardness — simply notice, and gently bring your attention back to your feet." },
    { key: 'mw11', text: "Now begin to coordinate your breathing with your steps. Breathe in for two or three steps... and out for two or three steps." },
    { key: 'mw12', text: "Let your arms hang naturally at your sides. You don't need to do anything with them. Simply walk." },
    { key: 'mw13', text: "Notice the ground beneath you. Hard or soft. Warm or cool. Steady." },
    { key: 'mw14', text: "Notice your surroundings without getting pulled into them. Let them simply be the backdrop to your movement." },
    { key: 'mw15', text: "Continue walking slowly. Each step is complete in itself. Each step is an arrival." },
    { key: 'mw16', text: "If you feel restless or silly, that is perfectly natural. Just notice the feeling, and keep walking." },
    { key: 'mw17', text: "This practice is about noticing what is always happening but usually ignored — the miracle of movement, the gift of a body that carries you through the world." },
    { key: 'mw18', text: "Begin to let your pace slow even further. Take one final slow walk across your space, with complete attention." },
    { key: 'mw19', text: "Now come to a gentle stop. Stand still once more. Feel your feet on the ground." },
    { key: 'mw20', text: "Take a slow breath in... and a long breath out." },
    { key: 'mw21', text: "Notice how you feel in this moment compared to when you began. Even a short period of mindful movement can shift something." },
    { key: 'mw22', text: "Thank you for moving with intention today. You can carry this quality of attention into any walk you take." },
  ],
  'seated-stretch': [
    { key: 'ss1',  text: "Welcome to this seated stretch reset. This practice releases tension held in the body — no equipment needed, just your chair." },
    { key: 'ss2',  text: "Sit toward the front edge of your seat so your feet are flat on the floor, hip-width apart." },
    { key: 'ss3',  text: "Take a slow breath in... and release. Let your shoulders drop away from your ears." },
    { key: 'ss4',  text: "Let's begin with your shoulders. Breathe in and raise them toward your ears... then roll them back and down on the exhale. Repeat this a few times at your own pace." },
    { key: 'ss5',  text: "Now roll them forward — up, forward, and down. Let any tightness begin to ease." },
    { key: 'ss6',  text: "Gently turn your head to the right, as if looking over your shoulder. Hold for a breath or two. Then slowly return to center." },
    { key: 'ss7',  text: "Now turn your head to the left. Hold. Return to center." },
    { key: 'ss8',  text: "Lower your right ear gently toward your right shoulder, stretching the left side of your neck. Keep your left shoulder relaxed. Breathe into the stretch." },
    { key: 'ss9',  text: "Slowly return to center, then lower your left ear toward your left shoulder. Breathe into the right side of your neck." },
    { key: 'ss10', text: "Come back to center. Take a breath." },
    { key: 'ss11', text: "Interlace your fingers and stretch your arms out in front of you, palms facing away. Feel the stretch across your upper back and shoulders." },
    { key: 'ss12', text: "Then reach your arms above your head, palms facing up. Take a full breath in as you stretch upward... and release your arms down on the exhale." },
    { key: 'ss13', text: "Twist gently to the right, placing your left hand on your right knee and your right hand on the back of the chair. Breathe into the twist." },
    { key: 'ss14', text: "Slowly unwind and repeat on the other side — twist to the left, right hand on left knee, left hand behind. Breathe." },
    { key: 'ss15', text: "Come back to center." },
    { key: 'ss16', text: "Extend your right leg straight out in front of you, flexing and pointing your foot a few times to wake up the ankle and calf. Then place it back down." },
    { key: 'ss17', text: "Now the left leg — extend, flex, point. Then return." },
    { key: 'ss18', text: "Interlace your fingers behind your lower back if that is comfortable, and gently open the chest, drawing the shoulder blades together. Take a breath here." },
    { key: 'ss19', text: "Release. Let your hands rest in your lap. Round your spine gently, tucking your chin — like you are hugging yourself from the inside. Take a breath." },
    { key: 'ss20', text: "Slowly come back to a neutral, tall seat." },
    { key: 'ss21', text: "Take one final, full breath in through your nose — letting your belly expand, then your chest — and a long, slow exhale." },
    { key: 'ss22', text: "Well done. You have given your body a reset. Carry this sense of ease into whatever comes next." },
  ],
  'mindful-listening': [
    { key: 'ml1',  text: "Welcome to this mindful listening practice. Sound is always present, but we rarely give it our full attention." },
    { key: 'ml2',  text: "Find a comfortable seated position. You can close your eyes for this practice, which will help you focus more deeply on what you hear." },
    { key: 'ml3',  text: "Take a slow breath in... and out. Let your body settle." },
    { key: 'ml4',  text: "For a moment, simply notice that there is sound in your environment. You don't need to identify or analyze it — just notice that sound exists." },
    { key: 'ml5',  text: "Now expand your awareness to the full soundscape around you. Like opening a window, let all sounds in — near and far, loud and soft." },
    { key: 'ml6',  text: "Notice the nearest sound to you. What is its quality? Is it sharp or soft? Constant or intermittent? Simply observe." },
    { key: 'ml7',  text: "Now let your awareness travel to the farthest sound you can detect. Perhaps a distant car, the wind, or voices from another room. Notice it without chasing it." },
    { key: 'ml8',  text: "Let your hearing move fluidly between near and far — like a wide-angle lens, taking in the whole field of sound." },
    { key: 'ml9',  text: "Rather than focusing on what something IS, try to notice the pure qualities of the sounds. High or low. Smooth or jagged. Loud or quiet." },
    { key: 'ml10', text: "Notice that sounds arise... and pass away. Each sound has a beginning, a duration, and an end." },
    { key: 'ml11', text: "If you find yourself labeling sounds — 'that's a car, that's a bird' — simply notice the label and return to the raw experience of hearing." },
    { key: 'ml12', text: "You may notice silence between sounds. Rest in that silence too. It is a kind of sound in its own right." },
    { key: 'ml13', text: "Now bring your attention to the sound of your own breathing. The subtle rush of air on the inhale. The softer release of the exhale." },
    { key: 'ml14', text: "Notice the rhythm of your breath as a sound. Steady. Alive." },
    { key: 'ml15', text: "Expand again to the full soundscape — your breath and the environment together." },
    { key: 'ml16', text: "Notice that all of these sounds are happening at once, and your awareness can hold all of them without effort." },
    { key: 'ml17', text: "For a moment, let go of all effort. Simply sit, and let sound wash over you without grasping or pushing anything away." },
    { key: 'ml18', text: "This is the nature of mindful listening — open, receptive, effortless." },
    { key: 'ml19', text: "Slowly bring your attention back to the room. Take a breath." },
    { key: 'ml20', text: "Notice how different sound feels when you listen with full attention rather than half an ear." },
    { key: 'ml21', text: "This quality of listening — spacious, open, without judgment — can also be offered to the people in your life." },
    { key: 'ml22', text: "When you are ready, gently open your eyes. Thank you for listening today." },
  ],
  'affirmation-breath': [
    { key: 'ab1',  text: "Welcome to this affirmation breath practice. We will pair a calming phrase with the natural rhythm of your breath." },
    { key: 'ab2',  text: "Find a comfortable, upright position. Let your hands rest gently in your lap." },
    { key: 'ab3',  text: "Close your eyes and take a few natural breaths. Simply arrive here." },
    { key: 'ab4',  text: "In this practice, we use a short phrase — an affirmation — as a focus for each inhale and exhale. The words ride on the breath." },
    { key: 'ab5',  text: "Let's begin. As you breathe in, silently say: 'I am breathing in calm.' As you breathe out: 'I am releasing tension.'" },
    { key: 'ab6',  text: "Breathe in calm... and breathe out tension. Let the words ride gently on the breath." },
    { key: 'ab7',  text: "Again. Breathe in calm... breathe out tension." },
    { key: 'ab8',  text: "Now let's shift the phrase. Breathe in and silently say: 'I am present.' Breathe out: 'I let go.'" },
    { key: 'ab9',  text: "I am present... I let go." },
    { key: 'ab10', text: "I am present... I let go." },
    { key: 'ab11', text: "Now try: 'I am enough.' Breathe those words in. And on the exhale: 'Everything is okay.'" },
    { key: 'ab12', text: "I am enough... Everything is okay." },
    { key: 'ab13', text: "I am enough... Everything is okay." },
    { key: 'ab14', text: "One more pairing. Breathe in: 'I choose peace.' Breathe out: 'I release what I cannot control.'" },
    { key: 'ab15', text: "I choose peace... I release what I cannot control." },
    { key: 'ab16', text: "I choose peace... I release what I cannot control." },
    { key: 'ab17', text: "Now let go of any specific phrases. Simply breathe — naturally, easily — and let your body feel the truth of those words." },
    { key: 'ab18', text: "You are calm. You are present. You are enough. You are at peace." },
    { key: 'ab19', text: "Take one final, deep breath — breathing in everything you need... and releasing on the exhale everything you do not." },
    { key: 'ab20', text: "Well done. These affirmations are yours to carry. Return to them whenever you need a moment of steadiness." },
  ],
  'stress-release': [
    { key: 'sr1',  text: "Welcome to this stress release check-in. We are going to take a few minutes to notice, name, and soften what you are carrying right now." },
    { key: 'sr2',  text: "Find a comfortable position. You don't need to prepare or fix anything — simply arrive as you are." },
    { key: 'sr3',  text: "Take a slow breath in through your nose... and release it fully through your mouth. Let that be a signal to yourself that it is okay to pause." },
    { key: 'sr4',  text: "Let's start by checking in with your body. Scan from your shoulders down to your stomach. Where are you holding tension right now?" },
    { key: 'sr5',  text: "Maybe your jaw is tight, or your shoulders are raised. Maybe there is a knot in your chest or a heaviness in your gut. Simply notice." },
    { key: 'sr6',  text: "Whatever you find, allow it to be there. You don't have to make it go away. Simply acknowledge: 'I notice tension here.'" },
    { key: 'sr7',  text: "Now check in with your thoughts. What has been occupying your mind today? Without analyzing, notice the general tone — busy, worried, scattered, numb?" },
    { key: 'sr8',  text: "Name it. 'My mind feels ___.' Naming an experience loosens its grip on us." },
    { key: 'sr9',  text: "Now check in with your emotions. Not what you think you should be feeling, but what is actually here. Frustration? Sadness? Anxiety? Exhaustion?" },
    { key: 'sr10', text: "Name that too. 'Right now, I feel ___.' There is no wrong answer." },
    { key: 'sr11', text: "Take a breath. You have just done something important — you looked honestly at your own inner experience." },
    { key: 'sr12', text: "Now let's begin to soften. On your next exhale, imagine releasing a little of the tension in your body. Not all of it — just a little." },
    { key: 'sr13', text: "And another exhale — let a little more go." },
    { key: 'sr14', text: "Breathe in steadiness... and breathe out what you no longer need." },
    { key: 'sr15', text: "Place one hand on your chest and one on your belly. Feel both rise and fall as you breathe." },
    { key: 'sr16', text: "This contact — your own hand on your own body — is an act of self-compassion. Notice how it feels." },
    { key: 'sr17', text: "Take three slow breaths here, at your own pace. There is no rush." },
    { key: 'sr18', text: "The stress you are carrying is real. The challenges are real. And you, right now, are handling them." },
    { key: 'sr19', text: "You are more capable than you realize. You have gotten through difficult days before. You will get through this too." },
    { key: 'sr20', text: "Take one more breath — full and slow — and let your hands return to your lap." },
    { key: 'sr21', text: "Whenever you feel overwhelmed today, return to this: three slow breaths, a hand on your heart, and the knowledge that this moment will pass." },
    { key: 'sr22', text: "Thank you for checking in with yourself. That act of awareness is the foundation of everything." },
  ],
  'morning-intention': [
    { key: 'mi1',  text: "Good morning. Welcome to this intention-setting practice. A few mindful minutes at the start of the day can set a completely different tone for everything that follows." },
    { key: 'mi2',  text: "Find a comfortable seated position. If you can, do this before looking at your phone or starting any tasks." },
    { key: 'mi3',  text: "Take a slow breath in through your nose... and a full exhale out. Let your body wake up gently." },
    { key: 'mi4',  text: "For a moment, simply notice that a new day has begun. Whatever happened yesterday is in the past. This moment is fresh." },
    { key: 'mi5',  text: "Check in briefly with your body. How are you feeling this morning — physically? Rested, tired, somewhere in between? Simply notice without judgment." },
    { key: 'mi6',  text: "Now check in with your mood. What is the emotional tone of your morning? Again, just notice — no need to change anything." },
    { key: 'mi7',  text: "Now let's turn to intention. An intention is different from a goal. A goal is something you achieve. An intention is a quality you want to bring to your day." },
    { key: 'mi8',  text: "Ask yourself: How do I want to show up today? What quality do I most want to bring to my actions and interactions?" },
    { key: 'mi9',  text: "Perhaps it is patience. Or presence. Or courage. Or kindness. Or simply ease." },
    { key: 'mi10', text: "Let one word or phrase come to you. Don't overthink it. Trust what arises." },
    { key: 'mi11', text: "Hold that intention gently in your mind. Say it to yourself once: 'Today, I intend to be ___.' Make it yours." },
    { key: 'mi12', text: "Take a breath and let that intention settle into your body. Where do you feel it? In your chest? Your shoulders? Your breath?" },
    { key: 'mi13', text: "Now think of one small, concrete action you can take this morning that aligns with that intention. Just one small thing." },
    { key: 'mi14', text: "You don't need to change the whole day. You only need to take the next step." },
    { key: 'mi15', text: "Take another breath. Feel the quiet readiness in your body — the natural alertness of a new morning." },
    { key: 'mi16', text: "Whatever this day brings, you have already begun it with awareness and intention. That changes things." },
    { key: 'mi17', text: "Take a final deep breath in, filling your lungs completely... and a long, releasing exhale." },
    { key: 'mi18', text: "Gently open your eyes. The day is waiting." },
    { key: 'mi19', text: "Return to your intention whenever you need it — write it down, say it aloud, or simply hold it in your heart." },
    { key: 'mi20', text: "Good morning. May today be exactly what you need it to be." },
  ],
  'sleep-wind-down': [
    { key: 'sw1',  text: "Welcome to this sleep wind-down practice. You have made it through another day. It is time to let the day go and prepare your body and mind for rest." },
    { key: 'sw2',  text: "Find a comfortable position in bed, lying on your back if possible. Let your legs uncross, and let your arms rest at your sides." },
    { key: 'sw3',  text: "Allow your eyes to close. There is nothing you need to do right now. Nothing to check. Nowhere to be." },
    { key: 'sw4',  text: "Take a slow breath in through your nose, letting your belly rise... and a long, slow exhale through slightly parted lips. Let the day begin to fade." },
    { key: 'sw5',  text: "Again. Breathe in... and all the way out." },
    { key: 'sw6',  text: "Let's briefly release any tension from the body. Begin with your face — let your jaw unclench, your forehead smooth, your eyes soften." },
    { key: 'sw7',  text: "Feel your head sink heavily into the pillow. Let your neck release." },
    { key: 'sw8',  text: "Relax your shoulders. Feel them drop toward the mattress. Let your arms be heavy." },
    { key: 'sw9',  text: "Your chest and belly — soft. Rising and falling with each breath, without effort." },
    { key: 'sw10', text: "Your lower back — let it release any tightness and sink into the bed." },
    { key: 'sw11', text: "Your legs — heavy, warm, completely relaxed. Your feet — still." },
    { key: 'sw12', text: "Your whole body, heavy and at rest." },
    { key: 'sw13', text: "Now let's quiet the mind. If thoughts arise — worries, to-do lists, replays of the day — simply notice them, and gently let them go. You can return to them tomorrow." },
    { key: 'sw14', text: "Imagine each thought as a cloud drifting slowly across a night sky. You watch it pass, and the sky clears again." },
    { key: 'sw15', text: "Let your breathing become even slower and softer. You are safe. You are warm. You are taken care of." },
    { key: 'sw16', text: "With each exhale, feel yourself sinking a little deeper into relaxation." },
    { key: 'sw17', text: "There is nowhere to go. Nothing to solve. You have done enough today." },
    { key: 'sw18', text: "Let your awareness become soft and diffuse — like the moment just before sleep, when thoughts begin to blur." },
    { key: 'sw19', text: "Simply breathe. In... and out. In... and out." },
    { key: 'sw20', text: "You are drifting. The day is behind you. Rest is here." },
    { key: 'sw21', text: "Let go of any effort to fall asleep. Simply be here, comfortable and still." },
    { key: 'sw22', text: "In... and out." },
    { key: 'sw23', text: "Let sleep come to you naturally, in its own time. You are already resting." },
    { key: 'sw24', text: "Good night. You did well today." },
  ],
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

// Build the session avatar start prompt — used on fresh start and on resume
function buildSessionStartPrompt(session, scriptSlideIndex = 0) {
  if (session.kind === 'scripted') {
    const segments = SESSION_SCRIPTS[session.id] || [];
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
  if (!sessionContext?.selectedSession) {
    return [
      'App context: The mobile mindfulness app has 12 selectable session tiles.',
      'Sessions 1 and 4 have scripted content.',
      'The other 10 session pages are placeholders for future guided content.',
      `User message: ${message}`,
    ].join('\n');
  }
  const lines = [
    'App context: The mobile mindfulness app has 12 selectable session tiles.',
    `Current session title: ${sessionContext.selectedSession.title}`,
    `Session status: ${sessionContext.sessionActive ? 'active' : 'not started'}`,
  ];
  if (sessionContext.selectedSession.kind === 'scripted') {
    const segments = SESSION_SCRIPTS[sessionContext.selectedSession.id] || [];
    lines.push(`This is a scripted session with ${segments.length} passages. Current passage: ${(sessionContext.scriptSlideIndex || 0) + 1}.`);
  }
  lines.push(`User message: ${message}`);
  return lines.join('\n');
}

function buildLocalChatFallback(_message, sessionContext) {
  if (sessionContext?.selectedSession?.kind === 'scripted') {
    const segments = SESSION_SCRIPTS[sessionContext.selectedSession.id] || [];
    return `${sessionContext.selectedSession.title} is a scripted session with ${segments.length} passages.`;
  }
  if (sessionContext?.selectedSession) {
    return `${sessionContext.selectedSession.title} is currently a placeholder session.`;
  }
  return 'This app has 12 session tiles. Sessions 1 and 4 have scripted content; the other 10 session pages are placeholders for future exercises.';
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

function buildLocalBackendUri(baseUri) {
  try {
    const url = new URL(baseUri);
    if (!url.hostname || url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      return '';
    }
    url.port = '8000';
    url.pathname = '';
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

// ─── Floating Avatar Dock ─────────────────────────────────────────────────────
// Always mounted — opacity:0 + pointerEvents:none when not visible so the
// WebView keeps running and localStorage / chat state survives screen transitions.

function FloatingAvatarDock({ avatarUri, avatarError, expanded, visible, onToggle, webViewRef, onLoad, onMessage, onError }) {
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
          onError={onError}
          onHttpError={onError}
          onMessage={onMessage}
        />
      ) : (
        <View style={styles.avatarLoading}>
          <View style={styles.loadingOrb} />
          <Text style={styles.loadingText}>{avatarError || 'Loading avatar...'}</Text>
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

// ─── Session Avatar Panel ─────────────────────────────────────────────────────

function SessionAvatarPanel({ avatarUri, avatarError, webViewRef, onLoad, onMessage, onError }) {
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
          onError={onError}
          onHttpError={onError}
          onMessage={onMessage}
        />
      ) : (
        <View style={styles.avatarLoading}>
          <View style={styles.loadingOrb} />
          <Text style={styles.loadingText}>{avatarError || 'Loading avatar...'}</Text>
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
  const getAuthorizedHeaders    = useCallback(async () => {
    const headers = { 'Content-Type': 'application/json' };
    const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }, []);

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
      const headers = await getAuthorizedHeaders();
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers,
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
  }, [draft, busy, chatSessionId, sessionContext, getAuthorizedHeaders]);

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
  const [avatarLoadError, setAvatarLoadError]     = useState('');
  const [apiAuthToken, setApiAuthToken]           = useState('');
  const [dockExpanded, setDockExpanded]           = useState(true);
  const sessionWebViewRef                         = useRef(null);
  const homeDockWebViewRef                        = useRef(null);
  const homeDockLoadCount                         = useRef(0);
  const avatarVoiceId                             = useRef(null);

  // ── Session state ──
  const [sessionActive, setSessionActive]         = useState(false);
  const [sessionStatus, setSessionStatus]         = useState('Not started');
  const [sessionStartTime, setSessionStartTime]   = useState(null);
  const [placeholderMessage, setPlaceholderMessage] = useState('');

  // Prevent double-recording when the session is auto-saved on blur/background
  const sessionRecorded = useRef(false);
  // Mirror of live session state for use inside AppState / focus callbacks
  const liveSession = useRef({ sessionActive: false, sessionStartTime: null, selectedSessionId: null, scriptSlideIndex: 0 });

  // ── Script state (scripted sessions) ──
  const [scriptSlideIndex, setScriptSlideIndex] = useState(0);

  // ── Modals ──
  const [summaryVisible, setSummaryVisible]   = useState(false);
  const [sessionSummary, setSessionSummary]   = useState('');
  const [sessionDuration, setSessionDuration] = useState('');

  // ── Completed-session tracking (Firestore) ──
  const [completedSessionIds, setCompletedSessionIds] = useState(() => new Set());

  useEffect(() => {
    let unsubUser = null;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubUser) {
        unsubUser();
        unsubUser = null;
      }
      if (!user) {
        setCompletedSessionIds(new Set());
        return;
      }
      const userRef = doc(db, 'users', user.uid);
      unsubUser = onSnapshot(
        userRef,
        (snap) => {
          const ids = snap.exists() ? snap.data()?.completedSessionIds : null;
          setCompletedSessionIds(new Set(Array.isArray(ids) ? ids : []));
        },
        () => setCompletedSessionIds(new Set()),
      );
    });
    return () => {
      if (unsubUser) unsubUser();
      unsubAuth();
    };
  }, []);

  const selectedSession = sessionCatalog.find((s) => s.id === selectedSessionId) || sessionCatalog[0];
  const sessionContext  = screen === 'session' || sessionActive
    ? { selectedSession, sessionActive, scriptSlideIndex }
    : null;
  const avatarBackendUri = useMemo(() => buildLocalBackendUri(avatarHtmlBase), [avatarHtmlBase]);

  const getAuthorizedHeaders = useCallback(async () => {
    const headers = { 'Content-Type': 'application/json' };
    const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }, []);

  // ── Avatar URIs — same chat_id for shared server-side conversation thread ──
  const homeDockUri = useMemo(() => buildAvatarUri(avatarHtmlBase, {
    compact: '1', host: 'home-dock', autostart: '1', chat_id: avatarConversationId, tts_base: avatarBackendUri,
  }), [avatarHtmlBase, avatarConversationId, avatarBackendUri]);

  const sessionAvatarUri = useMemo(() => buildAvatarUri(avatarHtmlBase, {
    compact: '1', host: 'session-panel', session: selectedSessionId, chat_id: avatarConversationId, tts_base: avatarBackendUri,
  }), [avatarHtmlBase, selectedSessionId, avatarConversationId, avatarBackendUri]);

  // ── Load avatar.html asset ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const asset = Asset.fromModule(require('../../assets/avatar.html'));
        setAvatarLoadError('');
        if (asset.localUri || asset.uri) {
          setAvatarHtmlBase(asset.localUri || asset.uri);
        }
        await asset.downloadAsync();
        const uri = asset.localUri || asset.uri;
        if (!cancelled) {
          if (uri) {
            setAvatarHtmlBase(uri);
          } else {
            setAvatarLoadError(
              'Avatar asset resolved to no URI. Check metro.config.js has assetExts.push("html") and run `npx expo start --clear`.',
            );
          }
        }
      } catch (err) {
        if (!cancelled) {
          const detail = err && (err.message || String(err));
          setAvatarLoadError(
            `Avatar asset failed: ${detail || 'unknown error'}`,
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return onIdTokenChanged(auth, async (user) => {
      if (!user) {
        setApiAuthToken('');
        return;
      }
      try {
        const token = await user.getIdToken();
        setApiAuthToken(token || '');
      } catch {
        setApiAuthToken('');
      }
    });
  }, []);

  const handleAvatarWebViewError = useCallback((event) => {
    const native = event?.nativeEvent;
    const detail =
      (native && (native.description || native.statusCode || native.url)) ||
      'unknown WebView error';
    setAvatarLoadError(`WebView load failed: ${detail}`);
  }, []);

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

  // ── Pre-warm TTS cache for all static script texts ──
  // Fires once on mount so script segments are cached before the user starts a session.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!auth.currentUser) return;
      const texts = Object.values(SESSION_SCRIPTS).flat().map((s) => s.text);
      try {
        const headers = await getAuthorizedHeaders();
        if (cancelled) return;
        fetch(`${API_BASE_URL}/tts/prewarm`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ texts }),
        }).catch(() => {});
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [getAuthorizedHeaders]);

  // ── Handle messages sent from avatar.html via ReactNativeWebView.postMessage ──
  const handleWebViewMessage = useCallback((event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'native-speak') {
        // Suspend the WebView AudioContext so iOS doesn't block AVSpeechSynthesizer
        const suspendJs = `(function(){try{if(typeof audioState!=='undefined'&&audioState.ctx&&audioState.ctx.state==='running')audioState.ctx.suspend();}catch(e){}})();true;`;
        sessionWebViewRef.current?.injectJavaScript(suspendJs);
        homeDockWebViewRef.current?.injectJavaScript(suspendJs);
        const resumeJs = `(function(){try{if(typeof audioState!=='undefined'&&audioState.ctx&&audioState.ctx.state==='suspended')audioState.ctx.resume();}catch(e){}})();true;`;
        const resumeCtx = () => {
          sessionWebViewRef.current?.injectJavaScript(resumeJs);
          homeDockWebViewRef.current?.injectJavaScript(resumeJs);
        };
        // Small delay so AudioContext fully releases the audio session before TTS starts
        setTimeout(() => {
          Speech.stop();
          Speech.speak(msg.text, {
            rate: 0.9,
            voice: avatarVoiceId.current ?? undefined,
            onDone: resumeCtx,
            onStopped: resumeCtx,
            onError: resumeCtx,
          });
        }, 120);
      } else if (msg.type === 'native-stop-speech') {
        Speech.stop();
        const resumeJs = `(function(){try{if(typeof audioState!=='undefined'&&audioState.ctx&&audioState.ctx.state==='suspended')audioState.ctx.resume();}catch(e){}})();true;`;
        sessionWebViewRef.current?.injectJavaScript(resumeJs);
        homeDockWebViewRef.current?.injectJavaScript(resumeJs);
      }
    } catch {}
  }, []);

  // ── Inject a postMessage event into the session avatar WebView ──
  // avatar.html listens for { source: 'mindfulness-host', type, ... } on window.
  const injectAvatarCommand = useCallback((command) => {
    const payload = JSON.stringify({ source: 'mindfulness-host', ...command });
    sessionWebViewRef.current?.injectJavaScript(
      `(function(){try{window._nativeHostCommand(${payload});}catch(e){}})();true;`
    );
  }, []);

  const injectHomeDockCommand = useCallback((command) => {
    const payload = JSON.stringify({ source: 'mindfulness-host', ...command });
    homeDockWebViewRef.current?.injectJavaScript(
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
    if (apiAuthToken) {
      setTimeout(() => {
        injectAvatarCommand({ type: 'host-auth-token', token: apiAuthToken });
      }, 380);
    }
    if (sessionActive) {
      setTimeout(() => {
        const session  = sessionCatalog.find((s) => s.id === selectedSessionId) || sessionCatalog[0];
        if (session.kind === 'scripted') {
          const segments = SESSION_SCRIPTS[session.id] || [];
          const segment  = segments[scriptSlideIndex] || segments[0];
          if (segment) {
            injectAvatarCommand({ type: 'host-speak-script', text: segment.text });
            return;
          }
        }
        const prompt = buildSessionStartPrompt(session, scriptSlideIndex);
        injectAvatarCommand({ type: 'host-start-session', prompt, announce: false });
      }, 700);
    }
  }, [apiAuthToken, selectedSessionId, sessionActive, scriptSlideIndex, injectAvatarCommand]);

  const handleHomeDockLoad = useCallback(() => {
    setTimeout(() => {
      homeDockWebViewRef.current?.injectJavaScript(HIDE_CONTROLS_JS);
    }, 300);
    if (apiAuthToken) {
      setTimeout(() => {
        injectHomeDockCommand({ type: 'host-auth-token', token: apiAuthToken });
      }, 380);
    }
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
  }, [apiAuthToken, injectHomeDockCommand]);

  useEffect(() => {
    injectAvatarCommand({ type: 'host-auth-token', token: apiAuthToken });
    injectHomeDockCommand({ type: 'host-auth-token', token: apiAuthToken });
  }, [apiAuthToken, injectAvatarCommand, injectHomeDockCommand]);

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

  // Keep liveSession ref current so AppState/blur callbacks always see fresh values
  useEffect(() => {
    liveSession.current = { sessionActive, sessionStartTime, selectedSessionId, scriptSlideIndex };
  }, [sessionActive, sessionStartTime, selectedSessionId, scriptSlideIndex]);

  // Auto-record when app goes to background (phone call, home button, etc.)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background' || next === 'inactive') {
        _autoRecordSession();
      }
    });
    return () => sub.remove();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-record when the user switches to another tab
  useFocusEffect(
    useCallback(() => {
      return () => { _autoRecordSession(); };
    }, []), // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── Auth ──
  const handleLogout = useCallback(async () => {
    try { await signOut(auth); } catch { /* ignore */ }
  }, []);

  const toggleLanguage = useCallback(() => {
    void setLocale(locale === 'en' ? 'ko' : 'en');
  }, [locale, setLocale]);

  const handleSettings = useCallback(() => {
    Alert.alert(t('cardSettingsTitle'), 'Coming soon.');
  }, [t]);

  // ── Session logic ──

  // Silently record an in-progress session if it has run for ≥ 3 min without a
  // formal End — called on app-background and tab-blur to avoid losing that time.
  function _autoRecordSession() {
    const { sessionActive, sessionStartTime, selectedSessionId, scriptSlideIndex } = liveSession.current;
    if (!sessionActive || sessionRecorded.current) return;
    const elapsed = Math.max(0, Math.floor((Date.now() - (sessionStartTime || Date.now())) / 1000));
    if (elapsed < 180) return;
    const session = sessionCatalog.find((s) => s.id === selectedSessionId) || sessionCatalog[0];
    const segments = SESSION_SCRIPTS[session.id] || [];
    const completed = session.kind !== 'scripted' || scriptSlideIndex >= segments.length - 1;
    sessionRecorded.current = true;
    void recordCompletedSession({
      sessionId: session.id,
      sessionTitle: session.title,
      durationSeconds: elapsed,
      completed,
      metadata: { kind: session.kind, scriptSlideIndex, scriptSegments: segments.length, autoRecorded: true },
    }).catch((err) => console.warn('Auto-record session failed', err));
  }

  const openSession = useCallback((id) => {
    setSelectedSessionId(id);
    setScreen('session');
    // If switching to a different session while one is active, clear it silently
    if (sessionActive && selectedSessionId !== id) {
      setSessionActive(false);
      setSessionStatus('Not started');
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
    sessionRecorded.current = false;
    setSessionStartTime(Date.now());
    setSessionActive(true);
    setSessionStatus('Session active');
    if (session.kind === 'scripted') {
      setScriptSlideIndex(0);
    } else {
      setPlaceholderMessage(`${session.title} is intentionally empty right now.`);
    }
    setTimeout(() => {
      if (session.kind === 'scripted') {
        const segments = SESSION_SCRIPTS[session.id] || [];
        const segment  = segments[0];
        if (segment) {
          injectAvatarCommand({ type: 'host-speak-script', text: segment.text });
          return;
        }
      }
      const prompt = buildSessionStartPrompt(session, 0);
      injectAvatarCommand({ type: 'host-start-session', prompt, announce: false });
    }, 200);
  }, [selectedSessionId, injectAvatarCommand]);

  const endSession = useCallback(() => {
    if (!sessionActive) return;
    const elapsed = Math.max(0, Math.floor((Date.now() - (sessionStartTime || Date.now())) / 1000));
    setSessionDuration(formatDuration(elapsed));
    const session = sessionCatalog.find((s) => s.id === selectedSessionId) || sessionCatalog[0];
    const segments = SESSION_SCRIPTS[session.id] || [];
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
    if (!sessionRecorded.current) {
      sessionRecorded.current = true;
      void recordCompletedSession({
        sessionId: session.id,
        sessionTitle: session.title,
        durationSeconds: elapsed,
        completed,
        metadata: { kind: session.kind, scriptSlideIndex, scriptSegments: segments.length },
      }).catch((error) => {
        console.warn('Failed to record session tracking data', error);
      });
    }
    setSummaryVisible(true);
    setSessionActive(false);
    setSessionStatus('Not started');
    setSessionStartTime(null);
    setPlaceholderMessage('');
    setScriptSlideIndex(0);
    // Tell avatar the session ended — it posts a closing message in chat
    injectAvatarCommand({ type: 'host-end-session' });
  }, [sessionActive, sessionStartTime, selectedSessionId, scriptSlideIndex, injectAvatarCommand]);

  const goToNextScriptSegment = useCallback(() => {
    const segments = SESSION_SCRIPTS[selectedSessionId] || [];
    if (scriptSlideIndex >= segments.length - 1) {
      endSession();
      return;
    }
    const nextIndex = scriptSlideIndex + 1;
    setScriptSlideIndex(nextIndex);
    injectAvatarCommand({ type: 'host-speak-script', text: segments[nextIndex].text });
  }, [scriptSlideIndex, selectedSessionId, endSession, injectAvatarCommand]);

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
            <View style={styles.heroActions}>
              {!dockExpanded ? (
                <Pressable style={({ pressed }) => [styles.heroBtnPrimary, pressed && styles.btnPressed]} onPress={() => setDockExpanded(true)}>
                  <Text style={styles.heroBtnPrimaryText}>Open Guide</Text>
                </Pressable>
              ) : (
                <Pressable style={({ pressed }) => [styles.heroBtnPrimary, pressed && styles.btnPressed]} onPress={() => openSession(sessionCatalog[0].id)}>
                  <Text style={styles.heroBtnPrimaryText}>Start With Caregiver Fatigue</Text>
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
              const isReady   = s.kind !== 'placeholder';
              const selected  = selectedSessionId === s.id;
              const disabled  = sessionActive && selectedSessionId !== s.id;
              const completed = completedSessionIds.has(s.id);
              return (
                <Pressable
                  key={s.id}
                  style={({ pressed }) => [
                    styles.sessionTile,
                    isReady ? styles.sessionTileGuided : styles.sessionTilePlaceholder,
                    completed && styles.sessionTileCompleted,
                    selected && styles.sessionTileSelected,
                    disabled && styles.btnDisabled,
                    pressed && !disabled && styles.btnPressed,
                  ]}
                  onPress={() => openSession(s.id)}
                  disabled={disabled}
                >
                  <View style={styles.sessionTileTop}>
                    <Text style={styles.sessionNumber}>{s.number}</Text>
                    <View
                      style={[
                        styles.pill,
                        completed
                          ? styles.pillCompleted
                          : isReady
                            ? styles.pillGuided
                            : styles.pillEmpty,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          completed
                            ? styles.pillTextCompleted
                            : isReady
                              ? styles.pillTextGuided
                              : styles.pillTextEmpty,
                        ]}
                      >
                        {completed ? 'Completed' : isReady ? 'Ready' : 'Empty'}
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
              <View style={[styles.pill, selectedSession.kind !== 'placeholder' ? styles.pillGuided : styles.pillEmpty]}>
                <Text style={[styles.pillText, selectedSession.kind !== 'placeholder' ? styles.pillTextGuided : styles.pillTextEmpty]}>
                  {selectedSession.kind === 'scripted' ? 'Scripted session' : 'Empty session'}
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

          {selectedSession.kind === 'scripted' && sessionActive && (() => {
            const segments = SESSION_SCRIPTS[selectedSession.id] || [];
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
                    style={({ pressed }) => [styles.progressNextBtn, pressed && styles.btnPressed]}
                    onPress={goToNextScriptSegment}
                  >
                    <Text style={styles.startBtnText}>{isLast ? 'Finish' : 'Next →'}</Text>
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
          />

          {selectedSession.kind !== 'scripted' && !!placeholderMessage && (
            <View style={styles.placeholderCard}>
              <Text style={styles.placeholderTitle}>Template Reserved</Text>
              <Text style={styles.placeholderBody}>{placeholderMessage}</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* ── Floating avatar dock — always mounted, hidden on session screen ── */}
      <FloatingAvatarDock
        avatarUri={homeDockUri}
        avatarError={avatarLoadError}
        expanded={dockExpanded}
        visible={screen === 'home'}
        onToggle={() => setDockExpanded((v) => !v)}
        webViewRef={homeDockWebViewRef}
        onLoad={handleHomeDockLoad}
        onError={handleAvatarWebViewError}
        onMessage={handleWebViewMessage}
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
  hero:                { borderRadius: 16, backgroundColor: ThemeColor.BRAND, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12, gap: 8 },
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
  dockWebView:         { flex: 1, backgroundColor: '#0d1b36' },

  // Avatar loading state
  avatarLoading:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#0d1b36', paddingHorizontal: 16 },
  loadingOrb:        { width: 48, height: 48, borderRadius: 24, backgroundColor: ThemeColor.BRAND, opacity: 0.5 },
  loadingText:       { color: 'rgba(255,255,255,0.85)', fontSize: 13, textAlign: 'center' },
  loadingDetailText: { color: 'rgba(255,255,255,0.5)', fontSize: 10, textAlign: 'center' },

  // ── Session avatar (inline) ──
  sessionAvatarPanel: { height: SESSION_AVATAR_HEIGHT, borderRadius: 18, overflow: 'hidden', marginBottom: 16, backgroundColor: '#0d1b36', ...cardShadow },
  sessionWebView:     { flex: 1, backgroundColor: '#0d1b36' },

  // Session grid
  sectionTitle:           { fontSize: 20, fontWeight: '800', color: ThemeColor.TEXT_PRIMARY, marginBottom: 12, marginTop: 4 },
  sessionGrid:            { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  sessionTile:            { width: (SCREEN_WIDTH - 42) / 2, borderRadius: 14, padding: 14, gap: 6, borderWidth: 1.5, minHeight: 140 },
  sessionTileGuided:      { backgroundColor: '#e8edf7', borderColor: 'rgba(31,60,136,0.2)' },
  sessionTilePlaceholder: { backgroundColor: ThemeColor.WHITE, borderColor: 'rgba(31,60,136,0.1)' },
  sessionTileCompleted:   { backgroundColor: '#dcfce7', borderColor: '#16a34a' },
  sessionTileSelected:    { borderColor: ThemeColor.BRAND, borderWidth: 2 },
  sessionTileTop:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sessionNumber:          { fontSize: 20, fontWeight: '900', color: ThemeColor.BRAND },
  sessionTileTitle:       { fontSize: 14, fontWeight: '700', color: ThemeColor.TEXT_PRIMARY },
  sessionTileDesc:        { fontSize: 12, color: ThemeColor.HOME_CARD_TEXT, lineHeight: 17 },
  sessionTileMeta:        { fontSize: 11, color: ThemeColor.HOME_SUBTITLE, fontWeight: '600' },

  // Pills
  pill:              { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  pillGuided:        { backgroundColor: ThemeColor.BRAND },
  pillEmpty:         { backgroundColor: '#e8edf7' },
  pillCompleted:     { backgroundColor: '#16a34a' },
  pillText:          { fontSize: 10, fontWeight: '800' },
  pillTextGuided:    { color: ThemeColor.WHITE },
  pillTextEmpty:     { color: ThemeColor.HOME_SUBTITLE },
  pillTextCompleted: { color: ThemeColor.WHITE },

  // Info cards
  card:          { backgroundColor: ThemeColor.WHITE, padding: 20, borderRadius: 8, borderTopWidth: 4, borderTopColor: ThemeColor.BRAND, marginBottom: 14, ...cardShadow },
  cardTitle:     { fontSize: 18, fontWeight: '700', color: ThemeColor.BRAND, marginBottom: 5 },
  cardText:      { color: ThemeColor.HOME_CARD_TEXT, lineHeight: 22 },
  supportBtn:    { backgroundColor: '#2ecc71', padding: 15, borderRadius: 8, marginTop: 4, alignItems: 'center' },
  supportBtnText:{ color: ThemeColor.WHITE, fontWeight: '700', fontSize: 16 },

  // Chat FAB

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
