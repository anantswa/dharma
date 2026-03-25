/**
 * Devotional audio tracks for meditation and prayer
 * Contains sacred mantras and devotional music
 */

export type DevotionalTrack = {
  id: string;
  title: string;
  subtitle: string;
  deity: string;
  audioUrl: any;
  duration?: number;
};

export const DEVOTIONAL_TRACKS: DevotionalTrack[] = [
  {
    id: '1',
    title: 'Omm and Bells',
    subtitle: 'Om with Celestial Bells',
    deity: 'Universal',
    // FIX: Exact case match "Omm_and_Bells.wav"
    audioUrl: require('../../assets/audio/devotional/Omm_and_Bells.wav'),
    duration: 240, 
  },
  {
    id: '2',
    title: 'Shankh Om and Bells',
    subtitle: 'Sacred Conch with Mantras',
    deity: 'Shiva',
    // FIX: Exact case match "Shankh_Om_and_Bells.wav"
    audioUrl: require('../../assets/audio/devotional/Shankh_Om_and_Bells.wav'),
    duration: 300, 
  },
  {
    id: '3',
    title: 'Shankh Twice',
    subtitle: 'Divine Conch Sounds',
    deity: 'Universal',
    // FIX: Exact case match "Shankh_twice.wav"
    audioUrl: require('../../assets/audio/devotional/Shankh_twice.wav'),
    duration: 120, 
  },
];