const WORKING_API_URL = "https://mindfulness-avatar.onrender.com";
const IS_LEGACY_RENDER_HOST = window.location.hostname === "multilingual-virtual-assistant.onrender.com";
const API_BASE_URL = IS_LEGACY_RENDER_HOST
  ? WORKING_API_URL
  : ((window.location.protocol === "http:" || window.location.protocol === "https:")
      ? window.location.origin
      : WORKING_API_URL);
const TOTAL_BREATHING_ROUNDS = 4;
const LANGUAGES = [
  { code: "en", name: "English",     gtLang: "en",    srLang: "en-US", dir: "ltr" },
  { code: "ko", name: "한국어",       gtLang: "ko",    srLang: "ko-KR", dir: "ltr" },
  { code: "es", name: "Español",     gtLang: "es",    srLang: "es-ES", dir: "ltr" },
  { code: "fr", name: "Français",    gtLang: "fr",    srLang: "fr-FR", dir: "ltr" },
  { code: "ja", name: "日本語",       gtLang: "ja",    srLang: "ja-JP", dir: "ltr" },
  { code: "zh", name: "中文",         gtLang: "zh-CN", srLang: "zh-CN", dir: "ltr" },
  { code: "ar", name: "العربية",     gtLang: "ar",    srLang: "ar-SA", dir: "rtl" },
  { code: "pt", name: "Português",   gtLang: "pt",    srLang: "pt-BR", dir: "ltr" },
  { code: "hi", name: "हिन्दी",       gtLang: "hi",    srLang: "hi-IN", dir: "ltr" },
  { code: "de", name: "Deutsch",     gtLang: "de",    srLang: "de-DE", dir: "ltr" },
  { code: "vi", name: "Tiếng Việt",  gtLang: "vi",    srLang: "vi-VN", dir: "ltr" },
];
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
  ],
  "body-scan": [
    { key: "bs1",  text: "Welcome. Find a comfortable position — lying down if possible, or seated with your back gently supported." },
    { key: "bs2",  text: "Allow your eyes to close, or let your gaze rest softly downward. Give yourself permission to arrive here." },
    { key: "bs3",  text: "Take a deep breath in through your nose... and release it slowly through your mouth. Begin to let go." },
    { key: "bs4",  text: "Let your breath return to its natural rhythm. In this practice, we will move attention slowly through the body — simply noticing, without trying to fix or change anything." },
    { key: "bs5",  text: "Bring your awareness all the way down to your feet. Notice the soles of your feet — any warmth, coolness, tingling, or pressure. Just observe." },
    { key: "bs6",  text: "Move your attention up to your ankles and calves. Are they holding any tension? You don't need to change it — simply be aware of it." },
    { key: "bs7",  text: "Now bring your awareness to your knees and thighs. Feel the weight of your legs. Notice where they make contact with the surface beneath you." },
    { key: "bs8",  text: "Let your attention travel to your hips and lower back. This area holds a lot for many of us. Breathe here for a moment." },
    { key: "bs9",  text: "Notice your belly. With each breath in, feel it rise. With each breath out, feel it fall. Let it be soft and easy." },
    { key: "bs10", text: "Bring awareness to your chest and the area around your heart. Notice the gentle rise and fall of your breathing. Feel your heartbeat if you can." },
    { key: "bs11", text: "Shift your attention to your upper back and shoulders. Imagine any held tension beginning to ease and dissolve with each exhale." },
    { key: "bs12", text: "Let awareness flow down through your arms — your elbows, forearms, wrists — all the way to your hands and fingertips. Notice any warmth or pulse here." },
    { key: "bs13", text: "Now bring your attention to your neck and throat. Notice if there is any tightness. Breathe into it gently, and let it soften." },
    { key: "bs14", text: "Shift your awareness to your jaw. Let it unclench. Let your tongue rest softly in your mouth, your lips part slightly." },
    { key: "bs15", text: "Notice the muscles around your eyes and across your forehead. Allow them to smooth and relax, as if a gentle hand were resting there." },
    { key: "bs16", text: "Now expand your awareness to take in your whole body at once — from the top of your head to the tips of your toes." },
    { key: "bs17", text: "Your whole body, breathing. Resting. Alive." },
    { key: "bs18", text: "If you noticed any areas of tension or discomfort, that is completely natural. The practice is to notice with kindness — not to judge." },
    { key: "bs19", text: "Stay here in this whole-body awareness for a moment. Let your breath be easy. Let your body be held by whatever surface you are resting on." },
    { key: "bs20", text: "You are exactly where you need to be, right now." },
    { key: "bs21", text: "Take a slow, deep breath in... and let it all go." },
    { key: "bs22", text: "Begin to gently deepen your breathing. Wiggle your fingers and toes to start reawakening the body." },
    { key: "bs23", text: "Slowly roll your neck from side to side if it feels comfortable. Take your time." },
    { key: "bs24", text: "When you are ready, gently open your eyes. There is no need to rush." },
    { key: "bs25", text: "Thank you for taking this time to listen to your body. Carry this sense of ease with you into the rest of your day." }
  ],
  "five-senses": [
    { key: "fs1",  text: "Welcome to this grounding practice. Whenever your mind feels scattered or anxious, this exercise can bring you back to the present moment." },
    { key: "fs2",  text: "Find a comfortable position — seated, standing, or lying down. Feel your feet make contact with the floor." },
    { key: "fs3",  text: "Take one slow breath in through your nose... and a long exhale out. Good. Let's begin." },
    { key: "fs4",  text: "We are going to work through your five senses, one by one. Each one is an anchor to the present moment — to right here, right now." },
    { key: "fs5",  text: "Begin with sight. Look around your environment and notice five things you can see. Take your time — really look at each one." },
    { key: "fs6",  text: "Notice colors, textures, shadows, shapes. Let your eyes rest on each thing for a moment. One... Two... Three... Four... Five." },
    { key: "fs7",  text: "Now bring your attention to touch. Notice four sensations you can physically feel — in your body or through your skin." },
    { key: "fs8",  text: "Perhaps the weight of your hands in your lap. The temperature of the air. The pressure of the chair beneath you. A texture of fabric against your skin. Notice four." },
    { key: "fs9",  text: "Now tune your attention to sound. Notice three sounds in your environment right now." },
    { key: "fs10", text: "Let your hearing open up — near sounds and distant ones, loud and quiet. Simply notice three of them without judgment." },
    { key: "fs11", text: "Now shift to smell. Bring your awareness to what you can smell — or simply to the quality of the air as you breathe in." },
    { key: "fs12", text: "Take a slow inhale. Maybe you notice something faint — a scent in the room, the freshness of the air, or simply the warmth of your breath. Notice two things." },
    { key: "fs13", text: "And finally, notice one thing you can taste. Perhaps a lingering flavor, or simply the neutral sensation of your mouth and tongue." },
    { key: "fs14", text: "Now take a moment to bring all five senses together. You are seeing, feeling, hearing, smelling, and tasting — all at once." },
    { key: "fs15", text: "You are fully, completely here. Right in this moment." },
    { key: "fs16", text: "Notice how different this feels from when we started. That slight sense of steadiness, of being grounded — that is real." },
    { key: "fs17", text: "This technique works by redirecting your nervous system from a stress response toward present-moment awareness." },
    { key: "fs18", text: "You can use this anywhere — before a difficult meeting, in a moment of panic, or simply as a daily reset." },
    { key: "fs19", text: "Let's close with three slow, intentional breaths. Breathe in through your nose... and out through your mouth." },
    { key: "fs20", text: "Again. In through the nose... and slowly out." },
    { key: "fs21", text: "One more. A long inhale... and a complete exhale." },
    { key: "fs22", text: "When you feel unsteady, return to your senses. Five things you see, four you feel, three you hear, two you smell, one you taste." },
    { key: "fs23", text: "The present moment is always here, waiting for you." },
    { key: "fs24", text: "Well done. Thank you for practicing today." }
  ],
  "loving-kindness": [
    { key: "lk1",  text: "Welcome to this loving kindness meditation, sometimes called Metta practice." },
    { key: "lk2",  text: "In this practice, we gently cultivate feelings of warmth and goodwill — toward ourselves first, and then outward toward others." },
    { key: "lk3",  text: "Find a comfortable seat. Let your hands rest in your lap, and allow your eyes to close." },
    { key: "lk4",  text: "Take a few slow, natural breaths. Let each exhale release a little of whatever you are carrying today." },
    { key: "lk5",  text: "We begin with ourselves — not out of selfishness, but because genuine compassion must include ourselves to be whole." },
    { key: "lk6",  text: "Picture yourself as you are right now. You may find this easy, or it may feel a little uncomfortable. Either is fine." },
    { key: "lk7",  text: "Silently repeat these phrases for yourself: May I be safe. May I be healthy. May I be happy. May I live with ease." },
    { key: "lk8",  text: "Allow the words to settle without forcing any particular feeling. Simply planting the intention is enough." },
    { key: "lk9",  text: "Once more: May I be safe. May I be healthy. May I be happy. May I live with ease." },
    { key: "lk10", text: "Now bring to mind someone you love easily — a close friend, a family member, a child, or a pet whose presence fills you with warmth." },
    { key: "lk11", text: "Picture them clearly. Let yourself feel the natural affection you have for them." },
    { key: "lk12", text: "Send them these same wishes: May you be safe. May you be healthy. May you be happy. May you live with ease." },
    { key: "lk13", text: "Feel that warmth flowing from your heart toward them, like a gentle light reaching across the distance between you." },
    { key: "lk14", text: "Now bring to mind a neutral person — someone you encounter in daily life but don't know well. A neighbor, a cashier, a stranger on the street." },
    { key: "lk15", text: "This person, like you, has a full inner life — joys and sorrows, hopes and fears. Offer them the same kindness: May you be safe. May you be healthy. May you be happy. May you live with ease." },
    { key: "lk16", text: "Now, if you feel ready, bring to mind someone who has been difficult for you. You don't need to condone anything they have done." },
    { key: "lk17", text: "Simply recognize that they too carry suffering. They too wish to be free from pain. As best you can, offer: May you be safe. May you be healthy. May you be happy. May you live with ease." },
    { key: "lk18", text: "If this feels too hard today, simply return to yourself. Compassion is a practice, not a test." },
    { key: "lk19", text: "Finally, let your awareness expand to include all beings everywhere — every person, every creature on this Earth." },
    { key: "lk20", text: "May all beings be safe. May all beings be healthy. May all beings be happy. May all beings live with ease." },
    { key: "lk21", text: "Feel the full circle of this compassion — beginning with your own heart, rippling outward to all of life." },
    { key: "lk22", text: "Rest in this for a moment. Breathing. Open. Kind." },
    { key: "lk23", text: "Notice how you feel. Perhaps there is a gentle warmth, or a sense of openness, or simply quiet." },
    { key: "lk24", text: "Take a slow, full breath in... and release it softly." },
    { key: "lk25", text: "The kindness you offered today is real. Carry it with you. Thank you for practicing." }
  ],
  "mindful-walking": [
    { key: "mw1",  text: "Welcome to this mindful walking practice. You will need a quiet space to walk slowly — even just a few steps back and forth is enough." },
    { key: "mw2",  text: "Before you begin moving, stand still for a moment. Feel your feet firmly on the ground." },
    { key: "mw3",  text: "Take a slow breath in... and release. Let your body arrive here." },
    { key: "mw4",  text: "Become aware of your posture. Stand gently tall, with your shoulders relaxed and your gaze soft — looking slightly ahead and downward." },
    { key: "mw5",  text: "Now bring your full attention to your feet. Notice the weight of your body flowing down through your legs and into the ground beneath you." },
    { key: "mw6",  text: "Begin to walk very slowly. Much slower than you normally would. With each step, notice the subtle movements involved." },
    { key: "mw7",  text: "As you lift your foot — feel the heel rise, then the ball of the foot, then the toes." },
    { key: "mw8",  text: "As you place your foot down — feel the heel make contact first, then the arch, then the toes settling." },
    { key: "mw9",  text: "Lift. Move. Place. That is all. Lift. Move. Place." },
    { key: "mw10", text: "If your mind wanders — to tasks, to worries, to the feeling of awkwardness — simply notice, and gently bring your attention back to your feet." },
    { key: "mw11", text: "Now begin to coordinate your breathing with your steps. Breathe in for two or three steps... and out for two or three steps." },
    { key: "mw12", text: "Let your arms hang naturally at your sides. You don't need to do anything with them. Simply walk." },
    { key: "mw13", text: "Notice the ground beneath you. Hard or soft. Warm or cool. Steady." },
    { key: "mw14", text: "Notice your surroundings without getting pulled into them. Let them simply be the backdrop to your movement." },
    { key: "mw15", text: "Continue walking slowly. Each step is complete in itself. Each step is an arrival." },
    { key: "mw16", text: "If you feel restless or silly, that is perfectly natural. Just notice the feeling, and keep walking." },
    { key: "mw17", text: "This practice is about noticing what is always happening but usually ignored — the miracle of movement, the gift of a body that carries you through the world." },
    { key: "mw18", text: "Begin to let your pace slow even further. Take one final slow walk across your space, with complete attention." },
    { key: "mw19", text: "Now come to a gentle stop. Stand still once more. Feel your feet on the ground." },
    { key: "mw20", text: "Take a slow breath in... and a long breath out." },
    { key: "mw21", text: "Notice how you feel in this moment compared to when you began. Even a short period of mindful movement can shift something." },
    { key: "mw22", text: "Thank you for moving with intention today. You can carry this quality of attention into any walk you take." }
  ],
  "seated-stretch": [
    { key: "ss1",  text: "Welcome to this seated stretch reset. This practice releases tension held in the body — no equipment needed, just your chair." },
    { key: "ss2",  text: "Sit toward the front edge of your seat so your feet are flat on the floor, hip-width apart." },
    { key: "ss3",  text: "Take a slow breath in... and release. Let your shoulders drop away from your ears." },
    { key: "ss4",  text: "Let's begin with your shoulders. Breathe in and raise them toward your ears... then roll them back and down on the exhale. Repeat this a few times at your own pace." },
    { key: "ss5",  text: "Now roll them forward — up, forward, and down. Let any tightness begin to ease." },
    { key: "ss6",  text: "Gently turn your head to the right, as if looking over your shoulder. Hold for a breath or two. Then slowly return to center." },
    { key: "ss7",  text: "Now turn your head to the left. Hold. Return to center." },
    { key: "ss8",  text: "Lower your right ear gently toward your right shoulder, stretching the left side of your neck. Keep your left shoulder relaxed. Breathe into the stretch." },
    { key: "ss9",  text: "Slowly return to center, then lower your left ear toward your left shoulder. Breathe into the right side of your neck." },
    { key: "ss10", text: "Come back to center. Take a breath." },
    { key: "ss11", text: "Interlace your fingers and stretch your arms out in front of you, palms facing away. Feel the stretch across your upper back and shoulders." },
    { key: "ss12", text: "Then reach your arms above your head, palms facing up. Take a full breath in as you stretch upward... and release your arms down on the exhale." },
    { key: "ss13", text: "Twist gently to the right, placing your left hand on your right knee and your right hand on the back of the chair. Breathe into the twist." },
    { key: "ss14", text: "Slowly unwind and repeat on the other side — twist to the left, right hand on left knee, left hand behind. Breathe." },
    { key: "ss15", text: "Come back to center." },
    { key: "ss16", text: "Extend your right leg straight out in front of you, flexing and pointing your foot a few times to wake up the ankle and calf. Then place it back down." },
    { key: "ss17", text: "Now the left leg — extend, flex, point. Then return." },
    { key: "ss18", text: "Interlace your fingers behind your lower back if that is comfortable, and gently open the chest, drawing the shoulder blades together. Take a breath here." },
    { key: "ss19", text: "Release. Let your hands rest in your lap. Round your spine gently, tucking your chin — like you are hugging yourself from the inside. Take a breath." },
    { key: "ss20", text: "Slowly come back to a neutral, tall seat." },
    { key: "ss21", text: "Take one final, full breath in through your nose — letting your belly expand, then your chest — and a long, slow exhale." },
    { key: "ss22", text: "Well done. You have given your body a reset. Carry this sense of ease into whatever comes next." }
  ],
  "mindful-listening": [
    { key: "ml1",  text: "Welcome to this mindful listening practice. Sound is always present, but we rarely give it our full attention." },
    { key: "ml2",  text: "Find a comfortable seated position. You can close your eyes for this practice, which will help you focus more deeply on what you hear." },
    { key: "ml3",  text: "Take a slow breath in... and out. Let your body settle." },
    { key: "ml4",  text: "For a moment, simply notice that there is sound in your environment. You don't need to identify or analyze it — just notice that sound exists." },
    { key: "ml5",  text: "Now expand your awareness to the full soundscape around you. Like opening a window, let all sounds in — near and far, loud and soft." },
    { key: "ml6",  text: "Notice the nearest sound to you. What is its quality? Is it sharp or soft? Constant or intermittent? Simply observe." },
    { key: "ml7",  text: "Now let your awareness travel to the farthest sound you can detect. Perhaps a distant car, the wind, or voices from another room. Notice it without chasing it." },
    { key: "ml8",  text: "Let your hearing move fluidly between near and far — like a wide-angle lens, taking in the whole field of sound." },
    { key: "ml9",  text: "Rather than focusing on what something IS, try to notice the pure qualities of the sounds. High or low. Smooth or jagged. Loud or quiet." },
    { key: "ml10", text: "Notice that sounds arise... and pass away. Each sound has a beginning, a duration, and an end." },
    { key: "ml11", text: "If you find yourself labeling sounds — 'that's a car, that's a bird' — simply notice the label and return to the raw experience of hearing." },
    { key: "ml12", text: "You may notice silence between sounds. Rest in that silence too. It is a kind of sound in its own right." },
    { key: "ml13", text: "Now bring your attention to the sound of your own breathing. The subtle rush of air on the inhale. The softer release of the exhale." },
    { key: "ml14", text: "Notice the rhythm of your breath as a sound. Steady. Alive." },
    { key: "ml15", text: "Expand again to the full soundscape — your breath and the environment together." },
    { key: "ml16", text: "Notice that all of these sounds are happening at once, and your awareness can hold all of them without effort." },
    { key: "ml17", text: "For a moment, let go of all effort. Simply sit, and let sound wash over you without grasping or pushing anything away." },
    { key: "ml18", text: "This is the nature of mindful listening — open, receptive, effortless." },
    { key: "ml19", text: "Slowly bring your attention back to the room. Take a breath." },
    { key: "ml20", text: "Notice how different sound feels when you listen with full attention rather than half an ear." },
    { key: "ml21", text: "This quality of listening — spacious, open, without judgment — can also be offered to the people in your life." },
    { key: "ml22", text: "When you are ready, gently open your eyes. Thank you for listening today." }
  ],
  "affirmation-breath": [
    { key: "ab1",  text: "Welcome to this affirmation breath practice. We will pair a calming phrase with the natural rhythm of your breath." },
    { key: "ab2",  text: "Find a comfortable, upright position. Let your hands rest gently in your lap." },
    { key: "ab3",  text: "Close your eyes and take a few natural breaths. Simply arrive here." },
    { key: "ab4",  text: "In this practice, we use a short phrase — an affirmation — as a focus for each inhale and exhale. The words ride on the breath." },
    { key: "ab5",  text: "Let's begin. As you breathe in, silently say: 'I am breathing in calm.' As you breathe out: 'I am releasing tension.'" },
    { key: "ab6",  text: "Breathe in calm... and breathe out tension. Let the words ride gently on the breath." },
    { key: "ab7",  text: "Again. Breathe in calm... breathe out tension." },
    { key: "ab8",  text: "Now let's shift the phrase. Breathe in and silently say: 'I am present.' Breathe out: 'I let go.'" },
    { key: "ab9",  text: "I am present... I let go." },
    { key: "ab10", text: "I am present... I let go." },
    { key: "ab11", text: "Now try: 'I am enough.' Breathe those words in. And on the exhale: 'Everything is okay.'" },
    { key: "ab12", text: "I am enough... Everything is okay." },
    { key: "ab13", text: "I am enough... Everything is okay." },
    { key: "ab14", text: "One more pairing. Breathe in: 'I choose peace.' Breathe out: 'I release what I cannot control.'" },
    { key: "ab15", text: "I choose peace... I release what I cannot control." },
    { key: "ab16", text: "I choose peace... I release what I cannot control." },
    { key: "ab17", text: "Now let go of any specific phrases. Simply breathe — naturally, easily — and let your body feel the truth of those words." },
    { key: "ab18", text: "You are calm. You are present. You are enough. You are at peace." },
    { key: "ab19", text: "Take one final, deep breath — breathing in everything you need... and releasing on the exhale everything you do not." },
    { key: "ab20", text: "Well done. These affirmations are yours to carry. Return to them whenever you need a moment of steadiness." }
  ],
  "stress-release": [
    { key: "sr1",  text: "Welcome to this stress release check-in. We are going to take a few minutes to notice, name, and soften what you are carrying right now." },
    { key: "sr2",  text: "Find a comfortable position. You don't need to prepare or fix anything — simply arrive as you are." },
    { key: "sr3",  text: "Take a slow breath in through your nose... and release it fully through your mouth. Let that be a signal to yourself that it is okay to pause." },
    { key: "sr4",  text: "Let's start by checking in with your body. Scan from your shoulders down to your stomach. Where are you holding tension right now?" },
    { key: "sr5",  text: "Maybe your jaw is tight, or your shoulders are raised. Maybe there is a knot in your chest or a heaviness in your gut. Simply notice." },
    { key: "sr6",  text: "Whatever you find, allow it to be there. You don't have to make it go away. Simply acknowledge: 'I notice tension here.'" },
    { key: "sr7",  text: "Now check in with your thoughts. What has been occupying your mind today? Without analyzing, notice the general tone — busy, worried, scattered, numb?" },
    { key: "sr8",  text: "Name it. 'My mind feels __.' Naming an experience loosens its grip on us." },
    { key: "sr9",  text: "Now check in with your emotions. Not what you think you should be feeling, but what is actually here. Frustration? Sadness? Anxiety? Exhaustion?" },
    { key: "sr10", text: "Name that too. 'Right now, I feel __.' There is no wrong answer." },
    { key: "sr11", text: "Take a breath. You have just done something important — you looked honestly at your own inner experience." },
    { key: "sr12", text: "Now let's begin to soften. On your next exhale, imagine releasing a little of the tension in your body. Not all of it — just a little." },
    { key: "sr13", text: "And another exhale — let a little more go." },
    { key: "sr14", text: "Breathe in steadiness... and breathe out what you no longer need." },
    { key: "sr15", text: "Place one hand on your chest and one on your belly. Feel both rise and fall as you breathe." },
    { key: "sr16", text: "This contact — your own hand on your own body — is an act of self-compassion. Notice how it feels." },
    { key: "sr17", text: "Take three slow breaths here, at your own pace. There is no rush." },
    { key: "sr18", text: "The stress you are carrying is real. The challenges are real. And you, right now, are handling them." },
    { key: "sr19", text: "You are more capable than you realize. You have gotten through difficult days before. You will get through this too." },
    { key: "sr20", text: "Take one more breath — full and slow — and let your hands return to your lap." },
    { key: "sr21", text: "Whenever you feel overwhelmed today, return to this: three slow breaths, a hand on your heart, and the knowledge that this moment will pass." },
    { key: "sr22", text: "Thank you for checking in with yourself. That act of awareness is the foundation of everything." }
  ],
  "morning-intention": [
    { key: "mi1",  text: "Good morning. Welcome to this intention-setting practice. A few mindful minutes at the start of the day can set a completely different tone for everything that follows." },
    { key: "mi2",  text: "Find a comfortable seated position. If you can, do this before looking at your phone or starting any tasks." },
    { key: "mi3",  text: "Take a slow breath in through your nose... and a full exhale out. Let your body wake up gently." },
    { key: "mi4",  text: "For a moment, simply notice that a new day has begun. Whatever happened yesterday is in the past. This moment is fresh." },
    { key: "mi5",  text: "Check in briefly with your body. How are you feeling this morning — physically? Rested, tired, somewhere in between? Simply notice without judgment." },
    { key: "mi6",  text: "Now check in with your mood. What is the emotional tone of your morning? Again, just notice — no need to change anything." },
    { key: "mi7",  text: "Now let's turn to intention. An intention is different from a goal. A goal is something you achieve. An intention is a quality you want to bring to your day." },
    { key: "mi8",  text: "Ask yourself: How do I want to show up today? What quality do I most want to bring to my actions and interactions?" },
    { key: "mi9",  text: "Perhaps it is patience. Or presence. Or courage. Or kindness. Or simply ease." },
    { key: "mi10", text: "Let one word or phrase come to you. Don't overthink it. Trust what arises." },
    { key: "mi11", text: "Hold that intention gently in your mind. Say it to yourself once: 'Today, I intend to be __.' Make it yours." },
    { key: "mi12", text: "Take a breath and let that intention settle into your body. Where do you feel it? In your chest? Your shoulders? Your breath?" },
    { key: "mi13", text: "Now think of one small, concrete action you can take this morning that aligns with that intention. Just one small thing." },
    { key: "mi14", text: "You don't need to change the whole day. You only need to take the next step." },
    { key: "mi15", text: "Take another breath. Feel the quiet readiness in your body — the natural alertness of a new morning." },
    { key: "mi16", text: "Whatever this day brings, you have already begun it with awareness and intention. That changes things." },
    { key: "mi17", text: "Take a final deep breath in, filling your lungs completely... and a long, releasing exhale." },
    { key: "mi18", text: "Gently open your eyes. The day is waiting." },
    { key: "mi19", text: "Return to your intention whenever you need it — write it down, say it aloud, or simply hold it in your heart." },
    { key: "mi20", text: "Good morning. May today be exactly what you need it to be." }
  ],
  "sleep-wind-down": [
    { key: "sw1",  text: "Welcome to this sleep wind-down practice. You have made it through another day. It is time to let the day go and prepare your body and mind for rest." },
    { key: "sw2",  text: "Find a comfortable position in bed, lying on your back if possible. Let your legs uncross, and let your arms rest at your sides." },
    { key: "sw3",  text: "Allow your eyes to close. There is nothing you need to do right now. Nothing to check. Nowhere to be." },
    { key: "sw4",  text: "Take a slow breath in through your nose, letting your belly rise... and a long, slow exhale through slightly parted lips. Let the day begin to fade." },
    { key: "sw5",  text: "Again. Breathe in... and all the way out." },
    { key: "sw6",  text: "Let's briefly release any tension from the body. Begin with your face — let your jaw unclench, your forehead smooth, your eyes soften." },
    { key: "sw7",  text: "Feel your head sink heavily into the pillow. Let your neck release." },
    { key: "sw8",  text: "Relax your shoulders. Feel them drop toward the mattress. Let your arms be heavy." },
    { key: "sw9",  text: "Your chest and belly — soft. Rising and falling with each breath, without effort." },
    { key: "sw10", text: "Your lower back — let it release any tightness and sink into the bed." },
    { key: "sw11", text: "Your legs — heavy, warm, completely relaxed. Your feet — still." },
    { key: "sw12", text: "Your whole body, heavy and at rest." },
    { key: "sw13", text: "Now let's quiet the mind. If thoughts arise — worries, to-do lists, replays of the day — simply notice them, and gently let them go. You can return to them tomorrow." },
    { key: "sw14", text: "Imagine each thought as a cloud drifting slowly across a night sky. You watch it pass, and the sky clears again." },
    { key: "sw15", text: "Let your breathing become even slower and softer. You are safe. You are warm. You are taken care of." },
    { key: "sw16", text: "With each exhale, feel yourself sinking a little deeper into relaxation." },
    { key: "sw17", text: "There is nowhere to go. Nothing to solve. You have done enough today." },
    { key: "sw18", text: "Let your awareness become soft and diffuse — like the moment just before sleep, when thoughts begin to blur." },
    { key: "sw19", text: "Simply breathe. In... and out. In... and out." },
    { key: "sw20", text: "You are drifting. The day is behind you. Rest is here." },
    { key: "sw21", text: "Let go of any effort to fall asleep. Simply be here, comfortable and still." },
    { key: "sw22", text: "In... and out." },
    { key: "sw23", text: "Let sleep come to you naturally, in its own time. You are already resting." },
    { key: "sw24", text: "Good night. You did well today." }
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
    previewDescription: "Set down the responsibility you have been carrying for a few minutes. This gentle practice helps you soften self-criticism, restore steadiness, and make room for your own needs.",
    zodiac: "Aries",
    kind: "scripted",
    duration: "~4 min · 6 segments"
  },
  {
    id: "body-scan",
    title: "Body Scan",
    description: "A guided check-in from head to toe.",
    previewDescription: "Bring your attention slowly through the body, noticing pressure, warmth, tension, and ease without needing to change anything. A grounding choice when your mind feels busy or disconnected.",
    zodiac: "Taurus",
    kind: "scripted",
    duration: "~7 min · 25 steps"
  },
  {
    id: "five-senses",
    title: "Five Senses Grounding",
    description: "A grounding exercise to reconnect with the present moment.",
    previewDescription: "Use sight, sound, touch, smell, and taste to return to what is happening right now. This short sensory reset can help interrupt spiraling thoughts and settle an overwhelmed nervous system.",
    zodiac: "Gemini",
    kind: "scripted",
    duration: "~6 min · 24 steps"
  },
  {
    id: "mindful-breathing",
    title: "Mindful Breathing",
    description: "A foundational breath awareness practice you can use anywhere.",
    previewDescription: "Follow the natural rhythm of your inhale and exhale without forcing it into a pattern. A simple practice for creating a little space before a meeting, conversation, or difficult moment.",
    zodiac: "Cancer",
    kind: "scripted",
    duration: "~5 min · 5 segments"
  },
  {
    id: "loving-kindness",
    title: "Loving Kindness",
    description: "A compassion-focused mindfulness practice.",
    previewDescription: "Repeat quiet wishes of safety, ease, and care for yourself and the people in your life. Use it when you feel hardened, lonely, or in need of a kinder inner voice.",
    zodiac: "Leo",
    kind: "scripted",
    duration: "~7 min · 25 steps"
  },
  {
    id: "mindful-walking",
    title: "Mindful Walking",
    description: "A light movement practice with full attention on each step.",
    previewDescription: "Let the pace of your steps become an anchor as you notice balance, movement, and the space around you. A good reset when sitting still feels difficult or restless energy needs somewhere to go.",
    zodiac: "Virgo",
    kind: "scripted",
    duration: "~6 min · 22 steps"
  },
  {
    id: "seated-stretch",
    title: "Seated Stretch Reset",
    description: "Gentle seated stretches to release tension.",
    previewDescription: "Ease common tension in the shoulders, neck, back, and hips with movements that can be done from a chair. Designed for a quiet desk break or a low-energy afternoon reset.",
    zodiac: "Libra",
    kind: "scripted",
    duration: "~6 min · 22 steps"
  },
  {
    id: "mindful-listening",
    title: "Mindful Listening",
    description: "A practice that centers attention through sound.",
    previewDescription: "Notice near and distant sounds without judging or chasing them. This listening practice can help widen your attention when thoughts feel loud and bring you back into your surroundings.",
    zodiac: "Scorpio",
    kind: "scripted",
    duration: "~6 min · 22 steps"
  },
  {
    id: "affirmation-breath",
    title: "Affirmation Breath",
    description: "Pair a calming phrase with your breath.",
    previewDescription: "Match a steady breath with a phrase that gives you support, such as ‘I can take this one moment at a time.’ A small ritual for building reassurance before the day gathers speed.",
    zodiac: "Sagittarius",
    kind: "scripted",
    duration: "~5 min · 20 steps"
  },
  {
    id: "stress-release",
    title: "Stress Release Check-In",
    description: "Notice, name, and soften what you are carrying.",
    previewDescription: "Pause long enough to identify what is asking for your attention instead of holding it as one undifferentiated weight. This reflective reset helps you name the pressure and choose a gentler next step.",
    zodiac: "Capricorn",
    kind: "scripted",
    duration: "~6 min · 22 steps"
  },
  {
    id: "morning-intention",
    title: "Morning Intention",
    description: "A simple intention-setting practice for the day.",
    previewDescription: "Start with a quality you want to bring into the next few hours—patience, focus, openness, or care. This is a brief way to choose how you want to meet the day rather than rush straight into it.",
    zodiac: "Aquarius",
    kind: "scripted",
    duration: "~5 min · 20 steps"
  },
  {
    id: "sleep-wind-down",
    title: "Sleep Wind Down",
    description: "A quiet practice to prepare your body for rest.",
    previewDescription: "Slow the transition from a full day into a softer, quieter state. Gentle body awareness and unhurried breathing help you release the urge to solve anything before sleep.",
    zodiac: "Pisces",
    kind: "scripted",
    duration: "~7 min · 24 steps"
  }
].map((session, index) => ({
  ...session,
  number: String(index + 1).padStart(2, "0")
}));

