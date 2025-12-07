import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  color?: string;
  emptyColor?: string;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 20,
  color = '#F59E0B', // Amber 500
  emptyColor = '#D1D5DB', // Gray 300
  interactive = false,
  onRatingChange,
}: StarRatingProps) {
  const handlePress = (index: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(index + 1);
    }
  };

  const stars = [];

  for (let i = 0; i < maxRating; i++) {
    const filled = i < Math.floor(rating);
    const halfFilled = !filled && i < rating && rating - i >= 0.5;

    const Star = (
      <Ionicons
        key={i}
        name={filled ? 'star' : halfFilled ? 'star-half' : 'star-outline'}
        size={size}
        color={filled || halfFilled ? color : emptyColor}
      />
    );

    if (interactive) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => handlePress(i)}
          activeOpacity={0.7}
          style={styles.starButton}
        >
          {Star}
        </TouchableOpacity>
      );
    } else {
      stars.push(Star);
    }
  }

  return <View style={styles.container}>{stars}</View>;
}

interface RatingSummaryProps {
  averageRating: number;
  reviewCount: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  color?: string;
  textColor?: string;
}

export function RatingSummary({
  averageRating,
  reviewCount,
  size = 'md',
  showCount = true,
  color = '#F59E0B',
  textColor = '#6B7280',
}: RatingSummaryProps) {
  const starSize = size === 'sm' ? 14 : size === 'md' ? 18 : 22;
  const fontSize = size === 'sm' ? 12 : size === 'md' ? 14 : 16;

  return (
    <View style={styles.summaryContainer}>
      <StarRating rating={averageRating} size={starSize} color={color} />
      {showCount && (
        <View style={styles.summaryText}>
          <View style={[styles.ratingText, { marginLeft: 6 }]}>
            <Ionicons name="star" size={starSize - 2} color={color} />
            <View style={{ marginLeft: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <View>
                  <Ionicons name="star" size={0} color="transparent" />
                </View>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// Simple inline rating display
interface InlineRatingProps {
  rating: number;
  reviewCount?: number;
  size?: 'sm' | 'md';
  textColor?: string;
}

export function InlineRating({
  rating,
  reviewCount,
  size = 'md',
  textColor = '#6B7280',
}: InlineRatingProps) {
  const starSize = size === 'sm' ? 14 : 16;
  const fontSize = size === 'sm' ? 12 : 14;

  return (
    <View style={styles.inlineContainer}>
      <Ionicons name="star" size={starSize} color="#F59E0B" />
      <View style={{ marginLeft: 4, flexDirection: 'row', alignItems: 'center' }}>
        <View>
          <Ionicons name="star" size={0} color="transparent" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starButton: {
    padding: 2,
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  ratingText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
