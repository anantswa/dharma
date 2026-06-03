import React from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Deity } from '../data/deityImages';

const { width, height } = Dimensions.get('window');
const THEME_COLOR = '#0f172a';

type Props = {
  item: Deity;
  index: number;
  scrollX: SharedValue<number>;
};

/**
 * One darshan figure with depth parallax: as the user swipes, the deity drifts
 * slower than the page and eases in scale/opacity, so it feels enshrined behind
 * the temple frame rather than flat on a scroll strip.
 */
export const DeityCard: React.FC<Props> = ({ item, index, scrollX }) => {
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

  const imageStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      scrollX.value,
      inputRange,
      [-width * 0.22, 0, width * 0.22], // parallax: image lags the page
      Extrapolation.CLAMP,
    );
    const scale = interpolate(scrollX.value, inputRange, [0.86, 1, 0.86], Extrapolation.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0.35, 1, 0.35], Extrapolation.CLAMP);
    return { transform: [{ translateX }, { scale }], opacity };
  });

  return (
    <View style={styles.cardContainer}>
      <View style={styles.backgroundLayer} />
      <View style={styles.safeZone}>
        <Animated.View style={[styles.imageWrap, imageStyle]}>
          <Image source={item.image} style={styles.deityImage} resizeMode="contain" />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: { width, height, justifyContent: 'center', alignItems: 'center' },
  backgroundLayer: { ...StyleSheet.absoluteFillObject, backgroundColor: THEME_COLOR },
  safeZone: { width, height, justifyContent: 'center', alignItems: 'center' },
  imageWrap: { width, height, justifyContent: 'center', alignItems: 'center' },
  deityImage: { width: '100%', height: '100%' },
});