const MOOD_OPTIONS = [
  { key: "low", emoji: "😔", label: "Low", value: 1, prompt: "What’s weighing on you today? You don’t have to solve it all at once." },
  { key: "tender", emoji: "😕", label: "Tender", value: 2, prompt: "What feels a little harder than usual today?" },
  { key: "steady", emoji: "😐", label: "Steady", value: 3, prompt: "Steady is enough. What would help you stay grounded today?" },
  { key: "good", emoji: "🙂", label: "Good", value: 4, prompt: "What’s one thing that helped you feel good today?" },
  { key: "bright", emoji: "😊", label: "Bright", value: 5, prompt: "What happened that you want to remember from today?" }
];

const DAILY_FORTUNES = [
  "A small pause will reveal the next right step.",
  "Your attention is a form of care—place it somewhere gentle today.",
  "Something ordinary will feel quietly meaningful when you slow down for it.",
  "You do not need a perfect day to make room for one good moment.",
  "Let ease be useful. You are allowed to move at a kinder pace.",
  "The feeling you make space for today will have less power over you tomorrow."
];

function getMoodOptions() {
  return MOOD_OPTIONS.map((mood) => ({
    ...mood,
    label: lt(`mood${mood.key[0].toUpperCase()}${mood.key.slice(1)}`),
    prompt: lt(`moodPrompt${mood.key[0].toUpperCase()}${mood.key.slice(1)}`)
  }));
}

function getDailyFortunes() {
  return window.MC_LOCALES?.[state.locale]?.fortunes || window.MC_LOCALES?.en?.fortunes || DAILY_FORTUNES;
}

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
  Pisces: { points: [[12,17],[27,29],[42,20],[55,34],[70,22],[86,12],[78,44]], edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[4,6]] }
};

function renderZodiacConstellation(sign) {
  const constellation = ZODIAC_CONSTELLATIONS[sign] || ZODIAC_CONSTELLATIONS.Aries;
  const lines = constellation.edges.map(([from, to]) => {
    const [x1, y1] = constellation.points[from];
    const [x2, y2] = constellation.points[to];
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
  }).join("");
  const stars = constellation.points.map(([cx, cy], index) => `<circle cx="${cx}" cy="${cy}" r="${index % 3 === 0 ? 2 : 1.4}" />`).join("");
  return `<svg class="zodiac-constellation" viewBox="0 0 100 60" role="img" aria-label="${escapeHtml(sign)} constellation">${lines}${stars}</svg>`;
}

const initialChatMessage =
  "Hi, I can answer general mindfulness questions and explain any session tile in the app. Open a session first if you want details about that specific practice.";

