import React from 'react';
import { View, Text, ImageBackground, StyleSheet, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export const WisdomDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  const { wisdom } = route.params as any || {};
  if (!wisdom) return null;

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
          <TouchableOpacity 
            style={styles.closeBtn} 
            onPress={() => navigation.goBack()}
            hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}
          >
            <Ionicons name="chevron-down" size={32} color="#f8fafc" />
          </TouchableOpacity>

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

            {wisdom.theme && (
              <View style={styles.themeBadge}>
                <Text style={styles.themeText}>{wisdom.theme}</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  bgImage: { width, height, flex: 1 },
  gradient: { flex: 1, justifyContent: 'space-between', padding: 24 },
  closeBtn: { marginTop: 60, alignSelf: 'flex-start', padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 50 },
  contentContainer: { paddingBottom: 50 },
  metaRow: { flexDirection: 'row', marginBottom: 16, opacity: 0.9 },
  tradition: { color: '#fbbf24', fontSize: 12, fontFamily: 'Playfair_Bold', letterSpacing: 2 },
  lineage: { color: '#cbd5e1', fontSize: 12, fontFamily: 'Playfair_Regular', letterSpacing: 1 },
  original: { fontSize: 22, color: '#e2e8f0', fontFamily: 'Playfair_Medium', fontStyle: 'italic', marginBottom: 24, lineHeight: 34 },
  divider: { height: 1, width: 60, backgroundColor: '#fbbf24', marginBottom: 24, opacity: 0.6 },
  translation: { fontSize: 24, color: '#ffffff', fontFamily: 'Playfair_Bold', lineHeight: 34, marginBottom: 20 },
  source: { fontSize: 15, color: '#94a3b8', fontFamily: 'Playfair_Regular', fontStyle: 'italic', marginBottom: 32 },
  themeBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.3)', backgroundColor: 'rgba(251, 191, 36, 0.1)' },
  themeText: { color: '#fbbf24', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }
});