import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  Extrapolation, interpolate, SharedValue, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue,
} from 'react-native-reanimated';
import { PetalShower } from '../components/PetalShower';
import { getComic } from '../data/comics';
import { getFaithTheme } from '../data/faiths';
import { usePreferencesStore } from '../store/preferencesStore';
import { track } from '../services/analytics';

const CATALOG_URL =
  'https://aiwugigdrvijjeoqtpog.supabase.co/storage/v1/object/public/dharma-art/kathas/catalog.json';
const { width: W, height: H } = Dimensions.get('window');

type Scene = { img: string; thumb?: string; heading?: string; text?: string };
type ScrollKatha = { id: string; title: string; scenes: Scene[] };

/**
 * KathaScroll — the panel-native reader for every painted book (kathas from the
 * catalog AND bundled comics via route.params.comicId). Full-screen art, gentle
 * parallax, staged text over a scrim, tap for pure-art mode.
 *
 * Built on a plain paging ScrollView: Animated.FlatList + pagingEnabled is
 * unreliable on the RN new architecture (swipes snap back to page 1) — this
 * was the "book only shows the first page" bug. Do not convert back.
 */

const SceneView: React.FC<{
  scene: Scene; index: number; scrollY: SharedValue<number>; showText: boolean; accent: string;
  near: boolean; onTap: () => void;
}> = ({ scene, index, scrollY, showText, accent, near, onTap }) => {
  const range = [(index - 1) * H, index * H, (index + 1) * H];

  // backdrop: full parallax (it is blurred, so cropping is invisible)
  const imgStyle = useAnimatedStyle(() => {
    const translateY = interpolate(scrollY.value, range, [-H * 0.12, 0, H * 0.12], Extrapolation.CLAMP);
    const scale = interpolate(scrollY.value, range, [1.12, 1.02, 1.12], Extrapolation.CLAMP);
    return { transform: [{ translateY }, { scale }] };
  });

  // the painting itself: drift only, never scaled — so no face is ever cut off
  const artStyle = useAnimatedStyle(() => {
    const translateY = interpolate(scrollY.value, range, [-H * 0.05, 0, H * 0.05], Extrapolation.CLAMP);
    return { transform: [{ translateY }] };
  });

  const textStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [range[0] + H * 0.35, range[1], range[2] - H * 0.35], [0, 1, 0], Extrapolation.CLAMP);
    const translateY = interpolate(scrollY.value, range, [26, 0, 26], Extrapolation.CLAMP);
    return { opacity, transform: [{ translateY }] };
  });

  return (
    <Pressable style={styles.scene} onPress={onTap}>
      {/* blurred backdrop fills the screen so off-ratio panels never sit on dead black */}
      <Animated.View style={[StyleSheet.absoluteFill, imgStyle]}>
        <ExpoImage
          source={{ uri: scene.thumb ?? scene.img }}
          style={StyleSheet.absoluteFill as any}
          contentFit="cover"
          blurRadius={38}
          cachePolicy="memory-disk"
        />
        <View style={styles.backdropDim} pointerEvents="none" />
      </Animated.View>

      {/* the painting, whole — `contain` keeps every face and edge on screen */}
      <Animated.View style={[StyleSheet.absoluteFill, artStyle]}>
        {!!scene.thumb && (
          <ExpoImage source={{ uri: scene.thumb }} style={StyleSheet.absoluteFill as any} contentFit="contain" cachePolicy="memory-disk" />
        )}
        {near && (
          <ExpoImage
            source={{ uri: scene.img }}
            style={StyleSheet.absoluteFill as any}
            contentFit="contain"
            transition={200}
            cachePolicy="memory-disk"
          />
        )}
      </Animated.View>
      {showText && (scene.heading || scene.text) && (
        <>
          <LinearGradient
            colors={['transparent', 'rgba(2,6,23,0.55)', 'rgba(2,6,23,0.92)']}
            locations={[0, 0.45, 1]}
            style={styles.scrim}
            pointerEvents="none"
          />
          <Animated.View style={[styles.textWrap, textStyle]} pointerEvents="none">
            {!!scene.heading && <Text style={[styles.heading, { color: accent }]}>{scene.heading}</Text>}
            {!!scene.text && <Text style={styles.body}>{scene.text}</Text>}
          </Animated.View>
        </>
      )}
    </Pressable>
  );
};