const translations = {
  en: {
    signInWelcome: "Welcome back", signInSubtitle: "Sign in to continue your mindfulness practice.",
    email: "Email", password: "Password", signInButton: "Sign In", signUpPrompt: "Create an account",
    forgotPassword: "Forgot password?",
    forgotPasswordEnterEmail: "Enter your email first so we know where to send the reset link.",
    forgotPasswordSent: "If this email is linked to an account, we'll send a password reset link.",
    forgotPasswordNotLinked: "This email is not linked to an account.",
    forgotPasswordFailed: "We could not send a reset email right now. Please confirm the address and try again.",
    signInFooter: "Multilingual mindfulness support for calmer daily routines.",
    headerTitle: "Mindfulness Sessions", logoutBtn: "Logout",
    chatHeader: "Mindfulness Virtual Assistant", card1Title: "About the Assistant",
    card1Text: "Our AI is trained to guide you through mindfulness exercises.",
    card3Title: "Recent Updates", card3Text: "We improved the processing features recently.",
    card4Title: "Quick Settings", card4Text: "Customize your interface and accessibility options here.",
    supportBtn: "Support Ticket", language: "Language", start: "Start",
    miniGuide: "Mini Guide", miniGuideTitle: "Mindfulness guide", hide: "Hide", hideMiniGuide: "Hide mini guide",
    profileTitle: "Profile", personalInformation: "Personal Information",
    settings: "Settings", support: "Support", logOut: "Log Out",
    firstName: "First Name", lastName: "Last Name", dateOfBirth: "Date of Birth",
    confirmPassword: "Confirm Password", signUpHeader: "Create Account",
    signUpSubmit: "Create Account", backToSignIn: "Already have an account? Sign in",
  },
  ko: {
    signInWelcome: "다시 오신 것을 환영합니다", signInSubtitle: "명상 연습을 계속하려면 로그인하세요.",
    email: "이메일", password: "비밀번호", signInButton: "로그인", signUpPrompt: "계정 만들기",
    forgotPassword: "비밀번호를 잊으셨나요?",
    forgotPasswordEnterEmail: "재설정 링크를 보낼 이메일을 먼저 입력해 주세요.",
    forgotPasswordSent: "이 이메일이 계정에 연결되어 있다면 비밀번호 재설정 링크를 보내드립니다.",
    forgotPasswordNotLinked: "이 이메일은 계정에 연결되어 있지 않습니다.",
    forgotPasswordFailed: "지금은 재설정 이메일을 보낼 수 없습니다. 이메일 주소를 확인한 뒤 다시 시도해 주세요.",
    signInFooter: "차분한 일상을 위한 다국어 명상 지원.",
    headerTitle: "마음챙김 세션", logoutBtn: "로그아웃",
    chatHeader: "명상 가상 비서", card1Title: "비서 정보",
    card1Text: "저희 AI는 명상 연습을 안내하도록 교육되었습니다.",
    card3Title: "최신 업데이트", card3Text: "최근 처리 기능을 개선했습니다.",
    card4Title: "빠른 설정", card4Text: "여기에서 인터페이스와 접근성 설정을 사용자 정의하십시오.",
    supportBtn: "지원 티켓", language: "언어", start: "시작",
    miniGuide: "미니 가이드", miniGuideTitle: "마음챙김 가이드", hide: "숨기기", hideMiniGuide: "미니 가이드 숨기기",
    profileTitle: "프로필", personalInformation: "개인 정보",
    settings: "설정", support: "지원", logOut: "로그아웃",
    firstName: "이름", lastName: "성", dateOfBirth: "생년월일",
    confirmPassword: "비밀번호 확인", signUpHeader: "계정 만들기",
    signUpSubmit: "계정 만들기", backToSignIn: "이미 계정이 있으신가요? 로그인",
  },
  es: {
    signInWelcome: "Bienvenido de nuevo", signInSubtitle: "Inicia sesión para continuar tu práctica de mindfulness.",
    email: "Correo electrónico", password: "Contraseña", signInButton: "Iniciar sesión", signUpPrompt: "Crear una cuenta",
    signInFooter: "Apoyo multilingüe de mindfulness para una vida más tranquila.",
    headerTitle: "Sesiones de mindfulness", logoutBtn: "Cerrar sesión",
    chatHeader: "Asistente virtual de mindfulness", card1Title: "Acerca del asistente",
    card1Text: "Nuestra IA está entrenada para guiarte en ejercicios de mindfulness.",
    card3Title: "Actualizaciones recientes", card3Text: "Recientemente mejoramos las funciones de procesamiento.",
    card4Title: "Ajustes rápidos", card4Text: "Personaliza tu interfaz y opciones de accesibilidad aquí.",
    supportBtn: "Ticket de soporte", language: "Idioma", start: "Comenzar",
    miniGuide: "Mini guía", miniGuideTitle: "Guía de mindfulness", hide: "Ocultar", hideMiniGuide: "Ocultar mini guía",
    profileTitle: "Perfil", personalInformation: "Información personal",
    settings: "Configuración", support: "Soporte", logOut: "Cerrar sesión",
    firstName: "Nombre", lastName: "Apellido", dateOfBirth: "Fecha de nacimiento",
    confirmPassword: "Confirmar contraseña", signUpHeader: "Crear cuenta",
    signUpSubmit: "Crear cuenta", backToSignIn: "¿Ya tienes una cuenta? Inicia sesión",
  },
  fr: {
    signInWelcome: "Bienvenue", signInSubtitle: "Connectez-vous pour continuer votre pratique de pleine conscience.",
    email: "E-mail", password: "Mot de passe", signInButton: "Se connecter", signUpPrompt: "Créer un compte",
    signInFooter: "Soutien multilingue pour des routines quotidiennes plus sereines.",
    headerTitle: "Séances de pleine conscience", logoutBtn: "Déconnexion",
    chatHeader: "Assistant virtuel de pleine conscience", card1Title: "À propos de l'assistant",
    card1Text: "Notre IA est formée pour vous guider dans des exercices de pleine conscience.",
    card3Title: "Mises à jour récentes", card3Text: "Nous avons récemment amélioré les fonctionnalités.",
    card4Title: "Paramètres rapides", card4Text: "Personnalisez votre interface et options d'accessibilité ici.",
    supportBtn: "Ticket de support", language: "Langue", start: "Commencer",
    miniGuide: "Mini guide", miniGuideTitle: "Guide de pleine conscience", hide: "Masquer", hideMiniGuide: "Masquer le mini guide",
    profileTitle: "Profil", personalInformation: "Informations personnelles",
    settings: "Paramètres", support: "Support", logOut: "Se déconnecter",
    firstName: "Prénom", lastName: "Nom de famille", dateOfBirth: "Date de naissance",
    confirmPassword: "Confirmer le mot de passe", signUpHeader: "Créer un compte",
    signUpSubmit: "Créer un compte", backToSignIn: "Vous avez déjà un compte ? Connectez-vous",
  },
  ja: {
    signInWelcome: "おかえりなさい", signInSubtitle: "マインドフルネスの練習を続けるにはサインインしてください。",
    email: "メールアドレス", password: "パスワード", signInButton: "サインイン", signUpPrompt: "アカウントを作成",
    signInFooter: "穏やかな日常のための多言語マインドフルネスサポート。",
    headerTitle: "マインドフルネスセッション", logoutBtn: "ログアウト",
    chatHeader: "マインドフルネス仮想アシスタント", card1Title: "アシスタントについて",
    card1Text: "AIはマインドフルネスの練習をガイドするよう訓練されています。",
    card3Title: "最近の更新", card3Text: "最近、処理機能を改善しました。",
    card4Title: "クイック設定", card4Text: "インターフェースとアクセシビリティのオプションをカスタマイズしてください。",
    supportBtn: "サポートチケット", language: "言語", start: "開始",
    miniGuide: "ミニガイド", miniGuideTitle: "マインドフルネスガイド", hide: "非表示", hideMiniGuide: "ミニガイドを非表示",
    profileTitle: "プロフィール", personalInformation: "個人情報",
    settings: "設定", support: "サポート", logOut: "ログアウト",
    firstName: "名", lastName: "姓", dateOfBirth: "生年月日",
    confirmPassword: "パスワードを確認", signUpHeader: "アカウントを作成",
    signUpSubmit: "アカウントを作成", backToSignIn: "すでにアカウントをお持ちですか？サインイン",
  },
  zh: {
    signInWelcome: "欢迎回来", signInSubtitle: "登录以继续您的正念练习。",
    email: "电子邮件", password: "密码", signInButton: "登录", signUpPrompt: "创建账户",
    signInFooter: "多语言正念支持，助您日常更从容平静。",
    headerTitle: "正念课程", logoutBtn: "退出登录",
    chatHeader: "正念虚拟助手", card1Title: "关于助手",
    card1Text: "我们的AI经过训练，引导您进行正念练习。",
    card3Title: "最近更新", card3Text: "我们最近改进了处理功能。",
    card4Title: "快速设置", card4Text: "在此自定义您的界面和辅助功能选项。",
    supportBtn: "支持工单", language: "语言", start: "开始",
    miniGuide: "迷你指南", miniGuideTitle: "正念指南", hide: "隐藏", hideMiniGuide: "隐藏迷你指南",
    profileTitle: "个人资料", personalInformation: "个人信息",
    settings: "设置", support: "支持", logOut: "退出登录",
    firstName: "名字", lastName: "姓氏", dateOfBirth: "出生日期",
    confirmPassword: "确认密码", signUpHeader: "创建账户",
    signUpSubmit: "创建账户", backToSignIn: "已有账户？立即登录",
  },
  ar: {
    signInWelcome: "مرحباً بعودتك", signInSubtitle: "سجّل الدخول لمواصلة ممارسة اليقظة الذهنية.",
    email: "البريد الإلكتروني", password: "كلمة المرور", signInButton: "تسجيل الدخول", signUpPrompt: "إنشاء حساب",
    signInFooter: "دعم متعدد اللغات لليقظة الذهنية من أجل روتين يومي أهدأ.",
    headerTitle: "جلسات اليقظة الذهنية", logoutBtn: "تسجيل الخروج",
    chatHeader: "مساعد اليقظة الذهنية الافتراضي", card1Title: "حول المساعد",
    card1Text: "تم تدريب الذكاء الاصطناعي لإرشادك خلال تمارين اليقظة الذهنية.",
    card3Title: "التحديثات الأخيرة", card3Text: "قمنا مؤخراً بتحسين ميزات المعالجة.",
    card4Title: "الإعدادات السريعة", card4Text: "خصّص واجهتك وخيارات إمكانية الوصول هنا.",
    supportBtn: "تذكرة الدعم", language: "اللغة", start: "ابدأ",
    miniGuide: "الدليل المصغر", miniGuideTitle: "دليل اليقظة", hide: "إخفاء", hideMiniGuide: "إخفاء الدليل المصغر",
    profileTitle: "الملف الشخصي", personalInformation: "المعلومات الشخصية",
    settings: "الإعدادات", support: "الدعم", logOut: "تسجيل الخروج",
    firstName: "الاسم الأول", lastName: "اسم العائلة", dateOfBirth: "تاريخ الميلاد",
    confirmPassword: "تأكيد كلمة المرور", signUpHeader: "إنشاء حساب",
    signUpSubmit: "إنشاء حساب", backToSignIn: "هل لديك حساب بالفعل؟ سجّل الدخول",
  },
  pt: {
    signInWelcome: "Bem-vindo de volta", signInSubtitle: "Entre para continuar sua prática de mindfulness.",
    email: "E-mail", password: "Senha", signInButton: "Entrar", signUpPrompt: "Criar uma conta",
    signInFooter: "Suporte multilíngue de mindfulness para rotinas diárias mais calmas.",
    headerTitle: "Sessões de mindfulness", logoutBtn: "Sair",
    chatHeader: "Assistente virtual de mindfulness", card1Title: "Sobre o assistente",
    card1Text: "Nossa IA é treinada para guiá-lo em exercícios de mindfulness.",
    card3Title: "Atualizações recentes", card3Text: "Melhoramos recentemente os recursos de processamento.",
    card4Title: "Configurações rápidas", card4Text: "Personalize sua interface e opções de acessibilidade aqui.",
    supportBtn: "Ticket de suporte", language: "Idioma", start: "Começar",
    miniGuide: "Mini guia", miniGuideTitle: "Guia de mindfulness", hide: "Ocultar", hideMiniGuide: "Ocultar mini guia",
    profileTitle: "Perfil", personalInformation: "Informações pessoais",
    settings: "Configurações", support: "Suporte", logOut: "Sair",
    firstName: "Nome", lastName: "Sobrenome", dateOfBirth: "Data de nascimento",
    confirmPassword: "Confirmar senha", signUpHeader: "Criar conta",
    signUpSubmit: "Criar conta", backToSignIn: "Já tem uma conta? Entre",
  },
  hi: {
    signInWelcome: "वापस स्वागत है", signInSubtitle: "अपनी माइंडफुलनेस प्रैक्टिस जारी रखने के लिए साइन इन करें।",
    email: "ईमेल", password: "पासवर्ड", signInButton: "साइन इन", signUpPrompt: "खाता बनाएं",
    signInFooter: "शांत दैनिक दिनचर्या के लिए बहुभाषी माइंडफुलनेस सहायता।",
    headerTitle: "माइंडफुलनेस सत्र", logoutBtn: "लॉग आउट",
    chatHeader: "माइंडफुलनेस वर्चुअल असिस्टेंट", card1Title: "असिस्टेंट के बारे में",
    card1Text: "हमारा AI माइंडफुलनेस अभ्यासों में मार्गदर्शन करने के लिए प्रशिक्षित है।",
    card3Title: "हालिया अपडेट", card3Text: "हमने हाल ही में प्रोसेसिंग सुविधाओं में सुधार किया है।",
    card4Title: "त्वरित सेटिंग्स", card4Text: "यहां अपना इंटरफेस और एक्सेसिबिलिटी विकल्प कस्टमाइज़ करें।",
    supportBtn: "सपोर्ट टिकट", language: "भाषा", start: "शुरू करें",
    miniGuide: "मिनी गाइड", miniGuideTitle: "माइंडफुलनेस गाइड", hide: "छिपाएं", hideMiniGuide: "मिनी गाइड छिपाएं",
    profileTitle: "प्रोफ़ाइल", personalInformation: "व्यक्तिगत जानकारी",
    settings: "सेटिंग्स", support: "सहायता", logOut: "लॉग आउट",
    firstName: "पहला नाम", lastName: "अंतिम नाम", dateOfBirth: "जन्म तिथि",
    confirmPassword: "पासवर्ड की पुष्टि करें", signUpHeader: "खाता बनाएं",
    signUpSubmit: "खाता बनाएं", backToSignIn: "पहले से खाता है? साइन इन करें",
  },
  de: {
    signInWelcome: "Willkommen zurück", signInSubtitle: "Melden Sie sich an, um Ihre Achtsamkeitspraxis fortzusetzen.",
    email: "E-Mail", password: "Passwort", signInButton: "Anmelden", signUpPrompt: "Konto erstellen",
    signInFooter: "Mehrsprachige Achtsamkeitsunterstützung für ruhigere Alltagsroutinen.",
    headerTitle: "Achtsamkeitssitzungen", logoutBtn: "Abmelden",
    chatHeader: "Virtueller Achtsamkeitsassistent", card1Title: "Über den Assistenten",
    card1Text: "Unsere KI ist darauf trainiert, Sie durch Achtsamkeitsübungen zu führen.",
    card3Title: "Aktuelle Updates", card3Text: "Wir haben die Verarbeitungsfunktionen kürzlich verbessert.",
    card4Title: "Schnelleinstellungen", card4Text: "Passen Sie hier Ihre Oberfläche und Zugänglichkeitsoptionen an.",
    supportBtn: "Support-Ticket", language: "Sprache", start: "Starten",
    miniGuide: "Mini-Guide", miniGuideTitle: "Achtsamkeitsguide", hide: "Ausblenden", hideMiniGuide: "Mini-Guide ausblenden",
    profileTitle: "Profil", personalInformation: "Persönliche Informationen",
    settings: "Einstellungen", support: "Support", logOut: "Abmelden",
    firstName: "Vorname", lastName: "Nachname", dateOfBirth: "Geburtsdatum",
    confirmPassword: "Passwort bestätigen", signUpHeader: "Konto erstellen",
    signUpSubmit: "Konto erstellen", backToSignIn: "Haben Sie bereits ein Konto? Anmelden",
  },
  vi: {
    signInWelcome: "Chào mừng trở lại", signInSubtitle: "Đăng nhập để tiếp tục thực hành chánh niệm của bạn.",
    email: "Email", password: "Mật khẩu", signInButton: "Đăng nhập", signUpPrompt: "Tạo tài khoản",
    signInFooter: "Hỗ trợ chánh niệm đa ngôn ngữ cho thói quen hàng ngày bình yên hơn.",
    headerTitle: "Các phiên chánh niệm", logoutBtn: "Đăng xuất",
    chatHeader: "Trợ lý chánh niệm ảo", card1Title: "Về trợ lý",
    card1Text: "AI của chúng tôi được đào tạo để hướng dẫn bạn qua các bài tập chánh niệm.",
    card3Title: "Cập nhật gần đây", card3Text: "Chúng tôi đã cải thiện các tính năng xử lý gần đây.",
    card4Title: "Cài đặt nhanh", card4Text: "Tùy chỉnh giao diện và tùy chọn trợ năng của bạn tại đây.",
    supportBtn: "Phiếu hỗ trợ", language: "Ngôn ngữ", start: "Bắt đầu",
    miniGuide: "Hướng dẫn nhỏ", miniGuideTitle: "Hướng dẫn chánh niệm", hide: "Ẩn", hideMiniGuide: "Ẩn hướng dẫn nhỏ",
    profileTitle: "Hồ sơ", personalInformation: "Thông tin cá nhân",
    settings: "Cài đặt", support: "Hỗ trợ", logOut: "Đăng xuất",
    firstName: "Tên", lastName: "Họ", dateOfBirth: "Ngày sinh",
    confirmPassword: "Xác nhận mật khẩu", signUpHeader: "Tạo tài khoản",
    signUpSubmit: "Tạo tài khoản", backToSignIn: "Đã có tài khoản? Đăng nhập",
  },
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
  languageModalVisible: false,
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
  sessionCompleted: false,
  leaveWarningVisible: false,
  sessionStatus: "Not started",
  sessionStartTime: null,
  placeholderMessage: "",
  summaryModalVisible: false,
  sessionSummary: "",
  sessionDuration: "",
  sessionTrackingMessage: "",
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
  avatarDockVisible: false,
  avatarDockX: null,
  avatarDockY: null,
  avatarDockWidth: null,
  avatarDockHeight: null,
  userStats: null,
  userStatsLoading: false,
  userStatsUnsubscribe: null,
  avatarTranscripts: {},
  guideProfile: "",
  expandedHistoryId: "",
  userSessions: [],
  userSessionsLoading: false,
  userSessionsUnsubscribe: null,
  statsMonthKey: "",
  statsSelectedDateKey: "",
  moodEntries: [],
  moodTodayKey: "",
  moodStorageKey: "",
  dailyFortune: "",
  fortuneSpinning: false,
  settings: {
    notifications: false,
    theme: "light"
  },
  settingsBanner: { type: "", text: "" },
  personalInfoDraft: {
    firstName: "",
    lastName: "",
    dateOfBirth: ""
  },
  personalInfoDirty: false,
  personalInfoSaving: false,
  personalInfoStatus: { type: "", text: "" }
};

function createSessionId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getMoodDateKey(date = new Date()) {
  return getLocalDateKey(date);
}

function getMoodStorageKey(user) {
  const identity = user?.uid || user?.email || "guest";
  return `mindfulness-moods-${identity}`;
}

