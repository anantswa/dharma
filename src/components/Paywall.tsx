import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { deitiesForFaith, getFaithTheme } from '../data/faiths';
import { DHARMA_PLUS, PLUS_BENEFITS } from '../data/products';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Why the paywall opened — shown as the headline so it feels contextual, not generic. */
  reason?: string;
  faith?: string | null;
  /** Called with the chosen storeId. Wire to react-native-iap / RevenueCat in the IAP layer. */
  onPurchase: (storeId: string) => void;
};

/**
 * Contextual, on-brand paywall. Opens from a locked feature (not a buried Store tab),
 * themed to the user's faith, fronted by their own darshan art.
 */
export const Paywall: React.FC<Props> = ({ visible, onClose, reason, faith, onPurchase }) => {
  const theme = getFaithTheme(faith);
  const hero = deitiesForFaith(faith)[0]?.image;
  const [selected, setSelected] = useState(DHARMA_PLUS.find((p) => p.featured)?.id ?? DHARMA_PLUS[0].id);

  const buy = () => {
    const product = DHARMA_PLUS.find((p) => p.id === selected);
    if (!product) return;
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch { /* noop */ }
    onPurchase(product.storeId);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {hero && <Image source={hero} style={styles.hero} resizeMode="cover" />}
          <LinearGradient
            colors={['rgba(2,6,23,0.2)', 'rgba(2,6,23,0.85)', '#0b1220']}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />

          <Pressable style={styles.close} onPress={onClose} hitSlop={16}>
            <Ionicons name="close" size={22} color="#e2e8f0" />
          </Pressable>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={[styles.kicker, { color: theme.accent }]}>DHARMA+</Text>
            <Text style={styles.headline}>{reason ?? 'Deepen your practice'}</Text>

            <View style={styles.benefits}>
              {PLUS_BENEFITS.map((b) => (
                <View key={b} style={styles.benefitRow}>
                  <Ionicons name="sparkles" size={15} color={theme.accent} style={{ marginTop: 2 }} />
                  <Text style={styles.benefitText}>{b}</Text>
                </View>
              ))}
            </View>

            {DHARMA_PLUS.map((p) => {
              const on = p.id === selected;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setSelected(p.id)}
                  style={[
                    styles.tier,
                    { borderColor: on ? theme.accent : 'rgba(148,163,184,0.25)', backgroundColor: on ? theme.accentSoft : 'rgba(15,23,42,0.5)' },
                  ]}
                >
                  <View style={styles.radioWrap}>
                    <View style={[styles.radio, { borderColor: theme.accent }]}>
                      {on && <View style={[styles.radioDot, { backgroundColor: theme.accent }]} />}
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.tierTitleRow}>
                      <Text style={styles.tierTitle}>{p.title}</Text>
                      {p.badge && (
                        <Text style={[styles.tierBadge, { color: theme.accent, borderColor: theme.accent }]}>
                          {p.badge}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.tierTagline}>{p.tagline}</Text>
                  </View>
                  <Text style={[styles.tierPrice, on && { color: theme.accent }]}>{p.price}</Text>
                </Pressable>
              );
            })}

            <Pressable style={[styles.cta, { backgroundColor: theme.accent }]} onPress={buy}>
              <Text style={styles.ctaText}>Begin Dharma+</Text>
            </Pressable>

            <Text style={styles.fine}>
              Cancel anytime. Payment is charged to your store account. Subscriptions renew unless
              turned off at least 24h before the period ends.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    height: '88%',
    backgroundColor: '#0b1220',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  hero: { position: 'absolute', top: 0, left: 0, right: 0, height: 260 },
  close: {
    position: 'absolute', top: 16, right: 16, zIndex: 5,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(2,6,23,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  body: { paddingHorizontal: 22, paddingTop: 150, paddingBottom: 40 },
  kicker: { fontSize: 13, letterSpacing: 3, fontWeight: '800', marginBottom: 6 },
  headline: { fontSize: 26, color: '#f8fafc', fontFamily: 'Playfair_Bold', lineHeight: 32, marginBottom: 20 },
  benefits: { marginBottom: 22, gap: 10 },
  benefitRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  benefitText: { flex: 1, color: '#cbd5e1', fontSize: 14.5, lineHeight: 20 },
  tier: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10 },
  radioWrap: { marginRight: 12 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  tierTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tierTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '700' },
  tierBadge: { fontSize: 10, fontWeight: '700', borderWidth: 1, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1, overflow: 'hidden' },
  tierTagline: { color: '#94a3b8', fontSize: 12.5, marginTop: 2 },
  tierPrice: { color: '#e2e8f0', fontSize: 15, fontWeight: '800', marginLeft: 8 },
  cta: { marginTop: 14, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  ctaText: { color: '#0b1220', fontSize: 16, fontWeight: '800' },
  fine: { color: '#64748b', fontSize: 11, lineHeight: 16, marginTop: 14, textAlign: 'center' },
});
