# Aarti Plate Image Setup

## 📍 Location
Place your aarti plate image here:
```
assets/images/rituals/aarti.png
```

## 🎨 Image Requirements

### Format
- **File type**: PNG
- **Background**: Transparent (alpha channel)
- **Orientation**: Top-down view (as if looking down at the plate)

### Dimensions
- **Recommended size**: 512x512 px or 1024x1024 px
- **Aspect ratio**: 1:1 (square)
- The component will scale it to 120x120 dp on screen

### Visual Guidelines
- Round brass aarti plate (thali) with diya/lamp
- Traditional design with visible details
- Warm, golden brass color
- Should look devotional and authentic
- Visible decorative patterns on the rim (optional)

## 🔧 Component Configuration

The plate appears at the bottom-center of the HomeScreen and can be:
- Dragged in any direction with your finger
- Has weighted, smooth movement (not instant)
- Returns to bottom-center position when released
- Has a subtle lift effect when touched

### Adjusting Plate Properties

To modify the aarti plate behavior, edit these constants in:
`src/components/AartiPlate.tsx`

```typescript
const PLATE_SIZE = 120;        // Size in dp (default: 120)
const INITIAL_BOTTOM = 80;     // Distance from bottom (default: 80)
const LIFT_SCALE = 1.05;       // Scale when lifted (default: 1.05)
const LIFT_TRANSLATION = -4;   // Upward movement when touched (default: -4px)
```

### Spring Animation Tuning

For devotional feel, adjust the spring configuration:

```typescript
const SPRING_CONFIG = {
  damping: 20,      // Higher = less bounce (devotional: 15-25)
  stiffness: 90,    // Lower = slower return (devotional: 80-120)
  mass: 1.2,        // Higher = heavier feel (devotional: 1.0-1.5)
};
```

## ✨ Current Status
⚠️ **ACTION REQUIRED**: You need to add `aarti.png` to this folder.

The component is already integrated into HomeScreen and will display once you add the image.
