import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo } from 'react';
import {
  Dimensions,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ALL_MODULES, getModulesForUser, type ModuleDefinition } from '../data/modules';
import { getLessonsForModule } from '../services/moduleService';
import { AudioService } from '../services/audioService';
import { ShankhService } from '../services/shankhService';
import { useLearnProgressStore } from '../store/learnProgressStore';
import { usePreferencesStore } from '../store/preferencesStore';
import { useDataStore } from '../store/dataStore';

const { width } = Dimensions.get('window');

type Props = {
  navigation: any;
};

type SectionData = {
  title: string;
  subtitle: string;
  data: ModuleDefinition[];
};

export const LearnScreen: React.FC<Props> = ({ navigation }) => {
  const completedLessons = useLearnProgressStore((s) => s.completedLessons);
  const loadProgress = useLearnProgressStore((s) => s.loadProgress);
  const primaryTradition = usePreferencesStore((s) => s.primaryTradition);
  const enabledTraditions = usePreferencesStore((s) => s.enabledTraditions);
  const wisdomLoaded = useDataStore((s) => s.isLoaded);

  useEffect(() => { loadProgress(); }, []);

  useFocusEffect(
    useCallback(() => {
      AudioService.pause();
      ShankhService.pause();
      return undefined;
    }, [])
  );

  const sections = useMemo((): SectionData[] => {
    const modules = getModulesForUser(primaryTradition, enabledTraditions);

    const scripture = modules.filter((m) => m.type === 'scripture');
    const thematic = modules.filter((m) => m.type === 'thematic');
    const practice = modules.filter((m) => m.type === 'practice');

    const result: SectionData[] = [];
    if (scripture.length)
      result.push({ title: 'Sacred Texts', subtitle: 'Verse-by-verse journeys through scripture', data: scripture });
    if (thematic.length)
      result.push({ title: 'Explorations', subtitle: 'Cross-tradition themes', data: thematic });
    if (practice.length)
      result.push({ title: 'Daily Practice', subtitle: 'Build a daily spiritual habit', data: practice });

    return result;
  }, [primaryTradition, enabledTraditions]);

  const getProgress = (module: ModuleDefinition): { completed: number; total: number } => {
    // Count how many lessons in this module are completed
    const prefix = `${module.id}:`;
    const completed = completedLessons.filter((id) => id.startsWith(prefix)).length;
    // Get actual lesson count from dataStore if available
    const lessons = wisdomLoaded ? getLessonsForModule(module) : [];
    const total = lessons.length || module.estimatedLessons;
    return { completed, total };
  };

  const getDifficultyLabel = (d: string) => {
    switch (d) {
      case 'beginner': return 'Beginner';
      case 'intermediate': return 'Intermediate';
      case 'advanced': return 'Advanced';
      default: return '';
    }
  };

  const getTraditionEmoji = (t: string) => {
    switch (t) {
      case 'hindu': return '';
      case 'buddhist': return '';
      case 'sikh': return '';
      case 'jain': return '';
      case 'zen': return '';
      case 'christian': return '';
      case 'sufi': return '';
      case 'cross-tradition': return '';
      default: return '';
    }
  };

  const renderModule = ({ item: module }: { item: ModuleDefinition }) => {
    const { completed, total } = getProgress(module);
    const pct = total > 0 ? completed / total : 0;
    const isStarted = completed > 0;

    return (
      <Pressable
        style={styles.moduleCard}
        onPress={() =>
          navigation.navigate('LessonSelection', { moduleId: module.id })
        }
      >
        <LinearGradient
          colors={[
            `${module.accentColor}18`,
            `${module.accentColor}08`,
          ]}
          style={styles.moduleGradient}
        >
          <View style={[styles.moduleIcon, { backgroundColor: `${module.accentColor}25` }]}>
            <Ionicons
              name={module.iconName as any}
              size={28}
              color={module.accentColor}
            />
          </View>

          <View style={styles.moduleContent}>
            <View style={styles.moduleTitleRow}>
              <Text style={styles.moduleTitle} numberOfLines={1}>
                {module.title}
              </Text>
              <Text style={[styles.difficultyBadge, {
                color: module.difficulty === 'advanced' ? '#E74C3C' :
                       module.difficulty === 'intermediate' ? '#F39C12' : '#27AE60',
              }]}>
                {getDifficultyLabel(module.difficulty)}
              </Text>
            </View>

            <Text style={styles.moduleSubtitle} numberOfLines={2}>
              {module.subtitle}
            </Text>

            <View style={styles.moduleFooter}>
              <Text style={styles.lessonCount}>
                {total} lessons {getTraditionEmoji(module.tradition)}
              </Text>

              {isStarted && (
                <View style={styles.progressRow}>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${pct * 100}%`, backgroundColor: module.accentColor },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {completed}/{total}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <Ionicons name="chevron-forward" size={20} color="#475569" />
        </LinearGradient>
      </Pressable>
    );
  };

  const renderSectionHeader = ({ section }: { section: SectionData }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderModule}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Learn</Text>
            <Text style={styles.headerSubtitle}>
              {ALL_MODULES.filter(m => m.available).length} modules across {7} traditions
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Playfair_Bold',
    color: '#fbbf24',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    fontFamily: 'Playfair_Regular',
    color: '#64748b',
  },
  sectionHeader: {
    marginTop: 28,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Playfair_Bold',
    color: '#e2e8f0',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  moduleCard: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  moduleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  moduleIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleContent: {
    flex: 1,
  },
  moduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  moduleTitle: {
    fontSize: 17,
    fontFamily: 'Playfair_Bold',
    color: '#f1f5f9',
    flex: 1,
  },
  difficultyBadge: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginLeft: 8,
  },
  moduleSubtitle: {
    fontSize: 13,
    fontFamily: 'Playfair_Regular',
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 8,
  },
  moduleFooter: {
    gap: 6,
  },
  lessonCount: {
    fontSize: 12,
    color: '#64748b',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: '#64748b',
    width: 40,
    textAlign: 'right',
  },
});
