/**
 * Mantra of the Day — the Vidyā module's hook on Today (§2.4). A small row
 * under the wisdom strip: one word, its gloss, "you've said it a thousand
 * times". Tap → the full lesson. Resolved by mantraOfDay() from the SAME
 * darshan function the card and the bell use, gated on the loaded catalog,
 * so it can never point at a lesson the user cannot open. No streak language.
 */
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getFaithTheme } from '../data/faiths';
import { track } from '../services/analytics';
import { mantraOfDay } from '../services/mantraOfDay';
import { usePreferencesStore } from '../store/preferencesStore';
import { useVidyaStore } from '../store/vidyaStore';

export const MantraOfDayRow: React.FC = () => {
  const navigation = useNavigation<any>();
  const primary = usePreferencesStore((s) => s.primaryTradition);
  const ista = usePreferencesStore((s) => s.ista);
  const lessons = useVidyaStore((s) => s.lessons);
  const theme = getFaithTheme(primary);

  useEffect(() => { useVidyaStore.getState().load(); }, []);

  const today = useMemo(() => mantraOfDay(lessons, primary, ista), [lessons, primary, ista]);
  if (!today) return null;

  const { lesson, word } = today;
  const isSeed = lesson.class === 'bija';
  const open = () => {
    track('vidya_mod_tap', { id: lesson.id, reason: today.reason });
    navigation.navigate('VidyaLesson', { id: lesson.id, from: 'today' });
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel={`Mantra of the day — ${lesson.titleHi}. Opens the lesson.`}
    >
      <View style={[styles.devaBox, { borderColor: `${theme.accent}44` }]}>
        <Text style={[styles.deva, { color: theme.accent }]} numberOfLines={1}>{word?.deva ?? lesson.sanskrit}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.kicker}>MANTRA OF THE DAY · {lesson.titleHi}</Text>
        <Text style={styles.line} numberOfLines={2}>
          {word ? (
            <>
              <Text style={{ fontStyle: 'italic' }}>{word.iast}</Text> — “{word.glossEn}”.{isSeed ? '' : ' You’ve said it a thousand times.'}
            </>
          ) : lesson.titleEn}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#64748b" />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56,
    borderWidth: 1, borderColor: 'rgba(148,163,184,0.16)',
    backgroundColor: 'rgba(15,23,42,0.5)', borderRadius: 16,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16,
  },
  devaBox: { minWidth: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, backgroundColor: '#0b1220' },
  deva: { fontSize: 20, fontFamily: 'Playfair_Medium' },
  kicker: { color: '#64748b', fontSize: 10, letterSpacing: 1.2, fontWeight: '800' },
  line: { color: '#e2e8f0', fontSize: 13.5, lineHeight: 18, marginTop: 3 },
});
