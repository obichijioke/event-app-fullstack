import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Avatar } from '@/components/ui/avatar';
import { StarRating } from './star-rating';
import type { Review } from '@/lib/types';

interface ReviewCardProps {
  review: Review;
  onEdit?: () => void;
  onDelete?: () => void;
  isOwn?: boolean;
}

export function ReviewCard({ review, onEdit, onDelete, isOwn = false }: ReviewCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const timeAgo = formatDistanceToNow(new Date(review.createdAt), { addSuffix: true });

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avatar name={review.user.name} size="sm" />
          <View style={styles.userText}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {review.user.name}
            </Text>
            <Text style={[styles.date, { color: colors.textSecondary }]}>
              {timeAgo}
            </Text>
          </View>
        </View>
        <StarRating rating={review.rating} size={16} />
      </View>

      {review.comment && (
        <Text style={[styles.comment, { color: colors.text }]}>
          {review.comment}
        </Text>
      )}

      {isOwn && (onEdit || onDelete) && (
        <View style={[styles.actions, { borderTopColor: colors.border }]}>
          {onEdit && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onEdit}
            >
              <Ionicons name="pencil-outline" size={16} color={colors.tint} />
              <Text style={[styles.actionText, { color: colors.tint }]}>Edit</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onDelete}
            >
              <Ionicons name="trash-outline" size={16} color={colors.error} />
              <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

interface ReviewSummaryCardProps {
  averageRating: number;
  reviewCount: number;
  onWriteReview?: () => void;
  canReview?: boolean;
}

export function ReviewSummaryCard({
  averageRating,
  reviewCount,
  onWriteReview,
  canReview = false,
}: ReviewSummaryCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.summaryContent}>
        <View style={styles.ratingDisplay}>
          <Text style={[styles.ratingNumber, { color: colors.text }]}>
            {averageRating.toFixed(1)}
          </Text>
          <StarRating rating={averageRating} size={20} />
          <Text style={[styles.reviewCountText, { color: colors.textSecondary }]}>
            {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
          </Text>
        </View>

        {canReview && onWriteReview && (
          <TouchableOpacity
            style={[styles.writeButton, { backgroundColor: colors.tint }]}
            onPress={onWriteReview}
          >
            <Ionicons name="create-outline" size={18} color="#FFFFFF" />
            <Text style={styles.writeButtonText}>Write Review</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userText: {
    marginLeft: 10,
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    marginTop: 2,
  },
  comment: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  summaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingDisplay: {
    alignItems: 'flex-start',
    gap: 6,
  },
  ratingNumber: {
    fontSize: 32,
    fontWeight: '700',
  },
  reviewCountText: {
    fontSize: 13,
    marginTop: 4,
  },
  writeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  writeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
