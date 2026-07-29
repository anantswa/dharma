import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { getFaithTheme } from '../data/faiths';
import { usePreferencesStore } from '../store/preferencesStore';
import { track } from '../services/analytics';

// SECURITY (2026-07-28): the app carries NO backend credential — feedback goes
// out as a mail compose (user-controlled, nothing stored by us), and only the
// newsletter opt-in touches the network via our own public web endpoint.
const FEEDBACK_EMAIL = 'contact@dharmaweave.com';
const SUBSCRIBE_URL = 'https://dharmaweave.com/api/subscribe';

const RATINGS = [
  { id: 'loved', emoji: '🪷', label: 'Loved it' },
  { id: 'good', emoji: '🙂', label: "It's good" },
  { id: 'needs_work', emoji: '🛠️', label: 'Needs work' },
] as const;

/**
 * Feedback — the improvement loop, in-app. A gentle form (no account needed):
 * how it feels + what to improve, composed into the user's own mail app to
 * contact@dharmaweave.com. Optional email doubles as newsletter signup (posts
 * to the dharmaweave.com subscriber list — our own public endpoint, no key).
 */
export const FeedbackScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const theme = getFaithTheme(usePreferencesStore.getState().primaryTradition);
  const [rating, setRating] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [newsletter, setNewsletter] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const canSend = !!rating || message.trim().length > 0;

  const send = async () => {
    if (!canSend || sending) return;
    setSending(true);
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch { /* noop */ }
    const cleanEmail = email.trim().toLowerCase();
    try {
      // feedback = a mail compose in the user's own hands — no backend, no key
      const ratingLabel = RATINGS.find((r) => r.id === rating)?.label ?? '—';
      const body =
        `How it feels: ${ratingLabel}\n\n${message.trim()}\n\n` +
        `— Dharma v${Constants.expoConfig?.version ?? '0.0.0'} · ${Platform.OS}`;
      await Linking.openURL(
        `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent('Dharma app feedback')}&body=${encodeURIComponent(body)}`,
      );
      if (newsletter && cleanEmail.includes('@')) {
        fetch(SUBSCRIBE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, source_slug: 'dharma-app' }),
        }).catch(() => {});
      }
      track('feedback_sent', { rating: rating ?? 'none', newsletter: newsletter && !!cleanEmail });
      setSent(true);
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch { /* noop */ }
    } catch { /* no mail client — fail soft */ }
    setSending(false);
  };

  if (sent) {
    return (
      <View style={[styles.container, styles.centerAll]}>
        <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />
        <Text style={{ fontSize: 52, marginBottom: 14 }}>🙏</Text>
        <Text style={styles.thanksTitle}>Thank you</Text>
        <Text style={styles.thanksSub}>
          Every message shapes the next version of Dharma.
          {newsletter && email.trim() ? '\nWelcome to the newsletter — the next katha will find you.' : ''}
        </Text>
        <Pressable style={[styles.sendBtn, { backgroundColor: theme.accent, marginTop: 26 }]} onPress={() => navigation.goBack()}>
          <Text style={styles.sendTxt}>Done</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={16}>
          <Ionicons name="chevron-back" size={26} color="#e2e8f0" />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.kicker, { color: theme.accent }]}>HELP US IMPROVE</Text>
        <Text style={styles.title}>How is Dharma{'\n'}for you?</Text>

        <View style={styles.ratingRow}>
          {RATINGS.map((r) => (
            <Pressable
              key={r.id}
              style={[styles.ratingChip, rating === r.id && { borderColor: theme.accent, backgroundColor: theme.accentSoft }]}
              onPress={() => { setRating(r.id); try { Haptics.selectionAsync(); } catch { /* noop */ } }}
            >
              <Text style={{ fontSize: 26 }}>{r.emoji}</Text>
              <Text style={[styles.ratingLbl, rating === r.id && { color: '#f8fafc' }]}>{r.label}</Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          style={styles.msgBox}
          placeholder="What should we improve? What do you wish the app had? (optional)"
          placeholderTextColor="#475569"
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={2000}
        />

        <TextInput
          style={styles.emailBox}
          placeholder="Your email (optional — for replies & the newsletter)"
          placeholderTextColor="#475569"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Pressable style={styles.newsRow} onPress={() => setNewsletter((v) => !v)}>
          <Ionicons
            name={newsletter ? 'checkbox' : 'square-outline'}
            size={20}
            color={newsletter ? theme.accent : '#64748b'}
          />
          <Text style={styles.newsTxt}>
            Send me the DharmaWeave newsletter — new kathas, mantras & art, no noise
          </Text>
        </Pressable>

        <Pressable
          style={[styles.sendBtn, { backgroundColor: theme.accent }, (!canSend || sending) && { opacity: 0.45 }]}
          disabled={!canSend || sending}
          onPress={send}
        >
          <Text style={styles.sendTxt}>{sending ? 'Sending…' : '🪔  Send'}</Text>
        </Pressable>
        <Text style={styles.privacyNote}>
          Send opens your own mail app — your message goes directly to the DharmaWeave team and nothing is
          stored by the app. Email is used solely for the newsletter if you opt in.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  centerAll: { alignItems: 'center', justifyContent: 'center', padding: 30 },
  topBar: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 4 },
  scroll: { paddingHorizontal: 22, paddingBottom: 50 },
  kicker: { fontSize: 12, letterSpacing: 3, fontWeight: '800' },
  title: { fontSize: 32, color: '#f8fafc', fontFamily: 'Playfair_Bold', marginTop: 6, lineHeight: 40, marginBottom: 22 },
  ratingRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  ratingChip: {
    flex: 1, alignItems: 'center', gap: 6, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(148,163,184,0.18)', borderRadius: 16,
    backgroundColor: 'rgba(15,23,42,0.5)',
  },
  ratingLbl: { color: '#94a3b8', fontSize: 12.5, fontWeight: '700' },
  msgBox: {
    minHeight: 110, borderWidth: 1, borderColor: 'rgba(148,163,184,0.2)', borderRadius: 16,
    padding: 14, color: '#f1f5f9', fontSize: 14.5, textAlignVertical: 'top',
    backgroundColor: 'rgba(2,6,23,0.5)', marginBottom: 12,
  },
  emailBox: {
    borderWidth: 1, borderColor: 'rgba(148,163,184,0.2)', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12, color: '#f1f5f9', fontSize: 14.5,
    backgroundColor: 'rgba(2,6,23,0.5)', marginBottom: 12,
  },
  newsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 20, paddingRight: 8 },
  newsTxt: { color: '#94a3b8', fontSize: 13, lineHeight: 19, flex: 1 },
  sendBtn: { borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  sendTxt: { color: '#0b1220', fontSize: 15.5, fontWeight: '800' },
  privacyNote: { color: '#475569', fontSize: 11.5, lineHeight: 17, marginTop: 12, textAlign: 'center' },
  thanksTitle: { color: '#f8fafc', fontSize: 28, fontFamily: 'Playfair_Bold' },
  thanksSub: { color: '#94a3b8', fontSize: 14.5, textAlign: 'center', lineHeight: 22, marginTop: 10 },
});
