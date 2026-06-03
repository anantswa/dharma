import React, { useRef, useState } from 'react';
import { View, Text, ImageBackground, StyleSheet, TouchableOpacity, StatusBar, Dimensions, Share, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Paywall } from '../components/Paywall';
import { ShareableCard } from '../components/ShareableCard';
import { usePremiumStore } from '../store/premiumStore';
import { usePreferencesStore } from '../store/preferencesStore';

const { width, height } = Dimensions.get('window');

export const WisdomDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const isPremium = usePremiumStore((s) => s.isPremium);
  const primaryTradition = usePreferencesStore((s) => s.primaryTradition);
  const [showPaywall, setShowPaywall] = useState(false);
  const cardRef = useRef<View>(null);

  const { wisdom } = route.params as any || {};
  if (!wisdom) return null;

  const onListen = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch { /* noop */ }
    if (isPremium) {
      // TODO(iap): play the ElevenLabs narration track for this verse.
      Alert.alert('Sacred narration', 'Playing the narrated verse…');
    } else {
      setShowPaywall(true);
    }
  };

  const onPurchase = (storeId: string) => {
    // TODO(iap): hand off to react-native-iap / RevenueCat (native only).
    // Kept honest: we do not grant entitlement here.
    setShowPaywall(false);
    Alert.alert('Almost there', `This will start checkout for "${storeId}" on device.`);
  };

  const shareText = () => {
    const original = wisdom.original_transliteration ? `${wisdom.original_transliteration}\n\n` : '';
    const translation = wisdom.translation_en ? `“${wisdom.translation_en}”\n` : '';
    const source = wisdom.source ? `— ${wisdom.source}\n` : '';
    return `${original}${translation}${source}\nShared from Dharma 🪔`;
  };

  const onShare = async () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch { /* noop */ }
    // Preferred: share the visual card as an image.
    // Lazy-require view-shot so Expo Go (where the native module isn't bundled) falls back cleanly.
    try {
      const { captureRef } = require('react-native-view-shot');
      if (cardRef.current && (await Sharing.isAvailableAsync())) {
        const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share this wisdom' });
        return;
      }
    } catch {
      /* fall through to text share */
    }
    // Fallback: OS text share (web / capture unavailable).
    try {
      await Share.share({ message: shareText() });
    } catch {
      /* user dismissed */
    }
  };

  // --- THE NEW IMAGE LOGIC (Same as Library) ---
  const getBackgroundImage = () => {
    const t = wisdom.tradition.toLowerCase();
    
    // 1. Community
    if (t.includes('sikh')) return require('../../assets/images/community/community_sikh.jpg');
    if (t.includes('jain')) return require('../../assets/images/community/community_jain.jpg');
    if (t.includes('gujarati')) return require('../../assets/images/community/community_gujarati.jpg');
    if (t.includes('himachal')) return require('../../assets/images/community/community_himachal.jpg');

    // 2. Quotes
    if (t.includes('zen') || t.includes('buddh')) {
        return require('../../assets/images/quotes/quotes_bg_01.jpg');
    }

    // 3. Splash (Fallback)
    // You can randomly pick one here if you want variety later:
    // const splashes = [require(...splash_01.jpg), require(...splash_02.jpg)]
    return require('../../assets/images/splash/splash_01.jpg');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ImageBackground 
        source={getBackgroundImage()} 
        style={styles.bgImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(2,6,23,0.1)', 'rgba(2,6,23,0.6)', '#020617']}
          locations={[0, 0.6, 1]}
          style={styles.gradient}
        >
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.goBack()}
              hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}
            >
              <Ionicons name="chevron-down" size={32} color="#f8fafc" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={onShare}
              hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}
              accessibilityRole="button"
              accessibilityLabel="Share this wisdom"
            >
              <Ionicons name="share-outline" size={24} color="#f8fafc" />
            </TouchableOpacity>
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.metaRow}>
              <Text style={styles.tradition}>
                {wisdom.tradition.toUpperCase()}
              </Text>
              {wisdom.lineage && (
                <Text style={styles.lineage}> • {wisdom.lineage.toUpperCase()}</Text>
              )}
            </View>

            <Text style={styles.original}>
              {wisdom.original_transliteration}
            </Text>

            <View style={styles.divider} />

            <Text style={styles.translation}>
              "{wisdom.translation_en}"
            </Text>

            <Text style={styles.source}>
              — {wisdom.source}
            </Text>

            {/* Contextual premium: sacred narration of this verse */}
            <TouchableOpacity style={styles.listenBtn} onPress={onListen} activeOpacity={0.85}>
              <Ionicons name={isPremium ? 'play-circle' : 'lock-closed'} size={18} color="#fbbf24" />
              <Text style={styles.listenText}>
                {isPremium ? 'Listen in a sacred voice' : 'Hear this in a sacred voice'}
              </Text>
              {!isPremium && <Text style={styles.listenPlus}>Dharma+</Text>}
            </TouchableOpacity>

            {wisdom.theme && (
              <View style={styles.themeBadge}>
                <Text style={styles.themeText}>{wisdom.theme}</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </ImageBackground>

      <Paywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        reason="Hear every teaching in a sacred voice"
        faith={primaryTradition ?? wisdom.tradition}
        onPurchase={onPurchase}
      />

      {/* Off-screen card captured for image sharing */}
      <View style={styles.offscreen} pointerEvents="none">
        <ShareableCard ref={cardRef} wisdom={wisdom} faith={primaryTradition ?? wisdom.tradition} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  bgImage: { width, height, flex: 1 },
  gradient: { flex: 1, justifyContent: 'space-between', padding: 24 },
  topBar: { marginTop: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 50, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  contentContainer: { paddingBottom: 50 },
  metaRow: { flexDirection: 'row', marginBottom: 16, opacity: 0.9 },
  tradition: { color: '#fbbf24', fontSize: 12, fontFamily: 'Playfair_Bold', letterSpacing: 2 },
  lineage: { color: '#cbd5e1', fontSize: 12, fontFamily: 'Playfair_Regular', letterSpacing: 1 },
  original: { fontSize: 22, color: '#e2e8f0', fontFamily: 'Playfair_Medium', fontStyle: 'italic', marginBottom: 24, lineHeight: 34 },
  divider: { height: 1, width: 60, backgroundColor: '#fbbf24', marginBottom: 24, opacity: 0.6 },
  translation: { fontSize: 24, color: '#ffffff', fontFamily: 'Playfair_Bold', lineHeight: 34, marginBottom: 20 },
  source: { fontSize: 15, color: '#94a3b8', fontFamily: 'Playfair_Regular', fontStyle: 'italic', marginBottom: 20 },
  listenBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.4)', backgroundColor: 'rgba(251,191,36,0.10)',
  },
  listenText: { color: '#f8fafc', fontSize: 14, fontWeight: '600' },
  listenPlus: { color: '#fbbf24', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  offscreen: { position: 'absolute', left: -9999, top: 0 },
  themeBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.3)', backgroundColor: 'rgba(251, 191, 36, 0.1)' },
  themeText: { color: '#fbbf24', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }
});