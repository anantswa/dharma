# Dharma

**A daily spiritual companion across Hindu, Sikh, Buddhist, Jain, and Zen traditions.**

Part of the [DharmaWeave](https://play.google.com/store/books/author?id=Anant+Swarup) ecosystem.

## Features

### Temple Darshan (Home)
Swipeable deity carousel with 10 deities across traditions. Interactive aarti plate, shankh audio loop, and devotional music player. A digital temple experience you can carry in your pocket.

### Sacred Calendar
150+ festivals and observances for 2026-2027 across Hindu, Buddhist, Jain, and Sikh traditions. Tap any event to learn its significance, rituals, and spiritual meaning.

### Wisdom Library
150+ teachings from the Bhagavad Gita, Guru Granth Sahib, Dhammapada, Tattvartha Sutra, and Zen masters. Filter by tradition. Each teaching includes the original transliteration and English translation.

### Learn
Interactive lesson modules starting with the Hanuman Chalisa (43 verses). Each lesson includes Hindi text, transliteration, English meaning, and associated imagery. Bhagavad Gita module coming soon.

### DharmaWeave Store
Links to the DharmaWeave ecosystem including books on Google Play and chants on Spotify.

### Daily Wisdom Notifications
Configurable daily reminders with tradition-filtered wisdom quotes.

## Tech Stack

- **React Native** 0.81 + **Expo** SDK 54
- **TypeScript** with Playfair Display typography
- **Zustand** for state management with AsyncStorage persistence
- **Expo AV** for devotional audio playback
- **React Navigation** (bottom tabs + native stack)
- **Offline-first** -- no backend required

## Design Language

Dark theme (#020617), saffron/gold accents (#fbbf24), Playfair Display font, glass morphism cards with blur effects.

## Getting Started

```bash
npm install
npx expo start --web
```

## Multi-Tradition Representation

Dharma serves five traditions equally:
- **Hindu**: Bhagavad Gita, Upanishads, Yoga Sutras, festivals, Ekadashi calendar
- **Sikh**: Guru Granth Sahib, Japji Sahib, all Gurpurabs, Baisakhi
- **Buddhist**: Dhammapada, Heart Sutra, Vesak, Asalha Puja, Bodhi Day
- **Jain**: Tattvartha Sutra, Mahavir Jayanti, Paryushana, Das Lakshan
- **Zen**: Platform Sutra, Gateless Gate, Blue Cliff Record

## Project Structure

```
src/
  screens/       # 13 screens
  components/    # Reusable UI (GlassCard, AartiPlate, MusicPlayer, etc.)
  data/          # Wisdom teachings, calendar events, lesson content
  services/      # Audio, notifications, shankh audio
  store/         # Zustand stores (preferences, premium, progress, music)
  navigation/    # React Navigation setup
assets/
  audio/         # Devotional audio tracks
  images/        # Deity images, lesson images, community photos
```

## Build

```bash
# EAS Build for Android APK
npx eas build -p android --profile preview

# Production builds
npx eas build -p android --profile production
npx eas build -p ios --profile production
```

## Credits

Built by **Anant Swarup** with contributions from Manisha and Kashyap.

## License

All rights reserved.
