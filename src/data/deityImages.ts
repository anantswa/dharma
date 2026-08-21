/**
 * Static Deity Images Loader
 * Maps optimized JPEG images to their display names.
 */

export type Deity = {
  id: string;
  name: string;
  image: any;
  filename: string;
  tradition?: string;
};

/** Streamed deity art (uploaded to dharma-art/deities/). Keeps the binary light. */
const ART = (slug: string) => ({
  uri: `https://dharmaweave.com/cdn/dharma-art/deities/${slug}.jpg`,
});

export const FINAL_DEITIES: Deity[] = [
  {
    id: '1',
    name: 'Goddess Devi',
    filename: 'devi.jpeg',
    image: require('../../assets/images/deities/devi.jpeg'), 
  },
  {
    id: '2',
    name: 'Lord Ganesha',
    filename: 'ganesha.jpeg',
    image: ART('ganesha'),
  },
  {
    id: '3',
    name: 'Lord Hanuman',
    filename: 'hanuman.jpg',
    image: ART('hanuman'),
  },
  {
    id: '4',
    name: 'Lord Hanuman (Sunset)',
    filename: 'hanuman_sunset.jpg',
    image: require('../../assets/images/deities/hanuman_sunset.jpg'), 
  },
  {
    id: '5',
    name: 'Lord Krishna',
    filename: 'krishna.jpg',
    // ✅ UNCOMMENTED: Ensure 'krishna.jpg' is in the folder
    image: ART('krishna'),
  },
  {
    id: '6',
    name: 'Goddess Lakshmi',
    filename: 'lakshmi.jpg',
    image: ART('lakshmi'),
  },
  {
    id: '7',
    name: 'Lord Shiva',
    filename: 'shiva.jpg',
    image: ART('shiva'),
  },
  {
    id: '8',
    name: 'Lord Ram',
    filename: 'sriram.jpg',
    image: ART('rama'),
  },
  {
    id: '9',
    name: 'Lord Buddha',
    filename: 'buddha.jpg',
    // ✅ ADDED: Ensure 'buddha.jpg' exists
    image: require('../../assets/images/deities/buddha.jpg'), 
  },

  // ── Buddhist darshan (added iteration-02) ──
  {
    id: '11',
    name: 'The Buddha',
    filename: 'buddha_dhammapada.jpg',
    tradition: 'Buddhist',
    image: require('../../assets/images/deities/buddha_dhammapada.jpg'),
  },
  {
    id: '12',
    name: 'Shakyamuni Buddha',
    filename: 'shakyamuni.jpg',
    tradition: 'Buddhist',
    image: ART('buddha'),
  },
  {
    id: '13',
    name: 'Avalokiteśvara',
    filename: 'avalokiteshvara.jpg',
    tradition: 'Buddhist',
    image: ART('avalokiteshvara'),
  },
  {
    id: '14',
    name: 'The Buddha (Udāna)',
    filename: 'buddha_udana.jpg',
    tradition: 'Buddhist',
    image: require('../../assets/images/deities/buddha_udana.jpg'),
  },

  // ── New calibrated-register set (streamed from dharma-art/deities/, 2026-06-04) ──
  // Hindu
  { id: '20', name: 'Lord Vishnu',        filename: 'vishnu.jpg',        tradition: 'Hindu', image: ART('vishnu') },
  { id: '21', name: 'Lord Brahma',        filename: 'brahma.jpg',        tradition: 'Hindu', image: ART('brahma') },
  { id: '22', name: 'Goddess Saraswati',  filename: 'saraswati.jpg',     tradition: 'Hindu', image: ART('saraswati') },
  { id: '23', name: 'Goddess Kali',       filename: 'kali.jpg',          tradition: 'Hindu', image: ART('kali') },
  { id: '24', name: 'Goddess Parvati',    filename: 'parvati.jpg',       tradition: 'Hindu', image: ART('parvati') },
  { id: '25', name: 'Lord Kartikeya',     filename: 'kartikeya.jpg',     tradition: 'Hindu', image: ART('kartikeya') },
  { id: '26', name: 'Radha-Krishna',      filename: 'radha_krishna.jpg', tradition: 'Hindu', image: ART('radha_krishna') },
  { id: '27', name: 'Lord Venkateswara',  filename: 'venkateswara.jpg',  tradition: 'Hindu', image: ART('venkateswara') },
  { id: '28', name: 'Surya Dev',          filename: 'surya.jpg',         tradition: 'Hindu', image: ART('surya') },
  // Buddhist
  { id: '30', name: 'Green Tārā',         filename: 'green_tara.jpg',     tradition: 'Buddhist', image: ART('green_tara') },
  { id: '31', name: 'White Tārā',         filename: 'white_tara.jpg',     tradition: 'Buddhist', image: ART('white_tara') },
  { id: '32', name: 'Padmasambhava',      filename: 'padmasambhava.jpg',  tradition: 'Buddhist', image: ART('padmasambhava') },
  { id: '33', name: 'Medicine Buddha',    filename: 'medicine_buddha.jpg', tradition: 'Buddhist', image: ART('medicine_buddha') },
  { id: '34', name: 'Amitābha',           filename: 'amitabha.jpg',       tradition: 'Buddhist', image: ART('amitabha') },
  { id: '35', name: 'Mañjuśrī',           filename: 'manjushri.jpg',      tradition: 'Buddhist', image: ART('manjushri') },
];

export const DEITIES = FINAL_DEITIES;