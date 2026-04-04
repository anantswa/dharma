import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ALL_MODULES } from '../data/modules';
import { getLessonsForModule, type ModuleLesson } from '../services/moduleService';
import { CHALISA_LESSONS } from '../data/chalisaLessons';
import { useLearnProgressStore } from '../store/learnProgressStore';
import { useDataStore } from '../store/dataStore';

type Props = {
  navigation: any;
  route: any;
};

export const LessonSelectionScreen: React.FC<Props> = ({ navigation, route }) => {
  const moduleId = route.params?.moduleId || 'hanuman-chalisa';
  const module = ALL_MODULES.find((m) => m.id === moduleId);
  const completedLessons = useLearnProgressStore((s) => s.completedLessons);
  const loadProgress = useLearnProgressStore((s) => s.loadProgress);
  const markLessonIncomplete = useLearnProgressStore((s) => s.markLessonIncomplete);
  const wisdom = useDataStore((s) => s.wisdom);

  useEffect(() => { loadProgress(); }, []);

  // Get lessons — either from the old Chalisa data or from Supabase via moduleService
  const lessons: ModuleLesson[] = useMemo(() => {
    if (!module) return [];

    // For Hanuman Chalisa, use the existing detailed lesson data if Supabase has fewer
    if (moduleId === 'hanuman-chalisa') {
      const supabaseLessons = getLessonsForModule(module);
      if (supabaseLessons.length >= CHALISA_LESSONS.length) {
        return supabaseLessons;
      }
      // Fallback to bundled Chalisa data
      return CHALISA_LESSONS.map((cl, i) => ({
        id: cl.id,
        number: cl.number,
        title: cl.title,
        original: cl.hindi || '',
        transliteration: cl.transliteration || '',
        translation: cl.meaning || '',
        context: '',
        elaboration: '',
        source: 'Hanuman Chalisa',
        speaker: 'Tulsidas',
        mood: 'devotional',
        tradition: 'hindu',
        themes: ['devotion'],
        reflectionPrompt: module.reflectionPrompts?.[i % (module.reflectionPrompts?.length || 1)] || '',
        audioUrl: null,
      }));
    }

    return getLessonsForModule(module);
  }, [moduleId, wisdom]);

  const prefix = `${moduleId}:`;
  const moduleCompleted = completedLessons.filter((id) => id.startsWith(prefix));

  const isLessonCompleted = (lesson: ModuleLesson): boolean => {
    // Support both old format (lesson-1) and new format (module:id)
    return completedLessons.includes(lesson.id) || completedLessons.includes(`${prefix}${lesson.id}`);
  };

  const isLessonLocked = (index: number): boolean => {
    // For scripture modules: sequential unlock
    if (module?.type === 'scripture') {
      if (index === 0) return false;
      const prev = lessons[index - 1];
      return !isLessonCompleted(prev);
    }
    // For thematic/practice: all unlocked
    return false;
  };

  const handleLessonPress = (lesson: ModuleLesson) => {
    navigation.navigate('LessonFlow', {
      lessonId: lesson.id,
      moduleId,
      lesson,
    });
  };

  const handleMarkIncomplete = (lesson: ModuleLesson) => {
    Alert.alert(
      'Mark as Incomplete',
      `Redo "${lesson.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redo',
          style: 'destructive',
          onPress: () => {
            markLessonIncomplete(lesson.id);
            markLessonIncomplete(`${prefix}${lesson.id}`);
          },
        },
      ],
    );
  };

  if (!module) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Module not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{module.title}</Text>
          <Text style={styles.headerSub}>{module.subtitle}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Module description + progress */}
      <View style={styles.descSection}>
        <Text style={styles.descText}>{module.description}</Text>
        <View style={styles.progressRow}>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: lessons.length > 0
                    ? `${(moduleCompleted.length / lessons.length) * 100}%`
                    : '0%',
                  backgroundColor: module.accentColor,
                },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {moduleCompleted.length} / {lessons.length} complete
          </Text>
        </View>
      </View>

      {/* Lesson list */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {lessons.map((lesson, index) => {
          const locked = isLessonLocked(index);
          const completed = isLessonCompleted(lesson);

          return (
            <Pressable
              key={lesson.id}
              style={[
                styles.lessonCard,
                locked && styles.lessonCardLocked,
                completed && styles.lessonCardCompleted,
              ]}
              onPress={() => !locked && handleLessonPress(lesson)}
              disabled={locked}
            >
              <View style={styles.lessonLeft}>
                <View style={[
                  styles.lessonNum,
                  locked && styles.lessonNumLocked,
                  completed && styles.lessonNumCompleted,
                ]}>
                  {locked ? (
                    <Ionicons name="lock-closed" size={16} color="#475569" />
                  ) : completed ? (
                    <Ionicons name="checkmark" size={18} color="#22c55e" />
                  ) : (
                    <Text style={styles.lessonNumText}>{lesson.number}</Text>
                  )}
                </View>
                <View style={styles.lessonInfo}>
                  <Text style={[styles.lessonTitle, locked && styles.lockedText]} numberOfLines={1}>
                    {lesson.title}
                  </Text>
                  <Text style={[styles.lessonSnippet, locked && styles.lockedText]} numberOfLines={1}>
                    {lesson.transliteration || lesson.translation}
                  </Text>
                </View>
              </View>
              {!locked && !completed && (
                <Ionicons name="chevron-forward" size={20} color={module.accentColor} />
              )}
              {completed && (
                <Pressable style={styles.redoBtn} onPress={() => handleMarkIncomplete(lesson)}>
                  <Ionicons name="refresh-outline" size={18} color="#64748b" />
                </Pressable>
              )}
            </Pressable>
          );
        })}

        {lessons.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="cloud-download-outline" size={48} color="#475569" />
            <Text style={styles.emptyText}>
              Syncing content from DharmaWeave...
            </Text>
            <Text style={styles.emptySubtext}>
              Pull down to refresh, or check your connection.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Playfair_Bold', color: '#fbbf24' },
  headerSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  descSection: { paddingHorizontal: 20, paddingVertical: 16 },
  descText: { fontSize: 14, color: '#94a3b8', lineHeight: 20, marginBottom: 14 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBarBg: { flex: 1, height: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  progressLabel: { fontSize: 12, color: '#64748b' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(15,23,42,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  lessonCardLocked: { opacity: 0.4 },
  lessonCardCompleted: { borderColor: 'rgba(34,197,94,0.2)' },
  lessonLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  lessonNum: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(251,191,36,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  lessonNumLocked: { backgroundColor: 'rgba(71,85,105,0.2)' },
  lessonNumCompleted: { backgroundColor: 'rgba(34,197,94,0.12)' },
  lessonNumText: { fontSize: 14, fontWeight: '700', color: '#fbbf24' },
  lessonInfo: { flex: 1 },
  lessonTitle: { fontSize: 15, fontFamily: 'Playfair_SemiBold', color: '#e2e8f0', marginBottom: 2 },
  lessonSnippet: { fontSize: 12, color: '#64748b', fontStyle: 'italic' },
  lockedText: { color: '#475569' },
  redoBtn: { padding: 8 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: '#64748b', marginTop: 12, fontFamily: 'Playfair_Medium' },
  emptySubtext: { fontSize: 13, color: '#475569', marginTop: 4 },
  errorText: { color: '#ef4444', textAlign: 'center', marginTop: 100, fontSize: 16 },
});
