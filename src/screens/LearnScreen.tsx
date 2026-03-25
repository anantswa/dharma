import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { CHALISA_LESSONS } from '../data/chalisaLessons';
import { AudioService } from '../services/audioService';
import { ShankhService } from '../services/shankhService';
import { useLearnProgressStore } from '../store/learnProgressStore';

const { width } = Dimensions.get('window');

type Props = {
  navigation: any;
};

type LearningModule = {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  progress?: number;
  totalLessons?: number;
  available: boolean;
  onPress?: () => void;
};

export const LearnScreen: React.FC<Props> = ({ navigation }) => {
  const completedLessons = useLearnProgressStore((s) => s.completedLessons);
  const loadProgress = useLearnProgressStore((s) => s.loadProgress);

  useEffect(() => {
    loadProgress();
  }, []);

  // Pause any home audio (music or shankh loop) when entering Learn screen
  useFocusEffect(
    useCallback(() => {
      AudioService.pause();
      ShankhService.pause();
      return undefined;
    }, [])
  );

  const learningModules: LearningModule[] = [
    {
      id: 'hanuman-chalisa',
      title: 'Hanuman Chalisa',
      subtitle: 'Learn verse by verse with audio guidance',
      icon: 'book',
      color: '#f97316',
      progress: completedLessons.length,
      totalLessons: CHALISA_LESSONS.length,
      available: true,
      onPress: () => navigation.navigate('LessonSelection'),
    },
    {
      id: 'bhagavad-gita',
      title: 'Bhagavad Gita',
      subtitle: 'Explore the sacred scripture',
      icon: 'book-outline',
      color: '#8b5cf6',
      available: false,
    },
  ];

  const renderModule = (module: LearningModule) => (
    <Pressable
      key={module.id}
      style={styles.moduleCard}
      onPress={module.available ? module.onPress : undefined}
      disabled={!module.available}
    >
      <LinearGradient
        colors={
          module.available
            ? ['rgba(251, 191, 36, 0.1)', 'rgba(251, 191, 36, 0.05)']
            : ['rgba(100, 116, 139, 0.1)', 'rgba(100, 116, 139, 0.05)']
        }
        style={styles.moduleGradient}
      >
        <View style={styles.moduleIcon}>
          <Ionicons
            name={module.icon}
            size={32}
            color={module.available ? module.color : '#64748b'}
          />
        </View>
        
        <View style={styles.moduleContent}>
          <Text style={[
            styles.moduleTitle,
            !module.available && styles.disabledText
          ]}>
            {module.title}
          </Text>
          <Text style={[
            styles.moduleSubtitle,
            !module.available && styles.disabledText
          ]}>
            {module.subtitle}
          </Text>
          
          {module.available && module.progress !== undefined && module.totalLessons !== undefined && (
            <View style={styles.moduleProgressContainer}>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${(module.progress / module.totalLessons) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.moduleProgressText}>
                {module.progress} / {module.totalLessons} lessons
              </Text>
            </View>
          )}
          
          {!module.available && (
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          )}
        </View>
        
        {module.available && (
          <Ionicons name="chevron-forward" size={24} color="#fbbf24" />
        )}
      </LinearGradient>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="school" size={48} color="#fbbf24" />
          <Text style={styles.title}>Learn</Text>
          <Text style={styles.subtitle}>
            Explore sacred texts and deepen your understanding
          </Text>
        </View>

        {/* Learning Modules */}
        <View style={styles.modulesContainer}>
          {learningModules.map(renderModule)}
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Playfair_Bold',
    color: '#fbbf24',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Playfair_Regular',
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  modulesContainer: {
    gap: 16,
  },
  moduleCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  moduleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  moduleIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleContent: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 20,
    fontFamily: 'Playfair_Bold',
    color: '#fff',
    marginBottom: 4,
  },
  moduleSubtitle: {
    fontSize: 14,
    fontFamily: 'Playfair_Regular',
    color: '#94a3b8',
    marginBottom: 12,
  },
  moduleProgressContainer: {
    marginTop: 4,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fbbf24',
    borderRadius: 3,
  },
  moduleProgressText: {
    fontSize: 12,
    fontFamily: 'Playfair_Regular',
    color: '#64748b',
  },
  comingSoonBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  comingSoonText: {
    fontSize: 12,
    fontFamily: 'Playfair_SemiBold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  disabledText: {
    opacity: 0.5,
  },
});
