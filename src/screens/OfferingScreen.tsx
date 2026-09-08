import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getFaithTheme } from '../data/faiths';
import { usePreferencesStore } from '../store/preferencesStore';
import { track } from '../services/analytics';

/**
 * Support the creators — a quiet tip, never a nag.
 *
 * DESIGN LAW (App Store 3.1.1 / 3.2.1): this is a TIP TO THE DEVELOPER for
 * digital content, so it MUST go through IAP and must never be framed as a
 * donation to a temple, religion or charity — that is a different Apple rule
 * which forbids IAP, and it would misrepresent who receives the money
 * (Tara Ventures Pte Ltd). Never link out to a web donate page from iOS.
 * Never imply a physical act of worship is performed on the user's behalf.
 *
 * The tiers below map to IAP product ids created in App Store Connect / Play
 * Console. Until the purchase layer lands (next native build), taps record
 * intent so we know which tier people reach for.
 */
export const OFFERINGS = [
  { id: 'diya', productId: 'com.taraventures.dharma.support.small',
    emoji: '🪔', name: 'A small thanks', price: '₹19 · $0.29',
    line: 'Helps cover what it costs to keep the app running.' },
  { id: 'flowers', productId: 'com.taraventures.dharma.support.medium',
    emoji: '🌺', name: 'A kind hand', price: '₹49 · $0.99',
    line: 'Goes towards the next mantra recording.' },
  { id: 'lamp', productId: 'com.taraventures.dharma.support.large',
    emoji: '🕉️', name: 'A patron', price: '₹199 · $2.99',
    line: 'Helps our artists paint the next katha.' },
] as const;

export const OfferingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const theme = getFaithTheme(usePreferencesStore((s) => s.primaryTradition));
  const [noted, setNoted] = useState<string | null>(null);

  const offer = (o: (typeof OFFERINGS)[number]) => {
    track('offering_tap', { tier: o.id });
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch { /* noop */ }
    setNoted(o.id);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={16} style={{ marginBottom: 8 }}>
          <Ionicons name="chevron-back" size={26} color="#e2e8f0" />
        </Pressable>

        <Text style={styles.lamp}>🪔</Text>
        <Text style={styles.title}>Support the creators</Text>
        <Text style={styles.sub}>
          A small team writes, paints and records everything in this app — and gives it away free.
          If our work has meant something to you, you can support us directly. Nothing is unlocked by it,
          and nothing is withheld without it.
        </Text>

        {OFFERINGS.map((o) => (
          <Pressable key={o.id} style={styles.row} onPress={() => offer(o)}>
            <Text style={styles.emoji}>{o.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{o.name}</Text>
              <Text style={styles.line}>{noted === o.id ? '🙏 Noted — the doors open soon.' : o.line}</Text>
            </View>
            <Text style={[styles.price, { color: theme.accent }]}>{o.price}</Text>
          </Pressable>
        ))}

        <Text style={styles.note}>
          Support opens with the next update. This is a voluntary tip to DharmaWeave by Tara Ventures Pte Ltd,
          the studio that makes this app — not a religious donation or a charitable contribution, and not
          tax-deductible. It funds the next book, the next mantra, and keeps all of it free.
        </Text>
        <Text style={styles.blessing}>सर्वे भवन्तु सुखिनः</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  scroll: { paddingHorizontal: 22, paddingTop: 62, paddingBottom: 60 },
  lamp: { fontSize: 40, textAlign: 'center', marginTop: 8 },
  title: { fontSize: 30, color: '#f8fafc', fontFamily: 'Playfair_Bold', textAlign: 'center', marginTop: 8 },
  sub: { color: '#94a3b8', fontSize: 13.5, lineHeight: 21, textAlign: 'center', marginTop: 12, marginBottom: 26 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(15,23,42,0.55)', borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.14)', padding: 16, marginBottom: 12,
  },
  emoji: { fontSize: 26 },
  name: { color: '#f1f5f9', fontSize: 16, fontFamily: 'Playfair_Bold' },
  line: { color: '#94a3b8', fontSize: 12, marginTop: 3, lineHeight: 17 },
  price: { fontSize: 13, fontWeight: '800' },
  note: { color: '#64748b', fontSize: 11.5, lineHeight: 18, textAlign: 'center', marginTop: 18 },
  blessing: { color: '#475569', fontSize: 14, textAlign: 'center', marginTop: 24, fontFamily: 'Playfair_Regular' },
});
