/**
 * Birth details entry — the key that personalizes every lesson.
 *
 * PRIVACY DESIGN LAW: everything entered here stays in the on-device store.
 * No network call, no analytics prop, ever. The screen says so, plainly,
 * because the promise is part of the product.
 *
 * Place: a curated city list keeps v1 dependency-free (no geocoding API —
 * that would leak the birthplace off-device). "Nearest big city" is accurate
 * enough: 1° of longitude shifts the lagna by ~4 minutes of time.
 */
import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useJyotishStore } from '../store/jyotishStore';
import { SIGNS, NAKSHATRAS } from '../services/jyotishEngine';

const GOLD = '#fbbf24';

const CITIES: { label: string; lat: number; lon: number; utcOffsetMinutes: number; dst?: boolean }[] = [
  { label: 'New Delhi, India', lat: 28.61, lon: 77.21, utcOffsetMinutes: 330 },
  { label: 'Mumbai, India', lat: 19.08, lon: 72.88, utcOffsetMinutes: 330 },
  { label: 'Kolkata, India', lat: 22.57, lon: 88.36, utcOffsetMinutes: 330 },
  { label: 'Chennai, India', lat: 13.08, lon: 80.27, utcOffsetMinutes: 330 },
  { label: 'Bengaluru, India', lat: 12.97, lon: 77.59, utcOffsetMinutes: 330 },
  { label: 'Hyderabad, India', lat: 17.39, lon: 78.49, utcOffsetMinutes: 330 },
  { label: 'Lucknow, India', lat: 26.85, lon: 80.95, utcOffsetMinutes: 330 },
  { label: 'Jaipur, India', lat: 26.91, lon: 75.79, utcOffsetMinutes: 330 },
  { label: 'Singapore', lat: 1.35, lon: 103.82, utcOffsetMinutes: 480 },
  { label: 'Dubai, UAE', lat: 25.2, lon: 55.27, utcOffsetMinutes: 240 },
  { label: 'London, UK', dst: true, lat: 51.51, lon: -0.13, utcOffsetMinutes: 0 },
  { label: 'New York, USA', dst: true, lat: 40.71, lon: -74.01, utcOffsetMinutes: -300 },
  { label: 'San Francisco, USA', dst: true, lat: 37.77, lon: -122.42, utcOffsetMinutes: -480 },
  { label: 'Toronto, Canada', dst: true, lat: 43.65, lon: -79.38, utcOffsetMinutes: -300 },
  { label: 'Sydney, Australia', dst: true, lat: -33.87, lon: 151.21, utcOffsetMinutes: 600 },
  { label: 'Kathmandu, Nepal', lat: 27.72, lon: 85.32, utcOffsetMinutes: 345 },
  { label: 'Ahmedabad, India', lat: 23.02, lon: 72.57, utcOffsetMinutes: 330 },
  { label: 'Pune, India', lat: 18.52, lon: 73.86, utcOffsetMinutes: 330 },
  { label: 'Chandigarh, India', lat: 30.73, lon: 76.78, utcOffsetMinutes: 330 },
  { label: 'Patna, India', lat: 25.59, lon: 85.14, utcOffsetMinutes: 330 },
  { label: 'Bhopal, India', lat: 23.26, lon: 77.41, utcOffsetMinutes: 330 },
  { label: 'Varanasi, India', lat: 25.32, lon: 82.99, utcOffsetMinutes: 330 },
  { label: 'Guwahati, India', lat: 26.14, lon: 91.74, utcOffsetMinutes: 330 },
  { label: 'Kochi, India', lat: 9.93, lon: 76.27, utcOffsetMinutes: 330 },
  { label: 'Srinagar, India', lat: 34.08, lon: 74.8, utcOffsetMinutes: 330 },
  { label: 'Shimla, India', lat: 31.1, lon: 77.17, utcOffsetMinutes: 330 },
  { label: 'Colombo, Sri Lanka', lat: 6.93, lon: 79.85, utcOffsetMinutes: 330 },
  { label: 'Dhaka, Bangladesh', lat: 23.81, lon: 90.41, utcOffsetMinutes: 360 },
  { label: 'Karachi, Pakistan', lat: 24.86, lon: 67.0, utcOffsetMinutes: 300 },
  { label: 'Kuala Lumpur, Malaysia', lat: 3.14, lon: 101.69, utcOffsetMinutes: 480 },
  { label: 'Hong Kong', lat: 22.32, lon: 114.17, utcOffsetMinutes: 480 },
  { label: 'Chicago, USA', dst: true, lat: 41.88, lon: -87.63, utcOffsetMinutes: -360 },
  { label: 'Houston, USA', dst: true, lat: 29.76, lon: -95.37, utcOffsetMinutes: -360 },
  { label: 'Vancouver, Canada', dst: true, lat: 49.28, lon: -123.12, utcOffsetMinutes: -480 },
  { label: 'Melbourne, Australia', dst: true, lat: -37.81, lon: 144.96, utcOffsetMinutes: 600 },
  { label: 'Auckland, NZ', dst: true, lat: -36.85, lon: 174.76, utcOffsetMinutes: 720 },
  { label: 'Port of Spain, Trinidad', lat: 10.65, lon: -61.51, utcOffsetMinutes: -240 },
  { label: 'Paramaribo, Suriname', lat: 5.85, lon: -55.2, utcOffsetMinutes: -180 },
  { label: 'Nairobi, Kenya', lat: -1.29, lon: 36.82, utcOffsetMinutes: 180 },
  { label: 'Johannesburg, SA', lat: -26.2, lon: 28.05, utcOffsetMinutes: 120 },
];

