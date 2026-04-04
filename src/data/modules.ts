/**
 * Learning Module Definitions
 *
 * Each module pulls its content from the Supabase wisdom table using
 * series_id or source_text queries. Modules are the core learning
 * experience of the app — they turn the wisdom library into structured
 * journeys that users progress through verse by verse.
 *
 * Module types:
 * - 'scripture': Sequential verse-by-verse study (Gita, Chalisa, Dhammapada)
 * - 'thematic': Cross-tradition exploration of a spiritual theme
 * - 'practice': Daily practices — meditation prompts, reflections
 *
 * Lesson flow per type:
 * - scripture: Read (original + translation) -> Understand (context) -> Reflect (prompt) -> Complete
 * - thematic: Discover (the teaching) -> Compare (cross-tradition) -> Contemplate -> Complete
 * - practice: Set intention -> Guided practice -> Journal -> Complete
 */

export type ModuleType = 'scripture' | 'thematic' | 'practice';

export type ModuleDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type ModuleDefinition = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  type: ModuleType;
  difficulty: ModuleDifficulty;
  tradition: string;             // 'hindu', 'buddhist', 'cross-tradition', etc.
  iconName: string;              // Ionicons name
  accentColor: string;           // Module-specific accent color

  // How to fetch lessons from Supabase
  query: {
    series_id?: string;          // Match wisdom.series_id
    source_text?: string;        // Match wisdom.source_text
    themes?: string[];           // Match any of these themes (for thematic modules)
    tradition?: string;          // Filter by tradition
    min_importance?: number;     // Minimum importance
  };

  // Estimated lesson count (shown before sync)
  estimatedLessons: number;

  // Whether module is available or coming soon
  available: boolean;

  // Reflection prompts for each lesson (used in the Reflect step)
  reflectionPrompts?: string[];
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCRIPTURE MODULES — Sequential verse-by-verse journeys
// ═══════════════════════════════════════════════════════════════════════════════

