import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { StarRating } from './star-rating';
import { reviewsApi } from '@/lib/api';
import type { Review, CreateReviewRequest, UpdateReviewRequest } from '@/lib/types';

interface WriteReviewModalProps {
  visible: boolean;
  onClose: () => void;
  eventId?: string;
  organizerId?: string;
  existingReview?: Review | null;
  onSuccess?: () => void;
}

export function WriteReviewModal({
  visible,
  onClose,
  eventId,
  organizerId,
  existingReview,
  onSuccess,
}: WriteReviewModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const queryClient = useQueryClient();

  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');

  const isEditing = !!existingReview;
  const targetId = eventId || organizerId;
  const targetType = eventId ? 'event' : 'organizer';

  // Reset form when modal opens/closes
  useEffect(() => {
    if (visible) {
      setRating(existingReview?.rating || 0);
      setComment(existingReview?.comment || '');
    }
  }, [visible, existingReview]);

  // Create review mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateReviewRequest) => {
      if (eventId) {
        return reviewsApi.createEventReview(eventId, data);
      } else if (organizerId) {
        return reviewsApi.createOrganizerReview(organizerId, data);
      }
      throw new Error('Missing target ID');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [targetType, targetId, 'reviews'] });
      queryClient.invalidateQueries({ queryKey: [targetType, targetId, 'review-summary'] });
      onSuccess?.();
      onClose();
      Alert.alert('Success', 'Your review has been submitted');
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to submit review');
    },
  });

  // Update review mutation
  const updateMutation = useMutation({
    mutationFn: async (data: UpdateReviewRequest) => {
      if (!existingReview) throw new Error('No review to update');
      if (eventId) {
        return reviewsApi.updateEventReview(eventId, existingReview.id, data);
      } else if (organizerId) {
        return reviewsApi.updateOrganizerReview(organizerId, existingReview.id, data);
      }
      throw new Error('Missing target ID');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [targetType, targetId, 'reviews'] });
      queryClient.invalidateQueries({ queryKey: [targetType, targetId, 'review-summary'] });
      onSuccess?.();
      onClose();
      Alert.alert('Success', 'Your review has been updated');
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to update review');
    },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating');
      return;
    }

    const data = {
      rating,
      comment: comment.trim() || undefined,
    };

    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {isEditing ? 'Edit Review' : 'Write a Review'}
            </Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.content}>
            {/* Rating Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Your Rating
              </Text>
              <View style={styles.ratingContainer}>
                <StarRating
                  rating={rating}
                  size={40}
                  interactive
                  onRatingChange={setRating}
                />
              </View>
              <Text style={[styles.ratingHint, { color: colors.textSecondary }]}>
                {rating === 0
                  ? 'Tap a star to rate'
                  : rating === 1
                  ? 'Poor'
                  : rating === 2
                  ? 'Fair'
                  : rating === 3
                  ? 'Good'
                  : rating === 4
                  ? 'Very Good'
                  : 'Excellent'}
              </Text>
            </View>

            {/* Comment Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Your Review (Optional)
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Share your experience..."
                placeholderTextColor={colors.textSecondary}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={5}
                maxLength={1000}
                textAlignVertical="top"
              />
              <Text style={[styles.charCount, { color: colors.textSecondary }]}>
                {comment.length}/1000
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: rating > 0 ? colors.tint : colors.border },
              ]}
              onPress={handleSubmit}
              disabled={rating === 0 || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isEditing ? 'Update Review' : 'Submit Review'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 36,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  ratingContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  ratingHint: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 6,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
