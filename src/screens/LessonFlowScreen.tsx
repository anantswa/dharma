import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CHALISA_LESSONS } from '../data/chalisaLessons';
import type { ModuleLesson } from '../services/moduleService';
import { useLearnProgressStore } from '../store/learnProgressStore';

const { width } = Dimensions.get('window');

type Props = {
  navigation: any;
  route: {
    params: {
      lessonId: string;
      moduleId?: string;
      lesson?: ModuleLesson;
    };
  };
};

type Step = 'read' | 'understand' | 'reflect' | 'done';

const STEPS: Step[] = ['read', 'understand', 'reflect', 'done'];
const STEP_LABELS: Record<Step, string> = {
  read: 'Read',
  understand: 'Understand',
  reflect: 'Reflect',
  done: 'Complete',
};

export const LessonFlowScreen: React.FC<Props> = ({ navigation, route }) => {
  const { lessonId, moduleId, lesson: routeLesson } = route.params;
  const markLessonComplete = useLearnProgressStore((s) => s.markLessonComplete);

  const [currentStep, setCurrentStep] = useState<Step>('read');
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [reflectionText, setReflectionText] = useState('');

  // Build lesson from either route params (new system) or Chalisa fallback
  const lesson: ModuleLesson | null = routeLesson || (() => {
    const chalisaLesson = CHALISA_LESSONS.find((l) => l.id === lessonId);
    if (!chalisaLesson) return null;
    return {
      id: chalisaLesson.id,
      number: chalisaLesson.number,
      title: chalisaLesson.title,
      original: chalisaLesson.hindi || chalisaLesson.text || '',
      transliteration: chalisaLesson.transliteration || '',
      translation: chalisaLesson.meaning || '',
      context: '',
      elaboration: '',
      source: 'Hanuman Chalisa',
      speaker: 'Tulsidas',
      mood: 'devotional',
      tradition: 'hindu',
      themes: ['devotion'],
      reflectionPrompt: 'What quality of Hanuman does this verse reveal to you?',
      audioUrl: null,
    };
  })();

  useEffect(() => {
    return () => { if (sound) sound.unloadAsync(); };
  }, [sound]);

  if (!lesson) {
    Alert.alert('Error', 'Lesson not found');
    navigation.goBack();
    return null;
  }

  const handleNext = async () => {
    if (sound) { await sound.stopAsync(); await sound.setPositionAsync(0); setIsPlaying(false); }

    const idx = STEPS.indexOf(currentStep);
    if (idx < STEPS.length - 1) {
      setCurrentStep(STEPS[idx + 1]);
    } else {
      // Complete: mark progress with module prefix
      const progressId = moduleId ? `${moduleId}:${lesson.id}` : lesson.id;
      markLessonComplete(progressId);
      navigation.goBack();
    }
  };

  const handleBack = () => {
    const idx = STEPS.indexOf(currentStep);
    if (idx > 0) setCurrentStep(STEPS[idx - 1]);
  };

  const handlePlayAudio = async () => {
    try {
      if (isPlaying && sound) {
        await sound.pauseAsync(); setIsPlaying(false);
      } else if (sound) {
        await sound.playAsync(); setIsPlaying(true);
      } else {
        const { sound: s } = await Audio.Sound.createAsync(
          require('../../assets/audio/devotional/Omm_and_Bells.wav'),
          { shouldPlay: true },
        );
        setSound(s); setIsPlaying(true);
        s.setOnPlaybackStatusUpdate((st) => {
          if (st.isLoaded && st.didJustFinish) setIsPlaying(false);
        });
      }
    } catch (e) {
      console.error('Audio error:', e);
    }
  };

  const handleClose = () => {
    Alert.alert('Exit Lesson', 'Exit without saving progress?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Exit', style: 'destructive',
        onPress: async () => {
          if (sound) { await sound.stopAsync(); await sound.unloadAsync(); }
          navigation.goBack();
        },
      },
    ]);
  };

  // ─── Step Indicator ───
  const renderStepIndicator = () => {
    const currentIdx = STEPS.indexOf(currentStep);
    return (
      <View style={styles.stepIndicator}>
        {STEPS.map((step, i) => (
          <View key={step} style={styles.stepItem}>
            <View style={[styles.stepCircle, i <= currentIdx && styles.stepCircleActive]}>
              {i < currentIdx ? (
                <Ionicons name="checkmark" size={14} color="#fff" />
              ) : (
                <Text style={[styles.stepLabel, i <= currentIdx && styles.stepLabelActive]}>
                  {STEP_LABELS[step].charAt(0)}
                </Text>
              )}
            </View>
            {i < STEPS.length - 1 && (
              <View style={[styles.stepLine, i < currentIdx && styles.stepLineActive]} />
            )}
          </View>
        ))}
      </View>
    );
  };

  // ─── Step: READ ───
  const renderRead = () => (
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Read the Verse</Text>
      <Text style={styles.stepDesc}>{lesson.source}</Text>

      <View style={styles.verseCard}>
        {lesson.original ? (
          <>
            <Text style={styles.verseLabel}>Original</Text>
            <Text style={styles.verseOriginal}>{lesson.original}</Text>
          </>
        ) : null}

        {lesson.transliteration ? (
          <>
            <View style={styles.divider} />
            <Text style={styles.verseLabel}>Transliteration</Text>
            <Text style={styles.verseTrans}>{lesson.transliteration}</Text>
          </>
        ) : null}

        <View style={styles.divider} />
        <Text style={styles.verseLabel}>Translation</Text>
        <Text style={styles.verseEn}>{lesson.translation}</Text>
      </View>

      {lesson.speaker ? (
        <Text style={styles.speakerNote}>Spoken by {lesson.speaker}</Text>
      ) : null}

      <Pressable style={styles.audioBtn} onPress={handlePlayAudio}>
        <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color="#fbbf24" />
        <Text style={styles.audioBtnText}>{isPlaying ? 'Pause' : 'Listen'}</Text>
      </Pressable>
    </ScrollView>
  );

  // ─── Step: UNDERSTAND ───
  const renderUnderstand = () => (
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Understand</Text>
      <Text style={styles.stepDesc}>The context and deeper meaning</Text>

      {lesson.context ? (
        <View style={styles.contextCard}>
          <Text style={styles.contextLabel}>The Setting</Text>
          <Text style={styles.contextText}>{lesson.context}</Text>
        </View>
      ) : null}

      {lesson.elaboration ? (
        <View style={styles.contextCard}>
          <Text style={styles.contextLabel}>Deeper Meaning</Text>
          <Text style={styles.contextText}>{lesson.elaboration}</Text>
        </View>
      ) : (
        <View style={styles.contextCard}>
          <Text style={styles.contextLabel}>The Teaching</Text>
          <Text style={styles.contextText}>{lesson.translation}</Text>
          {lesson.themes.length > 0 && (
            <View style={styles.themeRow}>
              {lesson.themes.slice(0, 4).map((t) => (
                <View key={t} style={styles.themeBadge}>
                  <Text style={styles.themeBadgeText}>{t.replace(/_/g, ' ')}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <Pressable style={styles.audioBtn} onPress={handlePlayAudio}>
        <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color="#fbbf24" />
        <Text style={styles.audioBtnText}>Listen again</Text>
      </Pressable>
    </ScrollView>
  );

  // ─── Step: REFLECT ───
  const renderReflect = () => (
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Ionicons name="sparkles" size={40} color="#fbbf24" style={{ alignSelf: 'center', marginBottom: 16 }} />
      <Text style={styles.stepTitle}>Reflect</Text>

      <View style={styles.reflectCard}>
        <Text style={styles.reflectPrompt}>{lesson.reflectionPrompt}</Text>
      </View>

      <TextInput
        style={styles.journalInput}
        placeholder="Write your thoughts... (optional)"
        placeholderTextColor="#475569"
        multiline
        value={reflectionText}
        onChangeText={setReflectionText}
        textAlignVertical="top"
      />

      <Text style={styles.reflectHint}>
        There are no right answers. Just sit with the question.
      </Text>
    </ScrollView>
  );

  // ─── Step: DONE ───
  const renderDone = () => (
    <View style={[styles.stepContent, { alignItems: 'center', justifyContent: 'center', flex: 1 }]}>
      <View style={styles.doneCircle}>
        <Ionicons name="checkmark" size={48} color="#22c55e" />
      </View>
      <Text style={styles.doneTitle}>Lesson Complete</Text>
      <Text style={styles.doneVerse} numberOfLines={2}>
        {lesson.transliteration || lesson.translation}
      </Text>
      <Text style={styles.doneSource}>{lesson.source}</Text>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'read': return renderRead();
      case 'understand': return renderUnderstand();
      case 'reflect': return renderReflect();
      case 'done': return renderDone();
    }
  };

  const currentIdx = STEPS.indexOf(currentStep);

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={handleClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#94a3b8" />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          {lesson.number}. {lesson.title}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {renderStepIndicator()}

      <View style={{ flex: 1 }}>
        {renderCurrentStep()}
      </View>

      {/* Bottom navigation */}
      <View style={styles.bottomBar}>
        {currentIdx > 0 ? (
          <Pressable style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backBtnText}>Back</Text>
          </Pressable>
        ) : <View style={{ width: 80 }} />}

        <Pressable style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>
            {currentStep === 'done' ? 'Finish' : 'Next'}
          </Text>
          <Ionicons
            name={currentStep === 'done' ? 'checkmark-circle' : 'arrow-forward'}
            size={20}
            color="#020617"
          />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
  },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 15, fontFamily: 'Playfair_SemiBold', color: '#94a3b8' },

  // Step indicator
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 16 },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepCircle: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  stepCircleActive: { backgroundColor: '#fbbf24' },
  stepLabel: { fontSize: 12, fontWeight: '700', color: '#475569' },
  stepLabelActive: { color: '#020617' },
  stepLine: { width: 32, height: 2, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 4 },
  stepLineActive: { backgroundColor: '#fbbf24' },

  // Step content
  stepContent: { paddingHorizontal: 24, paddingBottom: 24 },
  stepTitle: { fontSize: 26, fontFamily: 'Playfair_Bold', color: '#fbbf24', marginBottom: 6 },
  stepDesc: { fontSize: 14, color: '#64748b', marginBottom: 20 },

  // Verse card
  verseCard: {
    backgroundColor: 'rgba(15,23,42,0.8)', borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.15)', marginBottom: 16,
  },
  verseLabel: { fontSize: 11, color: '#fbbf24', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  verseOriginal: { fontSize: 22, color: '#f8fafc', lineHeight: 34, fontFamily: 'Playfair_Medium', marginBottom: 4 },
  verseTrans: { fontSize: 16, color: '#cbd5e1', fontStyle: 'italic', lineHeight: 24, marginBottom: 4 },
  verseEn: { fontSize: 17, color: '#e2e8f0', lineHeight: 26, fontFamily: 'Playfair_Regular' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 16 },
  speakerNote: { fontSize: 13, color: '#64748b', fontStyle: 'italic', marginBottom: 16 },

  // Audio button
  audioBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(251,191,36,0.1)', borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.2)', marginTop: 8,
  },
  audioBtnText: { fontSize: 15, color: '#fbbf24', fontFamily: 'Playfair_SemiBold' },

  // Context cards (Understand step)
  contextCard: {
    backgroundColor: 'rgba(15,23,42,0.6)', borderRadius: 18, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 14,
  },
  contextLabel: { fontSize: 11, color: '#fbbf24', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  contextText: { fontSize: 16, color: '#cbd5e1', lineHeight: 24 },
  themeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  themeBadge: {
    backgroundColor: 'rgba(251,191,36,0.1)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12,
  },
  themeBadgeText: { fontSize: 11, color: '#fbbf24', textTransform: 'capitalize' },

  // Reflect step
  reflectCard: {
    backgroundColor: 'rgba(251,191,36,0.08)', borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.2)', marginBottom: 20,
  },
  reflectPrompt: { fontSize: 20, color: '#f8fafc', fontFamily: 'Playfair_Medium', lineHeight: 30, textAlign: 'center' },
  journalInput: {
    backgroundColor: 'rgba(15,23,42,0.6)', borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    color: '#e2e8f0', fontSize: 15, lineHeight: 22, minHeight: 120,
  },
  reflectHint: { fontSize: 13, color: '#475569', textAlign: 'center', marginTop: 14, fontStyle: 'italic' },

  // Done step
  doneCircle: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(34,197,94,0.12)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  doneTitle: { fontSize: 28, fontFamily: 'Playfair_Bold', color: '#22c55e', marginBottom: 12 },
  doneVerse: { fontSize: 16, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', marginBottom: 8, paddingHorizontal: 20 },
  doneSource: { fontSize: 14, color: '#475569' },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 16, paddingBottom: 36,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: { paddingVertical: 12, paddingHorizontal: 20 },
  backBtnText: { fontSize: 15, color: '#64748b' },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fbbf24', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14,
  },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#020617' },
});