function loadMoodState(user) {
  const storageKey = getMoodStorageKey(user);
  state.moodStorageKey = storageKey;
  state.moodEntries = [];
  state.moodTodayKey = "";
  state.dailyFortune = "";
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    state.moodEntries = Array.isArray(saved.entries)
      ? saved.entries.filter((entry) => /^\d{4}-\d{2}-\d{2}$/.test(entry.dateKey) && MOOD_OPTIONS.some((mood) => mood.key === entry.mood)).slice(-365)
      : [];
    state.moodTodayKey = saved.moodTodayKey || "";
    state.dailyFortune = saved.locale === state.locale && saved.fortuneDateKey === getMoodDateKey() ? String(saved.dailyFortune || "") : "";
  } catch {
    state.moodEntries = [];
  }
}

function persistMoodState() {
  if (!state.moodStorageKey) return;
  try {
    localStorage.setItem(state.moodStorageKey, JSON.stringify({
      entries: state.moodEntries.slice(-365),
      moodTodayKey: state.moodTodayKey,
      dailyFortune: state.dailyFortune,
      fortuneDateKey: state.dailyFortune ? getMoodDateKey() : "",
      locale: state.locale
    }));
  } catch {
    // Mood check-ins remain usable if local storage is unavailable.
  }
}

function recordMood(moodKey) {
  const mood = getMoodOptions().find((option) => option.key === moodKey);
  if (!mood) return;
  const dateKey = getMoodDateKey();
  const nextEntries = state.moodEntries.filter((entry) => entry.dateKey !== dateKey);
  nextEntries.push({ dateKey, mood: mood.key });
  state.moodEntries = nextEntries.slice(-365);
  state.moodTodayKey = mood.key;
  persistMoodState();
  state.avatarDockVisible = true;
  render();
  void sendMoodFollowUp(mood);
}

async function sendMoodFollowUp(mood) {
  const startedAt = Date.now();
  while (!avatarReadyState[AVATAR_HOST_HOME] && Date.now() - startedAt < 20000) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!avatarReadyState[AVATAR_HOST_HOME]) return;
  await syncAvatarAuthState(AVATAR_HOST_HOME);
  queueAvatarCommand(AVATAR_HOST_HOME, {
    type: "host-send-text",
    text: `I’m feeling ${mood.label.toLowerCase()} today. Respond warmly and ask me one brief, natural follow-up question about what is behind that feeling. Do not answer the question for me or give advice unless I ask for it.`
  });
}

const FORTUNE_SPIN_MS = 1150;

/* Spin the reel in place. This deliberately does not call render(): a full
   re-render rebuilds the whole app shell mid-animation, which reads as the
   page reloading. Row height is measured rather than hardcoded, because the
   compact machine and the fortune card use different line heights. */
function spinDailyFortune() {
  if (state.fortuneSpinning) return;
  const fortunes = getDailyFortunes();
  if (!fortunes.length) return;
  const chosen = fortunes[Math.floor(Math.random() * fortunes.length)];

  const row = document.querySelector(".fortune-row");
  const reel = row && row.querySelector(".fortune-machine-reel");
  const button = row && row.querySelector('[data-action="spin-fortune"]');
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!row || !reel || reduceMotion || typeof reel.animate !== "function") {
    state.dailyFortune = chosen;
    state.fortuneSpinning = false;
    persistMoodState();
    render();
    return;
  }

  state.fortuneSpinning = true;

  const strip = [];
  for (let index = 0; index < 5; index += 1) {
    strip.push(fortunes[Math.floor(Math.random() * fortunes.length)]);
  }
  strip.push(chosen);
  reel.innerHTML = strip.map((line) => `<span>${escapeHtml(line)}</span>`).join("");

  row.classList.add("is-spinning");
  let restoreLabel = "";
  if (button) {
    restoreLabel = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<span aria-hidden="true">✦</span> ${escapeHtml(lt("spinning"))}`;
  }

  const rowHeight = reel.firstElementChild
    ? reel.firstElementChild.getBoundingClientRect().height
    : 0;
  const animation = reel.animate(
    [{ transform: "translateY(0)" }, { transform: `translateY(-${rowHeight * (strip.length - 1)}px)` }],
    { duration: FORTUNE_SPIN_MS, easing: "cubic-bezier(.16,.86,.26,1)", fill: "forwards" }
  );

  const settle = () => {
    state.dailyFortune = chosen;
    state.fortuneSpinning = false;
    persistMoodState();
    animation.cancel();
    row.classList.remove("is-spinning");
    reel.innerHTML = `<span>${escapeHtml(chosen)}</span>`;
    if (button) {
      button.disabled = false;
      button.innerHTML = restoreLabel;
    }
  };
  animation.finished.then(settle, settle);
}

function renderMoodPulse() {
  const moodOptions = getMoodOptions();
  const fortunes = getDailyFortunes();
  const todayMood = moodOptions.find((mood) => mood.key === state.moodTodayKey);
  const recentEntries = state.moodEntries.slice(-7);
  const average = recentEntries.length
    ? (recentEntries.reduce((sum, entry) => sum + (moodOptions.find((mood) => mood.key === entry.mood)?.value || 0), 0) / recentEntries.length).toFixed(1)
    : "—";

  return `
    <section class="home-wellness-grid" aria-label="${escapeHtml(lt("dailyMindfulnessTools"))}">
      <section class="home-tool-card mood-pulse" aria-labelledby="mood-pulse-title">
        <div class="mood-pulse-head">
          <div>
            <h2 id="mood-pulse-title">${escapeHtml(lt("quickCheckIn"))}</h2>
            <p>${escapeHtml(lt("homeWelcomeQuestion"))}</p>
          </div>
        <span class="mood-average">${recentEntries.length ? `${escapeHtml(lt("sevenDayAverage"))} <strong>${average}/5</strong>` : escapeHtml(lt("homeWelcomeQuestion"))}</span>
        </div>
        <div class="mood-options" role="group" aria-label="${escapeHtml(lt("chooseFeeling"))}">
          ${moodOptions.map((mood) => `
            <button class="mood-option ${state.moodTodayKey === mood.key ? "is-selected" : ""}" data-action="record-mood" data-mood="${mood.key}" type="button" aria-label="${escapeHtml(lt("feelingLabel", { feeling: mood.label }))}" aria-pressed="${state.moodTodayKey === mood.key}">
              <span aria-hidden="true">${mood.emoji}</span><small>${mood.label}</small>
            </button>
          `).join("")}
        </div>
        ${todayMood ? `<p class="mood-prompt"><strong>${todayMood.emoji} ${escapeHtml(lt("moodSaved"))}</strong> ${escapeHtml(lt("guidePreparingFollowUp"))}</p>` : `<p class="mood-prompt">${escapeHtml(lt("chooseClosestFeeling"))}</p>`}
      </section>
      <section class="home-tool-card fortune-card" aria-labelledby="fortune-card-title">
        <div class="fortune-card-copy">
          <h2 id="fortune-card-title">${escapeHtml(lt("fortuneMachine"))}</h2>
          <p>${escapeHtml(lt("fortuneDescription"))}</p>
        </div>
        <div class="fortune-row ${state.fortuneSpinning ? "is-spinning" : ""}">
          <div class="fortune-machine" aria-live="polite" aria-label="${escapeHtml(lt("fortuneMachine"))}">
            <div class="fortune-slot-marquee"><span>FORTUNE MACHINE</span><i aria-hidden="true"></i></div>
            <div class="fortune-machine-window"><div class="fortune-machine-reel">${state.dailyFortune && !state.fortuneSpinning ? `<span>${escapeHtml(state.dailyFortune)}</span>` : fortunes.slice(0, 4).map((fortune) => `<span>${escapeHtml(fortune)}</span>`).join("")}</div></div>
            <button class="fortune-button" data-action="spin-fortune" type="button" ${state.fortuneSpinning ? "disabled" : ""}><span aria-hidden="true">✦</span> ${state.fortuneSpinning ? escapeHtml(lt("spinning")) : escapeHtml(lt("spinFortune"))}</button>
            <div class="fortune-slot-base"><span>${escapeHtml(lt("yourMessageToday"))}</span><i aria-hidden="true"></i></div>
            <span class="fortune-slot-lever" aria-hidden="true"><i></i></span>
          </div>
        </div>
      </section>
    </section>
  `;
}

async function getCurrentUserIdToken() {
  const user = window._fb?.getCurrentUser?.();
  if (!user || typeof user.getIdToken !== "function") {
    return "";
  }

  try {
    return await user.getIdToken();
  } catch {
    return "";
  }
}

async function getApiHeaders(baseHeaders = {}) {
  const headers = { ...baseHeaders };
  const token = await getCurrentUserIdToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
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
  if (seconds < 60) return "<1 min";
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

function getFirebaseTrackingErrorMessage(error) {
  const code = error?.code || "";
  if (code === "permission-denied" || code === "firestore/permission-denied") {
    return "Firebase blocked this save with permission-denied. Your Firestore rules likely do not allow this session write.";
  }
  if (code === "unauthenticated" || code === "firestore/unauthenticated") {
    return "Firebase rejected the save because the session is no longer authenticated. Please sign in again.";
  }
  if (code === "unavailable" || code === "firestore/unavailable") {
    return "Firebase is temporarily unavailable. Please try again in a moment.";
  }
  const rawMessage = (error && (error.message || error.details)) ? String(error.message || error.details) : "";
  if (rawMessage) {
    return `Active Stats save failed: ${rawMessage}`;
  }
  return "We couldn't save this session to Active Stats. Please try again.";
}

async function recordSessionCompletion({ selectedSession, elapsedSeconds, completed, metadata = {} }) {
  if (!selectedSession) {
    return { ok: false, message: "No session was selected, so nothing was saved." };
  }
  if (elapsedSeconds <= 0) {
    return { ok: false, message: "This session ended before any time elapsed, so it was not added to your stats." };
  }
  if (!window._fb) {
    return { ok: false, message: "Session tracking is not ready yet. Please wait a moment and try again." };
  }
  if (!state.currentUser) {
    return { ok: false, message: "Sign in before starting a session if you want it saved to Active Stats." };
  }
  try {
    await window._fb.recordCompletedSession({
      sessionId: selectedSession.id,
      sessionTitle: selectedSession.title,
      durationSeconds: elapsedSeconds,
      completed,
      metadata,
    });
    return { ok: true, message: "Saved to Active Stats." };
  } catch (error) {
    console.warn("Failed to record session tracking data", error);
    return { ok: false, message: getFirebaseTrackingErrorMessage(error) };
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

function renderAppIcon(name) {
  const paths = {
    home: '<path d="M3 11.5 12 4l9 7.5v8a1 1 0 0 1-1 1h-5.2v-6.2H9.2v6.2H4a1 1 0 0 1-1-1z"/>',
    stats: '<path d="M5 20V10m7 10V4m7 16v-7"/><path d="M3 20h18"/>',
    profile: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
    spark: '<path d="m12 2 1.5 5.2L19 9l-5.5 1.8L12 16l-1.5-5.2L5 9l5.5-1.8z"/><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7z"/>',
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    logout: '<path d="M10 5H5v14h5m4-4 4-3-4-3m4 3H9"/>',
    identity: '<rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="11" r="2.2"/><path d="M5.8 16.6a3.6 3.6 0 0 1 6.4 0M14.5 10.5H18m-3.5 3.5H18"/>',
    settings: '<circle cx="12" cy="12" r="3.2"/><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6"/>',
    support: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.6a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.8-.9 1.4v.4"/><path d="M12 17.2h.01"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.3 2.4 3.5 5.4 3.5 9S14.3 18.6 12 21c-2.3-2.4-3.5-5.4-3.5-9S9.7 5.4 12 3"/>'
  };
  return `<svg class="app-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.spark}</svg>`;
}

const BRAND = {
  name: "Respire",
  wordmark: "RESPIRE"
};

/* The Respire mark: a hanko — an ink seal block,
   ruled with a fine gold keyline, carrying a mitsudomoe: three commas
   turning around a common centre. Colours come from CSS custom properties
   so the block inverts for the dark theme. The geometry lives as a sprite symbol in index.html. */
function renderBrandMark() {
  return `<svg class="brand-mark" viewBox="0 0 64 64" role="img" aria-label="${BRAND.name}"><use href="#respire-seal-mark"/></svg>`;
}

/* The crest on its own, for the coloured guide surfaces where a solid
   seal block would fight the container. */
function renderBrandLetter() {
  return `<svg class="brand-letter" viewBox="0 0 64 64" aria-hidden="true"><use href="#respire-glyph"/></svg>`;
}

function renderBrandLockup(extraClass = "") {
  return `<span class="app-brand-mark">${renderBrandMark()}</span><span class="app-brand-word ${extraClass}"><strong>${escapeHtml(BRAND.wordmark)}</strong></span>`;
}

function t(key) {
  return window.MC_LOCALES?.[state.locale]?.ui?.[key] || translations[state.locale]?.[key] || translations.en[key] || key;
}

function formatLocalized(template, values = {}) {
  return String(template).replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
  );
}

function lt(key, values = {}) {
  const template = window.MC_LOCALES?.[state.locale]?.ui?.[key]
    || window.MC_LOCALES?.en?.ui?.[key]
    || key;
  return formatLocalized(template, values);
}

function getSessionScripts(sessionId) {
  return window.MC_LOCALES?.[state.locale]?.sessions?.[sessionId]
    || window.MC_LOCALES?.en?.sessions?.[sessionId]
    || SESSION_SCRIPTS[sessionId]
    || [];
}

function localizeSession(session) {
  if (!session) return session;
  const translated = window.MC_LOCALES?.[state.locale]?.catalog?.[session.id]
    || window.MC_LOCALES?.en?.catalog?.[session.id]
    || {};
  return { ...session, ...translated };
}

function renderLangSelect(cssClass) {
  return `<select class="${cssClass} notranslate" data-action="set-language" aria-label="${escapeHtml(t('language'))}" translate="no">
    ${LANGUAGES.map(l => `<option value="${l.code}"${state.locale === l.code ? " selected" : ""}>${l.name}</option>`).join("")}
  </select>`;
}

const LANGUAGE_STORAGE_KEY = "mc_language_preference_v1";

function isSupportedLocale(locale) {
  return LANGUAGES.some((language) => language.code === locale);
}

function getLocalLanguagePreference() {
  try {
    const locale = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isSupportedLocale(locale) ? locale : "";
  } catch {
    return "";
  }
}

function persistLocalLanguagePreference(locale) {
  if (!isSupportedLocale(locale)) return;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, locale);
  } catch {
    // The account copy remains authoritative when browser storage is unavailable.
  }
}

function setLanguagePreference(locale, { dismissModal = false, shouldRender = true } = {}) {
  if (!isSupportedLocale(locale)) return;
  const localeChanged = state.locale !== locale;
  state.locale = locale;
  if (localeChanged) state.dailyFortune = "";
  if (dismissModal) state.languageModalVisible = false;
  persistLocalLanguagePreference(locale);
  void persistRemoteSettings({ locale });
  applyLocaleToDocument(locale);
  if (localeChanged) scheduleGoogleRetranslate();
  if (shouldRender) render();
}

function applyLocaleToDocument(locale) {
  const lang = LANGUAGES.find(l => l.code === locale) || LANGUAGES[0];
  document.documentElement.lang = locale;
  document.documentElement.dir = lang.dir;
  const shouldPreventGoogleTranslate = locale === "en";
  document.documentElement.classList.toggle("notranslate", shouldPreventGoogleTranslate);
  document.documentElement.setAttribute("translate", shouldPreventGoogleTranslate ? "no" : "yes");
  if (document.body) {
    document.body.classList.toggle("notranslate", shouldPreventGoogleTranslate);
    document.body.setAttribute("translate", shouldPreventGoogleTranslate ? "no" : "yes");
  }
}

let _gtTimer = null;
let _gtResetTimer = null;
let _lastGoogleTranslateLocale = "en";
function scheduleGoogleRetranslate() {
  clearTimeout(_gtResetTimer);
  if (state.locale === "en") {
    resetGoogleTranslate();
    scheduleGoogleTranslateResetRetries();
    return;
  }
  _lastGoogleTranslateLocale = state.locale;
  clearTimeout(_gtTimer);
  _gtTimer = setTimeout(_doGoogleRetranslate, 150);
}

