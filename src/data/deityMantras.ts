/**
 * Deity → mantra registry.
 *
 * Mirrors the `Music/Studies/NN_<slug>` folder taxonomy on the Drive, so every
 * finished chant render drops straight into a slot here (key === folder slug ===
 * storage key in the `dharma-audio/mantras/` bucket).
 *
 * CANON — Films/research/music_canon.md, "the authentic mantra chant" (Anant, 2026-06-02):
 *   • ONLY the canonical mantra words, repeated — nothing added.
 *   • Devanagari for pronunciation (the practitioner must say each syllable right).
 *   • slow, breath-paced, monastery locus; a SEAMLESS steady-state loop — no build,
 *     no crescendo, even level, warm tone — it must recede and never tire the listener.
 *   • famous mantras trip Suno's filter, so the real chant is Anant's Suno-app
 *     ear-pick → dropped into Music/Studies/NN_<slug>/ → loop-engined + uploaded.
 *
 * The app reads the LIVE manifest (`dharma-audio/mantras/catalog.json`: key → url),
 * so a deity's chant appears the moment its folder is filled — no app update needed.
 * Until then the deity falls back to the universal Om, so the toggle always sings.
 */
export type Mantra = {
  /** Drive folder slug === manifest key === storage object name. */
  key: string;
  /** Devanagari — what the practitioner reads. */
  deva: string;
  /** Transliteration — display only. */
  trans: string;
  /** Scripture / tradition. */
  source: string;
};

/** Universal fallback — every deity has *a* chant even before its own is finished. */
export const UNIVERSAL_OM: Mantra = {
  key: 'om',
  deva: 'ॐ',
  trans: 'Om',
  source: 'Praṇava — the primordial sound',
};

const M = {
  ganapati: { key: 'om_gam_ganapataye_namah', deva: 'ॐ गं गणपतये नमः', trans: 'Om Gaṃ Gaṇapataye Namaḥ', source: 'Gaṇapati mūla mantra' },
  shiva: { key: 'om_namah_shivaya', deva: 'ॐ नमः शिवाय', trans: 'Om Namaḥ Śivāya', source: 'Pañcākṣara · Yajurveda' },
  vasudeva: { key: 'om_namo_bhagavate_vasudevaya', deva: 'ॐ नमो भगवते वासुदेवाय', trans: 'Om Namo Bhagavate Vāsudevāya', source: 'Viṣṇu Purāṇa' },
  ram: { key: 'om_sri_ram_jaya_ram', deva: 'ॐ श्री राम जय राम जय जय राम', trans: 'Om Śrī Rāma Jaya Rāma', source: 'Rāma tāraka mantra' },
  hanuman: { key: 'om_ham_hanumate_namah', deva: 'ॐ हं हनुमते नमः', trans: 'Om Haṃ Hanumate Namaḥ', source: 'Hanumān bīja mantra' },
  lakshmi: { key: 'om_shreem_mahalakshmiyei', deva: 'ॐ श्रीं महालक्ष्म्यै नमः', trans: 'Om Śrīṃ Mahālakṣmyai Namaḥ', source: 'Lakṣmī bīja mantra · Śāradā-tilaka / Mantra-mahodadhi' },
  devi: { key: 'navarna_chamundayai', deva: 'ॐ ऐं ह्रीं क्लीं चामुण्डायै विच्चे', trans: 'Om Aiṃ Hrīṃ Klīṃ Cāmuṇḍāyai Vicce', source: 'Navārṇa · Devī Māhātmya' },
  manipadme: { key: 'om_mani_padme_hum', deva: 'ॐ मणि पद्मे हूँ', trans: 'Om Maṇi Padme Hūṃ', source: 'Avalokiteśvara / Chenrezig' },
  shakyamuni: { key: 'shakyamuni', deva: 'ॐ मुनि मुनि महामुनये स्वाहा', trans: 'Om Muni Muni Mahāmunaye Svāhā', source: 'Śākyamuni Buddha mantra' },
  refuge: { key: 'buddham_saranam', deva: 'बुद्धं शरणं गच्छामि', trans: 'Buddhaṃ Saraṇaṃ Gacchāmi', source: 'Triple Refuge' },
  // new calibrated-register roster
  saraswati: { key: 'om_aim_saraswatyai_namah', deva: 'ॐ ऐं सरस्वत्यै नमः', trans: 'Om Aiṃ Sarasvatyai Namaḥ', source: 'Sarasvatī mantra' },
  kali: { key: 'om_krim_kalyai_namah', deva: 'ॐ क्रीं कालिकायै नमः', trans: 'Om Krīṃ Kālikāyai Namaḥ', source: 'Kālī bīja mantra' },
  kartikeya: { key: 'om_sharavanabhavaya_namah', deva: 'ॐ शरवणभवाय नमः', trans: 'Om Śaravaṇabhavāya Namaḥ', source: 'Kārtikeya / Murugan mantra' },
  venkateswara: { key: 'om_namo_venkateshaya', deva: 'ॐ नमो वेङ्कटेशाय', trans: 'Om Namo Veṅkaṭeśāya', source: 'Veṅkaṭeśvara mantra' },
  surya: { key: 'om_suryaya_namah', deva: 'ॐ सूर्याय नमः', trans: 'Om Sūryāya Namaḥ', source: 'Sūrya mantra' },
  brahma: { key: 'om_brahmane_namah', deva: 'ॐ ब्रह्मणे नमः', trans: 'Om Brahmaṇe Namaḥ', source: 'Brahmā mantra' },
  greentara: { key: 'om_tare_tuttare_ture_soha', deva: 'ॐ तारे तुत्तारे तुरे स्वाहा', trans: 'Om Tāre Tuttāre Ture Svāhā', source: 'Green Tārā' },
  whitetara: { key: 'om_tare_white', deva: 'ॐ तारे तुत्तारे तुरे मम आयुः पुण्य ज्ञान पुष्टिं कुरु स्वाहा', trans: 'Om Tāre Tuttāre Ture Mama Āyuḥ… Svāhā', source: 'White Tārā' },
  padmasambhava: { key: 'om_ah_hung_vajra_guru', deva: 'ॐ आः हूँ वज्र गुरु पद्म सिद्धि हूँ', trans: 'Om Āḥ Hūṃ Vajra Guru Padma Siddhi Hūṃ', source: 'Vajra Guru mantra' },
  amitabha: { key: 'om_ami_dewa_hrih', deva: 'ॐ अमि देव ह्रीः', trans: 'Om Ami Dewa Hrīḥ', source: 'Amitābha mantra' },
  manjushri: { key: 'om_a_ra_pa_ca_na_dhih', deva: 'ॐ अ र प च न धीः', trans: 'Om A Ra Pa Ca Na Dhīḥ', source: 'Mañjuśrī wisdom mantra' },
  medicine: { key: 'bhaisajyaguru', deva: 'ॐ भैषज्ये भैषज्ये महाभैषज्ये राज समुद्गते स्वाहा', trans: 'Om Bhaiṣajye Bhaiṣajye Mahābhaiṣajye…', source: 'Medicine Buddha mantra' },
} satisfies Record<string, Mantra>;

