import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { shuffle } from '../../data/vidya/seeds';
import type { Grade } from '../../store/masteryStore';

type Props = {
  /** The chips in the right order. */
  target: string[];
  /** Wrong chips mixed into the tray (a wrong seed, a wrong case-ending). */
  distractors: string[];
  /** e.g. "Build the mūla mantra for Gaṇeśa" */
  prompt: string;
  accent: string;
  onResult: (g: Grade) => void;
};

/**
 * MulaBuilder (box 4–5): a chip tray — Oṃ + the seed + the name in the dative
 * + namaḥ, plus distractors — and the template made physical. Also serves as
 * a plain "Build it" for any word list (pass no distractors).
 * fully correct → knew · one swap → okay · else forgot (§3).
 */
export const MulaBuilder: React.FC<Props> = ({ target, distractors, prompt, accent, onResult }) => {
  const tray = useMemo(() => shuffle([...target, ...distractors].map((t, i) => ({ id: `${i}:${t}`, text: t }))), [target, distractors]);
  const [built, setBuilt] = useState<{ id: string; text: string }[]>([]);
  const [result, setResult] = useState<Grade | null>(null);

  const inLine = new Set(built.map((c) => c.id));

  const add = (c: { id: string; text: string }) => {
    if (result || inLine.has(c.id)) return;
    try { Haptics.selectionAsync(); } catch { /* noop */ }
    setBuilt((b) => [...b, c]);
  };
  const remove = (id: string) => {
    if (result) return;
    setBuilt((b) => b.filter((c) => c.id !== id));
  };

  const check = () => {
    if (result) return;
    const texts = built.map((c) => c.text);
    let g: Grade;
    if (texts.length !== target.length || texts.some((t) => !target.includes(t))) {
      g = 'forgot';
    } else {
      const wrong = texts.map((t, i) => (t === target[i] ? -1 : i)).filter((i) => i >= 0);
      const oneSwap = wrong.length === 2 && texts[wrong[0]] === target[wrong[1]] && texts[wrong[1]] === target[wrong[0]];
      g = wrong.length === 0 ? 'knew' : oneSwap ? 'okay' : 'forgot';
    }
    setResult(g);
    try { Haptics.notificationAsync(g === 'knew' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning); } catch { /* noop */ }
    setTimeout(() => onResult(g), 1300);
  };

  const lineColor = result === null ? 'rgba(148,163,184,0.25)' : result === 'knew' ? '#22c55e' : result === 'okay' ? accent : '#ef4444';

  return (
    <View style={styles.wrap}>
      <Text style={[styles.q, { color: accent }]}>{prompt.toUpperCase()}</Text>
      <View style={[styles.line, { borderColor: lineColor }]}>
        {built.length === 0 ? (
          <Text style={styles.placeholder}>tap the chips in order</Text>
        ) : (
          built.map((c) => (
            <Pressable key={c.id} onPress={() => remove(c.id)} style={[styles.chip, { borderColor: accent, backgroundColor: `${accent}1f` }]}>
              <Text style={[styles.chipTxt, { color: '#f8fafc' }]}>{c.text}</Text>
            </Pressable>
          ))
        )}
      </View>
      {result !== null && (
        <Text style={styles.answer}>
          {result === 'knew' ? 'Exactly.' : 'It goes: '}{result !== 'knew' && <Text style={{ color: '#f8fafc' }}>{target.join(' ')}</Text>}
        </Text>
      )}
      <View style={styles.tray}>
        {tray.map((c) => (
          <Pressable key={c.id} onPress={() => add(c)} disabled={inLine.has(c.id) || !!result} style={[styles.chip, inLine.has(c.id) && styles.chipUsed]}>
            <Text style={[styles.chipTxt, inLine.has(c.id) && { color: '#475569' }]}>{c.text}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        style={[styles.checkBtn, { backgroundColor: accent }, (built.length !== target.length || !!result) && { opacity: 0.4 }]}
        disabled={built.length !== target.length || !!result}
        onPress={check}
      >
        <Text style={styles.checkTxt}>Check</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  q: { fontSize: 11, letterSpacing: 1.5, fontWeight: '800' },
  line: { minHeight: 64, borderWidth: 1.5, borderRadius: 16, padding: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.55)' },
  placeholder: { color: '#475569', fontSize: 13, fontStyle: 'italic' },
  tray: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: 'rgba(148,163,184,0.3)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, minHeight: 44, justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.6)' },
  chipUsed: { opacity: 0.35 },
  chipTxt: { color: '#e2e8f0', fontSize: 20, fontFamily: 'Playfair_Medium' },
  answer: { color: '#94a3b8', fontSize: 14, lineHeight: 22 },
  checkBtn: { alignSelf: 'flex-start', borderRadius: 14, paddingHorizontal: 26, paddingVertical: 12, minHeight: 44 },
  checkTxt: { color: '#0b1220', fontSize: 14.5, fontWeight: '800' },
});
