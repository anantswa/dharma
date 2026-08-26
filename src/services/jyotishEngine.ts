/**
 * On-device sidereal (Lahiri) chart engine for the Jyotish module.
 *
 * DESIGN LAW (privacy): birth data enters this module and never leaves the
 * device. No analytics event may carry date, time, place, or any computed
 * chart value. See jyotishStore.
 *
 * Math: astronomy-engine (pure JS, arcminute-class accuracy) for tropical
 * ecliptic longitudes; classical mean-node formula for Rāhu; standard
 * ascendant trigonometry from local sidereal time. Sidereal = tropical −
 * Lahiri ayanāṁśa (linear model, <0.05° error this century — far inside a
 * 13°20' nakshatra or 30° rāśi).
 *
 * Validated against the Swiss-Ephemeris reference implementation
 * (Agentic-dharmaweave/lab/jyotish_engine.py) — see scripts/verify_jyotish.js.
 * Do not re-derive formulas from blogs (brief rule).
 */
import * as Astronomy from 'astronomy-engine';

export const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra',
  'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'] as const;
export const SIGNS_DEV = ['मेष', 'वृष', 'मिथुन', 'कर्क', 'सिंह', 'कन्या', 'तुला',
  'वृश्चिक', 'धनु', 'मकर', 'कुंभ', 'मीन'] as const;
export const NAKSHATRAS = ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta',
  'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'] as const;
/** Vimshottari lord cycle — nakshatra i has lord NAK_LORDS[i % 9]. The mod-9 pattern IS the curriculum. */
export const NAK_LORDS = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'] as const;
export const DASHA_YEARS: Record<string, number> = {
  Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17,
};

export type GrahaName = 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn' | 'Rahu' | 'Ketu';
export type GrahaPos = { graha: GrahaName; lon: number; sign: number; degInSign: number; nakshatra: number; pada: number };
export type Chart = {
  ascSign: number;            // 0-11, sidereal lagna sign
  ascLon: number;
  grahas: GrahaPos[];
  moonNakshatra: number;      // 0-26
  moonPada: number;           // 1-4
  firstDashaLord: string;     // Vimshottari start from Moon's nakshatra
  ayanamsa: number;
};

const DEG = Math.PI / 180;
const norm = (x: number) => ((x % 360) + 360) % 360;

/** Lahiri ayanāṁśa, linear model anchored at J2000 = 23.85675°, 50.2888″/yr. */
export function lahiriAyanamsa(date: Date): number {
  const years = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / (365.2425 * 86400e3);
  return 23.85675 + (50.2888 / 3600) * years;
}

/** Mean lunar ascending node (Rāhu), classical polynomial. */
function meanNode(date: Date): number {
  const d = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 86400e3;
  return norm(125.04452 - 0.05295377 * d);
}

function tropicalLon(body: Astronomy.Body, date: Date): number {
  // Geocentric ecliptic longitude of date (matches swisseph default frame).
  const vec = Astronomy.GeoVector(body, date, true);
  return Astronomy.Ecliptic(vec).elon;
}

function tropicalAscendant(date: Date, latDeg: number, lonDeg: number): number {
  const gst = Astronomy.SiderealTime(date);          // hours
  const ramc = norm((gst * 15) + lonDeg);            // RA of MC in degrees
  const eps = 23.4367 * DEG;
  const phi = latDeg * DEG;
  const r = ramc * DEG;
  // λ_asc = atan2( −cos RAMC, sin RAMC·cos ε + tan φ·sin ε )
  const asc = Math.atan2(Math.cos(r), -(Math.sin(r) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)));
  return norm(asc / DEG);
}

const at = (lon: number) => ({
  sign: Math.floor(norm(lon) / 30),
  degInSign: norm(lon) % 30,
  nakshatra: Math.floor(norm(lon) / (360 / 27)),
  pada: Math.floor((norm(lon) % (360 / 27)) / (360 / 108)) + 1,
});

/**
 * Cast a sidereal chart. `utcDate` must already be in UTC (caller converts
 * from local birth time using the birthplace's UTC offset).
 */
export function castChart(utcDate: Date, latDeg: number, lonDeg: number): Chart {
  const aya = lahiriAyanamsa(utcDate);
  const sid = (trop: number) => norm(trop - aya);

  const bodies: [GrahaName, Astronomy.Body][] = [
    ['Sun', Astronomy.Body.Sun], ['Moon', Astronomy.Body.Moon], ['Mars', Astronomy.Body.Mars],
    ['Mercury', Astronomy.Body.Mercury], ['Jupiter', Astronomy.Body.Jupiter],
    ['Venus', Astronomy.Body.Venus], ['Saturn', Astronomy.Body.Saturn],
  ];
  const grahas: GrahaPos[] = bodies.map(([name, body]) => {
    const lon = sid(tropicalLon(body, utcDate));
    return { graha: name, lon, ...at(lon) };
  });
  const rahu = sid(meanNode(utcDate));
  grahas.push({ graha: 'Rahu', lon: rahu, ...at(rahu) });
  const ketu = norm(rahu + 180);
  grahas.push({ graha: 'Ketu', lon: ketu, ...at(ketu) });

  const ascLon = sid(tropicalAscendant(utcDate, latDeg, lonDeg));
  const moon = grahas[1];
  return {
    ascSign: Math.floor(ascLon / 30),
    ascLon,
    grahas,
    moonNakshatra: moon.nakshatra,
    moonPada: moon.pada,
    firstDashaLord: NAK_LORDS[moon.nakshatra % 9],
    ayanamsa: aya,
  };
}
