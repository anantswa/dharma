import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COMICS } from '../data/comics';
import { getFaithTheme, templeEntryIndex } from '../data/faiths';
import { getDailyDarshan } from '../services/dailyDarshan';
import { FINAL_DEITIES } from '../data/deityImages';
import { IstaPicker } from '../components/IstaPicker';
import { FEATURED_HERO, showChalisaComic, showIstaLine } from '../data/featured';
import { sortWallpapersForFaith } from '../data/wallpaperPacks';
import { usePreferencesStore } from '../store/preferencesStore';
import { useWallpaperCatalog } from '../store/wallpaperCatalogStore';
import { useIstaInterest } from '../store/istaInterestStore';
import { useNoticeboard } from '../store/noticeboardStore';
import { fetchLibrary, booksForFaith, type LibraryBook } from '../data/library';
import { canRead, useOwnership } from '../store/ownershipStore';
import { enableAratiBell } from '../services/notificationService';
import { track } from '../services/analytics';

const { width: W } = Dimensions.get('window');
const ART = 'https://dharmaweave.com/cdn/dharma-art';

/**
 * Mandir — the temple treasury. The destination surface: everything the temple
 * gives freely (books, wallpapers, teachings, mantras) in one abundant place,
 * merchandised with real art, plus the paid iṣṭa line. All content streams from
 * Supabase catalogs, so new drops appear with zero app updates.
 */
