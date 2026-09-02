/**
 * Iṣṭa-devatā chooser — the one identity choice in the app.
 *
 * On-device only (preferencesStore, no account), reversible, never prompted
 * twice. Choosing an iṣṭa re-orders the temple entry, the japa mantra and the
 * wallpaper rail toward YOUR deity — "my Hanuman temple", not a gallery.
 * Answers the strongest demand signal in the analytics (repeat iṣṭa-teaser
 * taps) without a paywall: the choice is free; only the art packs are goods.
 */
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { darshanDeities } from '../data/faiths';
import { usePreferencesStore } from '../store/preferencesStore';
import { track } from '../services/analytics';

const GOLD = '#fbbf24';

export const IstaPicker: React.FC<{ accent?: string }> = ({ accent = GOLD }) => {
  const primary = usePreferencesStore((s) => s.primaryTradition);
  const ista = usePreferencesStore((s) => s.ista);
  const [open, setOpen] = useState(false);
  const list = darshanDeities(primary);
  const chosen = list.find((d) => d.id === ista);

  const choose = (id?: string) => {
    usePreferencesStore.getState().setIsta(id);
    if (id) track('ista_chosen', { deity: id });
    setOpen(false);
  };

  return (
    <>
      <Pressable style={styles.row} onPress={() => setOpen(true)}>
        {chosen
          ? <ExpoImage source={chosen.image} style={styles.thumb} contentFit="cover" />
          : <View style={[styles.thumb, styles.thumbEmpty]}><Text style={{ fontSize: 18 }}>🪷</Text></View>}
        <View style={{ flex: 1 }}>
          <Text style={[styles.kicker, { color: accent }]}>IṢṬA-DEVATĀ</Text>
          <Text style={styles.title}>
            {chosen ? chosen.name : 'Choose the deity of your heart'}
          </Text>
          <Text style={styles.sub}>
            {chosen
              ? 'Your temple, japa and wallpapers follow them. Tap to change.'
              : 'The temple, japa and wallpapers will follow your choice — private, on this device only.'}
          </Text>
        </View>
        <Text style={{ color: '#64748b', fontSize: 18 }}>›</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.sheetWrap}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Your iṣṭa-devatā</Text>
            <Text style={styles.sheetSub}>
              A private choice, kept on this device. You can change it any time.
            </Text>
            <ScrollView contentContainerStyle={styles.grid}>
              {list.map((d) => (
                <Pressable key={d.id} style={styles.cell} onPress={() => choose(d.id)}>
                  <ExpoImage source={d.image} style={[styles.cellImg, ista === d.id && { borderColor: accent, borderWidth: 2 }]} contentFit="cover" />
                  <Text style={styles.cellName} numberOfLines={1}>{d.name.replace(/^(Lord|Goddess)\s+/, '')}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {!!ista && (
                <Pressable style={styles.clearBtn} onPress={() => choose(undefined)}>
                  <Text style={{ color: '#94a3b8', fontSize: 14 }}>No iṣṭa</Text>
                </Pressable>
              )}
              <Pressable style={[styles.closeBtn, { backgroundColor: accent }]} onPress={() => setOpen(false)}>
                <Text style={{ color: '#0b1220', fontWeight: '700', fontSize: 14 }}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(15,23,42,0.75)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(148,163,184,0.14)', padding: 12, marginBottom: 14,
  },
  thumb: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#1e293b' },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  kicker: { fontSize: 10.5, letterSpacing: 1.4, fontWeight: '700' },
  title: { color: '#f1f5f9', fontSize: 15.5, fontWeight: '600', marginTop: 1 },
  sub: { color: '#64748b', fontSize: 11.5, marginTop: 2, lineHeight: 15 },
  sheetWrap: { flex: 1, backgroundColor: 'rgba(2,6,23,0.72)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0f172a', borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: 20, maxHeight: '82%',
  },
  sheetTitle: { color: '#f8fafc', fontSize: 20, fontWeight: '700' },
  sheetSub: { color: '#94a3b8', fontSize: 13, marginTop: 4, marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 16 },
  cell: { width: '30%', alignItems: 'center' },
  cellImg: { width: '100%', aspectRatio: 0.8, borderRadius: 12, backgroundColor: '#1e293b' },
  cellName: { color: '#cbd5e1', fontSize: 12, marginTop: 5 },
  clearBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(148,163,184,0.3)' },
  closeBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12 },
});
