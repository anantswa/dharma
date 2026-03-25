/**
 * Static Deity Images Loader
 * Maps optimized JPEG images to their display names.
 */

export type Deity = {
  id: string;
  name: string;
  image: any;
  filename: string;
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
  {
    id: '10',
    name: 'Lord Mahavir',
    filename: 'mahavir.jpg',
    // ✅ ADDED: Ensure 'mahavir.jpg' exists
    image: require('../../assets/images/deities/mahavir.jpg'), 
  },
];

export const DEITIES = FINAL_DEITIES;