export const MandirScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const primary = usePreferencesStore((s) => s.primaryTradition);
  const theme = getFaithTheme(primary);
  const walls = useWallpaperCatalog((s) => s.wallpapers);
  const istaNotedMap = useIstaInterest((s) => s.noted);
  const istaNoted = Object.keys(istaNotedMap).length > 0;

  const [library, setLibrary] = useState<LibraryBook[]>([]);
  const ownedMap = useOwnership((s) => s.owned);
  const remindersEnabled = usePreferencesStore((s) => s.remindersEnabled);
  const reminderTime = usePreferencesStore((s) => s.reminderTime);
  const [bellBusy, setBellBusy] = useState(false);

  useEffect(() => {
    track('mandir_open');
    useWallpaperCatalog.getState().load();
    useNoticeboard.getState().load();
    let alive = true;
    fetchLibrary().then((b) => { if (alive) setLibrary(b); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  // latest undismissed notice → one quiet card on the Mandir wall (never on Today)
  const notices = useNoticeboard((s) => s.notices);
  const dismissedNotices = useNoticeboard((s) => s.dismissed);
  const notice = notices.find((n) => !dismissedNotices[n.id]) ?? null;

  const ista = usePreferencesStore((s) => s.ista);
  const istaName = useMemo(() => FINAL_DEITIES.find((d) => d.id === ista)?.name, [ista]);
  const wallRail = useMemo(
    () => sortWallpapersForFaith(walls, theme.key, istaName).slice(0, 8),
    [walls, theme.key, istaName],
  );

  const comic = COMICS[0];
  const hero = FEATURED_HERO[theme.key];
  const darshan = getDailyDarshan(primary);

  const onIstaTap = (pack: string) => {
    track('ista_pack_tap', { pack });
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch { /* noop */ }
    useIstaInterest.getState().note(pack);
  };

  // Second calm bell surface (after the sheet's row) toward the >=20% WAU opt-in target.
  const onBellTap = async () => {
    if (remindersEnabled) { navigation.navigate('Settings' as any); return; } // already ringing → adjust in You
    if (bellBusy) return;
    setBellBusy(true);
    const time = reminderTime || '07:00';
    const ok = await enableAratiBell(time, primary);
    if (ok) track('bell_optin', { hour: parseInt(time.split(':')[0], 10), from: 'mandir_card' });
    setBellBusy(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.kicker, { color: theme.accent }]}>{theme.key === 'Buddhist' ? 'THE VIHĀRA' : 'THE MANDIR'}</Text>
        <Text style={styles.title}>A place of abundance</Text>
        <Text style={styles.sub}>The temple gives freely — books, sacred art, teachings, mantras.</Text>

        {/* noticeboard — latest note from the temple, dismissible */}
        {notice && (
          <View style={styles.noticeCard}>
            <Pressable
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}
              onPress={() => { track('notice_tap', { id: notice.id }); navigation.navigate('Noticeboard'); }}
            >
              <Ionicons name="notifications-outline" size={17} color={theme.accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.noticeTitle} numberOfLines={1}>{notice.title}</Text>
                <Text style={styles.noticeBody} numberOfLines={1}>{notice.body}</Text>
              </View>
            </Pressable>
            <Pressable hitSlop={10} onPress={() => useNoticeboard.getState().dismiss(notice.id)}>
              <Ionicons name="close" size={16} color="#64748b" />
            </Pressable>
          </View>
        )}

        {/* the inner sanctum first — darshan is the heart of the temple */}
        <Pressable
          style={styles.templeCard}
          onPress={() => { track('mandir_temple_tap'); navigation.navigate('Temple', { deityIndex: templeEntryIndex(primary, usePreferencesStore.getState().ista) }); }}
        >
          <ExpoImage source={darshan.deity.image} style={StyleSheet.absoluteFill as any} contentFit="cover" contentPosition={{ top: '7%' }} transition={250} />
          <LinearGradient colors={['transparent', 'rgba(2,6,23,0.5)', 'rgba(2,6,23,0.95)']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
          <View style={styles.heroInner}>
            <Text style={[styles.templeKicker, { color: theme.accent }]}>🪔  {darshan.reason.toUpperCase()}</Text>
            <Text style={styles.heroTitle}>Enter the temple</Text>
            <Text style={styles.heroSub}>Darshan, chants, and the day’s wisdom</Text>
          </View>
        </Pressable>

        <IstaPicker accent={theme.accent} />

        {/* ── MANTRAS & PRACTICE ─────────────────────────── */}
        <SectionHead accent={theme.accent} title="Mantras & practice" sub="The daily ritual, in your pocket" />
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 26 }}>
          <Pressable style={[styles.practiceCard, { borderColor: theme.accentSoft }]} onPress={() => navigation.navigate('Japa')}>
            <Text style={styles.practiceEmoji}>📿</Text>
            <Text style={styles.rowTitle}>Japa mala</Text>
            <Text style={styles.rowSub}>Count 108 with haptic beads</Text>
          </Pressable>
          <Pressable
            style={[styles.practiceCard, { borderColor: theme.accentSoft }]}
            onPress={onBellTap}
            disabled={bellBusy}
          >
            <Text style={styles.practiceEmoji}>🔔</Text>
            <Text style={styles.rowTitle}>Ārati bell</Text>
            <Text style={styles.rowSub}>
              {remindersEnabled
                ? `Rings each morning at ${reminderTime || '07:00'}`
                : 'Ring the morning ārati bell'}
            </Text>
          </Pressable>
        </View>

        {/* ── BOOKS & KATHAS (faith-gated hero) ──────────── */}
        <SectionHead accent={theme.accent} title={theme.key === 'Buddhist' ? 'Teachings & stories' : 'Books & kathas'} sub="Painted stories, made for the phone" />
        <Pressable
          style={styles.heroCard}
          onPress={() => { track('mandir_hero_tap', { hero: hero.title }); navigation.navigate(hero.route as any, hero.params as any); }}
        >
          <ExpoImage source={{ uri: hero.image }} style={StyleSheet.absoluteFill as any} contentFit="cover" transition={250} />
          <LinearGradient colors={['transparent', 'rgba(2,6,23,0.55)', 'rgba(2,6,23,0.96)']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
          <View style={styles.freeBadge}><Text style={styles.freeBadgeTxt}>{hero.badge}</Text></View>
          <View style={styles.heroInner}>
            <Text style={styles.heroTitle}>{hero.title}</Text>
            <Text style={styles.heroSub}>{hero.sub}</Text>
            <View style={[styles.pillCta, { backgroundColor: theme.accent }]}>
              <Ionicons name="book" size={14} color="#0b1220" />
              <Text style={styles.pillCtaTxt}>{theme.key === 'Buddhist' ? 'Begin free' : 'Read free'}</Text>
            </View>
          </View>
        </Pressable>

        {/* the rest of the library — streamed, so new books need no app release */}
        {booksForFaith(library, primary).filter((b) => b.id !== 'varaha').map((b) => {
          const readable = canRead(b.access, b.id, ownedMap);
          return (
            <Pressable
              key={b.id}
              style={styles.bookRow}
              onPress={() => {
                track('library_book_tap', { book: b.id, access: b.access });
                if (readable) navigation.navigate('KathaScroll', { kathaId: b.id });
                else { try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch { /* noop */ } }
              }}
            >
              <ExpoImage source={{ uri: b.cover }} style={styles.bookThumb} contentFit="cover" transition={200} />
              <View style={{ flex: 1 }}>
                {b.access === 'free' ? (
                  <View style={styles.rowBadge}><Text style={styles.rowBadgeTxt}>FREE</Text></View>
                ) : (
                  <View style={[styles.rowBadge, { backgroundColor: theme.accentSoft }]}>
                    <Text style={[styles.rowBadgeTxt, { color: theme.accent }]}>
                      {readable ? 'YOURS' : b.access === 'soon' ? 'SOON' : (b.price ?? 'UNLOCK')}
                    </Text>
                  </View>
                )}
                <Text style={styles.rowTitle}>{b.title}</Text>
                <Text style={styles.rowSub} numberOfLines={1}>{b.subtitle ?? `${b.sceneCount} painted scenes`}</Text>
              </View>
              <Ionicons name={readable ? 'chevron-forward' : 'lock-closed'} size={readable ? 18 : 15} color="#64748b" />
            </Pressable>
          );
        })}

        {showChalisaComic(theme.key) && (
          <Pressable
            style={styles.bookRow}
            onPress={() => { track('mandir_comic_tap'); navigation.navigate('KathaScroll', { comicId: comic.id }); }}
          >
            <ExpoImage source={{ uri: comic.cover }} style={styles.bookThumb} contentFit="cover" transition={200} />
            <View style={{ flex: 1 }}>
              <View style={styles.rowBadge}><Text style={styles.rowBadgeTxt}>FREE</Text></View>
              <Text style={styles.rowTitle}>{comic.title}</Text>
              <Text style={styles.rowSub}>{comic.subtitle} — every verse, illustrated</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#64748b" />
          </Pressable>
        )}
        {!showChalisaComic(theme.key) && <View style={{ height: 14 }} />}

        {/* Films — Android only (App Review keeps video off iOS v1) */}
        {Platform.OS !== 'ios' && (
          <Pressable style={styles.teachRow} onPress={() => navigation.navigate('Films')}>
            <View style={[styles.teachIcon, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="film-outline" size={19} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Films</Text>
              <Text style={styles.rowSub}>Cinematic kathas to watch</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#64748b" />
          </Pressable>
        )}
        {Platform.OS !== 'ios' && <View style={{ height: 14 }} />}

        {/* ── WALLPAPERS ─────────────────────────────────── */}
        <SectionHead
          accent={theme.accent} title="Darshan wallpapers" sub="Free sacred art for your lock screen"
          onMore={() => navigation.navigate('Wallpapers')}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 18 }} style={{ marginBottom: 26 }}>
          {wallRail.map((wp) => (
            <Pressable key={wp.id} onPress={() => { track('mandir_wallpaper_tap', { id: wp.id }); navigation.navigate('Wallpapers'); }}>
              <ExpoImage source={{ uri: wp.thumb }} style={styles.wallThumb} contentFit="cover" transition={200} />
            </Pressable>
          ))}
          {wallRail.length === 0 && [1, 2, 3].map((i) => <View key={i} style={[styles.wallThumb, { backgroundColor: 'rgba(15,23,42,0.7)' }]} />)}
          <Pressable style={[styles.wallThumb, styles.wallMore]} onPress={() => navigation.navigate('Wallpapers')}>
            <Ionicons name="grid" size={20} color={theme.accent} />
            <Text style={[styles.wallMoreTxt, { color: theme.accent }]}>See all</Text>
          </Pressable>
        </ScrollView>

        {/* Teachings live on Path now — one link, not a copy (learning is a category) */}
        <Pressable style={styles.teachRow} onPress={() => navigation.navigate('Path' as any)}>
          <View style={[styles.teachIcon, { backgroundColor: theme.accentSoft }]}>
            <Ionicons name="school-outline" size={19} color={theme.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Teachings & courses</Text>
            <Text style={styles.rowSub}>Learn the scriptures, verse by verse — on the Path tab</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#64748b" />
        </Pressable>
        <View style={{ height: 14 }} />

        {/* ── THE IṢṬA LINE (paid, Hindu-only imagery → faith-gated) ── */}
        {showIstaLine(theme.key) && (
          <>
            <SectionHead accent={theme.accent} title="Iṣṭa collection" sub="Wallpapers of your beloved deity — own them forever" />
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
              {[
                { id: 'hanuman', name: 'Hanuman', img: `${ART}/wallpapers/packs/ista_hanuman_thumb.jpg` },
                { id: 'mahadev', name: 'Mahadev', img: `${ART}/wallpapers/packs/ista_mahadev_thumb.jpg` },
                { id: 'krishna', name: 'Krishna', img: `${ART}/wallpapers/packs/ista_krishna_thumb.jpg` },
              ].map((p) => (
                <Pressable key={p.id} style={styles.istaCard} onPress={() => onIstaTap(p.id)}>
                  <ExpoImage source={{ uri: p.img }} style={StyleSheet.absoluteFill as any} contentFit="cover" transition={200} />
                  <LinearGradient colors={['transparent', 'rgba(2,6,23,0.9)']} style={StyleSheet.absoluteFill} />
                  <View style={styles.istaLock}>
                    <Ionicons name={istaNotedMap[p.id] ? 'checkmark' : 'lock-closed'} size={11} color="#f8fafc" />
                  </View>
                  <View style={{ position: 'absolute', bottom: 10, left: 10, right: 10 }}>
                    <Text style={styles.istaName}>{p.name}</Text>
                    <Text style={styles.istaPrice}>{istaNotedMap[p.id] ? '🙏 Noted' : '4 wallpapers'}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
            <Text style={styles.istaNote}>
              {istaNoted
                ? '🙏 Noted — we will open these doors soon. Your interest shapes what we make first.'
                : 'Each pack a one-time offering — about the price of a diya — yours forever. Tap the one you want first.'}
            </Text>
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

const SectionHead: React.FC<{ accent: string; title: string; sub: string; onMore?: () => void }> = ({ accent, title, sub, onMore }) => (
  <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 }}>
    <View style={{ flex: 1 }}>
      <Text style={[styles.sectionTitle]}>{title}</Text>
      <Text style={styles.sectionSub}>{sub}</Text>
    </View>
    {onMore && (
      <Pressable onPress={onMore} hitSlop={10}>
        <Text style={{ color: accent, fontSize: 13, fontWeight: '700' }}>See all →</Text>
      </Pressable>
    )}
  </View>
);

const CARD_W = (W - 18 * 2 - 20) / 3;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  scroll: { paddingHorizontal: 18, paddingTop: 64, paddingBottom: 120 },
  kicker: { fontSize: 11, letterSpacing: 2.5, fontWeight: '800' },
  title: { fontSize: 32, color: '#f8fafc', fontFamily: 'Playfair_Bold', marginTop: 4 },
  sub: { fontSize: 13.5, color: '#94a3b8', marginTop: 6, marginBottom: 26, lineHeight: 20 },
  sectionTitle: { fontSize: 19, color: '#f8fafc', fontFamily: 'Playfair_Bold' },
  sectionSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  noticeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(15,23,42,0.55)', borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.22)', paddingHorizontal: 14, paddingVertical: 11, marginBottom: 16, marginTop: -8,
  },
  noticeTitle: { color: '#f1f5f9', fontSize: 13.5, fontWeight: '700' },
  noticeBody: { color: '#94a3b8', fontSize: 12, marginTop: 1 },
  templeCard: { height: 220, borderRadius: 20, overflow: 'hidden', marginBottom: 26, justifyContent: 'flex-end', backgroundColor: '#0b1220' },
  templeKicker: { fontSize: 10.5, letterSpacing: 1.5, fontWeight: '800', marginBottom: 2 },
  heroCard: { height: 300, borderRadius: 20, overflow: 'hidden', marginBottom: 12, justifyContent: 'flex-end', backgroundColor: '#0b1220' },
  heroInner: { padding: 16 },
  heroTitle: { color: '#f8fafc', fontSize: 24, fontFamily: 'Playfair_Bold' },
  heroSub: { color: '#cbd5e1', fontSize: 12.5, marginTop: 4, lineHeight: 18 },
  freeBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: '#16a34a', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  freeBadgeTxt: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  pillCta: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, marginTop: 10 },
  pillCtaTxt: { color: '#0b1220', fontSize: 13, fontWeight: '800' },
  bookRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(15,23,42,0.5)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(148,163,184,0.12)', padding: 10, marginBottom: 26,
  },
  bookThumb: { width: 56, height: 76, borderRadius: 10, backgroundColor: '#0b1220' },
  rowBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(22,163,74,0.2)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 3 },
  rowBadgeTxt: { color: '#4ade80', fontSize: 9.5, fontWeight: '900', letterSpacing: 1 },
  rowTitle: { color: '#f1f5f9', fontSize: 15, fontFamily: 'Playfair_Bold' },
  rowSub: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  wallThumb: { width: 96, height: 180, borderRadius: 14, backgroundColor: '#0b1220' },
  wallMore: { alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(148,163,184,0.25)' },
  wallMoreTxt: { fontSize: 12, fontWeight: '700' },
  teachRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(15,23,42,0.5)',
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(148,163,184,0.12)', padding: 13, marginBottom: 10,
  },
  teachIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  practiceCard: {
    flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', borderRadius: 16, borderWidth: 1, padding: 14, gap: 3,
  },
  practiceEmoji: { fontSize: 24, marginBottom: 6 },
  istaCard: { width: CARD_W, height: CARD_W * 1.7, borderRadius: 14, overflow: 'hidden', backgroundColor: '#0b1220' },
  istaLock: {
    position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(2,6,23,0.6)',
  },
  istaName: { color: '#f8fafc', fontSize: 14, fontFamily: 'Playfair_Bold' },
  istaPrice: { color: '#cbd5e1', fontSize: 10.5, marginTop: 1 },
  supportRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, marginTop: 26, opacity: 0.75,
  },
  supportTxt: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  istaNote: { color: '#64748b', fontSize: 11.5, marginBottom: 4, lineHeight: 16 },
});
