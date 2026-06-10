/**
 * Sahāra (सहारा — support) — the "what brings you today?" doorway.
 *
 * The second way people reach for God: not the daily habit, but the moment of need.
 * Each need routes to the tradition's own prescription — deity + mantra + a short
 * breath practice + canonical verses — exactly as the tradition itself maps them
 * (Hanuman for courage, Ganesha before beginnings, the Gita's soul verses in grief).
 *
 * All content is curated and canonical (source-cited). The deity's chant plays
 * softly via the live mantras manifest (same resolver as the temple).
 */

export type SaharaVerse = {
  deva: string;          // Devanagari
  trans?: string;        // transliteration (optional display)
  en: string;            // English meaning
  hi: string;            // Hindi meaning
  source: string;        // citation
};

export type SaharaNeed = {
  id: string;
  emoji: string;
  /** The feeling, as the user would name it. */
  label: string;
  labelHi: string;
  /** One soft line under the label on the chooser. */
  whisper: string;
  /** Deity who answers this need (name matches deityMantras RULES + deity art slug). */
  deityName: string;
  artSlug: string;       // dharma-art/deities/<slug>.jpg
  /** Why this deity / one-line bridge shown under the header. */
  bridge: string;
  /** Breath practice — 3 short steps. */
  practice: { title: string; steps: string[] };
  verses: SaharaVerse[];
  /** The line they leave with. */
  closing: string;
};

const ART = (slug: string) =>
  `https://aiwugigdrvijjeoqtpog.supabase.co/storage/v1/object/public/dharma-art/deities/${slug}.jpg`;

export const saharaArtUrl = ART;