export function JyotishBirthScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { birth, setBirth, getChart } = useJyotishStore();
  const initial = birth
    ? new Date(birth.year, birth.month - 1, birth.day, birth.hour, birth.minute)
    : new Date(1990, 0, 1, 12, 0);
  // The picker's Date is only a UI vessel for its components — the birthplace
  // offset (not the phone's timezone) governs the actual UTC conversion.
  const [picked, setPicked] = useState<Date>(initial);
  // Android's picker is a dialog — it must be summoned per tap, never rendered inline.
  const [androidShow, setAndroidShow] = useState<'date' | 'time' | null>(null);
  // A saved DST birth carries base offset + 60; reopening must not silently
  // drop that hour on re-save (rotation-3 blocker).
  const savedCity = birth ? CITIES.find((c) => c.label === birth.placeLabel) : undefined;
  const [dstOn, setDstOn] = useState(
    !!(birth && savedCity && birth.utcOffsetMinutes !== savedCity.utcOffsetMinutes),
  );
  const [citySearch, setCitySearch] = useState('');
  const [cityIdx, setCityIdx] = useState(birth ? Math.max(0, CITIES.findIndex((c) => c.label === birth.placeLabel)) : -1);
  const [error, setError] = useState('');

  const shownCities = citySearch
    ? CITIES.filter((c) => c.label.toLowerCase().includes(citySearch.toLowerCase()))
    : CITIES;

  const save = () => {
    if (cityIdx < 0) { setError('Pick the nearest city to the birthplace'); return; }
    const c = CITIES[cityIdx];
    setBirth({
      year: picked.getFullYear(), month: picked.getMonth() + 1, day: picked.getDate(),
      hour: picked.getHours(), minute: picked.getMinutes(),
      // DST moves the clock one hour ahead of standard time.
      utcOffsetMinutes: c.utcOffsetMinutes + (c.dst && dstOn ? 60 : 0),
      lat: c.lat, lon: c.lon, placeLabel: c.label,
    });
    setError('');
    navigation.goBack();
  };

  const chart = getChart();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 14, padding: 20, paddingBottom: 60 }}>
        <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Back</Text></Pressable>
        <Text style={styles.title}>Your birth sky</Text>
        <Text style={styles.sub}>
          Three facts pin the sky at your first breath. They are computed on this phone and stored only on this phone —
          never uploaded, never in analytics, deletable any time.
        </Text>

        <Text style={styles.label}>Birth date</Text>
        {Platform.OS === 'ios' ? (
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={picked} mode="date" display="spinner"
              themeVariant="dark" maximumDate={new Date()}
              onChange={(_, d) => d && setPicked((prev) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), prev.getHours(), prev.getMinutes()))}
            />
          </View>
        ) : (
          <Pressable style={styles.input} onPress={() => setAndroidShow('date')}>
            <Text style={{ color: '#f8fafc', fontSize: 17 }}>
              {picked.getFullYear()}-{String(picked.getMonth() + 1).padStart(2, '0')}-{String(picked.getDate()).padStart(2, '0')}
            </Text>
          </Pressable>
        )}

        <Text style={styles.label}>Birth time (local at birthplace)</Text>
        {Platform.OS === 'ios' ? (
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={picked} mode="time" display="spinner"
              themeVariant="dark"
              onChange={(_, d) => d && setPicked((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate(), d.getHours(), d.getMinutes()))}
            />
          </View>
        ) : (
          <Pressable style={styles.input} onPress={() => setAndroidShow('time')}>
            <Text style={{ color: '#f8fafc', fontSize: 17 }}>
              {String(picked.getHours()).padStart(2, '0')}:{String(picked.getMinutes()).padStart(2, '0')}
            </Text>
          </Pressable>
        )}
        {androidShow && (
          <DateTimePicker
            value={picked} mode={androidShow} display="default" maximumDate={androidShow === 'date' ? new Date() : undefined}
            onChange={(_, d) => {
              setAndroidShow(null);
              if (!d) return;
              setPicked((prev) => androidShow === 'date'
                ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), prev.getHours(), prev.getMinutes())
                : new Date(prev.getFullYear(), prev.getMonth(), prev.getDate(), d.getHours(), d.getMinutes()));
            }}
          />
        )}
        <Text style={styles.hint}>Not sure of the time? Use your best guess — the Moon's sign is usually stable across a day; the lagna is what shifts.</Text>

        <Text style={styles.label}>Nearest city to the birthplace</Text>
        <TextInput value={citySearch} onChangeText={setCitySearch} placeholder="Search cities…"
          placeholderTextColor="#475569" style={[styles.input, { marginBottom: 10 }]} />
        <View style={styles.cityWrap}>
          {shownCities.map((c) => {
            const i = CITIES.indexOf(c);
            return (
            <Pressable key={c.label} onPress={() => setCityIdx(i)}
              style={[styles.city, cityIdx === i && styles.cityOn]}>
              <Text style={[styles.cityTxt, cityIdx === i && { color: '#0b1220', fontWeight: '700' }]}>{c.label}</Text>
            </Pressable>
          ); })}
        </View>

        {cityIdx >= 0 && CITIES[cityIdx].dst && (
          <Pressable style={styles.dstRow} onPress={() => setDstOn((v) => !v)}>
            <View style={[styles.dstBox, dstOn && { backgroundColor: GOLD, borderColor: GOLD }]}>
              {dstOn && <Text style={{ color: '#0b1220', fontSize: 12, fontWeight: '700' }}>✓</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#e2e8f0', fontSize: 13.5 }}>Daylight saving was in effect at birth</Text>
              <Text style={styles.hint}>This city shifts its clock in summer. A wrong hour can move the lagna a whole sign — check if unsure. (India never uses DST.)</Text>
            </View>
          </Pressable>
        )}
        {!!error && <Text style={styles.err}>{error}</Text>}
        <Pressable style={styles.cta} onPress={save}><Text style={styles.ctaTxt}>Cast my sky</Text></Pressable>

        {chart && (
          <Pressable onPress={() => { setBirth(null); setCityIdx(-1); }}>
            <Text style={styles.forget}>Forget my birth details</Text>
          </Pressable>
        )}

        {chart && (
          <View style={styles.preview}>
            <Text style={styles.previewKicker}>CURRENTLY CAST</Text>
            <Text style={styles.previewTxt}>
              Moon in {SIGNS[chart.grahas[1].sign]} · {NAKSHATRAS[chart.moonNakshatra]} · {SIGNS[chart.ascSign]} rising
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  back: { color: '#94a3b8', fontSize: 15, marginBottom: 10 },
  title: { fontSize: 28, fontFamily: 'Playfair_Bold', color: '#f8fafc' },
  sub: { fontSize: 13.5, color: '#94a3b8', marginTop: 6, lineHeight: 20 },
  label: { color: GOLD, fontSize: 11, letterSpacing: 1.5, marginTop: 22, marginBottom: 8 },
  input: { backgroundColor: '#0b1220', borderWidth: 1, borderColor: 'rgba(148,163,184,.25)', borderRadius: 12, color: '#f8fafc', fontSize: 17, padding: 13 },
  hint: { color: '#64748b', fontSize: 11.5, marginTop: 6, lineHeight: 16 },
  cityWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  city: { backgroundColor: '#0b1220', borderWidth: 1, borderColor: 'rgba(148,163,184,.25)', borderRadius: 18, paddingVertical: 7, paddingHorizontal: 12 },
  cityOn: { backgroundColor: GOLD, borderColor: GOLD },
  cityTxt: { color: '#cbd5e1', fontSize: 12.5 },
  err: { color: '#f87171', marginTop: 14, fontSize: 13 },
  cta: { backgroundColor: GOLD, borderRadius: 14, paddingVertical: 15, marginTop: 22 },
  ctaTxt: { color: '#0b1220', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  forget: { color: '#64748b', textAlign: 'center', marginTop: 16, fontSize: 13, textDecorationLine: 'underline' },
  dstRow: { flexDirection: 'row', gap: 10, marginTop: 18, alignItems: 'flex-start' },
  dstBox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: 'rgba(148,163,184,.5)', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  pickerWrap: { backgroundColor: '#0b1220', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(148,163,184,.2)', alignItems: 'center', paddingVertical: Platform.OS === 'ios' ? 0 : 8 },
  preview: { marginTop: 22, backgroundColor: '#0f1a33', borderRadius: 12, padding: 14 },
  previewKicker: { color: GOLD, fontSize: 10, letterSpacing: 1.6, marginBottom: 5 },
  previewTxt: { color: '#e2e8f0', fontSize: 14, lineHeight: 20 },
});
