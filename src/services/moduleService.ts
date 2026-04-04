/**
 * Module Service — fetches lesson content for learning modules from the dataStore.
 *
 * Each module defines a query (series_id, source_text, themes, tradition).
 * This service resolves that query against the synced wisdom data and
 * returns ordered lessons ready for the lesson flow screen.
 */

import type { ModuleDefinition } from '../data/modules';
import type { WisdomEntry } from '../types/supabase';
import { useDataStore } from '../store/dataStore';

export type ModuleLesson = {
  id: string;
  number: number;
  title: string;
  original: string;
  transliteration: string;
  translation: string;
  context: string;
  elaboration: string;
  source: string;
  speaker: string;
  mood: string;
  tradition: string;
  themes: string[];
  reflectionPrompt: string;
  audioUrl: string | null;
};

/**
 * Resolve a module's query into an ordered list of lessons.
 */
export function getLessonsForModule(module: ModuleDefinition): ModuleLesson[] {
  const wisdom = useDataStore.getState().wisdom;
  if (!wisdom.length) return [];

  let entries: WisdomEntry[] = [];
  const q = module.query;

  if (q.series_id) {
    // Sequential series — use series_order
    entries = wisdom
      .filter((w) => w.series_id === q.series_id)
      .sort((a, b) => (a.series_order || 0) - (b.series_order || 0));
  } else if (q.source_text) {
    // Match by source_text (ILIKE equivalent — case-insensitive contains)
    const searchLower = q.source_text.toLowerCase();
    entries = wisdom
      .filter((w) => w.source_text?.toLowerCase().includes(searchLower))
      .sort((a, b) => (a.series_order || 0) - (b.series_order || 0));
  } else if (q.themes && q.themes.length > 0) {
    // Thematic: match any of the target themes
    const targetThemes = new Set(q.themes);
    entries = wisdom.filter((w) => {
      if (!w.themes) return false;
      return w.themes.some((t) => targetThemes.has(t));
    });
  } else if (q.tradition) {
    // All entries for a tradition
    entries = wisdom.filter(
      (w) => w.tradition?.toLowerCase() === q.tradition?.toLowerCase(),
    );
  }

  // Apply importance filter
  if (q.min_importance) {
    entries = entries.filter((w) => (w.importance || 0) >= (q.min_importance || 0));
  }

  // Deduplicate by id
  const seen = new Set<string>();
  entries = entries.filter((w) => {
    if (seen.has(w.id)) return false;
    seen.add(w.id);
    return true;
  });

  // For thematic modules, sort by importance (best first)
  if (module.type === 'thematic' || module.type === 'practice') {
    entries.sort((a, b) => (b.importance || 3) - (a.importance || 3));
  }

  // Convert to lessons
  const prompts = module.reflectionPrompts || [
    'What does this teaching mean for your life today?',
    'Sit quietly for a moment. What arises?',
    'How would you explain this verse to someone you love?',
  ];

  return entries.map((w, i) => ({
    id: w.id,
    number: i + 1,
    title: buildLessonTitle(w, i, module),
    original: w.original_script || '',
    transliteration: w.transliteration || '',
    translation: w.translation_en || w.short_form || '',
    context: w.context || '',
    elaboration: w.elaboration || '',
    source: [w.source_text, w.source_location].filter(Boolean).join(' '),
    speaker: w.speaker || '',
    mood: w.mood || '',
    tradition: w.tradition || '',
    themes: w.themes || [],
    reflectionPrompt: prompts[i % prompts.length],
    audioUrl: w.audio_url || null,
  }));
}

function buildLessonTitle(w: WisdomEntry, index: number, module: ModuleDefinition): string {
  // For series: use source_location if available (e.g. "Chapter 2, Verse 47")
  if (w.source_location) return w.source_location;

  // For thematic: use short_form or a snippet of translation
  if (w.short_form) return w.short_form;

  // Fallback: "Lesson N"
  return `Lesson ${index + 1}`;
}