const SCRIPTURE_MODULES: ModuleDefinition[] = [
  {
    id: 'hanuman-chalisa',
    title: 'Hanuman Chalisa',
    subtitle: '42 verses of devotion to Hanuman',
    description: 'Learn the Hanuman Chalisa verse by verse — the most recited prayer in Hinduism. Each lesson teaches one verse: its Sanskrit text, meaning, and the story behind it.',
    type: 'scripture',
    difficulty: 'beginner',
    tradition: 'hindu',
    iconName: 'flame-outline',
    accentColor: '#FF6B35',
    query: { series_id: 'hanuman_chalisa' },
    estimatedLessons: 42,
    available: true,
    reflectionPrompts: [
      'What quality of Hanuman inspires you most in this verse?',
      'How does this teaching apply to a challenge you face today?',
      'Close your eyes and recite this verse from memory. How does it feel?',
      'What would it mean to embody this verse in your daily life?',
    ],
  },
  {
    id: 'bhagavad-gita',
    title: 'Bhagavad Gita',
    subtitle: 'The song of God — 60 essential verses',
    description: 'Journey through the Bhagavad Gita\'s most transformative teachings. Each lesson presents a verse with its battlefield context, Krishna\'s wisdom, and a reflection for your life.',
    type: 'scripture',
    difficulty: 'intermediate',
    tradition: 'hindu',
    iconName: 'book-outline',
    accentColor: '#D4A017',
    query: { series_id: 'gita' },
    estimatedLessons: 60,
    available: true,
    reflectionPrompts: [
      'Arjuna faced impossible choices. What impossible choice are you navigating?',
      'Krishna says act without attachment to results. Where in your life could you practice this?',
      'What does "dharma" mean to you after reading this verse?',
      'If Krishna were speaking to you directly, what would you ask?',
    ],
  },
  {
    id: 'ramayana',
    title: 'Ramayana',
    subtitle: 'The epic of Rama — 44 key passages',
    description: 'Walk the path of Rama through the Ramayana\'s most powerful moments — exile, devotion, war, and the triumph of dharma.',
    type: 'scripture',
    difficulty: 'intermediate',
    tradition: 'hindu',
    iconName: 'trail-sign-outline',
    accentColor: '#228B22',
    query: { series_id: 'ramayana' },
    estimatedLessons: 44,
    available: true,
    reflectionPrompts: [
      'Rama chose duty over comfort. When have you done the same?',
      'Sita\'s strength is quiet but immense. Where do you find quiet strength?',
      'What does loyalty mean to you after this passage?',
    ],
  },
  {
    id: 'dhammapada',
    title: 'Dhammapada',
    subtitle: 'The path of truth — Buddha\'s essential teachings',
    description: 'The Dhammapada distills the Buddha\'s teaching into 423 verses of startling clarity. This module presents the most essential, arranged by theme.',
    type: 'scripture',
    difficulty: 'beginner',
    tradition: 'buddhist',
    iconName: 'leaf-outline',
    accentColor: '#4A90D9',
    query: { series_id: 'dhammapada' },
    estimatedLessons: 19,
    available: true,
    reflectionPrompts: [
      'The Buddha says the mind shapes all experience. Notice your mind right now — what is it shaping?',
      'Impermanence is not a problem to solve. It is a truth to befriend. Can you sit with that?',
      'What attachment could you soften today?',
    ],
  },
  {
    id: 'yoga-sutras',
    title: 'Yoga Sutras',
    subtitle: 'Patanjali\'s science of the mind',
    description: 'The Yoga Sutras are not about physical poses — they are a manual for mastering the mind. Each sutra is a seed of wisdom that unfolds with contemplation.',
    type: 'scripture',
    difficulty: 'advanced',
    tradition: 'hindu',
    iconName: 'body-outline',
    accentColor: '#9B59B6',
    query: { series_id: 'yoga_sutras' },
    estimatedLessons: 10,
    available: true,
    reflectionPrompts: [
      'Yogas chitta vritti nirodhah — the stilling of the mind. When was your mind most still today?',
      'What is the difference between concentration and meditation in your experience?',
      'Patanjali maps the obstacles. Which obstacle is most alive in your life right now?',
    ],
  },
  {
    id: 'rig-veda',
    title: 'Rig Veda',
    subtitle: 'Humanity\'s oldest hymns',
    description: 'The Rig Veda is the oldest spiritual text in continuous use — hymns composed over 3,000 years ago that still resonate. These are the verses that shaped all of Hinduism.',
    type: 'scripture',
    difficulty: 'advanced',
    tradition: 'hindu',
    iconName: 'sunny-outline',
    accentColor: '#E8A317',
    query: { series_id: 'rig_veda' },
    estimatedLessons: 17,
    available: true,
  },
  {
    id: 'guru-granth',
    title: 'Guru Granth Sahib',
    subtitle: 'The living Guru of the Sikhs',
    description: 'The Guru Granth Sahib is not just a scripture — it is the eternal Guru. These selections span the Mool Mantar, Japji Sahib, Asa Di Vaar, and Sukhmani Sahib.',
    type: 'scripture',
    difficulty: 'intermediate',
    tradition: 'sikh',
    iconName: 'shield-outline',
    accentColor: '#FF8C00',
    query: { tradition: 'sikh', min_importance: 3 },
    estimatedLessons: 20,
    available: true,
    reflectionPrompts: [
      'Ik Onkar — One God. What does oneness mean in your daily experience?',
      'The Guru Granth Sahib dissolves caste. Where do you still carry divisions?',
      'Seva (selfless service) is central. How will you serve today?',
    ],
  },
  {
    id: 'bhagavata-purana',
    title: 'Bhagavata Purana',
    subtitle: 'Stories of the divine — Krishna, avatars, devotion',
    description: 'The Bhagavata Purana is storytelling as spiritual practice. Through Krishna\'s life, the ten avatars, and tales of devotees, it teaches that love is the highest path.',
    type: 'scripture',
    difficulty: 'intermediate',
    tradition: 'hindu',
    iconName: 'heart-outline',
    accentColor: '#E74C3C',
    query: { source_text: 'Bhagavata Purana' },
    estimatedLessons: 40,
    available: true,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// THEMATIC MODULES — Cross-tradition explorations
// ═══════════════════════════════════════════════════════════════════════════════

const THEMATIC_MODULES: ModuleDefinition[] = [
  {
    id: 'what-is-the-soul',
    title: 'What Is the Soul?',
    subtitle: 'Hindu, Buddhist, Sikh, Jain, Christian, Sufi perspectives',
    description: 'Every tradition asks: what am I beyond this body? Explore the Atman, Anatta, Rooh, Jiva, and Soul — not to flatten differences, but to hear the same question asked in different voices.',
    type: 'thematic',
    difficulty: 'intermediate',
    tradition: 'cross-tradition',
    iconName: 'sparkles-outline',
    accentColor: '#7B68EE',
    query: { themes: ['unity', 'transcendence', 'liberation', 'inner_light'] },
    estimatedLessons: 15,
    available: true,
    reflectionPrompts: [
      'The Gita says the soul is eternal. Buddhism says there is no fixed self. Can both be true?',
      'Close your eyes. What remains when you stop thinking?',
      'If you are not your thoughts, your body, or your name — what are you?',
    ],
  },
  {
    id: 'love-and-devotion',
    title: 'Love & Devotion',
    subtitle: 'Bhakti, Ishq, Agape — the path of the heart',
    description: 'From Meera\'s ecstatic surrender to Rumi\'s burning love to the Psalms\' cries to God — devotion is the one path every tradition shares. This module is for the heart, not the head.',
    type: 'thematic',
    difficulty: 'beginner',
    tradition: 'cross-tradition',
    iconName: 'heart-circle-outline',
    accentColor: '#FF69B4',
    query: { themes: ['devotion', 'love', 'surrender', 'divine_grace'] },
    estimatedLessons: 20,
    available: true,
    reflectionPrompts: [
      'Rumi says the wound is where the light enters. What wound has brought you light?',
      'What does it feel like to surrender? Is it weakness or the deepest strength?',
      'Who or what do you love so completely that it dissolves your sense of self?',
    ],
  },
  {
    id: 'facing-fear',
    title: 'Facing Fear',
    subtitle: 'Courage across traditions',
    description: 'Arjuna\'s despair on the battlefield. Prahlad\'s defiance of a tyrant. The Buddha sitting under the Bodhi tree while Mara attacks. Every spiritual path has a teaching about fear — and every teaching says: walk toward it.',
    type: 'thematic',
    difficulty: 'beginner',
    tradition: 'cross-tradition',
    iconName: 'shield-checkmark-outline',
    accentColor: '#DC143C',
    query: { themes: ['courage', 'fearlessness', 'protection', 'dharma'] },
    estimatedLessons: 15,
    available: true,
    reflectionPrompts: [
      'What are you afraid of right now? Name it honestly.',
      'Arjuna\'s fear was not cowardice — it was compassion misplaced. What fear of yours might be misplaced wisdom?',
      'Courage is not the absence of fear. It is action despite fear. What action are you avoiding?',
    ],
  },
  {
    id: 'finding-peace',
    title: 'Finding Peace',
    subtitle: 'Stillness, meditation, and inner quiet',
    description: 'The world is loud. These teachings are quiet. From Zen silence to Vedic meditation to the Psalms\' "Be still and know" — a module for when you need the noise to stop.',
    type: 'thematic',
    difficulty: 'beginner',
    tradition: 'cross-tradition',
    iconName: 'water-outline',
    accentColor: '#20B2AA',
    query: { themes: ['peace', 'meditation', 'detachment', 'impermanence'] },
    estimatedLessons: 15,
    available: true,
    reflectionPrompts: [
      'Where in your body do you hold tension right now? Breathe into it.',
      'Peace is not the absence of conflict. It is the presence of something deeper. What is that something?',
      'Can you sit for 60 seconds without reaching for your phone? Try it now.',
    ],
  },
  {
    id: 'karma-and-action',
    title: 'Karma & Right Action',
    subtitle: 'Duty, consequence, and the art of doing',
    description: 'Krishna\'s karma yoga. Buddhism\'s eightfold path. Sikhism\'s kirat karo. Jainism\'s ahimsa in action. How do you act in the world without being consumed by it?',
    type: 'thematic',
    difficulty: 'intermediate',
    tradition: 'cross-tradition',
    iconName: 'compass-outline',
    accentColor: '#DAA520',
    query: { themes: ['karma', 'duty', 'service', 'sacrifice', 'non_violence'] },
    estimatedLessons: 15,
    available: true,
  },
  {
    id: 'zen-koans',
    title: 'Zen Koans',
    subtitle: 'Riddles that break the thinking mind',
    description: 'A koan is not a puzzle with an answer. It is a bomb that destroys the question. Sit with each one. Don\'t think. Don\'t analyze. Let it work on you.',
    type: 'thematic',
    difficulty: 'advanced',
    tradition: 'zen',
    iconName: 'help-circle-outline',
    accentColor: '#708090',
    query: { tradition: 'zen' },
    estimatedLessons: 15,
    available: true,
    reflectionPrompts: [
      'Mu.',
      'What is the sound of one hand clapping? Don\'t answer with words.',
      'If you meet the Buddha on the road, kill him. What does this mean for YOUR teachers?',
      'Before enlightenment, chop wood, carry water. After enlightenment, chop wood, carry water. What changed?',
    ],
  },
  {
    id: 'sufi-poetry',
    title: 'The Sufi Path',
    subtitle: 'Rumi, Hafiz, Kabir, Bulleh Shah',
    description: 'Sufism is Islam\'s heart on fire. These poets didn\'t write about God — they wrote FROM the burning. Rumi\'s longing, Hafiz\'s joy, Kabir\'s radical honesty, Bulleh Shah\'s wild abandon.',
    type: 'thematic',
    difficulty: 'beginner',
    tradition: 'sufi',
    iconName: 'bonfire-outline',
    accentColor: '#C0392B',
    query: { tradition: 'sufi' },
    estimatedLessons: 20,
    available: true,
    reflectionPrompts: [
      'Rumi says "What you seek is seeking you." What is seeking you right now?',
      'Kabir questions everything — priests, temples, rituals. What belief of yours needs questioning?',
      'The Sufis say the ego is the veil. What would you see if the veil dropped?',
    ],
  },
  {
    id: 'upanishad-essentials',
    title: 'The Upanishads',
    subtitle: 'The end of the Vedas — the beginning of knowing',
    description: 'Tat Tvam Asi. Aham Brahmasmi. Ayam Atma Brahma. The Upanishads are where Indian philosophy becomes personal — where the cosmic truth is discovered within.',
    type: 'scripture',
    difficulty: 'advanced',
    tradition: 'hindu',
    iconName: 'eye-outline',
    accentColor: '#4169E1',
    query: {
      source_text: 'Upanishad',  // Will match all Upanishads via ILIKE
    },
    estimatedLessons: 30,
    available: true,
    reflectionPrompts: [
      'Tat Tvam Asi — "You are That." What is "That"?',
      'The Upanishads say Brahman is everywhere. Look at the room around you. Where is Brahman?',
      'Nachiketa demanded the truth about death. What truth are you avoiding demanding?',
    ],
  },
  {
    id: 'bible-essentials',
    title: 'Bible Essentials',
    subtitle: 'Psalms, Gospels, Genesis — the Christian heart',
    description: 'From "In the beginning" to "Love your neighbor as yourself" — the Bible\'s most powerful passages. Read not as theology, but as poetry of the soul reaching for the divine.',
    type: 'scripture',
    difficulty: 'beginner',
    tradition: 'christian',
    iconName: 'book-outline',
    accentColor: '#800020',
    query: { tradition: 'christian' },
    estimatedLessons: 25,
    available: true,
  },
  {
    id: 'jain-path',
    title: 'The Jain Path',
    subtitle: 'Non-violence, truth, and radical renunciation',
    description: 'Jainism takes non-violence further than any other tradition — ahimsa in thought, word, and deed. These teachings challenge you to live with radical gentleness.',
    type: 'thematic',
    difficulty: 'intermediate',
    tradition: 'jain',
    iconName: 'hand-left-outline',
    accentColor: '#B8860B',
    query: { tradition: 'jain' },
    estimatedLessons: 15,
    available: true,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// PRACTICE MODULES — Daily engagement
// ═══════════════════════════════════════════════════════════════════════════════

const PRACTICE_MODULES: ModuleDefinition[] = [
  {
    id: 'daily-reflection',
    title: 'Daily Reflection',
    subtitle: '30 days of morning wisdom',
    description: 'Start each morning with one verse and one question. No analysis, no study — just a moment of stillness before the day begins. 5 minutes that change the texture of your entire day.',
    type: 'practice',
    difficulty: 'beginner',
    tradition: 'cross-tradition',
    iconName: 'sunny-outline',
    accentColor: '#FFA500',
    query: { min_importance: 4 },
    estimatedLessons: 30,
    available: true,
    reflectionPrompts: [
      'What is one word that describes how you feel right now?',
      'What are you grateful for this morning?',
      'What intention will you carry into today?',
      'If you could let go of one thing today, what would it be?',
      'Who needs your kindness today?',
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ALL MODULES — sorted by display order
// ═══════════════════════════════════════════════════════════════════════════════

export const ALL_MODULES: ModuleDefinition[] = [
  // Scripture first (the deep journeys)
  ...SCRIPTURE_MODULES,
  // Then thematic (cross-tradition explorations)
  ...THEMATIC_MODULES,
  // Then practice (daily engagement)
  ...PRACTICE_MODULES,
];

/**
 * Get modules filtered by tradition preference.
 * Shows all available modules, but tradition-specific ones are sorted
 * to show the user's primary tradition first.
 */
export function getModulesForUser(
  primaryTradition?: string,
  enabledTraditions?: Record<string, boolean>,
): ModuleDefinition[] {
  let modules = ALL_MODULES.filter((m) => m.available);

  if (primaryTradition) {
    // Sort: primary tradition first, then cross-tradition, then others
    modules.sort((a, b) => {
      const aScore =
        a.tradition === primaryTradition.toLowerCase() ? 0 :
        a.tradition === 'cross-tradition' ? 1 : 2;
      const bScore =
        b.tradition === primaryTradition.toLowerCase() ? 0 :
        b.tradition === 'cross-tradition' ? 1 : 2;
      return aScore - bScore;
    });
  }

  return modules;
}
