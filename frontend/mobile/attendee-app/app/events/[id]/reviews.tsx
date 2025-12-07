import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/lib/stores/auth-store';
import { reviewsApi, ticketsApi } from '@/lib/api';
import { ReviewCard, ReviewSummaryCard, WriteReviewModal } from '@/components/reviews';
import { Loading } from '@/components/ui/loading';
import type { Review } from '@/lib/types';

export default function EventReviewsScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [showWriteModal, setShowWriteModal] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  // Fetch review summary
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['event', eventId, 'review-summary'],
    queryFn: () => reviewsApi.getEventReviewSummary(eventId!),
    enabled: !!eventId,
  });

  // Fetch reviews
  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['event', eventId, 'reviews'],
    queryFn: () => reviewsApi.getEventReviews(eventId!, 1, 50),
    enabled: !!eventId,
  });

  // Check if user has a ticket for this event (can review)
  const { data: userTickets } = useQuery({
    queryKey: ['user', 'event-tickets', eventId],
    queryFn: () => ticketsApi.getTickets({ eventId }),
    enabled: !!eventId && !!user,
  });

  const hasTicket = userTickets?.data && userTickets.data.length > 0;
  const userReview = reviewsData?.data?.find((r) => r.userId === user?.id);
  const canReview = hasTicket && !userReview;

  // Delete review mutation
  const deleteMutation = useMutation({
    mutationFn: (reviewId: string) => reviewsApi.deleteEventReview(eventId!, reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'review-summary'] });
      Alert.alert('Success', 'Review deleted');
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to delete review');
    },
  });

  const handleDeleteReview = (reviewId: string) => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete your review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(reviewId),
        },
      ]
    );
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setShowWriteModal(true);
  };

  const handleWriteReview = () => {
    setEditingReview(null);
    setShowWriteModal(true);
  };

  const renderReview = ({ item }: { item: Review }) => (
    <ReviewCard
      review={item}
      isOwn={item.userId === user?.id}
      onEdit={() => handleEditReview(item)}
      onDelete={() => handleDeleteReview(item.id)}
    />
  );

  const isLoading = summaryLoading || reviewsLoading;

  if (isLoading) {
    return <Loading fullScreen />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Reviews</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={reviewsData?.data || []}
        renderItem={renderReview}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.tint}
          />
        }
        ListHeaderComponent={
          <View style={styles.summaryContainer}>
            <ReviewSummaryCard
              averageRating={summary?.averageRating || 0}
              reviewCount={summary?.reviewCount || 0}
              canReview={canReview}
              onWriteReview={handleWriteReview}
            />

            {userReview && (
              <View style={styles.yourReviewSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Your Review
                </Text>
                <ReviewCard
                  review={userReview}
                  isOwn
                  onEdit={() => handleEditReview(userReview)}
                  onDelete={() => handleDeleteReview(userReview.id)}
                />
              </View>
            )}

            {!hasTicket && (
              <View style={[styles.infoBox, { backgroundColor: colors.tint + '10' }]}>
                <Ionicons name="information-circle-outline" size={20} color={colors.tint} />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  You need a ticket for this event to leave a review
                </Text>
              </View>
            )}

            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>
              All Reviews ({summary?.reviewCount || 0})
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={48} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No reviews yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Be the first to share your experience
            </Text>
          </View>
        }
      />

      <WriteReviewModal
        visible={showWriteModal}
        onClose={() => {
          setShowWriteModal(false);
          setEditingReview(null);
        }}
        eventId={eventId}
        existingReview={editingReview}
        onSuccess={() => {
          refetch();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryContainer: {
    marginBottom: 16,
  },
  yourReviewSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 10,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 4,
  },
});