function clearGoogleTranslateCookie(name, domain, path = "/") {
  const domainPart = domain ? `; domain=${domain}` : "";
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}${domainPart}`;
}

function setGoogleTranslateCookie(value, domain, path = "/") {
  const domainPart = domain ? `; domain=${domain}` : "";
  document.cookie = `googtrans=${value}; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=${path}${domainPart}`;
}

function getGoogleTranslateDomains() {
  const hostname = window.location.hostname;
  const domains = ["", hostname];
  const parts = hostname.split(".").filter(Boolean);
  if (parts.length > 1) {
    domains.push(`.${parts.slice(-2).join(".")}`);
    domains.push(`.${hostname}`);
  }
  return [...new Set(domains)];
}

function getGoogleTranslateCookiePaths() {
  const languagePaths = LANGUAGES.flatMap((lang) => {
    const gtLang = lang.gtLang || lang.code;
    return [`/${gtLang}`, `/en/${gtLang}`];
  });
  return [...new Set(["/", "/en", "/en/en", ...languagePaths])];
}

function resetGoogleTranslate() {
  clearTimeout(_gtTimer);
  const previousLocale = _lastGoogleTranslateLocale;
  _lastGoogleTranslateLocale = "en";
  applyLocaleToDocument("en");
  getGoogleTranslateDomains().forEach((domain) => {
    getGoogleTranslateCookiePaths().forEach((path) => {
      setGoogleTranslateCookie("/en/en", domain, path);
      clearGoogleTranslateCookie("googtrans", domain, path);
    });
  });
  const sel = document.querySelector("select.goog-te-combo");
  if (sel && sel.value) {
    sel.value = "";
    sel.dispatchEvent(new Event("change"));
  }
  document.documentElement.classList.remove("translated-ltr", "translated-rtl");
  if (document.body) {
    document.body.classList.remove("translated-ltr", "translated-rtl");
    document.body.style.top = "";
  }
  if (previousLocale !== "en") {
    document.querySelectorAll("iframe").forEach((iframe) => {
      try {
        iframe.contentWindow?.postMessage({ source: "mindfulness-host", type: "host-reset-translation" }, getAvatarTargetOrigin());
      } catch {}
    });
  }
}

function scheduleGoogleTranslateResetRetries() {
  let attempts = 0;
  const retry = () => {
    if (state.locale !== "en") {
      return;
    }
    resetGoogleTranslate();
    attempts += 1;
    if (attempts < 8) {
      _gtResetTimer = setTimeout(retry, attempts < 3 ? 150 : 500);
    }
  };
  _gtResetTimer = setTimeout(retry, 50);
}

function _doGoogleRetranslate() {
  const lang = LANGUAGES.find(l => l.code === state.locale);
  if (!lang || lang.gtLang === "en") return;
  const sel = document.querySelector("select.goog-te-combo");
  if (!sel) { _gtTimer = setTimeout(_doGoogleRetranslate, 600); return; }
  if (sel.value !== lang.gtLang) {
    sel.value = lang.gtLang;
    sel.dispatchEvent(new Event("change"));
  }
  _lastGoogleTranslateLocale = state.locale;
}

function getSelectedSession() {
  return localizeSession(
    sessionCatalog.find((session) => session.id === state.selectedSessionId) ||
    sessionCatalog[0]
  );
}

/* Which practices has this account actually finished? */
function getCompletedSessionTimes() {
  const lastCompletedAt = new Map();
  for (const entry of state.userSessions || []) {
    if (!entry || !entry.sessionId || entry.completed === false) continue;
    const when = entry.createdAt instanceof Date && !Number.isNaN(entry.createdAt.getTime())
      ? entry.createdAt.getTime()
      : 0;
    if (when >= (lastCompletedAt.get(entry.sessionId) || 0)) {
      lastCompletedAt.set(entry.sessionId, when);
    }
  }
  return lastCompletedAt;
}

/* Suggest something the user has not done yet. Once they have tried
   everything, resurface whichever practice they have left alone the longest.
   The pick is seeded off the local date so it stays put for the day instead of
   changing on every re-render. */
function getSuggestedSession() {
  if (!sessionCatalog.length) return getSelectedSession();

  const lastCompletedAt = getCompletedSessionTimes();
  const untried = sessionCatalog.filter((session) => !lastCompletedAt.has(session.id));

  if (!untried.length) {
    const staleFirst = [...sessionCatalog].sort(
      (a, b) => (lastCompletedAt.get(a.id) || 0) - (lastCompletedAt.get(b.id) || 0)
    );
    return localizeSession(staleFirst[0]);
  }

  const dateKey = getLocalDateKey();
  let seed = 0;
  for (let index = 0; index < dateKey.length; index += 1) {
    seed = (seed * 31 + dateKey.charCodeAt(index)) % 100000;
  }
  return localizeSession(untried[seed % untried.length]);
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
    sessionlanguage: (LANGUAGES.find((language) => language.code === state.locale) || LANGUAGES[0]).name
  };
}

function buildChatPrompt(message, sessionContext) {
  const conversationStyle = [
    "Response style: Sound like a warm, natural conversation, not a lesson or a prepared script.",
    "Use 1 to 3 short sentences and stay under 70 words unless the user explicitly asks for more detail or a guided exercise.",
    "Answer directly and ask no more than one brief follow-up question."
  ];
  if (!sessionContext?.selectedSession) {
    return [
      ...conversationStyle,
      "App context: The web mindfulness app has 12 selectable session rectangles.",
      "All 12 session pages now include guided or scripted mindfulness content.",
      `User message: ${message}`
    ].join("\n");
  }

  const lines = [
    ...conversationStyle,
    "App context: The web mindfulness app has 12 selectable session rectangles.",
    `Current session title: ${sessionContext.selectedSession.title}`,
    `Session description: ${sessionContext.selectedSession.description}`,
    `Session status: ${sessionContext.sessionActive ? "active" : "not started"}`,
    `Session language: ${sessionContext.sessionlanguage}`
  ];

  if (sessionContext.selectedSession.kind === "scripted") {
    const segments = getSessionScripts(sessionContext.selectedSession.id);
    lines.push(`This is a scripted session with ${segments.length} passages.`);
    lines.push(`Current passage: ${sessionContext.scriptSlideIndex + 1} of ${segments.length}.`);
  }

  lines.push(`User message: ${message}`);
  return lines.join("\n");
}

function buildLocalChatFallback(_message, sessionContext) {
  if (sessionContext?.selectedSession?.kind === "scripted") {
    const segments = getSessionScripts(sessionContext.selectedSession.id);
    return `${sessionContext.selectedSession.title} is a scripted session with ${segments.length} passages. You are on passage ${(sessionContext.scriptSlideIndex || 0) + 1}.`;
  }

  if (sessionContext?.selectedSession) {
    return `${sessionContext.selectedSession.title} is available in the mindfulness session library.`;
  }

  return "This app has 12 mindfulness session tiles, including breathing, grounding, compassion, movement, and sleep practices.";
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
let avatarDockKickerEl = null;
let avatarDockTitleEl = null;
let avatarDockCloseEl = null;
let avatarDockDrag = null;
let avatarDockResize = null;
let avatarSessionEl = null;
let avatarSessionIframeEl = null;
let _voiceRecording = false;
let _recognition = null;

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

function buildAvatarFrameSrc({ host, sessionId = "", autostart = false, conversationId = "", welcome = "" }) {
  const params = new URLSearchParams({
    compact: "1",
    controlled: "1",
    host,
    locale: state.locale,
    v: "36"
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

  if (welcome) {
    params.set("welcome", welcome);
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

function postAvatarCommand(host, command) {
  const iframe = getAvatarIframe(host);
  if (!iframe || !iframe.contentWindow || !avatarReadyState[host]) {
    return false;
  }

  iframe.contentWindow.postMessage(
    {
      source: "mindfulness-host",
      ...command
    },
    getAvatarTargetOrigin()
  );
  return true;
}

async function syncAvatarAuthState(host = null) {
  const command = {
    type: "host-auth-token",
    token: await getCurrentUserIdToken(),
    profile: state.guideProfile || ""
  };

  if (host) {
    queueAvatarCommand(host, command);
    return;
  }

  queueAvatarCommand(AVATAR_HOST_HOME, command);
  queueAvatarCommand(AVATAR_HOST_SESSION, command);
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
    const segments = getSessionScripts(selectedSession.id);
    const segment  = segments[state.scriptSlideIndex] || segments[0];
    if (segment) {
      const nextSegment = segments[state.scriptSlideIndex + 1] || null;
      queueAvatarCommand(AVATAR_HOST_SESSION, {
        type: "host-speak-script",
        text: segment.text,
        sessionId: selectedSession.id,
        segmentKey: segment.key,
        nextSegmentKey: nextSegment?.key || "",
        nextSegmentText: nextSegment?.text || ""
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
  if (state.avatarDockWidth != null && state.avatarDockHeight != null) {
    return { width: state.avatarDockWidth, height: state.avatarDockHeight };
  }
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

function applyAvatarDockSize() {
  if (!avatarDockEl) return;
  const { width, height } = getAvatarDockSize();
  avatarDockEl.style.width = `${width}px`;
  avatarDockEl.style.height = `${height}px`;
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

function handleAvatarDockResizeMove(event) {
  if (!avatarDockResize) return;
  const { corner, startX, startY, startWidth, startHeight, startLeft, startTop } = avatarDockResize;
  const deltaX = event.clientX - startX;
  const deltaY = event.clientY - startY;
  const resizeFromWest = corner.includes("w");
  const resizeFromNorth = corner.includes("n");
  // Was 1x1, which let the dock be dragged down to a single pixel — no layout
  // can serve that range, which is why the chrome appeared to stop scaling.
  // This is the smallest size the guide is still usable at.
  const minW = 220;
  const minH = 260;
  const availableWidth = resizeFromWest
    ? startLeft + startWidth - 12
    : window.innerWidth - startLeft - 12;
  const availableHeight = resizeFromNorth
    ? startTop + startHeight - 12
    : window.innerHeight - startTop - 12;
  const maxW = Math.max(minW, Math.min(availableWidth, 600));
  const maxH = Math.max(minH, Math.min(availableHeight, 700));
  const width = Math.min(maxW, Math.max(minW, startWidth + (resizeFromWest ? -deltaX : deltaX)));
  const height = Math.min(maxH, Math.max(minH, startHeight + (resizeFromNorth ? -deltaY : deltaY)));

  state.avatarDockWidth = width;
  state.avatarDockHeight = height;
  state.avatarDockX = resizeFromWest ? startLeft + startWidth - width : startLeft;
  state.avatarDockY = resizeFromNorth ? startTop + startHeight - height : startTop;
  applyAvatarDockSize();
  applyAvatarDockPosition();
}

function handleAvatarDockResizeUp() {
  avatarDockResize = null;
  document.body.classList.remove("avatar-resizing");
  document.body.style.cursor = "";
}

/* Each avatar frame holds a WebGL context and a full set of decoded textures,
   so leaving both mounted means the page carries two complete 3D scenes.
   But rebuilding one costs ~25s of texture decoding, so releasing the instant
   a surface is hidden makes casual toggling unusable. Compromise: hold the
   hidden frame for a grace period, which keeps quick returns instant, and
   reclaim it only if the user has genuinely moved on. */
/* Reclaim an idle frame after this long. Worth doing again now that a rebuild
   is ~3s rather than the ~25s it cost before the model was compressed: a frame
   the user has moved on from should not keep a WebGL context and a full set of
   textures alive. Returning inside the window still reuses the live frame, so
   ordinary toggling never pays the cost. Set to 0 to keep frames forever. */
const AVATAR_RELEASE_GRACE_MS = 30000;
const avatarReleaseTimers = {};

function releaseAvatarFrame(which) {
  const iframe = which === AVATAR_HOST_SESSION ? avatarSessionIframeEl : avatarDockIframeEl;
  if (!iframe || !iframe.isConnected) return;
  const parent = iframe.parentNode;
  iframe.src = "about:blank";        // drops the GL context and its textures
  if (parent) parent.removeChild(iframe);
  if (which === AVATAR_HOST_SESSION) avatarSessionIframeEl = null;
  else avatarDockIframeEl = null;
  avatarReadyState[which] = false;
}

function scheduleAvatarRelease(which) {
  if (!AVATAR_RELEASE_GRACE_MS) return;   // keep it resident
  if (avatarReleaseTimers[which]) return;
  avatarReleaseTimers[which] = window.setTimeout(() => {
    avatarReleaseTimers[which] = null;
    releaseAvatarFrame(which);
  }, AVATAR_RELEASE_GRACE_MS);
}

function keepAvatarAlive(which) {
  if (!avatarReleaseTimers[which]) return;
  clearTimeout(avatarReleaseTimers[which]);
  avatarReleaseTimers[which] = null;
}

function ensureAvatarDock() {
  if (avatarDockEl && avatarDockIframeEl && avatarDockIframeEl.isConnected) {
    return;
  }
  if (avatarDockEl) {
    // element survives, only the frame was released
    const wrap = avatarDockEl.querySelector(".avatar-dock-frame-wrap");
    const frame = document.createElement("iframe");
    frame.className = "avatar-dock-frame";
    frame.title = "Mindfulness avatar guide";
    frame.setAttribute("allow", "autoplay; microphone");
    wrap.appendChild(frame);
    avatarDockIframeEl = frame;
    return;
  }

  avatarDockEl = document.createElement("section");
  avatarDockEl.className = "avatar-dock hidden";
  avatarDockEl.innerHTML = `
    <div class="avatar-dock-header notranslate" translate="no">
      <div class="avatar-dock-copy">
        <p class="avatar-dock-kicker"></p>
        <p class="avatar-dock-title"></p>
      </div>
      <button class="avatar-dock-close" type="button"></button>
    </div>
    <div class="avatar-dock-frame-wrap">
      <iframe
        class="avatar-dock-frame"
        title="Mindfulness avatar guide"
        loading="lazy"
        allow="autoplay"
      ></iframe>
    </div>
    <div class="avatar-dock-resize-handle avatar-dock-resize-nw" data-resize-corner="nw" aria-hidden="true"></div>
    <div class="avatar-dock-resize-handle avatar-dock-resize-ne" data-resize-corner="ne" aria-hidden="true"></div>
    <div class="avatar-dock-resize-handle avatar-dock-resize-sw" data-resize-corner="sw" aria-hidden="true"></div>
    <div class="avatar-dock-resize-handle avatar-dock-resize-se" data-resize-corner="se" aria-hidden="true"></div>
  `;

  document.body.appendChild(avatarDockEl);

  avatarDockHeaderEl = avatarDockEl.querySelector(".avatar-dock-header");
  avatarDockIframeEl = avatarDockEl.querySelector(".avatar-dock-frame");
  avatarDockKickerEl = avatarDockEl.querySelector(".avatar-dock-kicker");
  avatarDockTitleEl = avatarDockEl.querySelector(".avatar-dock-title");
  avatarDockCloseEl = avatarDockEl.querySelector(".avatar-dock-close");


  avatarDockCloseEl.addEventListener("click", () => {
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
  window.addEventListener("pointercancel", handleAvatarDockPointerUp);

  avatarDockEl.querySelectorAll(".avatar-dock-resize-handle").forEach((resizeHandle) => {
    resizeHandle.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const rect = avatarDockEl.getBoundingClientRect();
      const cursor = getComputedStyle(resizeHandle).cursor;
      avatarDockResize = {
        corner: resizeHandle.dataset.resizeCorner,
        cursor,
        startX: event.clientX,
        startY: event.clientY,
        startLeft: rect.left,
        startTop: rect.top,
        startWidth: rect.width,
        startHeight: rect.height
      };
      document.body.classList.add("avatar-resizing");
      document.body.style.cursor = cursor;
      resizeHandle.setPointerCapture?.(event.pointerId);
    });
  });
  window.addEventListener("pointermove", handleAvatarDockResizeMove);
  window.addEventListener("pointerup", handleAvatarDockResizeUp);
  window.addEventListener("pointercancel", handleAvatarDockResizeUp);
}

function syncAvatarDock() {
  const shouldShow = state.screen === "home" && state.avatarDockVisible;
  if (!shouldShow && !avatarDockEl) return;   // nothing built yet, nothing to release
  ensureAvatarDock();
  document.body.classList.toggle("avatar-dock-open", shouldShow);
  avatarDockEl.classList.toggle("hidden", !shouldShow);

  if (!shouldShow) {
    scheduleAvatarRelease(AVATAR_HOST_HOME);
    return;
  }
  keepAvatarAlive(AVATAR_HOST_HOME);
  scheduleAvatarRelease(AVATAR_HOST_SESSION);

  avatarDockKickerEl.textContent = "";
  avatarDockTitleEl.textContent = "";
  avatarDockCloseEl.textContent = t("hide");
  avatarDockCloseEl.setAttribute("aria-label", t("hideMiniGuide"));

  applyAvatarDockSize();
  applyAvatarDockPosition();

  const src = buildAvatarFrameSrc({
    host: AVATAR_HOST_HOME,
    autostart: true,
    conversationId: state.avatarConversationId,
    welcome: lt("welcomeGuideNamed", {
      name: state.userStats?.firstName || state.userStats?.fullName?.split(" ")[0] || ""
    }).replace(/\s+/g, " ").trim()
  });
  if (avatarDockIframeEl.dataset.src !== src) {
    avatarReadyState[AVATAR_HOST_HOME] = false;
    avatarDockIframeEl.dataset.src = src;
    avatarDockIframeEl.src = src;
    state.homeAvatarAutostarted = true;
  }
}

function ensureSessionAvatarPanel() {
  if (avatarSessionEl && avatarSessionIframeEl && avatarSessionIframeEl.isConnected) {
    return;
  }
  if (avatarSessionEl) {
    const frame = document.createElement("iframe");
    frame.className = "session-avatar-frame";
    frame.title = "Mindfulness session guide";
    frame.setAttribute("loading", "lazy");
    frame.setAttribute("allow", "autoplay; microphone");
    avatarSessionEl.appendChild(frame);
    avatarSessionIframeEl = frame;
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
  const hostEl = document.getElementById("session-avatar-host");
  const shouldShow = state.screen === "session" && Boolean(hostEl);
  if (!shouldShow && !avatarSessionEl) return;
  ensureSessionAvatarPanel();
  avatarSessionEl.classList.toggle("hidden", !shouldShow);

  if (!shouldShow) {
    scheduleAvatarRelease(AVATAR_HOST_SESSION);
    return;
  }
  keepAvatarAlive(AVATAR_HOST_SESSION);
  scheduleAvatarRelease(AVATAR_HOST_HOME);

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

function shiftStatsMonth(delta) {
  const month = parseMonthKey(state.statsMonthKey || getMonthKey(new Date()));
  month.setMonth(month.getMonth() + delta);
  state.statsMonthKey = getMonthKey(month);
  render();
}

function resetStatsMonth() {
  state.statsMonthKey = getMonthKey(new Date());
  render();
}

function goSubpage(screen) {
  endHomeDockAvatar();
  state.screen = screen;
  state.settingsBanner = { type: "", text: "" };
  if (screen === "personal-info") {
    initializePersonalInfoDraft();
  }
  if (avatarSessionEl) avatarSessionEl.classList.add("hidden");
  render();
}

function initializePersonalInfoDraft() {
  const data = state.userStats || {};
  state.personalInfoDraft = {
    firstName: String(data.firstName || ""),
    lastName: String(data.lastName || ""),
    dateOfBirth: normalizeDobInputValue(data.dateOfBirth || data.dob)
  };
  state.personalInfoDirty = false;
  state.personalInfoSaving = false;
  state.personalInfoStatus = { type: "", text: "" };
}

function getPersonalInfoSaveError(error) {
  const code = error?.code || "";
  if (code === "permission-denied" || code === "firestore/permission-denied") {
    return "Your profile could not be saved because Firebase denied the update.";
  }
  if (code === "unavailable" || code === "firestore/unavailable" || code === "auth/network-request-failed") {
    return "Your profile could not be saved because the network is unavailable. Try again.";
  }
  return "Your profile could not be saved. Please try again.";
}

async function handleSavePersonalInfo() {
  if (state.personalInfoSaving) return;

  const firstName = state.personalInfoDraft.firstName.trim();
  const lastName = state.personalInfoDraft.lastName.trim();
  const dateOfBirth = state.personalInfoDraft.dateOfBirth;
  const today = getLocalDateKey();

  if (!firstName || !lastName) {
    state.personalInfoStatus = { type: "error", text: "Enter both your first and last name." };
    render();
    return;
  }
  if (firstName.length > 60 || lastName.length > 60) {
    state.personalInfoStatus = { type: "error", text: "Names must be 60 characters or fewer." };
    render();
    return;
  }
  if (dateOfBirth && (dateOfBirth < "1900-01-01" || dateOfBirth > today)) {
    state.personalInfoStatus = { type: "error", text: "Enter a valid date of birth." };
    render();
    return;
  }
  if (!window._fb || !state.currentUser) {
    state.personalInfoStatus = { type: "error", text: "Your account is not ready. Sign in again and retry." };
    render();
    return;
  }

  state.personalInfoSaving = true;
  state.personalInfoStatus = { type: "", text: "Saving your profile…" };
  render();

  try {
    const profilePatch = {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      dateOfBirth
    };
    await window._fb.updateUserProfile(state.currentUser.uid, profilePatch);
    state.userStats = { ...(state.userStats || {}), ...profilePatch };
    state.personalInfoDraft = { firstName, lastName, dateOfBirth };
    state.personalInfoDirty = false;
    state.personalInfoSaving = false;
    state.personalInfoStatus = { type: "ok", text: "Profile saved." };
    render();
  } catch (error) {
    console.warn("Failed to save personal information", error);
    state.personalInfoSaving = false;
    state.personalInfoStatus = { type: "error", text: getPersonalInfoSaveError(error) };
    render();
  }
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
      payload.languagePreference = patch.locale;
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

function getPasswordResetMessage(err) {
  const code = (err && err.code) || "";
  if (code === "auth/invalid-email") {
    return "Please enter a valid email address.";
  }
  if (code === "auth/user-not-found") {
    return t("forgotPasswordNotLinked");
  }
  if (code === "auth/too-many-requests") {
    return "Too many reset attempts. Please wait a moment and try again.";
  }
  if (code === "auth/network-request-failed") {
    return "Network error while sending the reset email. Please check your connection and try again.";
  }
  if (err && err.message === "not-ready") {
    return "Firebase is still starting up. Please wait a moment and try again.";
  }
  return (err && err.message) || "Could not send reset email.";
}

async function handlePasswordReset() {
  if (!window._fb || !state.currentUser || !state.currentUser.email) {
    showSettingsBanner("error", "You must be signed in with an email to reset your password.");
    return;
  }
  try {
    await window._fb.sendPasswordResetEmail(state.currentUser.email);
    showSettingsBanner("ok", `Password reset email sent to ${state.currentUser.email}.`);
  } catch (err) {
    showSettingsBanner("error", getPasswordResetMessage(err));
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
  const segments = getSessionScripts(state.selectedSessionId);
  if (state.scriptSlideIndex >= segments.length - 1) {
    endSelectedSession();
    return;
  }
  state.scriptSlideIndex += 1;
  render();
  const segment = segments[state.scriptSlideIndex];
  const nextSegment = segments[state.scriptSlideIndex + 1] || null;
  queueAvatarCommand(AVATAR_HOST_SESSION, {
    type: "host-speak-script",
    text: segment.text,
    sessionId: state.selectedSessionId,
    segmentKey: segment.key,
    nextSegmentKey: nextSegment?.key || "",
    nextSegmentText: nextSegment?.text || ""
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

function _micIconSvg() {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>`;
}

