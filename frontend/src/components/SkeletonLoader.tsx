import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface Props {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

export default function SkeletonLoader({ width = '100%', height = 20, borderRadius = 4, style }: Props) {
  const customOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(customOpacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(customOpacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    
    animation.start();

    return () => {
      animation.stop();
    };
  }, [customOpacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity: customOpacity },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E1E9EE',
  },
});
