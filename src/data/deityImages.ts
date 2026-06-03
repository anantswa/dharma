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
    image: require('../../assets/images/deities/ganesha.jpeg'), 
  },
  {
    id: '3',
    name: 'Lord Hanuman',
    filename: 'hanuman.jpg',
    image: require('../../assets/images/deities/hanuman.jpg'), 
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
    image: require('../../assets/images/deities/krishna.jpg'), 
  },
  {
    id: '6',
    name: 'Goddess Lakshmi',
    filename: 'lakshmi.jpg',
    image: require('../../assets/images/deities/lakshmi.jpg'), 
  },
  {
    id: '7',
    name: 'Lord Shiva',
    filename: 'shiva.jpg',
    image: require('../../assets/images/deities/shiva.jpg'), 
  },
  {
    id: '8',
    name: 'Lord Ram',
    filename: 'sriram.jpg',
    image: require('../../assets/images/deities/sriram.jpg'), 
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
    image: require('../../assets/images/deities/shakyamuni.jpg'),
  },
  {
    id: '13',
    name: 'Avalokiteśvara',
    filename: 'avalokiteshvara.jpg',
    tradition: 'Buddhist',
    image: require('../../assets/images/deities/avalokiteshvara.jpg'),
  },
  {
    id: '14',
    name: 'The Buddha (Udāna)',
    filename: 'buddha_udana.jpg',
    tradition: 'Buddhist',
    image: require('../../assets/images/deities/buddha_udana.jpg'),
  },

  // ── Christian darshan (added iteration-02) ──
  {
    id: '15',
    name: 'Jesus Christ',
    filename: 'jesus_john.jpg',
    tradition: 'Christian',
    image: require('../../assets/images/deities/jesus_john.jpg'),
  },
  {
    id: '16',
    name: 'Christ the Teacher',
    filename: 'jesus_matthew.jpg',
    tradition: 'Christian',
    image: require('../../assets/images/deities/jesus_matthew.jpg'),
  },
  {
    id: '17',
    name: 'King David',
    filename: 'king_david.jpg',
    tradition: 'Christian',
    image: require('../../assets/images/deities/king_david.jpg'),
  },
  {
    id: '18',
    name: 'Archangel Gabriel',
    filename: 'gabriel.jpg',
    tradition: 'Christian',
    image: require('../../assets/images/deities/gabriel.jpg'),
  },
];

export const DEITIES = FINAL_DEITIES;