function _waveHtml() {
  return `<span class="mic-wave" aria-hidden="true"><span class="mic-wave-bar"></span><span class="mic-wave-bar"></span><span class="mic-wave-bar"></span><span class="mic-wave-bar"></span><span class="mic-wave-bar"></span></span>`;
}

function _toggleVoiceInput(btn, onResult) {
  if (_voiceRecording) {
    if (_recognition) _recognition.stop();
    return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    alert('Voice input is not supported in this browser. Try Chrome or Edge.');
    return;
  }
  _voiceRecording = true;
  btn.classList.add('mic-recording');
  btn.innerHTML = _waveHtml();
  btn.setAttribute('aria-label', 'Stop recording');

  let _transcript = '';
  _recognition = new SR();
  _recognition.lang = (LANGUAGES.find(l => l.code === state.locale) || LANGUAGES[0]).srLang;
  _recognition.interimResults = false;
  _recognition.maxAlternatives = 1;

  _recognition.onresult = (evt) => {
    _transcript = (evt.results[0]?.[0]?.transcript || '').trim();
  };
  _recognition.onend = () => {
    const text = _transcript;
    _voiceRecording = false;
    _recognition = null;
    btn.classList.remove('mic-recording');
    btn.innerHTML = _micIconSvg();
    btn.setAttribute('aria-label', 'Start voice input');
    if (text) {
      if (onResult) {
        onResult(text);
      } else {
        state.chatDraft = text;
        if (!state.chatModalVisible) { state.chatModalVisible = true; render(); }
        sendChatMessage();
      }
    }
  };
  _recognition.onerror = () => {};

  try { _recognition.start(); } catch (_) {
    _voiceRecording = false;
    _recognition = null;
    btn.classList.remove('mic-recording');
    btn.innerHTML = _micIconSvg();
    btn.setAttribute('aria-label', 'Start voice input');
  }
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
    session_id: state.chatSessionId,
    lang: state.locale,
  });
  const headers = await getApiHeaders({ "Content-Type": "application/json" });

  // Streaming audio: MSE for Chrome/Firefox (plays at first chunk, ~300 ms latency),
  // blob-URL fallback for Safari (plays when sentence completes, same as before).
  const _mseSup = typeof MediaSource !== 'undefined' && MediaSource.isTypeSupported('audio/mpeg');
  const _sents = {};   // seq -> { chunks, pending, ms, sb, audio, ended }
  let _nextSeq = 0;
  let _playingSeq = -1;

  function _sentGet(seq) {
    if (!_sents[seq]) _sents[seq] = { chunks: [], pending: [], ms: null, sb: null, audio: null, ended: false };
    return _sents[seq];
  }

  function _sentFlush(seq) {
    const s = _sents[seq];
    if (!s || !s.sb || s.sb.updating || !s.pending.length) return;
    const total = s.pending.reduce((n, c) => n + c.length, 0);
    const buf = new Uint8Array(total);
    let off = 0; for (const c of s.pending) { buf.set(c, off); off += c.length; }
    s.pending = [];
    s.sb.appendBuffer(buf);
  }

  function _sentTryPlay(seq) {
    if (seq !== _nextSeq || _playingSeq !== -1) return;
    const s = _sents[seq];
    if (!s || !s.audio) return;
    if (_mseSup && s.ms && s.audio.readyState < 3) return;
    _playingSeq = seq;
    s.audio.play().catch(() => { _playingSeq = -1; _sentAdvance(); });
    s.audio.addEventListener('ended', _sentAdvance, { once: true });
    s.audio.addEventListener('error', _sentAdvance, { once: true });
  }

  function _sentAdvance() {
    if (_playingSeq === -1) return;
    const s = _sents[_nextSeq];
    if (s && s.audio && s.audio.src && s.audio.src.startsWith('blob:')) URL.revokeObjectURL(s.audio.src);
    delete _sents[_nextSeq];
    _playingSeq = -1;
    _nextSeq++;
    _sentTryPlay(_nextSeq);
  }

  function onAudioChunk(seq, b64) {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const s = _sentGet(seq);
    s.chunks.push(bytes);
    if (!_mseSup) return;
    s.pending.push(bytes);
    if (!s.ms) {
      const ms = new MediaSource();
      const audio = new Audio();
      audio.src = URL.createObjectURL(ms);
      s.ms = ms; s.audio = audio;
      ms.addEventListener('sourceopen', () => {
        const sb = ms.addSourceBuffer('audio/mpeg');
        s.sb = sb;
        sb.addEventListener('updateend', () => {
          _sentFlush(seq);
          if (s.ended) _sentFinish(seq);
        });
        _sentFlush(seq);
      }, { once: true });
      audio.addEventListener('canplay', () => _sentTryPlay(seq));
    } else if (s.sb && !s.sb.updating) {
      _sentFlush(seq);
    }
  }

  function _sentFinish(seq) {
    const s = _sents[seq];
    if (!s || !s.ms || !s.sb) return;
    if (s.pending.length) { _sentFlush(seq); return; }
    if (s.sb.updating) {
      s.sb.addEventListener('updateend', () => _sentFinish(seq), { once: true });
      return;
    }
    if (s.ms.readyState === 'open') {
      try { s.ms.endOfStream(); } catch (_) {}
    }
  }

  function onAudioEnd(seq) {
    const s = _sentGet(seq);
    s.ended = true;
    if (!_mseSup) {
      const total = s.chunks.reduce((n, c) => n + c.length, 0);
      const buf = new Uint8Array(total);
      let off = 0; for (const c of s.chunks) { buf.set(c, off); off += c.length; }
      s.audio = new Audio(URL.createObjectURL(new Blob([buf], { type: 'audio/mpeg' })));
      _sentTryPlay(seq);
      return;
    }
    _sentFinish(seq);
  }

  try {
    // Try streaming first so text appears as it generates
    let gotChunk = false;
    try {
      const res = await fetch(`${API_BASE_URL}/chat/stream`, {
        method: "POST",
        headers,
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
          if (evt.audio_chunk !== undefined) {
            onAudioChunk(evt.seq, evt.audio_chunk);
          } else if (evt.audio_end) {
            onAudioEnd(evt.seq);
          } else if (evt.chunk) {
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
        headers,
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
  state.sessionTrackingMessage = "";
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

const TRANSCRIPT_MAX_MESSAGES = 120;
const TRANSCRIPT_MAX_CHARS = 24000;

/* Firestore documents cap at 1 MB, so trim the transcript from the front and
   keep the most recent exchange. */
/* The guide frame builds the updated profile (it owns the API plumbing) and
   posts it up; the host is what has Firestore access, so it persists. */
async function persistGuideProfile(profile) {
  const next = String(profile || "").trim();
  if (!next || next === state.guideProfile) return;
  if (!state.currentUser || !window._fb) return;
  state.guideProfile = next;
  try {
    await window._fb.updateUserProfile(state.currentUser.uid, { guideProfile: next });
  } catch (error) {
    console.warn("Could not save the guide profile", error);
  }
}

function collectSessionTranscript() {
  const messages = state.avatarTranscripts[AVATAR_HOST_SESSION] || [];
  const trimmed = [];
  let chars = 0;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const entry = messages[index];
    const text = String(entry?.text || "").slice(0, 4000);
    if (!text) continue;
    if (trimmed.length >= TRANSCRIPT_MAX_MESSAGES || chars + text.length > TRANSCRIPT_MAX_CHARS) break;
    chars += text.length;
    trimmed.unshift({ role: entry.role === "user" ? "user" : "assistant", text });
  }
  return trimmed;
}

/* Would ending right now count as a full session? Used both by the leave
   warning and by the record that gets written. */
function isSelectedSessionComplete(selectedSession) {
  if (!selectedSession) return false;
  if (selectedSession.kind === "guided") {
    return state.slideIndex === breathingSlides.length - 1 || state.roundsDone >= TOTAL_BREATHING_ROUNDS;
  }
  if (selectedSession.kind === "scripted") {
    const segments = getSessionScripts(selectedSession.id);
    return segments.length > 0 && state.scriptSlideIndex >= segments.length - 1;
  }
  return true;
}

function getElapsedSessionSeconds() {
  return Math.max(0, Math.floor((Date.now() - (state.sessionStartTime || Date.now())) / 1000));
}

/* The End button asks first when the practice is unfinished. Leaving still
   banks the time — only the "completed" credit is lost. */
function requestEndSelectedSession() {
  if (!state.sessionActive) return;
  if (isSelectedSessionComplete(getSelectedSession())) {
    endSelectedSession();
    return;
  }
  state.leaveWarningVisible = true;
  render();
}

function dismissLeaveWarning() {
  state.leaveWarningVisible = false;
  render();
}

function confirmLeaveSession() {
  state.leaveWarningVisible = false;
  endSelectedSession();
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
    completed = isSelectedSessionComplete(selectedSession);
    trackingMetadata.slideIndex = state.slideIndex;
    trackingMetadata.roundsDone = state.roundsDone;
    trackingMetadata.totalRounds = TOTAL_BREATHING_ROUNDS;
  } else if (selectedSession.kind === "scripted") {
    const segments = getSessionScripts(selectedSession.id);
    completed = isSelectedSessionComplete(selectedSession);
    trackingMetadata.scriptSlideIndex = state.scriptSlideIndex;
    trackingMetadata.scriptSegments = segments.length;
    state.sessionSummary = completed
      ? `You completed the full ${selectedSession.title} session.`
      : `You made it through ${state.scriptSlideIndex + 1} of ${segments.length} passages of ${selectedSession.title}, and that time still counts. Come back when you have a few more minutes and finish it off.`;
  } else {
    state.sessionSummary = `${selectedSession.title} ended. This session page is still empty for now, but the layout is ready for future guided content.`;
  }

  state.sessionCompleted = completed;

  const sessionTranscript = collectSessionTranscript();
  state.avatarTranscripts[AVATAR_HOST_SESSION] = [];

  state.sessionTrackingMessage = "Saving to Active Stats...";
  state.summaryModalVisible = true;
  clearExerciseState();
  render();

  void recordSessionCompletion({
    selectedSession,
    elapsedSeconds,
    completed,
    metadata: { ...trackingMetadata, summary: state.sessionSummary, transcript: sessionTranscript, messageCount: sessionTranscript.length },
  }).then((trackingResult) => {
    state.sessionTrackingMessage = trackingResult?.message || "";
    if (state.summaryModalVisible) render();
  });
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

async function handleWebForgotPassword() {
  const emailInput = document.getElementById("signin-email");
  const email = ((emailInput && emailInput.value) || state.signInEmail).trim();
  state.signInEmail = email;
  if (!email) {
    alert(t("forgotPasswordEnterEmail"));
    return;
  }
  try {
    if (!window._fb) throw new Error("not-ready");
    await window._fb.sendPasswordResetEmail(email);
    alert(t("forgotPasswordSent"));
  } catch (err) {
    alert(getPasswordResetMessage(err) || t("forgotPasswordFailed"));
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
  state.languageModalVisible = false;
  state.avatarDockVisible = true;
  if (avatarSessionEl) avatarSessionEl.classList.add("hidden");
  render();
}

function renderSessionTile(session) {
  session = localizeSession(session);
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
  return `
    <main class="signin-screen">
      <div class="signin-lang-corner">
        ${renderLangSelect("signin-lang-select")}
      </div>

      <section class="signin-card" aria-label="Sign in">
        <div class="signin-brand-lockup app-brand" aria-label="${escapeHtml(BRAND.name)}">
          ${renderBrandLockup()}
        </div>
        <h1 class="signin-title">${escapeHtml(t("signInWelcome"))}</h1>
        <p class="signin-subtitle">${escapeHtml(t("signInSubtitle"))}</p>

        <label class="signin-field">
          <span class="signin-icon" aria-hidden="true">✉</span>
          <input
            id="signin-email"
            type="email"
            aria-label="${escapeHtml(t("email"))}"
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
            aria-label="${escapeHtml(t("password"))}"
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

        <button class="signin-link signin-link-secondary" data-action="forgot-password" type="button">
          ${escapeHtml(t("forgotPassword"))}
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
  return `
    <main class="signin-screen">
      <div class="signin-lang-corner">
        ${renderLangSelect("signin-lang-select")}
      </div>

      <section class="signin-card signup-card" aria-label="Create account">
        <h1 class="signin-title">${escapeHtml(t("signUpHeader"))}</h1>

        <div class="signup-name-row">
          <label class="signin-field signup-half">
            <input
            id="signup-firstname"
            type="text"
            aria-label="${escapeHtml(t("firstName"))}"
              autocomplete="given-name"
              placeholder="${escapeHtml(t("firstName"))}"
              value="${escapeHtml(state.signUpFirstName)}"
            >
          </label>
          <label class="signin-field signup-half">
            <input
            id="signup-lastname"
            type="text"
            aria-label="${escapeHtml(t("lastName"))}"
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
            aria-label="${escapeHtml(t("dateOfBirth"))}"
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
            aria-label="${escapeHtml(t("email"))}"
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
            aria-label="${escapeHtml(t("password"))}"
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
            aria-label="${escapeHtml(t("confirmPassword"))}"
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
  const suggestedSession = getSuggestedSession();
  const completedSessionTimes = getCompletedSessionTimes();
  const localizedSessionCatalog = sessionCatalog.map(localizeSession);
  const firstName = state.userStats?.firstName || state.userStats?.fullName?.split(" ")[0] || state.currentUser?.displayName?.split(" ")[0] || "there";
  const totalActiveDays = state.userStats?.totalActiveDays ?? state.userStats?.totalDays ?? 0;
  const currentStreak = state.userStats?.currentStreak ?? 0;

  return `
    ${
      state.languageModalVisible
        ? `
          <div class="home-modal-overlay">
            <section class="home-modal">
              <h2 class="home-modal-title">Language / 언어</h2>
              <div class="home-language-choices">
                ${renderLangSelect("lang-select lang-select-light home-language-select")}
              </div>
              <button class="home-start-btn" data-action="close-language-modal" type="button">${escapeHtml(t("start"))}</button>
            </section>
          </div>
        `
        : ""
    }

    <section class="atlas-welcome" aria-labelledby="atlas-welcome-title">
      <div class="atlas-welcome-copy">
        <span class="atlas-kicker"><i class="atlas-kicker-seal" aria-hidden="true"></i>${escapeHtml(lt("recommendedStartingPoint"))}</span>
        <h1 id="atlas-welcome-title">${escapeHtml(lt("welcomeBackNamed", { name: firstName }))}</h1>
      </div>
      <div class="atlas-rhythm" aria-label="${escapeHtml(lt("yourActivity"))}">
        <button data-action="go-stats" type="button"><strong>${escapeHtml(String(currentStreak))}</strong><span>${escapeHtml(lt("dayStreak"))}</span></button>
        <i aria-hidden="true"></i>
        <button data-action="go-stats" type="button"><strong>${escapeHtml(String(totalActiveDays))}</strong><span>${escapeHtml(lt("daysActive"))}</span></button>
      </div>
    </section>

    <section class="atlas-next-step">
      <button class="atlas-practice-hero" data-action="open-session" data-session-id="${escapeHtml(suggestedSession.id)}" type="button">
        <span class="atlas-practice-copy">
          <span class="atlas-practice-label">${escapeHtml(lt("homeFeaturedLabel"))}</span>
          <strong>${escapeHtml(suggestedSession.title)}</strong>
          <span>${escapeHtml(suggestedSession.previewDescription || suggestedSession.description)}</span>
          <span class="atlas-practice-cta">${escapeHtml(lt("beginPractice", { title: suggestedSession.title }))} ${renderAppIcon("arrow")}</span>
        </span>
        <span class="atlas-constellation zodiac-${escapeHtml(suggestedSession.zodiac.toLowerCase())}" aria-hidden="true">
          <small>${escapeHtml(suggestedSession.zodiac)}</small>
          ${renderZodiacConstellation(suggestedSession.zodiac)}
        </span>
      </button>
      <aside class="atlas-guide-card" data-action="open-avatar-dock">
        <span class="atlas-guide-orbit" aria-hidden="true">${renderBrandLetter()}</span>
        <div><span>${escapeHtml(lt("homeSubtitle"))}</span><strong>${escapeHtml(lt("askGuide"))}</strong><p>${escapeHtml(lt("homeWelcomeQuestion"))}</p></div>
        <button data-action="open-avatar-dock" type="button" aria-label="${escapeHtml(lt("askGuide"))}">${renderAppIcon("arrow")}</button>
      </aside>
    </section>

    ${renderMoodPulse()}

    ${
      state.sessionActive
        ? `
          <section class="resume-card">
            <div class="resume-copy">
              <p class="resume-title">${escapeHtml(lt("continuePractice"))}</p>
              <p class="resume-body">${escapeHtml(lt("practiceStillActive", { title: selectedSession.title }))}</p>
            </div>
            <button class="action-button action-button-primary" data-action="resume-session">${escapeHtml(lt("continuePractice"))}</button>
          </section>
        `
        : ""
    }

    <section class="home-practice-section atlas-library-section">
      <div class="atlas-section-heading">
        <div><span>${escapeHtml(lt("homeSelectionIntro"))}</span><h2>${escapeHtml(lt("exploreAllPractices"))}</h2></div>
        <span class="atlas-count">${escapeHtml(lt("availableCount", { count: localizedSessionCatalog.length }))}</span>
      </div>
      <div class="home-library atlas-library">
        ${localizedSessionCatalog.map((session) => {
          const isDone = completedSessionTimes.has(session.id);
          const isSuggested = session.id === suggestedSession.id;
          return `
          <button class="home-library-row practice-${escapeHtml(session.id)} ${isDone ? "is-complete" : ""} ${isSuggested ? "is-suggested" : ""}" data-action="open-session" data-session-id="${escapeHtml(session.id)}" type="button" aria-label="${escapeHtml(session.title)}, ${escapeHtml(session.duration)}${isDone ? `, ${escapeHtml(lt("completed"))}` : ""}" aria-describedby="practice-details-${escapeHtml(session.id)}">
            <span class="home-library-index">${escapeHtml(session.number)}</span>
            <span class="home-library-copy"><small>${escapeHtml(session.zodiac)}${isDone ? ` <b class="home-library-done">${escapeHtml(lt("completed"))}</b>` : isSuggested ? ` <b class="home-library-tag">${escapeHtml(lt("homeFeaturedLabel"))}</b>` : ""}</small><strong>${escapeHtml(session.title)}</strong></span>
            <span class="home-library-meta"><span class="home-library-duration">${escapeHtml(session.duration)}</span><b aria-hidden="true">+</b></span>
            <span class="home-library-preview" id="practice-details-${escapeHtml(session.id)}"><span class="home-library-preview-inner"><span class="home-library-preview-art zodiac-${escapeHtml(session.zodiac.toLowerCase())}" aria-hidden="true"><small>${escapeHtml(session.zodiac)}</small>${renderZodiacConstellation(session.zodiac)}</span><span class="home-library-preview-copy"><span>${escapeHtml(session.previewDescription || session.description)}</span><em>${escapeHtml(lt("homeOpenPractice"))} ↗</em></span></span></span>
          </button>
        `;
        }).join("")}
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

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function parseMonthKey(monthKey) {
  const [year, month] = String(monthKey || getMonthKey(new Date())).split("-").map(Number);
  const safeYear = Number.isFinite(year) ? year : new Date().getFullYear();
  const safeMonth = Number.isFinite(month) && month >= 1 && month <= 12 ? month : new Date().getMonth() + 1;
  return new Date(safeYear, safeMonth - 1, 1);
}

function buildActivityMap() {
  return state.userSessions.reduce((map, entry) => {
    const dateKey = entry.localDate || (entry.createdAt instanceof Date ? getLocalDateKey(entry.createdAt) : "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return map;
    if (!map[dateKey]) map[dateKey] = { sessions: 0, seconds: 0, titles: [] };
    map[dateKey].sessions += 1;
    map[dateKey].seconds += Math.max(0, Number(entry.durationSeconds) || 0);
    if (entry.sessionTitle) map[dateKey].titles.push(entry.sessionTitle);
    return map;
  }, {});
}

function buildCalendarDays(monthDate) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      key: getLocalDateKey(date),
      day: date.getDate(),
      inMonth: date.getMonth() === monthDate.getMonth(),
      label: date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
    };
  });
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

function renderHistoryTranscript(entry) {
  const transcript = Array.isArray(entry.transcript) ? entry.transcript : [];
  if (!transcript.length) return "";
  const expanded = state.expandedHistoryId === entry.id;
  const count = transcript.length;
  return `
    <button class="history-transcript-toggle ${expanded ? "is-open" : ""}" data-action="toggle-history-transcript" data-history-id="${escapeHtml(entry.id)}" type="button" aria-expanded="${expanded}">
      <span>${expanded ? "Hide conversation" : "View conversation"}</span>
      <span class="history-transcript-count">${count} message${count === 1 ? "" : "s"}</span>
    </button>
    ${expanded ? `
      <ol class="history-transcript">
        ${transcript.map((line) => `
          <li class="history-transcript-line history-transcript-${line.role === "user" ? "user" : "guide"}">
            <span class="history-transcript-who">${line.role === "user" ? "You" : "Guide"}</span>
            <p>${escapeHtml(line.text)}</p>
          </li>
        `).join("")}
      </ol>
    ` : ""}
  `;
}

function renderSessionHistory() {
  if (!state.currentUser) return "";
  if (state.userSessionsLoading && state.userSessions.length === 0) {
    return `
      <section class="history-section">
        <h2 class="history-title">${escapeHtml(t("recentPractice"))}</h2>
        <p class="history-empty">${escapeHtml(t("statsLoading"))}</p>
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
                ${renderHistoryTranscript(entry)}
              </li>
            `;
          })
          .join("")}
      </ul>
    </section>
  `;
}

function renderStatsScreen() {
  if (!state.statsMonthKey) state.statsMonthKey = getMonthKey(new Date());
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
  const activityMap = buildActivityMap();
  const month = parseMonthKey(state.statsMonthKey);
  const monthLabel = month.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const calendarDays = buildCalendarDays(month);
  const monthActiveDays = calendarDays.filter((day) => activityMap[day.key]).length;
  const maxMonthSessions = Math.max(1, ...calendarDays.map((day) => activityMap[day.key]?.sessions || 0));
  const selectedDay = calendarDays.find((day) => day.key === state.statsSelectedDateKey);
  const selectedActivity = state.statsSelectedDateKey ? activityMap[state.statsSelectedDateKey] : null;

  return `
    <section class="stats-heading-row">
      <div>
        <h1 class="stats-title">Your rhythm</h1>
        <p class="stats-subtitle">${escapeHtml(subtitle)}</p>
      </div>
      <div class="stats-heading-mark" aria-hidden="true"><span></span><span></span><span></span></div>
    </section>

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

    <section class="activity-panel" aria-labelledby="activity-calendar-title">
      <div class="activity-panel-head">
        <div>
          <h2 id="activity-calendar-title">Practice map</h2>
          <p>${monthActiveDays} active day${monthActiveDays === 1 ? "" : "s"} in ${escapeHtml(monthLabel)}</p>
        </div>
        <div class="month-controls" aria-label="${escapeHtml(t("activityCalendar"))}">
          <button class="month-nav-button" data-action="stats-previous-month" type="button" aria-label="${escapeHtml(lt("previousMonth"))}">‹</button>
          <button class="month-label-button" data-action="stats-current-month" type="button">${escapeHtml(monthLabel)}</button>
          <button class="month-nav-button" data-action="stats-next-month" type="button" aria-label="${escapeHtml(lt("nextMonth"))}">›</button>
        </div>
      </div>
      <div class="activity-calendar" role="grid" aria-label="${escapeHtml(lt("calendarLabel", { month: monthLabel }))}">
        <div class="activity-weekdays" role="row">
          ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => `<span role="columnheader">${day}</span>`).join("")}
        </div>
        <div class="activity-grid">
          ${calendarDays.map((day) => {
            const activity = activityMap[day.key];
            const count = activity?.sessions || 0;
            const label = activity
              ? `${day.label}: ${count} session${count === 1 ? "" : "s"}, ${formatMinutes(activity.seconds)}`
              : `${day.label}: no sessions`;
            const level = count ? Math.min(4, Math.ceil((count / maxMonthSessions) * 4)) : 0;
            return `<div class="activity-day ${day.inMonth ? "" : "activity-day-muted"} activity-level-${level} ${state.statsSelectedDateKey === day.key ? "activity-day-selected" : ""}" data-action="stats-day" data-date-key="${day.key}" role="gridcell" tabindex="0" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}"><span>${day.day}</span></div>`;
          }).join("")}
        </div>
      </div>
      ${selectedDay ? `
        <div class="activity-detail" aria-live="polite">
          <div><strong>${escapeHtml(selectedDay.label)}</strong><span>${selectedActivity ? `${selectedActivity.sessions} session${selectedActivity.sessions === 1 ? "" : "s"} · ${escapeHtml(formatMinutes(selectedActivity.seconds))}` : "No sessions"}</span></div>
          ${selectedActivity?.titles?.length ? `<p>${escapeHtml(selectedActivity.titles.join(" · "))}</p>` : ""}
        </div>
      ` : ""}
      <div class="activity-legend"><span>Less</span><i class="activity-swatch activity-level-0"></i><i class="activity-swatch activity-level-1"></i><i class="activity-swatch activity-level-2"></i><i class="activity-swatch activity-level-3"></i><i class="activity-swatch activity-level-4"></i><span>More</span></div>
    </section>

    ${renderSessionHistory()}
  `;
}

function renderProfileScreen() {
  const user = state.currentUser;
  const data = state.userStats || {};
  const nameParts = String(data.fullName || user?.displayName || "").trim().split(/\s+/).filter(Boolean);
  const firstName = data.firstName || nameParts[0] || "";
  const lastName = data.lastName || nameParts.slice(1).join(" ") || "";
  const email = user?.email || data.email || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const displayName = fullName || (email ? email.split("@")[0] : t("profileTitle"));
  const initials =
    ((firstName[0] || email[0] || BRAND.name[0]) + (lastName[0] || "")).toUpperCase();
  const memberSince = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : "";

  const currentStreak = data.currentStreak ?? 0;
  const sessionsFinished = data.sessionsFinished ?? 0;
  const totalSessionSeconds = data.totalSessionSeconds ?? data.totalSessionTime ?? 0;

  const rows = [
    { action: "go-personal-info", icon: "identity", label: t("personalInformation"), hint: "Name, email, and date of birth" },
    { action: "go-settings", icon: "settings", label: t("settings"), hint: "Language, appearance, session preferences" },
    { action: "go-support", icon: "support", label: t("support"), hint: "Questions, feedback, and account help" }
  ];

  return `
    <header class="profile-head">
      <p class="profile-eyebrow">${escapeHtml(BRAND.wordmark)}</p>
      <h1 class="profile-title">${escapeHtml(t("profileTitle"))}</h1>
    </header>

    <section class="profile-identity" aria-label="Account summary">
      <div class="profile-identity-main">
        <span class="profile-avatar" aria-hidden="true">${escapeHtml(initials)}</span>
        <div class="profile-identity-copy">
          <strong>${escapeHtml(displayName)}</strong>
          ${memberSince ? `<span class="profile-identity-meta">A member since ${escapeHtml(memberSince)}</span>` : ""}
        </div>
        <button class="profile-edit" data-action="go-personal-info" type="button">Edit</button>
      </div>
      <dl class="profile-metrics">
        <div><dt>Current streak</dt><dd>${currentStreak}<span>${currentStreak === 1 ? "day" : "days"}</span></dd></div>
        <div><dt>Sessions</dt><dd>${sessionsFinished}<span>complete</span></dd></div>
        <div><dt>Time in practice</dt><dd>${escapeHtml(formatMinutes(totalSessionSeconds))}</dd></div>
      </dl>
    </section>

    <p class="profile-group-label">Account</p>
    <section class="profile-section">
      ${rows.map((row) => `
        <button class="profile-row" data-action="${row.action}" type="button">
          <span class="profile-row-icon" aria-hidden="true">${renderAppIcon(row.icon)}</span>
          <span class="profile-row-copy">
            <span class="profile-row-label">${escapeHtml(row.label)}</span>
            <span class="profile-row-hint">${escapeHtml(row.hint)}</span>
          </span>
          <span class="profile-arrow" aria-hidden="true">›</span>
        </button>
      `).join("")}
    </section>

    <section class="profile-section profile-section-danger">
      <button class="profile-row profile-row-danger" data-action="logout" type="button">
        <span class="profile-row-icon" aria-hidden="true">${renderAppIcon("logout")}</span>
        <span class="profile-row-copy">
          <span class="profile-row-label profile-danger-text">${escapeHtml(t("logOut"))}</span>
          <span class="profile-row-hint">Sign out of ${escapeHtml(BRAND.name)} on this device</span>
        </span>
        <span class="profile-arrow" aria-hidden="true">›</span>
      </button>
    </section>

    <p class="profile-signature">${escapeHtml(BRAND.wordmark)}</p>
  `;
}

function renderBackBar() {
  return `
    <div class="back-row">
      <button class="back-btn" data-action="go-profile" type="button">‹ Profile</button>
    </div>
  `;
}

function normalizeDobInputValue(dob) {
  if (!dob) return "";
  if (typeof dob.toDate === "function") {
    return getLocalDateKey(dob.toDate());
  }
  if (dob instanceof Date && !Number.isNaN(dob.getTime())) {
    return getLocalDateKey(dob);
  }
  const value = String(dob).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : getLocalDateKey(parsed);
}

function renderPersonalInfoScreen() {
  const user = state.currentUser;
  const data = state.userStats || {};
  const email = (user && user.email) || data.email || "—";
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
      <form class="info-card personal-info-form" id="personal-info-form" novalidate>
        <label class="personal-info-field" for="profile-first-name">
          <span>First name</span>
          <input id="profile-first-name" type="text" value="${escapeHtml(state.personalInfoDraft.firstName)}" maxlength="60" autocomplete="given-name" required>
        </label>
        <label class="personal-info-field" for="profile-last-name">
          <span>Last name</span>
          <input id="profile-last-name" type="text" value="${escapeHtml(state.personalInfoDraft.lastName)}" maxlength="60" autocomplete="family-name" required>
        </label>
        <label class="personal-info-field" for="profile-date-of-birth">
          <span>Date of birth</span>
          <input id="profile-date-of-birth" type="date" value="${escapeHtml(state.personalInfoDraft.dateOfBirth)}" min="1900-01-01" max="${escapeHtml(getLocalDateKey())}" autocomplete="bday">
        </label>
        <div class="info-row">
          <span class="info-row-label">Language</span>
          ${renderLangSelect("lang-select lang-select-light")}
        </div>
        <div class="personal-info-actions">
          <p class="personal-info-status ${state.personalInfoStatus.type === "error" ? "error" : ""}" role="status" aria-live="polite">${escapeHtml(state.personalInfoStatus.text)}</p>
          <button class="personal-info-save" type="submit" ${state.personalInfoSaving || !state.personalInfoDirty ? "disabled" : ""}>${state.personalInfoSaving ? "Saving…" : "Save changes"}</button>
        </div>
      </form>
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
          ${renderLangSelect("lang-select lang-select-light")}
        </div>

        <div class="settings-row">
          <div class="settings-row-copy">
            <p class="settings-row-label">Theme</p>
            <p class="settings-row-hint">${state.settings.theme === "dark" ? "Dark mode is on." : "Light mode."}</p>
          </div>
          <button class="toggle-switch ${state.settings.theme === "dark" ? "on" : ""}" data-action="toggle-theme" type="button" aria-label="${escapeHtml(lt("toggleTheme"))}"></button>
        </div>

        <div class="settings-row">
          <div class="settings-row-copy">
            <p class="settings-row-label">Notifications</p>
            <p class="settings-row-hint">${escapeHtml(notifText)}</p>
          </div>
          <button class="toggle-switch ${state.settings.notifications ? "on" : ""}" data-action="toggle-notifications" type="button" aria-label="${escapeHtml(lt("toggleNotifications"))}"></button>
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
        <div class="faq-body">From the Home tab, pick any of the 12 session tiles and tap Start Session. Each session now plays through the avatar with step-by-step Next controls and a progress bar.</div>
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

function computeSessionProgress(selectedSession) {
  if (!state.sessionActive) return { percent: 0, label: "" };
  if (selectedSession.kind === "guided") {
    const total = Math.max(1, breathingSlides.length - 1);
    const stepRatio = Math.min(1, state.slideIndex / total);
    const inRoundsPhase = (breathingSlides[state.slideIndex] || {}).key === "rounds";
    const roundsRatio = inRoundsPhase
      ? Math.min(1, state.roundsDone / TOTAL_BREATHING_ROUNDS) * (1 / total)
      : 0;
    const percent = Math.min(100, Math.round((stepRatio + roundsRatio) * 100));
    return {
      percent,
      label: `Step ${Math.min(state.slideIndex + 1, breathingSlides.length)} of ${breathingSlides.length}`,
    };
  }
  if (selectedSession.kind === "scripted") {
    const segs = getSessionScripts(selectedSession.id);
    if (!segs.length) return { percent: 0, label: "" };
    const percent = Math.min(100, Math.round(((state.scriptSlideIndex + 1) / segs.length) * 100));
    return { percent, label: `Passage ${state.scriptSlideIndex + 1} of ${segs.length}` };
  }
  return { percent: 0, label: "" };
}

function computeNextButtonState(selectedSession) {
  if (!state.sessionActive) return { visible: false, disabled: true, label: "Next" };
  if (selectedSession.kind === "guided") {
    const currentSlide = breathingSlides[state.slideIndex] || breathingSlides[0];
    const disabled =
      state.roundRunning ||
      (currentSlide.key === "rounds" && state.roundsDone < TOTAL_BREATHING_ROUNDS);
    const isLast = state.slideIndex === breathingSlides.length - 1;
    return { visible: true, disabled, label: isLast ? "Finish" : "Next" };
  }
  if (selectedSession.kind === "scripted") {
    const segs = getSessionScripts(selectedSession.id);
    const isLast = state.scriptSlideIndex >= segs.length - 1;
    return { visible: true, disabled: false, label: isLast ? "Finish" : "Next" };
  }
  return { visible: false, disabled: true, label: "Next" };
}

function syncSessionAvatarProgress() {
  if (state.screen !== "session") return;
  const selectedSession = getSelectedSession();
  const progress = computeSessionProgress(selectedSession);
  const showProgress =
    state.sessionActive && (selectedSession.kind === "guided" || selectedSession.kind === "scripted");
  const nextBtn = computeNextButtonState(selectedSession);

  queueAvatarCommand(AVATAR_HOST_SESSION, {
    type: "host-set-progress",
    percent: showProgress ? progress.percent : 0,
    label: showProgress ? `${progress.label} · ${progress.percent}%` : ""
  });
  queueAvatarCommand(AVATAR_HOST_SESSION, {
    type: "host-set-next-button",
    visible: nextBtn.visible,
    disabled: nextBtn.disabled,
    label: nextBtn.label
  });
}

function renderSessionScreen() {
  const selectedSession = getSelectedSession();
  const localizedStatus = state.sessionStatus === "Session active" ? lt("sessionActive") : lt("statusNotStarted");
  const isComplete = state.sessionActive && isSelectedSessionComplete(selectedSession);

  return `
    <nav class="session-crumbs" aria-label="Breadcrumb">
      <button class="session-back" data-action="go-home" type="button">
        <span aria-hidden="true">‹</span> ${escapeHtml(lt("backToSessions"))}
      </button>
      <span class="session-crumb-sep" aria-hidden="true">/</span>
      <span class="session-crumb-current">${escapeHtml(selectedSession.title)}</span>
    </nav>

    <section class="detail-hero session-hero ${state.sessionActive ? "is-running" : ""}">
      <span class="session-hero-art zodiac-${escapeHtml(selectedSession.zodiac.toLowerCase())}" aria-hidden="true">
        <small>${escapeHtml(selectedSession.zodiac)}</small>
        ${renderZodiacConstellation(selectedSession.zodiac)}
      </span>

      <div class="session-hero-copy">
        <div class="detail-hero-top-left">
          <span class="detail-number">${selectedSession.number}</span>
          <span class="detail-pill ${selectedSession.kind !== "placeholder" ? "detail-pill-guided" : "detail-pill-placeholder"}">
            ${escapeHtml(selectedSession.kind === "placeholder" ? lt("templateReserved") : lt("guidedSession"))}
          </span>
          <span class="session-status ${state.sessionActive ? "is-live" : ""}">
            <i aria-hidden="true"></i>${escapeHtml(localizedStatus)}
          </span>
        </div>

        <h1 class="detail-title">${escapeHtml(selectedSession.title)}</h1>

        ${
          selectedSession.description
            ? `<p class="detail-description">${escapeHtml(selectedSession.description)}</p>`
            : ""
        }

        ${
          selectedSession.duration
            ? `<p class="session-hero-meta">${escapeHtml(selectedSession.duration)}</p>`
            : ""
        }

        <div class="detail-hero-actions">
          ${
            state.sessionActive
              ? `<button class="session-cta session-cta-end ${isComplete ? "is-finish" : ""}" data-action="end-session">
                   ${escapeHtml(isComplete ? lt("finish") : lt("endSession"))}
                 </button>`
              : `<button class="session-cta session-cta-start" data-action="start-session">
                   ${escapeHtml(lt("start"))}
                 </button>`
          }
        </div>
      </div>
    </section>

    <section class="panel-card session-avatar-shell">
      <div class="session-avatar-host" id="session-avatar-host"></div>
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
            <h2 class="sheet-title">${escapeHtml(lt("mindfulnessChat"))}</h2>
            <p class="sheet-subtitle">
              ${
                state.screen === "session"
                  ? escapeHtml(lt("contextSession", { title: selectedSession.title }))
                  : escapeHtml(lt("contextGeneral"))
              }
            </p>
          </div>
          <button class="close-button" data-action="close-chat">${escapeHtml(t("cancel"))}</button>
        </div>

        <div class="chat-frame">
          <div class="status-row">${escapeHtml(lt("assistantStatus", { status: state.chatStatus }))}</div>
          <div class="chat-window" id="chat-window">
            ${renderMessages(state.chatMessages)}
          </div>
          <div class="composer">
            <button class="composer-mic${_voiceRecording ? ' mic-recording' : ''}" data-action="toggle-mic" type="button" aria-label="${escapeHtml(_voiceRecording ? lt('stopRecording') : lt('startVoiceInput'))}">${_voiceRecording ? _waveHtml() : _micIconSvg()}</button>
            <textarea
              class="chat-input"
              id="chat-input"
              placeholder="${escapeHtml(lt("chatPlaceholder"))}"
              ${state.chatBusy ? "disabled" : ""}
            >${escapeHtml(state.chatDraft)}</textarea>
            <button class="composer-send" data-action="send-chat" type="button" aria-label="${escapeHtml(t("sendMessage"))}" ${!state.chatDraft.trim() || state.chatBusy ? "disabled" : ""}>${escapeHtml(lt("send"))}</button>
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
        <h2 class="modal-title">${escapeHtml(state.sessionCompleted ? "Session complete" : "Paused for now")}</h2>
        <div class="modal-duration">Session length: ${escapeHtml(state.sessionDuration)}</div>
        <div class="modal-summary">${escapeHtml(state.sessionSummary)}</div>
        ${state.sessionTrackingMessage ? `<div class="modal-summary">${escapeHtml(state.sessionTrackingMessage)}</div>` : ""}
        <button class="summary-close" data-action="close-summary">Close</button>
      </section>
    </div>
  `;
}

function renderLeaveWarning() {
  if (!state.leaveWarningVisible) return "";
  const elapsed = getElapsedSessionSeconds();
  const banked = formatMinutes(elapsed);
  return `
    <div class="overlay leave-warning-overlay" data-action="dismiss-leave-warning">
      <section class="leave-warning" role="alertdialog" aria-modal="true" aria-labelledby="leave-warning-title" aria-describedby="leave-warning-body">
        <h2 class="leave-warning-title" id="leave-warning-title">Leave before finishing?</h2>
        <p class="leave-warning-body" id="leave-warning-body">
          This practice won't count as completed, and it won't extend your streak — those are for finished sessions.
        </p>
        <p class="leave-warning-credit">
          Your ${escapeHtml(banked)} of practice still counts toward your total time.
        </p>
        <div class="leave-warning-actions">
          <button class="leave-warning-stay" data-action="dismiss-leave-warning" type="button">Keep practicing</button>
          <button class="leave-warning-leave" data-action="confirm-leave-session" type="button">Leave anyway</button>
        </div>
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
    scheduleGoogleRetranslate();
    return;
  }

  const profileActive = ["profile","personal-info","settings","support"].includes(state.screen);
  appEl.innerHTML = `
    <main class="app-shell">
      <aside class="app-sidebar">
        <button class="app-brand" data-action="go-home" type="button" aria-label="${escapeHtml(BRAND.name)}">${renderBrandLockup()}</button>
        <nav class="app-nav" aria-label="Primary navigation">
          <button class="${state.screen === "home" ? "active" : ""}" data-action="go-home" type="button">${renderAppIcon("home")}<span>${escapeHtml(t("homeTab"))}</span></button>
          <button class="${state.screen === "stats" ? "active" : ""}" data-action="go-stats" type="button">${renderAppIcon("stats")}<span>${escapeHtml(t("myStatsTab"))}</span></button>
          <button class="${profileActive ? "active" : ""}" data-action="go-profile" type="button">${renderAppIcon("profile")}<span>${escapeHtml(t("profileTab"))}</span></button>
        </nav>
        <div class="app-sidebar-guide" data-action="open-avatar-dock"><span>${renderBrandLetter()}</span><strong>${escapeHtml(lt("askGuide"))}</strong><p>${escapeHtml(lt("homeWelcomeQuestion"))}</p><button data-action="open-avatar-dock" type="button">${escapeHtml(lt("chat"))} ${renderAppIcon("arrow")}</button></div>
        <div class="app-sidebar-footer"><div class="app-language">${renderAppIcon("globe")}${renderLangSelect("lang-select lang-select-light")}</div><button class="app-signout" data-action="logout" type="button">${renderAppIcon("logout")}${escapeHtml(t("logoutBtn"))}</button></div>
      </aside>
      <section class="app-workspace">
        <header class="app-mobile-header"><button class="app-brand" data-action="go-home" type="button" aria-label="${escapeHtml(BRAND.name)}">${renderBrandLockup()}</button><div class="app-language">${renderLangSelect("lang-select lang-select-light")}</div></header>
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
        <nav class="app-mobile-nav" aria-label="Primary navigation">
          <button class="${state.screen === "home" ? "active" : ""}" data-action="go-home" type="button">${renderAppIcon("home")}<span>${escapeHtml(t("homeTab"))}</span></button>
          <button class="${state.screen === "stats" ? "active" : ""}" data-action="go-stats" type="button">${renderAppIcon("stats")}<span>${escapeHtml(t("myStatsTab"))}</span></button>
          <button class="${profileActive ? "active" : ""}" data-action="go-profile" type="button">${renderAppIcon("profile")}<span>${escapeHtml(t("profileTab"))}</span></button>
        </nav>
      </section>
    </main>
    ${
      state.screen === "home" && !state.avatarDockVisible
        ? `<button class="avatar-dock-launcher" data-action="open-avatar-dock" type="button" aria-label="${escapeHtml(lt("openMindfulnessChat"))}">${escapeHtml(lt("chat"))}</button>`
        : ""
    }
    ${renderSummaryModal()}
    ${renderLeaveWarning()}
  `;

  attachInputHandlers();
  scrollChatToBottom();
  syncAvatarDock();
  requestAnimationFrame(() => requestAnimationFrame(syncSessionAvatarPanel));
  syncSessionAvatarProgress();
  scheduleGoogleRetranslate();
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

  const bindPersonalInfo = (id, key) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", (event) => {
      state.personalInfoDraft[key] = event.target.value;
      state.personalInfoDirty = true;
      state.personalInfoStatus = { type: "", text: "" };
      const saveButton = document.querySelector(".personal-info-save");
      if (saveButton) saveButton.disabled = false;
    });
  };
  bindPersonalInfo("profile-first-name", "firstName");
  bindPersonalInfo("profile-last-name", "lastName");
  bindPersonalInfo("profile-date-of-birth", "dateOfBirth");

  const personalInfoForm = document.getElementById("personal-info-form");
  if (personalInfoForm) {
    personalInfoForm.addEventListener("submit", (event) => {
      event.preventDefault();
      void handleSavePersonalInfo();
    });
  }

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

