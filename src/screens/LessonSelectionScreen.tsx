import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import {
    Alert,
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { CHALISA_LESSONS, LessonType } from '../data/chalisaLessons';
import { useLearnProgressStore } from '../store/learnProgressStore';

const { width } = Dimensions.get('window');

type Props = {
  navigation: any;
};

export const LessonSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const completedLessons = useLearnProgressStore((s) => s.completedLessons);
  const loadProgress = useLearnProgressStore((s) => s.loadProgress);
  const markLessonIncomplete = useLearnProgressStore((s) => s.markLessonIncomplete);

  useEffect(() => {
    loadProgress();
  }, []);

  const handleLessonPress = (lesson: LessonType) => {
    navigation.navigate('LessonFlow', { lessonId: lesson.id });
  };

  const handleMarkIncomplete = (lesson: LessonType) => {
    Alert.alert(
      'Mark as Incomplete',
      `Are you sure you want to mark "${lesson.title}" as incomplete? This will allow you to redo the lesson.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Mark Incomplete', 
          style: 'destructive',
          onPress: () => markLessonIncomplete(lesson.id)
        },
      ]
    );
  };

  const isLessonLocked = (lessonNumber: number) => {
    // First lesson is always unlocked
    if (lessonNumber === 1) return false;
    
    // Check if previous lesson is completed
    const previousLessonId = `lesson-${lessonNumber - 1}`;
    return !completedLessons.includes(previousLessonId);
  };

  const renderLessonCard = (lesson: LessonType) => {
    const isLocked = isLessonLocked(lesson.number);
    const isCompleted = completedLessons.includes(lesson.id);

    return (
      <View key={lesson.id} style={styles.lessonCardWrapper}>
        <Pressable
          style={[
            styles.lessonCard,
            isLocked && styles.lessonCardLocked,
            isCompleted && styles.lessonCardCompleted,
          ]}
          onPress={() => !isLocked && handleLessonPress(lesson)}
          disabled={isLocked}
        >
          <View style={styles.lessonCardLeft}>
            <View style={[
              styles.lessonNumber,
              isLocked && styles.lessonNumberLocked,
              isCompleted && styles.lessonNumberCompleted,
            ]}>
              {isLocked ? (
                <Ionicons name="lock-closed" size={20} color="#64748b" />
              ) : isCompleted ? (
                <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
              ) : (
                <Text style={styles.lessonNumberText}>{lesson.number}</Text>
              )}
            </View>
            <View style={styles.lessonInfo}>
              <Text style={[
                styles.lessonTitle,
                isLocked && styles.lessonTitleLocked,
              ]}>
                {lesson.title}
              </Text>
              <Text style={[
                styles.lessonType,
                isLocked && styles.lessonTypeLocked,
              ]}>
                {lesson.type === 'doha' ? 'Opening Verse' : 'Verse'}
              </Text>
            </View>
          </View>
          {!isLocked && !isCompleted && (
            <Ionicons name="chevron-forward" size={24} color="#fbbf24" />
          )}
          {isCompleted && (
            <Pressable
              style={styles.redoButton}
              onPress={() => handleMarkIncomplete(lesson)}
            >
              <Ionicons name="refresh-outline" size={20} color="#64748b" />
            </Pressable>
          )}
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Choose a Lesson</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Summary */}
      <View style={styles.progressSummary}>
        <View style={styles.progressItem}>
          <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
          <Text style={styles.progressText}>
            {completedLessons.length} / {CHALISA_LESSONS.length} Completed
          </Text>
        </View>
      </View>

      {/* Lesson List */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {CHALISA_LESSONS.map(renderLessonCard)}
        
        {/* More lessons coming soon */}
        <View style={styles.comingSoonCard}>
          <Ionicons name="time-outline" size={32} color="#64748b" />
          <Text style={styles.comingSoonText}>More lessons coming soon...</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Playfair_Bold',
    color: '#fff',
  },
  progressSummary: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(251, 191, 36, 0.2)',
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Playfair_Medium',
    color: '#fff',
    marginLeft: 8,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  lessonCardWrapper: {
    marginBottom: 12,
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  lessonCardLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(148, 163, 184, 0.2)',
    opacity: 0.6,
  },
  lessonCardCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  lessonCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  lessonNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  lessonNumberLocked: {
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
  },
  lessonNumberCompleted: {
    backgroundColor: 'transparent',
  },
  lessonNumberText: {
    fontSize: 18,
    fontFamily: 'Playfair_Bold',
    color: '#fbbf24',
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontFamily: 'Playfair_SemiBold',
    color: '#fff',
    marginBottom: 4,
  },
  lessonTitleLocked: {
    color: '#64748b',
  },
  lessonType: {
    fontSize: 13,
    fontFamily: 'Playfair_Regular',
    color: '#94a3b8',
  },
  lessonTypeLocked: {
    color: '#475569',
  },
  redoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  comingSoonCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 20,
  },
  comingSoonText: {
    fontSize: 14,
    fontFamily: 'Playfair_Regular',
    color: '#64748b',
    marginTop: 12,
  },
});
