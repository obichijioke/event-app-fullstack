import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { eventsApi } from '@/lib/api';
import { Loading } from '@/components/ui/loading';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export default function EventFAQsScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const {
    data: faqs,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['event', eventId, 'faqs'],
    queryFn: () => eventsApi.getEventFAQs(eventId!),
    enabled: !!eventId,
  });

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
        // Track FAQ view when expanded
        eventsApi.trackFAQView(eventId!, id).catch(() => {});
      }
      return newSet;
    });
  };

  const handleMarkHelpful = async (faqId: string) => {
    try {
      await eventsApi.markFAQHelpful(eventId!, faqId);
    } catch {
      // Silently fail
    }
  };

  const renderFAQ = ({ item, index }: { item: FAQ; index: number }) => {
    const isExpanded = expandedIds.has(item.id);

    return (
      <View style={[styles.faqContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={styles.questionRow}
          onPress={() => toggleExpand(item.id)}
          activeOpacity={0.7}
        >
          <View style={[styles.numberBadge, { backgroundColor: colors.tint + '15' }]}>
            <Text style={[styles.numberText, { color: colors.tint }]}>
              {index + 1}
            </Text>
          </View>
          <Text style={[styles.question, { color: colors.text }]}>
            {item.question}
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.icon}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={[styles.answerContainer, { borderTopColor: colors.border }]}>
            <Text style={[styles.answer, { color: colors.textSecondary }]}>
              {item.answer}
            </Text>
            <TouchableOpacity
              style={[styles.helpfulButton, { borderColor: colors.border }]}
              onPress={() => handleMarkHelpful(item.id)}
            >
              <Ionicons name="thumbs-up-outline" size={16} color={colors.icon} />
              <Text style={[styles.helpfulText, { color: colors.textSecondary }]}>
                Helpful
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  // Sort FAQs by order
  const sortedFaqs = [...(faqs || [])].sort((a, b) => a.order - b.order);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>FAQ</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={sortedFaqs}
        renderItem={renderFAQ}
        keyExtractor={(item, index) => item.id || `${index}-${item.question}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.tint}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="help-circle-outline" size={48} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No FAQs available
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Frequently asked questions haven't been added for this event
            </Text>
          </View>
        }
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
  faqContainer: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontSize: 13,
    fontWeight: '600',
  },
  question: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  answerContainer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 12,
    marginLeft: 40,
    borderTopWidth: 1,
  },
  answer: {
    fontSize: 14,
    lineHeight: 22,
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  helpfulText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 20,
  },
});
