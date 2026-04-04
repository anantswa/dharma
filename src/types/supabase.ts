/**
 * TypeScript types matching the DharmaWeave Supabase tables.
 * These are the shapes returned by the REST API / supabase-js client.
 */

export type WisdomEntry = {
  id: string;
  tradition: string;
  source_text: string | null;
  source_location: string | null;
  speaker: string | null;
  listener: string | null;
  context: string | null;
  original_script: string | null;
  transliteration: string | null;
  translation_en: string | null;
  translation_hi: string | null;
  elaboration: string | null;
  themes: string[] | null;
  mood: string | null;
  era: string | null;
  short_form: string | null;
  importance: number | null;
  emotion_cluster: string | null;
  calendar_tags: string[] | null;
  series_id: string | null;
  series_order: number | null;
  audio_url: string | null;
  created_at: string;
};

export type FestivalEntry = {
  id: string;
  date: string;
  name: string;
  faith: string;
  category: string;
  description: string | null;
  significance: string | null;
  story: string | null;
  customs: string | null;
  regions: string[] | null;
  importance: number | null;
  tradition: string | null;
  alternate_names: string[] | null;
  lunar_date: string | null;
  duration_days: number | null;
  content_themes: string[] | null;
  suggested_mood: string | null;
  year: number | null;
};

export type ImageEntry = {
  id: string;
  file_url: string | null;
  thumbnail_url: string | null;
  tradition: string | null;
  source_text: string | null;
  primary_figure: string | null;
  mood: string | null;
  scene_description: string | null;
  tags: string[] | null;
  orientation: string | null;
  available: boolean;
};
