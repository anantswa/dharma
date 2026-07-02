import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Pressable } from 'react-native';
import { WebView } from 'react-native-webview';
import { getFaithTheme } from '../data/faiths';
import { track } from '../services/analytics';

/**
 * In-app film player — plays our cinematic kathas inside the app via the YouTube
 * embed player (privacy-enhanced youtube-nocookie domain). Replaces the old
 * deep-link that bounced users out to the YouTube website/app — the exact
 * behaviour App Review flagged under guideline 4.2.2 ("web browsing experience").
 */
export const FilmPlayerScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { id, title, channel } = route.params ?? {};
  const theme = getFaithTheme('Hindu');
  const { width } = useWindowDimensions();
  const playerH = Math.round((width * 9) / 16);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => { track('film_play', { id }); }, [id]);

  const embed = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0&modestbranding=1`;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={16}>
          <Ionicons name="chevron-back" size={26} color="#e2e8f0" />
        </Pressable>
      </View>

      <View style={[styles.playerWrap, { height: playerH }]}>
        {loading && (
          <View style={styles.loading}>
            <ActivityIndicator color={theme.accent} size="large" />
          </View>
        )}
        <WebView
          source={{ uri: embed }}
          style={{ backgroundColor: '#000' }}
          allowsInlineMediaPlayback
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          onLoadEnd={() => setLoading(false)}
        />
      </View>

      <View style={styles.meta}>
        <Text style={styles.title}>{title}</Text>
        {!!channel && <Text style={styles.channel}>{channel} · via YouTube</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  topBar: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 10 },
  playerWrap: { width: '100%', backgroundColor: '#000' },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 2, backgroundColor: '#000' },
  meta: { padding: 18 },
  title: { color: '#f8fafc', fontSize: 19, fontFamily: 'Playfair_Bold', lineHeight: 26 },
  channel: { color: '#94a3b8', fontSize: 13, marginTop: 8 },
});