/** Reverse lookup (incl. the universal Om) — caption whatever key is actually playing. */
export const MANTRA_BY_KEY: Record<string, Mantra> = Object.fromEntries(
  [UNIVERSAL_OM, ...Object.values(M)].map((m) => [m.key, m]),
);

/** keyword (in deity name, lowercased) → mantra. First match wins; order matters. */
const RULES: { match: string[]; mantra: Mantra }[] = [
  { match: ['ganesh'], mantra: M.ganapati },
  { match: ['shiva', 'mahadev'], mantra: M.shiva },
  { match: ['venkat', 'balaji'], mantra: M.venkateswara },          // before krishna/vishnu
  { match: ['krishna', 'vishnu', 'vasudev', 'radha'], mantra: M.vasudeva },
  { match: ['ram'], mantra: M.ram },
  { match: ['hanuman'], mantra: M.hanuman },
  { match: ['lakshmi'], mantra: M.lakshmi },
  { match: ['saraswati', 'sarasvati'], mantra: M.saraswati },
  { match: ['kali', 'kālī'], mantra: M.kali },                      // before generic Devi
  { match: ['kartikeya', 'murugan', 'skanda'], mantra: M.kartikeya },
  { match: ['surya', 'sūrya'], mantra: M.surya },
  { match: ['brahma'], mantra: M.brahma },
  { match: ['devi', 'durga', 'parvati'], mantra: M.devi },
  // Buddhist
  { match: ['avalokite', 'chenrezig'], mantra: M.manipadme },
  { match: ['white tārā', 'white tara'], mantra: M.whitetara },     // before generic Tārā
  { match: ['tārā', 'tara'], mantra: M.greentara },
  { match: ['padmasambhava', 'guru rinpoche'], mantra: M.padmasambhava },
  { match: ['amitābha', 'amitabha'], mantra: M.amitabha },
  { match: ['mañju', 'manjushri', 'manjusri'], mantra: M.manjushri },
  { match: ['medicine', 'bhaisajya', 'bhaiṣajya'], mantra: M.medicine }, // before generic buddha
  { match: ['shakyamuni'], mantra: M.shakyamuni },
  { match: ['buddha'], mantra: M.refuge },
];

/** The mantra a deity *should* chant (by name). Audio availability resolved separately. */
export function mantraForDeity(name: string | undefined): Mantra {
  const n = (name || '').toLowerCase();
  for (const r of RULES) if (r.match.some((m) => n.includes(m))) return r.mantra;
  return UNIVERSAL_OM;
}

/**
 * Resolve the actual chant to play for a deity, given the live manifest.
 * Prefers the deity's own mantra; falls back to the universal Om; else nothing.
 */
export function resolveChant(
  name: string | undefined,
  manifest: Record<string, string>,
): { mantra: Mantra; url: string } | null {
  const wanted = mantraForDeity(name);
  if (manifest[wanted.key]) return { mantra: wanted, url: manifest[wanted.key] };
  if (manifest[UNIVERSAL_OM.key]) return { mantra: UNIVERSAL_OM, url: manifest[UNIVERSAL_OM.key] };
  return null;
}