export const KathaScrollScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const comicId: string | undefined = route.params?.comicId;
  const kathaId = route.params?.kathaId ?? (comicId ? undefined : 'varaha');
  const theme = getFaithTheme(usePreferencesStore((s) => s.primaryTradition));

  const [katha, setKatha] = useState<ScrollKatha | null>(null);
  const [startIdx, setStartIdx] = useState(0);
  const [idx, setIdx] = useState(0);
  const [showText, setShowText] = useState(true);
  const [chrome, setChrome] = useState(true);
  const [finished, setFinished] = useState(false);
  const [inviteDone, setInviteDone] = useState(false);
  const [email, setEmail] = useState('');
  const scrollY = useSharedValue(0);
  const resumeKey = `@dharma:kathascroll:${comicId ?? kathaId}`;
  const idxRef = useRef(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        let loaded: ScrollKatha | null = null;
        if (comicId) {
          // bundled comic → same flagship reader (verse over scrim, not baked-on text)
          const c = getComic(comicId);
          if (c) {
            loaded = {
              id: c.id,
              title: c.title,
              scenes: c.pages.map((p) => ({
                img: p.image,
                heading: p.heading,
                text: [p.verse, p.caption].filter(Boolean).join('\n\n'),
              })),
            };
          }
        } else {
          const res = await fetch(CATALOG_URL);
          const data = await res.json();
          const k = (data?.kathas ?? []).find((x: any) => x.id === kathaId);
          if (k?.scroll?.scenes?.length) loaded = { id: kathaId!, title: k.title, scenes: k.scroll.scenes };
        }
        if (!alive || !loaded) return;
        const saved = await AsyncStorage.getItem(resumeKey);
        const at = saved ? Math.min(Math.max(Number(saved) || 0, 0), loaded.scenes.length - 1) : 0;
        if (!alive) return;
        // resolve resume BEFORE first render: contentOffset places us, no scrollToIndex races
        setStartIdx(at); setIdx(at); idxRef.current = at;
        setKatha(loaded);
        track('kathascroll_open', { katha: comicId ?? kathaId });
      } catch { /* gentle empty state below */ }
    })();
    return () => { alive = false; };
  }, [kathaId, comicId, resumeKey]);

  const onScroll = useAnimatedScrollHandler((e) => { scrollY.value = e.contentOffset.y; });

  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.y / H);
    if (i !== idxRef.current) {
      idxRef.current = i;
      setIdx(i);
      AsyncStorage.setItem(resumeKey, String(i)).catch(() => {});
    }
  };

  // stay ahead of the reader: warm the next few paintings while this one is on screen
  useEffect(() => {
    if (!katha) return;
    const next = katha.scenes.slice(idx + 1, idx + 4).map((s) => s.img);
    if (next.length) ExpoImage.prefetch(next).catch(() => {});
  }, [idx, katha]);

  useEffect(() => {
    if (katha && idx >= katha.scenes.length - 1 && !finished) {
      setFinished(true);
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch { /* noop */ }
      track('kathascroll_complete', { katha: katha.id });
    }
  }, [idx, katha, finished]);

  const scenes = useMemo(() => katha?.scenes ?? [], [katha]);

  if (!katha) {
    return (
      <View style={[styles.container, styles.centerAll]}>
        <LinearGradient colors={['#020617', '#0b1220']} style={StyleSheet.absoluteFill} />
        <Text style={styles.loading}>Opening the katha…</Text>
        <Pressable onPress={() => navigation.goBack()} style={{ padding: 16 }}>
          <Text style={{ color: '#64748b' }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={settle}
        contentOffset={{ x: 0, y: startIdx * H }}
        removeClippedSubviews
      >
        {scenes.map((scene, i) => (
          <SceneView
            key={i}
            scene={scene}
            index={i}
            scrollY={scrollY}
            showText={showText}
            accent={theme.accent}
            near={Math.abs(i - idx) <= 2}
            onTap={() => setChrome((c) => !c)}
          />
        ))}
      </Animated.ScrollView>

      {/* first-page cue — makes the vertical read obvious */}
      {idx === 0 && (
        <View style={styles.swipeHint} pointerEvents="none">
          <Ionicons name="chevron-up" size={18} color="rgba(248,250,252,0.8)" />
          <Text style={styles.swipeHintTxt}>swipe up — {scenes.length} scenes</Text>
        </View>
      )}

      {finished && idx >= scenes.length - 1 && <PetalShower />}

      {/* post-delight invitation — never a gate, only offered once the book is finished */}
      {finished && idx >= scenes.length - 1 && !inviteDone && (
        <View style={styles.invite}>
          <Text style={[styles.inviteKicker, { color: theme.accent }]}>🪷  THE NEXT KATHA</Text>
          <Text style={styles.inviteTitle}>If this moved you</Text>
          <Text style={styles.inviteSub}>We paint a new one every few weeks. Leave an email and it will find you — nothing else, ever.</Text>
          <TextInput
            style={styles.inviteInput}
            placeholder="you@example.com"
            placeholderTextColor="#475569"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              style={[styles.inviteBtn, { backgroundColor: theme.accent, flex: 1, opacity: email.includes('@') ? 1 : 0.45 }]}
              disabled={!email.includes('@')}
              onPress={() => {
                track('katha_newsletter_join', { katha: katha.id });
                fetch('https://dharmaweave.com/api/subscribe', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: email.trim().toLowerCase(), source_slug: `katha-${katha.id}` }),
                }).catch(() => {});
                try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch { /* noop */ }
                setInviteDone(true);
              }}
            >
              <Text style={styles.inviteBtnTxt}>Send it to me</Text>
            </Pressable>
            <Pressable style={styles.inviteSkip} onPress={() => setInviteDone(true)}>
              <Text style={styles.inviteSkipTxt}>Not now</Text>
            </Pressable>
          </View>
        </View>
      )}

      {chrome && (
        <View style={styles.topBar} pointerEvents="box-none">
          <Pressable style={styles.roundBtn} onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color="#f8fafc" />
          </Pressable>
          <View style={[styles.pill, { borderColor: theme.accentSoft }]}>
            <Text style={styles.pillTxt}>{idx + 1} / {scenes.length}</Text>
          </View>
          <Pressable
            style={styles.roundBtn}
            onPress={() => { setShowText((t) => !t); try { Haptics.selectionAsync(); } catch { /* noop */ } }}
            hitSlop={12}
          >
            <Ionicons name={showText ? 'text' : 'text-outline'} size={19} color={showText ? theme.accent : '#94a3b8'} />
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centerAll: { alignItems: 'center', justifyContent: 'center' },
  loading: { color: '#94a3b8', fontSize: 15 },
  scene: { width: W, height: H, overflow: 'hidden', backgroundColor: '#000' },
  backdropDim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2,6,23,0.55)' },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: H * 0.42 },
  textWrap: { position: 'absolute', left: 22, right: 22, bottom: 46 },
  heading: { fontSize: 13, letterSpacing: 2, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' },
  body: { color: '#f1f5f9', fontSize: 16.5, lineHeight: 25, fontFamily: 'Playfair_Regular' },
  topBar: {
    position: 'absolute', top: 52, left: 14, right: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  roundBtn: {
    width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(2,6,23,0.6)',
  },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(2,6,23,0.6)' },
  pillTxt: { color: '#e2e8f0', fontSize: 12.5, fontWeight: '700' },
  swipeHint: { position: 'absolute', bottom: 18, left: 0, right: 0, alignItems: 'center' },
  invite: {
    position: 'absolute', left: 18, right: 18, bottom: 44,
    backgroundColor: 'rgba(2,6,23,0.94)', borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)', padding: 18,
  },
  inviteKicker: { fontSize: 10.5, letterSpacing: 2, fontWeight: '800' },
  inviteTitle: { color: '#f8fafc', fontSize: 21, fontFamily: 'Playfair_Bold', marginTop: 5 },
  inviteSub: { color: '#94a3b8', fontSize: 12.5, lineHeight: 18, marginTop: 5, marginBottom: 12 },
  inviteInput: {
    borderWidth: 1, borderColor: 'rgba(148,163,184,0.25)', borderRadius: 12,
    paddingHorizontal: 13, paddingVertical: 11, color: '#f1f5f9', fontSize: 14.5, marginBottom: 10,
  },
  inviteBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  inviteBtnTxt: { color: '#0b1220', fontSize: 14.5, fontWeight: '800' },
  inviteSkip: { paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  inviteSkipTxt: { color: '#64748b', fontSize: 13.5, fontWeight: '600' },
  swipeHintTxt: { color: 'rgba(248,250,252,0.75)', fontSize: 11.5, fontWeight: '600', letterSpacing: 0.5 },
});
