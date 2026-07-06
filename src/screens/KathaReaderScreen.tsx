import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { PetalShower } from '../components/PetalShower';
import { getFaithTheme } from '../data/faiths';
import { usePreferencesStore } from '../store/preferencesStore';
import { track } from '../services/analytics';

const CATALOG_URL =
  'https://aiwugigdrvijjeoqtpog.supabase.co/storage/v1/object/public/dharma-art/kathas/catalog.json';
const { width: W, height: H } = Dimensions.get('window');

type Katha = {
  id: string; title: string; subtitle?: string; tradition?: string;
  cover: string; pages: string[]; pageCount: number;
};

/**
 * Katha reader — the free graphic novel, read as a full-screen vertical book.
 * Streams pages from the kathas catalog (new books appear with no app update),
 * remembers your page, and closes with a small ceremony. Chrome fades away so
 * the art is the whole experience; tap to bring it back.
 */
export const KathaReaderScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const kathaId = route.params?.kathaId ?? 'varaha';
  const theme = getFaithTheme(usePreferencesStore.getState().primaryTradition);

  const [katha, setKatha] = useState<Katha | null>(null);
  const [page, setPage] = useState(0);
  const [chrome, setChrome] = useState(true);
  const [finished, setFinished] = useState(false);
  const listRef = useRef<FlatList>(null);
  const resumeKey = `@dharma:katha:${kathaId}`;

  // load catalog + resume position
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(CATALOG_URL);
        const data = await res.json();
        const k = (data?.kathas ?? []).find((x: Katha) => x.id === kathaId) ?? data?.kathas?.[0];
        if (!alive || !k) return;
        setKatha(k);
        track('katha_open', { katha: k.id });
        const saved = await AsyncStorage.getItem(resumeKey);
        const idx = saved ? Math.min(Number(saved), k.pages.length - 1) : 0;
        if (idx > 0) {
          setPage(idx);
          setTimeout(() => listRef.current?.scrollToIndex({ index: idx, animated: false }), 60);
        }
      } catch { /* offline — show gentle empty state below */ }
    })();
    return () => { alive = false; };
  }, [kathaId, resumeKey]);

  const onViewable = useRef(({ viewableItems }: any) => {
    if (viewableItems?.length) {
      const idx = viewableItems[0].index ?? 0;
      setPage(idx);
      AsyncStorage.setItem(resumeKey, String(idx)).catch(() => {});
    }
  }).current;

  // completion — once, when the last page is reached
  useEffect(() => {
    if (katha && page >= katha.pages.length - 1 && !finished) {
      setFinished(true);
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch { /* noop */ }
      track('katha_complete', { katha: katha.id });
    }
  }, [page, katha, finished]);

  const renderPage = useCallback(({ item, index }: { item: string; index: number }) => (
    <Pressable style={styles.page} onPress={() => setChrome((c) => !c)}>
      <ExpoImage
        source={{ uri: item }}
        style={styles.pageImg}
        contentFit="contain"
        transition={200}
        cachePolicy="memory-disk"
        priority={index <= 2 ? 'high' : 'normal'}
      />
    </Pressable>
  ), []);

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
      <FlatList
        ref={listRef}
        data={katha.pages}
        keyExtractor={(u) => u}
        renderItem={renderPage}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        getItemLayout={(_, i) => ({ length: H, offset: H * i, index: i })}
        initialNumToRender={2}
        maxToRenderPerBatch={3}
        windowSize={5}
      />

      {finished && page >= katha.pages.length - 1 && <PetalShower />}

      {/* floating chrome — fades with a tap */}
      {chrome && (
        <>
          <View style={styles.topBar} pointerEvents="box-none">
            <Pressable style={styles.roundBtn} onPress={() => navigation.goBack()} hitSlop={12}>
              <Ionicons name="chevron-back" size={22} color="#f8fafc" />
            </Pressable>
            <View style={[styles.progressPill, { borderColor: theme.accentSoft }]}>
              <Text style={styles.progressTxt}>{page + 1} / {katha.pageCount}</Text>
            </View>
          </View>
          <View style={styles.titleStrip} pointerEvents="none">
            <Text style={styles.titleTxt} numberOfLines={1}>{katha.title}</Text>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centerAll: { alignItems: 'center', justifyContent: 'center' },
  loading: { color: '#94a3b8', fontSize: 15 },
  page: { width: W, height: H, backgroundColor: '#000' },
  pageImg: { width: '100%', height: '100%' },
  topBar: {
    position: 'absolute', top: 52, left: 14, right: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  roundBtn: {
    width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(2,6,23,0.6)',
  },
  progressPill: {
    borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: 'rgba(2,6,23,0.6)',
  },
  progressTxt: { color: '#e2e8f0', fontSize: 12.5, fontWeight: '700' },
  titleStrip: { position: 'absolute', bottom: 34, left: 0, right: 0, alignItems: 'center' },
  titleTxt: {
    color: 'rgba(226,232,240,0.85)', fontSize: 12.5, fontWeight: '600',
    backgroundColor: 'rgba(2,6,23,0.55)', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 999, overflow: 'hidden',
  },
});
