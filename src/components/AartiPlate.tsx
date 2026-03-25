import React from 'react';
import { Dimensions, Image, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Aarti plate configuration
const PLATE_SIZE = 120; // Size of the aarti plate
const INITIAL_BOTTOM = 40; // Distance from bottom
const INITIAL_X = width / 2 - PLATE_SIZE / 2; // Centered horizontally
const INITIAL_Y = height - INITIAL_BOTTOM - PLATE_SIZE; // Position from top

// Movement boundaries (soft bounds)
const MIN_X = -PLATE_SIZE * 0.3; // Allow 30% off left edge
const MAX_X = width - PLATE_SIZE * 0.7; // Allow 30% off right edge
const MIN_Y = 60; // Keep below status bar
const MAX_Y = height - 60; // Keep above bottom edge

// Spring configuration for devotional feel
const SPRING_CONFIG = {
  damping: 20, // Higher damping = less oscillation
  stiffness: 90, // Lower stiffness = slower movement
  mass: 1.2, // Higher mass = more weight feel
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

// Lift animation configuration
const LIFT_SCALE = 1.05;
const LIFT_TRANSLATION = -4;

export const AartiPlate: React.FC = () => {
  // Position values
  const translateX = useSharedValue(INITIAL_X);
  const translateY = useSharedValue(INITIAL_Y);
  
  // Lift effect values
  const scale = useSharedValue(1);
  const liftY = useSharedValue(0);
  
  // Context for gesture
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const isPressed = useSharedValue(false);

  // Clamp position to soft bounds
  const clampPosition = (value: number, min: number, max: number) => {
    'worklet';
    return Math.max(min, Math.min(max, value));
  };

  // Pan gesture - smooth finger tracking
  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      isPressed.value = true;
      startX.value = translateX.value;
      startY.value = translateY.value;
      
      // Lift the plate gently
      scale.value = withSpring(LIFT_SCALE, { damping: 15, stiffness: 150 });
      liftY.value = withSpring(LIFT_TRANSLATION, { damping: 15, stiffness: 150 });
    })
    .onUpdate((event) => {
      'worklet';
      // Follow finger smoothly - direct assignment for immediate response
      const newX = clampPosition(startX.value + event.translationX, MIN_X, MAX_X);
      const newY = clampPosition(startY.value + event.translationY, MIN_Y, MAX_Y);
      
      // Direct value assignment - no animation delay
      translateX.value = newX;
      translateY.value = newY;
    })
    .onEnd((event) => {
      'worklet';
      isPressed.value = false;
      
      // Return to origin with calm spring animation
      translateX.value = withSpring(INITIAL_X, SPRING_CONFIG);
      translateY.value = withSpring(INITIAL_Y, SPRING_CONFIG);
      
      // Reset lift effect
      scale.value = withSpring(1, { damping: 15, stiffness: 120 });
      liftY.value = withSpring(0, { damping: 15, stiffness: 120 });
    })
    .minDistance(5)
    .maxPointers(1); // Only allow single touch to prevent conflicts

  // Animated style for the plate
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value + liftY.value },
        { scale: scale.value },
      ],
    };
  });

  // Shadow style (subtle elevation when lifted)
  const shadowStyle = useAnimatedStyle(() => {
    const shadowOpacity = isPressed.value
      ? withSpring(0.4, { damping: 15 })
      : withSpring(0.15, { damping: 15 });

    return {
      shadowOpacity,
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View 
        style={[styles.plateContainer, animatedStyle, shadowStyle]}
        pointerEvents="box-none"
      >
        <Image
          source={require('../../assets/images/rituals/aarti.png')}
          style={styles.plate}
          resizeMode="contain"
        />
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  plateContainer: {
    position: 'absolute',
    width: PLATE_SIZE,
    height: PLATE_SIZE,
    // Shadow properties for depth
    shadowColor: '#FF9933', // Warm aarti glow color
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  plate: {
    width: '100%',
    height: '100%',
  },
});
