import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CHALISA_LESSONS } from '../data/chalisaLessons';
import { useLearnProgressStore } from '../store/learnProgressStore';

const { width, height } = Dimensions.get('window');

type Props = {
  navigation: any;
  route: {
    params: {
      lessonId: string;
    };
  };
};

type Step = 'listen' | 'read' | 'repeat' | 'done';

export const LessonFlowScreen: React.FC<Props> = ({ navigation, route }) => {
  const { lessonId } = route.params;
  const lesson = CHALISA_LESSONS.find((l) => l.id === lessonId);
  const markLessonComplete = useLearnProgressStore((s) => s.markLessonComplete);
  
  const [currentStep, setCurrentStep] = useState<Step>('listen');
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup sound when component unmounts
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  if (!lesson) {
    Alert.alert('Error', 'Lesson not found');
    navigation.goBack();
    return null;
  }

  const handleNext = async () => {
    // Stop and reset audio when moving to next step
    if (sound) {
      await sound.stopAsync();
      await sound.setPositionAsync(0);
      setIsPlaying(false);
    }
    
    if (currentStep === 'listen') {
      setCurrentStep('read');
    } else if (currentStep === 'read') {
      setCurrentStep('repeat');
    } else if (currentStep === 'repeat') {
      setCurrentStep('done');
    } else if (currentStep === 'done') {
      markLessonComplete(lessonId);
      navigation.goBack();
    }
  };

  const handleBack = async () => {
    // Stop and reset audio when moving to previous step
    if (sound) {
      await sound.stopAsync();
      await sound.setPositionAsync(0);
      setIsPlaying(false);
    }
    
    if (currentStep === 'read') {
      setCurrentStep('listen');
    } else if (currentStep === 'repeat') {
      setCurrentStep('read');
    } else if (currentStep === 'done') {
      setCurrentStep('repeat');
    }
  };

  const handlePlayAudio = async () => {
    try {
      if (isPlaying && sound) {
        // Pause the audio
        await sound.pauseAsync();
        setIsPlaying(false);
      } else if (sound) {
        // Resume the audio
        await sound.playAsync();
        setIsPlaying(true);
      } else {
        // Load and play the audio for the first time
        const { sound: newSound } = await Audio.Sound.createAsync(
          require('../../assets/audio/devotional/Omm_and_Bells.wav'),
          { shouldPlay: true }
        );
        setSound(newSound);
        setIsPlaying(true);

        // Listen for playback status
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const handleClose = () => {
    Alert.alert(
      'Exit Lesson',
      'Are you sure you want to exit? Your progress will not be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Exit', 
          style: 'destructive', 
          onPress: async () => {
            if (sound) {
              await sound.stopAsync();
              await sound.unloadAsync();
            }
            navigation.goBack();
          }
        },
      ]
    );
  };

  const renderStepIndicator = () => {
    const steps: Step[] = ['listen', 'read', 'repeat', 'done'];
    const currentIndex = steps.indexOf(currentStep);

    return (
      <View style={styles.stepIndicator}>
        {steps.map((step, index) => (
          <View key={step} style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                index <= currentIndex && styles.stepCircleActive,
              ]}
            >
              {index < currentIndex ? (
                <Ionicons name="checkmark" size={16} color="#fff" />
              ) : (
                <Text style={styles.stepNumber}>{index + 1}</Text>
              )}
            </View>
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.stepLine,
                  index < currentIndex && styles.stepLineActive,
                ]}
              />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderListenStep = () => (
    <ScrollView 
      style={styles.stepScrollView}
      contentContainerStyle={styles.stepContent}
      showsVerticalScrollIndicator={false}
    >
      <Ionicons name="headset" size={80} color="#fbbf24" />
      <Text style={styles.stepTitle}>Listen Carefully</Text>
      <Text style={styles.stepDescription}>
        Listen to the verse being recited by a native speaker
      </Text>

      <View style={styles.verseCard}>
        <Text style={styles.verseCardTitle}>Devanagari (Hindi)</Text>
        <Text style={styles.verseText}>{lesson.text}</Text>
        
        {lesson.transliteration && (
          <>
            <View style={styles.divider} />
            <Text style={styles.verseCardTitle}>Transliteration (English)</Text>
            <Text style={styles.transliterationText}>
              {lesson.transliteration}
            </Text>
          </>
        )}
        
        {lesson.meaning && (
          <>
            <View style={styles.divider} />
            <Text style={styles.verseCardTitle}>Meaning</Text>
            <Text style={styles.meaningText}>
              {lesson.meaning}
            </Text>
          </>
        )}
      </View>

      <View style={styles.audioPlayer}>
        <Pressable style={styles.playButton} onPress={handlePlayAudio}>
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={40}
            color="#fff"
          />
        </Pressable>
        <Text style={styles.audioText}>
          {isPlaying ? 'Playing...' : 'Tap to listen'}
        </Text>
      </View>
    </ScrollView>
  );

  const renderReadStep = () => (
    <ScrollView 
      style={styles.stepScrollView}
      contentContainerStyle={styles.stepContent}
      showsVerticalScrollIndicator={false}
    >
      <Ionicons name="book-outline" size={80} color="#fbbf24" />
      <Text style={styles.stepTitle}>Read the Verse</Text>
      <Text style={styles.stepDescription}>
        Read the verse in Devanagari and transliteration
      </Text>

      <View style={styles.verseCard}>
        <Text style={styles.verseCardTitle}>Devanagari (Hindi)</Text>
        <Text style={styles.verseText}>{lesson.text}</Text>
        
        {lesson.transliteration && (
          <>
            <View style={styles.divider} />
            <Text style={styles.verseCardTitle}>Transliteration (English)</Text>
            <Text style={styles.transliterationText}>
              {lesson.transliteration}
            </Text>
          </>
        )}
        
        {lesson.meaning && (
          <>
            <View style={styles.divider} />
            <Text style={styles.verseCardTitle}>Meaning</Text>
            <Text style={styles.meaningText}>
              {lesson.meaning}
            </Text>
          </>
        )}
      </View>

      <Pressable style={styles.playAgainButton} onPress={handlePlayAudio}>
        <Ionicons 
          name={isPlaying ? 'pause' : 'play'} 
          size={20} 
          color="#fbbf24" 
        />
        <Text style={styles.playAgainText}>
          {isPlaying ? 'Pause' : 'Play audio'}
        </Text>
      </Pressable>
    </ScrollView>
  );

  const renderRepeatStep = () => (
    <ScrollView 
      style={styles.stepScrollView}
      contentContainerStyle={styles.stepContent}
      showsVerticalScrollIndicator={false}
    >
      <Ionicons name="mic" size={80} color="#fbbf24" />
      <Text style={styles.stepTitle}>Practice Speaking</Text>
      <Text style={styles.stepDescription}>
        Try to recite the verse along with the audio
      </Text>

      <View style={styles.verseCard}>
        <Text style={styles.verseCardTitle}>Devanagari (Hindi)</Text>
        <Text style={styles.verseText}>{lesson.text}</Text>
        {lesson.transliteration && (
          <>
            <View style={styles.divider} />
            <Text style={styles.verseCardTitle}>Transliteration (English)</Text>
            <Text style={styles.transliterationText}>
              {lesson.transliteration}
            </Text>
          </>
        )}
        
        {lesson.meaning && (
          <>
            <View style={styles.divider} />
            <Text style={styles.verseCardTitle}>Meaning</Text>
            <Text style={styles.meaningText}>
              {lesson.meaning}
            </Text>
          </>
        )}
      </View>

      <Pressable style={styles.playAgainButton} onPress={handlePlayAudio}>
        <Ionicons 
          name={isPlaying ? 'pause' : 'play'} 
          size={20} 
          color="#fbbf24" 
        />
        <Text style={styles.playAgainText}>
          {isPlaying ? 'Pause' : 'Play audio'}
        </Text>
      </Pressable>
    </ScrollView>
  );

  const renderDoneStep = () => (
    <ScrollView 
      style={styles.stepScrollView}
      contentContainerStyle={styles.stepContent}
      showsVerticalScrollIndicator={false}
    >
      <Ionicons name="checkmark-circle" size={100} color="#22c55e" />
      <Text style={styles.stepTitle}>Great Job! 🎉</Text>
      <Text style={styles.stepDescription}>
        You've completed {lesson.title}
      </Text>

      <View style={styles.verseCard}>
        <Text style={styles.verseCardTitle}>Devanagari (Hindi)</Text>
        <Text style={styles.verseText}>{lesson.text}</Text>
        
        {lesson.transliteration && (
          <>
            <View style={styles.divider} />
            <Text style={styles.verseCardTitle}>Transliteration (English)</Text>
            <Text style={styles.transliterationText}>
              {lesson.transliteration}
            </Text>
          </>
        )}
        
        {lesson.meaning && (
          <>
            <View style={styles.divider} />
            <Text style={styles.verseCardTitle}>Meaning</Text>
            <Text style={styles.meaningText}>
              {lesson.meaning}
            </Text>
          </>
        )}
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Ionicons name="book" size={24} color="#fbbf24" />
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryLabel}>Lesson</Text>
            <Text style={styles.summaryValue}>{lesson.title}</Text>
          </View>
        </View>
        
        <View style={styles.summaryRow}>
          <Ionicons name="trophy" size={24} color="#fbbf24" />
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryLabel}>Status</Text>
            <Text style={styles.summaryValue}>Completed ✓</Text>
          </View>
        </View>
      </View>

      <Pressable
        style={styles.reviewButton}
        onPress={() => setCurrentStep('listen')}
      >
        <Ionicons name="refresh" size={20} color="#64748b" />
        <Text style={styles.reviewText}>Review lesson</Text>
      </Pressable>
    </ScrollView>
  );

  const hasBackgroundImage = lesson.image;

  const mainContent = (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
        <View style={styles.lessonInfo}>
          <Text style={styles.lessonType}>
            {lesson.type === 'doha' ? 'DOHA' : 'CHAUPAI'}
          </Text>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Step Content */}
      <View style={styles.contentContainer}>
        {currentStep === 'listen' && renderListenStep()}
        {currentStep === 'read' && renderReadStep()}
        {currentStep === 'repeat' && renderRepeatStep()}
        {currentStep === 'done' && renderDoneStep()}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.footer}>
        {currentStep !== 'listen' && (
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.backButtonText}>Previous</Text>
          </Pressable>
        )}
        <Pressable 
          style={[
            styles.nextButton, 
            currentStep === 'listen' && styles.nextButtonFull
          ]} 
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === 'done' ? 'Continue' : 'Next Step'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#0f172a" />
        </Pressable>
      </View>
    </>
  );

  if (hasBackgroundImage) {
    return (
      <ImageBackground
        source={lesson.image}
        style={styles.container}
        resizeMode="cover"
      >
        <View style={styles.fullScreenOverlay} />
        {mainContent}
      </ImageBackground>
    );
  }

  return (
    <View style={styles.container}>
      {mainContent}
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
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonInfo: {
    alignItems: 'center',
  },
  lessonType: {
    fontSize: 12,
    fontFamily: 'Playfair_Medium',
    color: '#94a3b8',
    letterSpacing: 1,
  },
  lessonTitle: {
    fontSize: 18,
    fontFamily: 'Playfair_Bold',
    color: '#fff',
    marginTop: 2,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#fbbf24',
  },
  stepNumber: {
    fontSize: 14,
    fontFamily: 'Playfair_Bold',
    color: '#64748b',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: '#fbbf24',
  },
  contentContainer: {
    flex: 1,
  },
  stepScrollView: {
    flex: 1,
  },
  stepContent: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontFamily: 'Playfair_Bold',
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    fontFamily: 'Playfair_Regular',
    color: '#94a3b8',
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  fullScreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    zIndex: 0,
  },
  audioPlayer: {
    alignItems: 'center',
    marginTop: 32,
  },
  playButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fbbf24',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#fbbf24',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  audioText: {
    fontSize: 16,
    fontFamily: 'Playfair_Medium',
    color: '#fff',
    marginTop: 16,
  },
  verseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 24,
    marginTop: 32,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  verseCardTitle: {
    fontSize: 14,
    fontFamily: 'Playfair_SemiBold',
    color: '#fbbf24',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  verseText: {
    fontSize: 20,
    fontFamily: 'Playfair_Regular',
    color: '#fff',
    lineHeight: 32,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    marginVertical: 20,
  },
  transliterationText: {
    fontSize: 16,
    fontFamily: 'Playfair_Regular',
    color: '#94a3b8',
    lineHeight: 26,
    textAlign: 'center',
  },
  meaningText: {
    fontSize: 16,
    fontFamily: 'Playfair_Regular',
    color: '#e2e8f0',
    lineHeight: 26,
    textAlign: 'center',
  },
  playAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  },
  playAgainText: {
    fontSize: 16,
    fontFamily: 'Playfair_Medium',
    color: '#fbbf24',
    marginLeft: 8,
  },
  audioControls: {
    alignItems: 'center',
    marginTop: 40,
  },
  controlButton: {
    marginBottom: 12,
  },
  controlText: {
    fontSize: 16,
    fontFamily: 'Playfair_Medium',
    color: '#94a3b8',
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    marginTop: 32,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryInfo: {
    marginLeft: 16,
  },
  summaryLabel: {
    fontSize: 13,
    fontFamily: 'Playfair_Regular',
    color: '#64748b',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: 'Playfair_SemiBold',
    color: '#fff',
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
  },
  reviewText: {
    fontSize: 16,
    fontFamily: 'Playfair_Medium',
    color: '#64748b',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    gap: 12,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Playfair_Bold',
    color: '#fff',
    marginLeft: 8,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fbbf24',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#fbbf24',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    fontSize: 18,
    fontFamily: 'Playfair_Bold',
    color: '#0f172a',
    marginRight: 8,
  },
});