export const SAHARA_NEEDS: SaharaNeed[] = [
  {
    id: 'anxious',
    emoji: '🌊',
    label: 'I feel anxious',
    labelHi: 'मन अशांत है',
    whisper: 'The mind is restless — the tradition knows this.',
    deityName: 'Lord Shiva',
    artSlug: 'shiva',
    bridge: 'Shiva sits unmoved at the centre of every storm. Sit with him.',
    practice: {
      title: 'The longer exhale',
      steps: [
        'Breathe in gently for a count of four.',
        'Breathe out slowly for a count of six — let the breath leave like a wave returning.',
        'With each exhale, silently: śānti. Stay for nine breaths.',
      ],
    },
    verses: [
      {
        deva: 'असंशयं महाबाहो मनो दुर्निग्रहं चलम् ।\nअभ्यासेन तु कौन्तेय वैराग्येण च गृह्यते ॥',
        trans: 'asaṁśayaṁ mahābāho mano durnigrahaṁ calam, abhyāsena tu kaunteya vairāgyeṇa ca gṛhyate',
        en: 'Without doubt the mind is restless and hard to hold — but by practice, and by gently letting go, it is held.',
        hi: 'निःसंदेह मन चंचल है और कठिनाई से वश में आता है — पर अभ्यास और वैराग्य से वह वश में आ ही जाता है।',
        source: 'Bhagavad Gītā 6.35',
      },
      {
        deva: 'योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय ।\nसिद्ध्यसिद्ध्योः समो भूत्वा समत्वं योग उच्यते ॥',
        en: 'Established in calm, do what is yours to do — the same in success and failure. That evenness is yoga.',
        hi: 'योग में स्थित होकर अपना कर्म कर; सिद्धि-असिद्धि में सम रहना ही योग कहलाता है।',
        source: 'Bhagavad Gītā 2.48',
      },
    ],
    closing: 'The storm is on the surface. You are the depth.',
  },
  {
    id: 'grieving',
    emoji: '🕊️',
    label: 'I am grieving',
    labelHi: 'शोक में हूँ',
    whisper: 'For the heart that has lost someone.',
    deityName: 'Lord Krishna',
    artSlug: 'krishna',
    bridge: 'On the field of Kurukshetra, Krishna spoke to a grieving heart. He speaks to yours.',
    practice: {
      title: 'The heart breath',
      steps: [
        'Place a hand over your heart.',
        'Breathe slowly into that warmth, as if the breath could reach what aches.',
        'On each exhale, let the love remain and the weight soften. Nine breaths.',
      ],
    },
    verses: [
      {
        deva: 'न जायते म्रियते वा कदाचि-\nन्नायं भूत्वा भविता वा न भूयः ।\nअजो नित्यः शाश्वतोऽयं पुराणो\nन हन्यते हन्यमाने शरीरे ॥',
        trans: 'na jāyate mriyate vā kadācin…',
        en: 'The soul is never born, and it never dies. Unborn, eternal, everlasting — it is not slain when the body is slain.',
        hi: 'आत्मा न कभी जन्मती है, न कभी मरती है। यह अजन्मा, नित्य, शाश्वत है — शरीर के मारे जाने पर भी यह नहीं मरती।',
        source: 'Bhagavad Gītā 2.20',
      },
      {
        deva: 'वासांसि जीर्णानि यथा विहाय\nनवानि गृह्णाति नरोऽपराणि ।\nतथा शरीराणि विहाय जीर्णा-\nन्यन्यानि संयाति नवानि देही ॥',
        en: 'As a person sets aside worn garments and puts on new ones, so the soul sets aside the worn body and moves into the new.',
        hi: 'जैसे मनुष्य पुराने वस्त्र त्यागकर नये धारण करता है, वैसे ही आत्मा जीर्ण शरीर त्यागकर नया धारण करती है।',
        source: 'Bhagavad Gītā 2.22',
      },
    ],
    closing: 'What you love is not lost. It has only changed its garment.',
  },
  {
    id: 'grateful',
    emoji: '🙏',
    label: 'I feel grateful',
    labelHi: 'कृतज्ञ हूँ',
    whisper: 'Let the fullness be offered back.',
    deityName: 'Goddess Lakshmi',
    artSlug: 'lakshmi',
    bridge: 'Gratitude is how abundance is received — and how it is kept flowing.',
    practice: {
      title: 'Three gifts',
      steps: [
        'Take one slow breath, and name — silently — one gift of this day.',
        'A second breath: name another. A third: one more.',
        'Rest a moment with the fullness. It was always being given.',
      ],
    },
    verses: [
      {
        deva: 'ॐ पूर्णमदः पूर्णमिदं पूर्णात्पूर्णमुदच्यते ।\nपूर्णस्य पूर्णमादाय पूर्णमेवावशिष्यते ॥',
        trans: 'oṁ pūrṇam adaḥ pūrṇam idaṁ…',
        en: 'That is whole; this is whole. From wholeness, wholeness arises. Take wholeness from wholeness — wholeness alone remains.',
        hi: 'वह पूर्ण है; यह भी पूर्ण है। पूर्ण से पूर्ण निकलता है; पूर्ण में से पूर्ण लेने पर भी पूर्ण ही शेष रहता है।',
        source: 'Īśāvāsya Upaniṣad — invocation',
      },
      {
        deva: 'पत्रं पुष्पं फलं तोयं यो मे भक्त्या प्रयच्छति ।\nतदहं भक्त्युपहृतमश्नामि प्रयतात्मनः ॥',
        en: 'A leaf, a flower, a fruit, a little water — offered with love, I accept it.',
        hi: 'पत्र, पुष्प, फल या जल — जो मुझे प्रेम से अर्पित करता है, मैं उसका वह भक्ति-भरा उपहार स्वीकार करता हूँ।',
        source: 'Bhagavad Gītā 9.26',
      },
    ],
    closing: 'Gratitude is darshan — seeing what was always given.',
  },
  {
    id: 'courage',
    emoji: '🔥',
    label: 'I need courage',
    labelHi: 'साहस चाहिए',
    whisper: 'Before the hard thing. Before the leap.',
    deityName: 'Lord Hanuman',
    artSlug: 'hanuman',
    bridge: 'When the ocean had to be crossed, Hanuman simply remembered who he was.',
    practice: {
      title: 'The steady flame',
      steps: [
        'Sit tall. Take one deep breath in — and feel the spine rise.',
        'Exhale slowly, shoulders settling, jaw soft. The body of someone who is ready.',
        'Three more breaths. With each: balam — strength. It is already in you.',
      ],
    },
    verses: [
      {
        deva: 'संकट कटै मिटै सब पीरा ।\nजो सुमिरै हनुमत बलबीरा ॥',
        trans: 'saṅkaṭa kaṭai miṭai saba pīrā, jo sumirai hanumata balabīrā',
        en: 'Every danger passes, every pain dissolves, for the one who remembers Hanuman, the mighty and brave.',
        hi: 'संकट कट जाते हैं, सब पीड़ा मिट जाती है — जो बलवीर हनुमान का स्मरण करता है।',
        source: 'Hanuman Chalisa',
      },
      {
        deva: 'क्लैब्यं मा स्म गमः पार्थ नैतत्त्वय्युपपद्यते ।\nक्षुद्रं हृदयदौर्बल्यं त्यक्त्वोत्तिष्ठ परन्तप ॥',
        en: 'Do not yield to weakness — it does not become you. Shake off this faintness of heart. Rise.',
        hi: 'हे पार्थ, कायरता को मत अपनाओ — यह तुम्हें शोभा नहीं देती। हृदय की इस दुर्बलता को त्यागकर उठ खड़े हो।',
        source: 'Bhagavad Gītā 2.3',
      },
    ],
    closing: 'He who leapt the ocean lives in you.',
  },
  {
    id: 'beginning',
    emoji: '🌅',
    label: 'A new beginning',
    labelHi: 'नई शुरुआत',
    whisper: 'Before the first step — invoke the remover of obstacles.',
    deityName: 'Lord Ganesha',
    artSlug: 'ganesha',
    bridge: 'Every Hindu beginning starts with Ganesha — so the path opens clean.',
    practice: {
      title: 'The saṅkalpa breath',
      steps: [
        'Bring the new thing to mind — see its very first step, small and clear.',
        'Breathe in, and silently make the vow: I begin.',
        'Breathe out, and release the outcome. The step is yours; the fruit is His.',
      ],
    },
    verses: [
      {
        deva: 'वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ ।\nनिर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा ॥',
        trans: 'vakratuṇḍa mahākāya sūryakoṭi samaprabha…',
        en: 'O curved-trunked, vast-bodied one, radiant as ten million suns — make my path free of obstacles, always, in every undertaking.',
        hi: 'हे वक्रतुण्ड, महाकाय, करोड़ सूर्यों के समान तेजस्वी देव — मेरे सब कार्यों में सदा विघ्नों को दूर करें।',
        source: 'Gaṇeśa dhyāna-śloka',
      },
      {
        deva: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥',
        en: 'Your right is to the work alone, never to its fruits. Begin — and let go of the outcome.',
        hi: 'तेरा अधिकार केवल कर्म पर है, फल पर कभी नहीं। कर्म कर — और फल की चिंता छोड़ दे।',
        source: 'Bhagavad Gītā 2.47',
      },
    ],
    closing: 'Every threshold is His doorway.',
  },
  {
    id: 'sleepless',
    emoji: '🌙',
    label: "I can't sleep",
    labelHi: 'नींद नहीं आती',
    whisper: 'Let the day be set down.',
    deityName: 'Lord Shiva',
    artSlug: 'shiva',
    bridge: 'The one who wears the crescent moon holds the night. Give it to him.',
    practice: {
      title: 'Setting the day down',
      steps: [
        'Lying down or seated — breathe out long, and let the face go soft.',
        'With each exhale, release one thing from today. Name it, thank it, set it down.',
        'When the hands feel heavy and warm, let even the counting go.',
      ],
    },
    verses: [
      {
        deva: 'युक्ताहारविहारस्य युक्तचेष्टस्य कर्मसु ।\nयुक्तस्वप्नावबोधस्य योगो भवति दुःखहा ॥',
        trans: 'yuktāhāra-vihārasya… yukta-svapnāvabodhasya',
        en: 'For one measured in food and rest, in effort — and in sleep and waking — this path dissolves all sorrow.',
        hi: 'जिसका आहार-विहार संतुलित है, कर्मों में चेष्टा संतुलित है, सोना-जागना संतुलित है — उसके लिए योग दुःखों का नाश करने वाला है।',
        source: 'Bhagavad Gītā 6.17',
      },
      {
        deva: 'सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः ।\nसर्वे भद्राणि पश्यन्तु मा कश्चिद्दुःखभाग्भवेत् ॥',
        en: 'May all be happy. May all be free of illness. May all see what is good. May no one suffer.',
        hi: 'सब सुखी हों, सब निरोग हों, सब शुभ देखें, कोई दुःख का भागी न हो।',
        source: 'Śānti-pāṭha (traditional)',
      },
    ],
    closing: 'Let the day go. The night is held.',
  },
];

export const getSaharaNeed = (id?: string): SaharaNeed =>
  SAHARA_NEEDS.find((n) => n.id === id) ?? SAHARA_NEEDS[0];
