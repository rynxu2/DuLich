/**
 * FavoriteButton Component — Animated heart toggle for tour wishlist
 */
import React, { useState, useEffect, useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { favoritesApi } from '../api/favorites';
import { theme } from '../theme';

interface Props {
  tourId: number;
  size?: number;
  style?: object;
}

export default function FavoriteButton({ tourId, size = 26, style }: Props) {
  const [isFavorite, setIsFavorite] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const checkFavorite = async () => {
      try {
        const res = await favoritesApi.check(tourId);
        setIsFavorite(res.data.favorited);
      } catch {
        // Ignore — use default false
      }
    };
    checkFavorite();
  }, [tourId]);

  const handleToggle = async () => {
    // Optimistic update with bounce animation
    const newValue = !isFavorite;
    setIsFavorite(newValue);

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.4,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      await favoritesApi.toggle(tourId);
    } catch {
      // Revert on error
      setIsFavorite(!newValue);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleToggle}
      style={[styles.button, style]}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Icon
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={size}
          color={isFavorite ? theme.colors.accent : '#fff'}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 20,
    padding: 8,
  },
});
