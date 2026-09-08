import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { MantraWord } from '../../data/vidya/types';
import { useVidyaStore } from '../../store/vidyaStore';

type Props = {
  word: MantraWord | null;
  accent: string;
  onClose: () => void;
  /** Sound the word again (its clip, or its slice of the slow track). */
  onHear: (w: MantraWord) => void;
  onOpenLesson?: (id: string) => void;
};

const canHear = (w: MantraWord) => !!w.audioUrl || (typeof w.t0 === 'number' && typeof w.t1 === 'number');

/**
 * The word drill-down (§3 screen 3, tap a triplet): full meaning En + Hi,
 * root and case tag in plain words where the card has them, hear the word
 * alone, and "also in" the other lessons that carry it. Optional depth —
 * the host pauses the main track while this is open and resumes on close.
 */
export const WordSheet: React.FC<Props> = ({ word, accent, onClose, onHear, onOpenLesson }) => {
  const lessons = useVidyaStore((s) => s.lessons);
  const alsoIn = (word?.alsoIn ?? [])
    .map((id) => lessons.find((l) => l.id === id))
    .filter((l): l is NonNullable<typeof l> => !!l);

  return (
    <Modal visible={!!word} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          {word && (
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <View style={styles.head}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.deva}>{word.deva}</Text>
                  <Text style={styles.iast}>{word.iast}</Text>
                </View>
                <Pressable onPress={onClose} hitSlop={14} accessibilityRole="button" accessibilityLabel="Close">
                  <Ionicons name="close" size={24} color="#e2e8f0" />
                </Pressable>
              </View>

              <Text style={styles.gloss}>{word.glossEn}</Text>
              <Text style={styles.glossHi}>{word.glossHi}</Text>

              {!!word.root && (
                <View style={styles.rowBlock}>
                  <Text style={[styles.kicker, { color: accent }]}>ROOT</Text>
                  <Text style={styles.body}>{word.root}</Text>
                </View>
              )}
              {!!word.grammar && (
                <View style={styles.rowBlock}>
                  <Text style={[styles.kicker, { color: accent }]}>WHY IT ENDS THIS WAY</Text>
                  <Text style={styles.body}>{word.grammar}</Text>
                </View>
              )}

              {canHear(word) && (
                <Pressable style={[styles.hearBtn, { borderColor: accent }]} onPress={() => onHear(word)}>
                  <Ionicons name="volume-medium" size={16} color={accent} />
                  <Text style={[styles.hearTxt, { color: accent }]}>Hear the word alone</Text>
                </Pressable>
              )}

              {alsoIn.length > 0 && (
                <View style={styles.rowBlock}>
                  <Text style={[styles.kicker, { color: accent }]}>ALSO IN</Text>
                  {alsoIn.map((l) => (
                    <Pressable key={l.id} style={styles.alsoRow} onPress={() => onOpenLesson?.(l.id)} disabled={!onOpenLesson}>
                      <Text style={styles.alsoTitle}>{l.titleHi}</Text>
                      {!!onOpenLesson && <Ionicons name="chevron-forward" size={16} color="#64748b" />}
                    </Pressable>
                  ))}
                </View>
              )}
              <View style={{ height: 8 }} />
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.72)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0b1220', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: 'rgba(148,163,184,0.18)', padding: 22, paddingBottom: 40, maxHeight: '78%',
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  deva: { color: '#f8fafc', fontSize: 40, fontFamily: 'Playfair_Medium', lineHeight: 56 },
  iast: { color: '#cbd5e1', fontSize: 16, fontStyle: 'italic' },
  gloss: { color: '#e2e8f0', fontSize: 17, fontFamily: 'Playfair_Regular', lineHeight: 26 },
  glossHi: { color: '#cbd5e1', fontSize: 16, lineHeight: 25, marginTop: 4 },
  rowBlock: { marginTop: 16 },
  kicker: { fontSize: 11, letterSpacing: 1.5, fontWeight: '800', marginBottom: 5 },
  body: { color: '#cbd5e1', fontSize: 14.5, lineHeight: 22 },
  hearBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9, marginTop: 18, minHeight: 40 },
  hearTxt: { fontSize: 13.5, fontWeight: '700' },
  alsoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(148,163,184,0.12)' },
  alsoTitle: { color: '#e2e8f0', fontSize: 15, fontFamily: 'Playfair_Medium' },
});