appEl.addEventListener("change", (event) => {
  const sel = event.target.closest("select[data-action='set-language']");
  if (!sel) return;
  const newLocale = sel.value;
  if (newLocale && isSupportedLocale(newLocale)) {
    setLanguagePreference(newLocale, {
      dismissModal: !sel.closest(".home-modal")
    });
  }
});

appEl.addEventListener("click", (event) => {
  const actionEl = event.target.closest("[data-action]");
  if (!actionEl) {
    return;
  }

  const { action } = actionEl.dataset;
  const isOverlay = actionEl.classList.contains("overlay");

  if ((action === "close-chat" || action === "close-summary" || action === "dismiss-leave-warning") && isOverlay && event.target !== actionEl) {
    return;
  }

  switch (action) {
    case "set-language": {
      const newLocale = actionEl.dataset.locale;
      if (newLocale && isSupportedLocale(newLocale)) {
        setLanguagePreference(newLocale, { dismissModal: true });
      }
      break;
    }
    case "close-language-modal":
      setLanguagePreference(state.locale, { dismissModal: true });
      break;
    case "sign-in":
      handleWebSignIn();
      break;
    case "forgot-password":
      handleWebForgotPassword();
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
    case "record-mood":
      recordMood(actionEl.dataset.mood);
      break;
    case "spin-fortune":
      spinDailyFortune();
      break;
    case "stats-previous-month":
      shiftStatsMonth(-1);
      break;
    case "stats-next-month":
      shiftStatsMonth(1);
      break;
    case "stats-current-month":
      resetStatsMonth();
      break;
    case "stats-day":
      state.statsSelectedDateKey = actionEl.dataset.dateKey || "";
      render();
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
    case "toggle-history-transcript": {
      const historyId = actionEl.dataset.historyId || "";
      state.expandedHistoryId = state.expandedHistoryId === historyId ? "" : historyId;
      render();
      break;
    }
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
    case "dismiss-leave-warning":
      dismissLeaveWarning();
      break;
    case "confirm-leave-session":
      confirmLeaveSession();
      break;
    case "end-session":
      requestEndSelectedSession();
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
    case "toggle-mic":
      _toggleVoiceInput(actionEl);
      break;
    case "close-summary":
      state.summaryModalVisible = false;
      state.sessionTrackingMessage = "";
      render();
      break;
    default:
      break;
  }
});

