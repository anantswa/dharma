import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ErrorCode, useIAP, type Product, type Purchase } from 'expo-iap';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
 * Founder 2026-09-08: everything inside Apple and Google — their rules, their
 * tax handling. The three tiers are CONSUMABLE products with the same ids in
 * App Store Connect and Play Console; the store's own sheet takes the payment,
 * we finish (consume) the transaction, and show thanks. Prices come from the
 * store (localised); the hard-coded strings are the offline fallback only.
 */
export const OFFERINGS = [
  { id: 'diya', productId: 'com.taraventures.dharma.support.small',
    emoji: '🪔', name: 'A small thanks', price: '$0.29',
    line: 'Helps cover what it costs to keep the app running.' },
  { id: 'flowers', productId: 'com.taraventures.dharma.support.medium',
    emoji: '🌺', name: 'A kind hand', price: '$0.99',
    line: 'Goes towards the next mantra recording.' },
  { id: 'lamp', productId: 'com.taraventures.dharma.support.large',
    emoji: '🕉️', name: 'A patron', price: '$2.99',
    line: 'Helps our artists paint the next katha.' },
] as const;
const SKUS = OFFERINGS.map((o) => o.productId);
const tierOf = (productId: string) => OFFERINGS.find((o) => o.productId === productId)?.id ?? productId;

export const OfferingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const theme = getFaithTheme(usePreferencesStore((s) => s.primaryTradition));
  const [busy, setBusy] = useState<string | null>(null);      // productId mid-purchase
  const [thanked, setThanked] = useState<string | null>(null); // tier that just went through
  const [problem, setProblem] = useState<string | null>(null);

  const { connected, products, fetchProducts, requestPurchase, finishTransaction } = useIAP({
    onPurchaseSuccess: async (purchase: Purchase) => {
      try {
        await finishTransaction({ purchase, isConsumable: true }); // consume: the same tip can be given again
      } catch { /* the store retries unfinished transactions on next launch */ }
      track('offering_purchase', { tier: tierOf(purchase.productId), env: (purchase as { environmentIOS?: string }).environmentIOS ?? 'store' });
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch { /* noop */ }
      setBusy(null); setProblem(null); setThanked(tierOf(purchase.productId));
    },
    onPurchaseError: (error) => {
      setBusy(null);
      if (error.code === ErrorCode.UserCancelled) { track('offering_cancel'); return; }
      track('offering_error', { code: error.code });
      setProblem(error.code === ErrorCode.NetworkError ? 'No connection just now — try again later.' : 'The store could not complete that. Nothing was charged.');
    },
  });

  useEffect(() => {
    if (connected) fetchProducts({ skus: SKUS, type: 'in-app' }).catch(() => undefined);
  }, [connected, fetchProducts]);

  const storePrice = (productId: string) => (products as Product[] | undefined)?.find((p) => p.id === productId)?.displayPrice;

  const offer = async (o: (typeof OFFERINGS)[number]) => {
    track('offering_tap', { tier: o.id, live: connected });
    try { Haptics.selectionAsync(); } catch { /* noop */ }
    if (!connected) { setProblem('The store is not reachable just now — try again in a moment.'); return; }
    setBusy(o.productId); setProblem(null);
    try {
      await requestPurchase({ request: { apple: { sku: o.productId }, google: { skus: [o.productId] } }, type: 'in-app' });
    } catch { setBusy(null); }
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

        {thanked && (
          <View style={[styles.thanks, { borderColor: `${theme.accent}66` }]}>
            <Text style={[styles.thanksTitle, { color: theme.accent }]}>🙏 Thank you</Text>
            <Text style={styles.thanksLine}>Received. It goes straight into the next thing we make.</Text>
          </View>
        )}

        {OFFERINGS.map((o) => (
          <Pressable key={o.id} style={[styles.row, busy === o.productId && { opacity: 0.6 }]} onPress={() => offer(o)} disabled={!!busy} accessibilityRole="button">
            <Text style={styles.emoji}>{o.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{o.name}</Text>
              <Text style={styles.line}>{o.line}</Text>
            </View>
            {busy === o.productId
              ? <ActivityIndicator color={theme.accent} />
              : <Text style={[styles.price, { color: theme.accent }]}>{storePrice(o.productId) ?? o.price}</Text>}
          </Pressable>
        ))}

        {!!problem && <Text style={styles.problem}>{problem}</Text>}

        <Text style={styles.note}>
          Payment is taken by the App Store or Google Play. This is a voluntary tip to DharmaWeave by Tara Ventures Pte Ltd,
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
  thanks: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16, backgroundColor: 'rgba(15,23,42,0.55)', alignItems: 'center' },
  thanksTitle: { fontSize: 18, fontFamily: 'Playfair_Bold' },
  thanksLine: { color: '#cbd5e1', fontSize: 13, marginTop: 6, textAlign: 'center' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(15,23,42,0.55)', borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.14)', padding: 16, marginBottom: 12, minHeight: 64,
  },
  emoji: { fontSize: 26 },
  name: { color: '#f1f5f9', fontSize: 16, fontFamily: 'Playfair_Bold' },
  line: { color: '#94a3b8', fontSize: 12, marginTop: 3, lineHeight: 17 },
  price: { fontSize: 13, fontWeight: '800' },
  problem: { color: '#fca5a5', fontSize: 12.5, textAlign: 'center', marginTop: 6 },
  note: { color: '#64748b', fontSize: 11.5, lineHeight: 18, textAlign: 'center', marginTop: 18 },
  blessing: { color: '#475569', fontSize: 14, textAlign: 'center', marginTop: 24, fontFamily: 'Playfair_Regular' },
});