appEl.addEventListener("keydown", (event) => {
  const day = event.target.closest?.('[data-action="stats-day"]');
  if (!day || (event.key !== "Enter" && event.key !== " ")) return;
  event.preventDefault();
  state.statsSelectedDateKey = day.dataset.dateKey || "";
  render();
});

window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin) {
    return;
  }

  const data = event.data;
  if (!data || data.source !== "mindfulness-avatar") return;

  if (data.type === "avatar-ready") {
    if (!avatarReadyState[data.host]) {
      avatarReadyState[data.host] = true;
    }
    flushAvatarCommands(data.host);
    void syncAvatarAuthState(data.host);
    if (data.host === AVATAR_HOST_SESSION) {
      syncSessionAvatarProgress();
    }
    return;
  }

  if (data.type === "profile-updated") {
    void persistGuideProfile(data.profile);
    return;
  }

  if (data.type === "transcript") {
    state.avatarTranscripts[data.host] = Array.isArray(data.messages) ? data.messages : [];
    return;
  }

  if (data.type === "next-clicked" && data.host === AVATAR_HOST_SESSION) {
    const selectedSession = getSelectedSession();
    if (selectedSession.kind === "guided") {
      goToNextSlide();
    } else if (selectedSession.kind === "scripted") {
      goToNextScriptSegment();
    }
    return;
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
    if (state.leaveWarningVisible) {
      state.leaveWarningVisible = false;
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
const storedLanguagePreference = getLocalLanguagePreference();
if (storedLanguagePreference) {
  state.locale = storedLanguagePreference;
  applyLocaleToDocument(storedLanguagePreference);
}

(async function initApp() {
  let fbReady = false;
  try {
    const res = await fetch(`${API_BASE_URL}/firebase-config`);
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
        getCurrentUser:   ()          => auth.currentUser,
        sendPasswordResetEmail: (email) => auth.sendPasswordResetEmail(email),
        saveUserProfile:  (uid, data) => db.collection("users").doc(uid).set(data),
        updateUserProfile: (uid, data) => db.collection("users").doc(uid).set({
          ...data,
          updatedAt: fieldValue.serverTimestamp(),
        }, { merge: true }),
        subscribeToUserDoc: (uid, onData, onError) =>
          db.collection("users").doc(uid).onSnapshot(
            (snap) => onData(snap.exists ? snap.data() : {}),
            (err) => { if (onError) onError(err); }
          ),
          subscribeToUserSessions: (uid, onData, onError) =>
          db.collection("users").doc(uid).collection("sessions")
            .orderBy("createdAt", "desc")
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
                    transcript: Array.isArray(data.metadata && data.metadata.transcript) ? data.metadata.transcript : [],
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
            // Only a finished practice earns credit: the completed count, the
            // streak and the active-day tally are all gated on it. Time spent
            // always banks, so leaving early is never worth nothing.
            const isFullSession = completed === true;
            const lastActiveDate = data.lastActiveDate || null;
            const diff = getDayDifference(lastActiveDate, todayKey);
            const isNewActiveDay = lastActiveDate !== todayKey;
            const currentStreak = isFullSession
              ? (!isNewActiveDay
                  ? data.currentStreak || 1
                  : diff === 1
                    ? (data.currentStreak || 0) + 1
                    : 1)
              : data.currentStreak || 0;
            const longestStreak = Math.max(data.longestStreak || 0, currentStreak);
            const totalActiveDays = (data.totalActiveDays ?? data.totalDays ?? 0)
              + (isFullSession && isNewActiveDay ? 1 : 0);
            const totalSessionSeconds = (data.totalSessionSeconds || 0) + elapsedSeconds;
            const totalSessionMinutes = roundSessionMinutes(totalSessionSeconds);
            const sessionsFinished = (data.sessionsFinished || 0) + (isFullSession ? 1 : 0);

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
              // an unfinished practice must not claim the day, or a later full
              // session today would be treated as already counted
              ...(isFullSession ? { lastActiveDate: todayKey } : {}),
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
        loadMoodState(user);
        if (user) {
          state.authScreen = "signin";
          state.languageModalVisible = false;
        }
        void syncAvatarAuthState();
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
              if (typeof data.guideProfile === "string") {
                state.guideProfile = data.guideProfile;
                void syncAvatarAuthState();
              }
              state.userStatsLoading = false;
              if (state.screen === "personal-info" && !state.personalInfoDirty && !state.personalInfoSaving && !state.personalInfoStatus.text) {
                initializePersonalInfoDraft();
              }
              if (data && data.settings && typeof data.settings === "object") {
                const incoming = data.settings;
                const merged = { ...state.settings };
                if (typeof incoming.notifications === "boolean") merged.notifications = incoming.notifications;
                if (incoming.theme === "dark" || incoming.theme === "light") merged.theme = incoming.theme;
                state.settings = merged;
                applyTheme(merged.theme);
                persistLocalSettings();
              }
              const remoteLocale = data && isSupportedLocale(data.locale)
                ? data.locale
                : data && isSupportedLocale(data.languagePreference)
                  ? data.languagePreference
                  : "";
              if (remoteLocale) {
                const localeChanged = state.locale !== remoteLocale;
                state.locale = remoteLocale;
                state.languageModalVisible = false;
                persistLocalLanguagePreference(remoteLocale);
                applyLocaleToDocument(remoteLocale);
                if (localeChanged) {
                  scheduleGoogleRetranslate();
                  render();
                }
              } else {
                const localLocale = getLocalLanguagePreference();
                if (localLocale) {
                  state.locale = localLocale;
                  state.languageModalVisible = false;
                  applyLocaleToDocument(localLocale);
                  void persistRemoteSettings({ locale: localLocale });
                } else {
                  state.languageModalVisible = true;
                }
              }
              if (["home", "stats", "settings", "personal-info"].includes(state.screen)) render();
            },
            () => {
              state.userStats = {};
              state.userStatsLoading = false;
              state.languageModalVisible = !getLocalLanguagePreference();
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
              // home reads this too now, for the suggestion and the done badges
              if (state.screen === "stats" || state.screen === "home") render();
            },
            () => {
              state.userSessions = [];
              state.userSessionsLoading = false;
              if (state.screen === "stats" || state.screen === "home") render();
            }
          );
        } else {
          state.userStats = null;
          state.userStatsLoading = false;
          state.userSessions = [];
          state.userSessionsLoading = false;
          state.languageModalVisible = false;
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
