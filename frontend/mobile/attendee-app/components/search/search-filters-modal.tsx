import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, startOfDay, endOfDay, addDays, startOfWeek, endOfWeek, isSaturday, isSunday } from 'date-fns';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/components/ui/button';

export interface SearchFilters {
  dateRange?: {
    start: Date;
    end: Date;
  } | null;
  priceRange?: {
    min: number;
    max: number;
  } | null;
  freeOnly?: boolean;
  sortBy?: 'date' | 'popularity' | 'price_asc' | 'price_desc';
  upcoming?: boolean;
}

interface SearchFiltersModalProps {
  visible: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onApply: (filters: SearchFilters) => void;
}

type DatePreset = 'today' | 'tomorrow' | 'this_week' | 'this_weekend' | 'custom' | null;

export function SearchFiltersModal({
  visible,
  onClose,
  filters,
  onApply,
}: SearchFiltersModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);
  const [datePreset, setDatePreset] = useState<DatePreset>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(new Date());
  const [tempEndDate, setTempEndDate] = useState(addDays(new Date(), 7));

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters, visible]);

  const handleDatePreset = (preset: DatePreset) => {
    setDatePreset(preset);
    const today = new Date();

    switch (preset) {
      case 'today':
        setLocalFilters({
          ...localFilters,
          dateRange: {
            start: startOfDay(today),
            end: endOfDay(today),
          },
        });
        break;
      case 'tomorrow':
        const tomorrow = addDays(today, 1);
        setLocalFilters({
          ...localFilters,
          dateRange: {
            start: startOfDay(tomorrow),
            end: endOfDay(tomorrow),
          },
        });
        break;
      case 'this_week':
        setLocalFilters({
          ...localFilters,
          dateRange: {
            start: startOfDay(today),
            end: endOfWeek(today),
          },
        });
        break;
      case 'this_weekend':
        // Find next Saturday
        let saturday = today;
        while (!isSaturday(saturday)) {
          saturday = addDays(saturday, 1);
        }
        let sunday = addDays(saturday, 1);
        setLocalFilters({
          ...localFilters,
          dateRange: {
            start: startOfDay(saturday),
            end: endOfDay(sunday),
          },
        });
        break;
      case 'custom':
        setTempStartDate(localFilters.dateRange?.start || today);
        setTempEndDate(localFilters.dateRange?.end || addDays(today, 7));
        setShowStartPicker(true);
        break;
      case null:
        setLocalFilters({
          ...localFilters,
          dateRange: null,
        });
        break;
    }
  };

  const handleStartDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartPicker(false);
    }
    if (date) {
      setTempStartDate(date);
      if (Platform.OS === 'android') {
        setShowEndPicker(true);
      }
    }
  };

  const handleEndDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndPicker(false);
    }
    if (date) {
      setTempEndDate(date);
      setLocalFilters({
        ...localFilters,
        dateRange: {
          start: startOfDay(tempStartDate),
          end: endOfDay(date),
        },
      });
    }
  };

  const handleConfirmDates = () => {
    setLocalFilters({
      ...localFilters,
      dateRange: {
        start: startOfDay(tempStartDate),
        end: endOfDay(tempEndDate),
      },
    });
    setShowStartPicker(false);
    setShowEndPicker(false);
  };

  const handleReset = () => {
    setLocalFilters({
      sortBy: 'date',
      upcoming: true,
    });
    setDatePreset(null);
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const sortOptions: { value: SearchFilters['sortBy']; label: string; icon: string }[] = [
    { value: 'date', label: 'Date', icon: 'calendar-outline' },
    { value: 'popularity', label: 'Popularity', icon: 'trending-up-outline' },
    { value: 'price_asc', label: 'Price: Low to High', icon: 'arrow-up-outline' },
    { value: 'price_desc', label: 'Price: High to Low', icon: 'arrow-down-outline' },
  ];

  const datePresets: { value: DatePreset; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'tomorrow', label: 'Tomorrow' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_weekend', label: 'This Weekend' },
    { value: 'custom', label: 'Custom' },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Filters</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={[styles.resetText, { color: colors.tint }]}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Date Filters */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Date</Text>
            <View style={styles.presetGrid}>
              {datePresets.map((preset) => (
                <TouchableOpacity
                  key={preset.value}
                  style={[
                    styles.presetButton,
                    {
                      backgroundColor: datePreset === preset.value ? colors.tint : colors.card,
                      borderColor: datePreset === preset.value ? colors.tint : colors.border,
                    },
                  ]}
                  onPress={() => handleDatePreset(preset.value)}
                >
                  <Text
                    style={[
                      styles.presetText,
                      { color: datePreset === preset.value ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  styles.presetButton,
                  {
                    backgroundColor: datePreset === null ? colors.tint : colors.card,
                    borderColor: datePreset === null ? colors.tint : colors.border,
                  },
                ]}
                onPress={() => handleDatePreset(null)}
              >
                <Text
                  style={[
                    styles.presetText,
                    { color: datePreset === null ? '#FFFFFF' : colors.text },
                  ]}
                >
                  Any Date
                </Text>
              </TouchableOpacity>
            </View>

            {/* Custom Date Range */}
            {datePreset === 'custom' && (
              <View style={styles.datePickerContainer}>
                <View style={styles.dateRow}>
                  <View style={styles.dateField}>
                    <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>From</Text>
                    <TouchableOpacity
                      style={[styles.dateButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => setShowStartPicker(true)}
                    >
                      <Text style={[styles.dateButtonText, { color: colors.text }]}>
                        {format(tempStartDate, 'MMM d, yyyy')}
                      </Text>
                      <Ionicons name="calendar-outline" size={18} color={colors.icon} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.dateField}>
                    <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>To</Text>
                    <TouchableOpacity
                      style={[styles.dateButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => setShowEndPicker(true)}
                    >
                      <Text style={[styles.dateButtonText, { color: colors.text }]}>
                        {format(tempEndDate, 'MMM d, yyyy')}
                      </Text>
                      <Ionicons name="calendar-outline" size={18} color={colors.icon} />
                    </TouchableOpacity>
                  </View>
                </View>
                {Platform.OS === 'ios' && (showStartPicker || showEndPicker) && (
                  <View style={[styles.iosPickerContainer, { backgroundColor: colors.card }]}>
                    <DateTimePicker
                      value={showStartPicker ? tempStartDate : tempEndDate}
                      mode="date"
                      display="inline"
                      onChange={showStartPicker ? handleStartDateChange : handleEndDateChange}
                      minimumDate={showStartPicker ? new Date() : tempStartDate}
                    />
                    <Button
                      title="Confirm"
                      onPress={handleConfirmDates}
                      style={styles.confirmDateButton}
                    />
                  </View>
                )}
                {Platform.OS === 'android' && showStartPicker && (
                  <DateTimePicker
                    value={tempStartDate}
                    mode="date"
                    display="default"
                    onChange={handleStartDateChange}
                    minimumDate={new Date()}
                  />
                )}
                {Platform.OS === 'android' && showEndPicker && (
                  <DateTimePicker
                    value={tempEndDate}
                    mode="date"
                    display="default"
                    onChange={handleEndDateChange}
                    minimumDate={tempStartDate}
                  />
                )}
              </View>
            )}
          </View>

          {/* Price Filter */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Price</Text>
            <View style={[styles.switchRow, { backgroundColor: colors.card }]}>
              <View style={styles.switchInfo}>
                <Ionicons name="pricetag-outline" size={22} color={colors.icon} />
                <Text style={[styles.switchLabel, { color: colors.text }]}>Free Events Only</Text>
              </View>
              <Switch
                value={localFilters.freeOnly || false}
                onValueChange={(value) =>
                  setLocalFilters({ ...localFilters, freeOnly: value })
                }
                trackColor={{ false: colors.border, true: colors.tint + '50' }}
                thumbColor={localFilters.freeOnly ? colors.tint : colors.card}
              />
            </View>
          </View>

          {/* Sort By */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Sort By</Text>
            <View style={styles.sortOptions}>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortOption,
                    {
                      backgroundColor:
                        localFilters.sortBy === option.value ? colors.tint + '15' : 'transparent',
                      borderColor:
                        localFilters.sortBy === option.value ? colors.tint : colors.border,
                    },
                  ]}
                  onPress={() => setLocalFilters({ ...localFilters, sortBy: option.value })}
                >
                  <Ionicons
                    name={option.icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={localFilters.sortBy === option.value ? colors.tint : colors.icon}
                  />
                  <Text
                    style={[
                      styles.sortOptionText,
                      {
                        color:
                          localFilters.sortBy === option.value ? colors.tint : colors.text,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {localFilters.sortBy === option.value && (
                    <Ionicons name="checkmark" size={20} color={colors.tint} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Current Filters Summary */}
          {localFilters.dateRange && (
            <View style={[styles.filterSummary, { backgroundColor: colors.tint + '10' }]}>
              <Ionicons name="information-circle-outline" size={18} color={colors.tint} />
              <Text style={[styles.filterSummaryText, { color: colors.tint }]}>
                Showing events from {format(localFilters.dateRange.start, 'MMM d')} to{' '}
                {format(localFilters.dateRange.end, 'MMM d, yyyy')}
              </Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Apply Button */}
        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <Button title="Apply Filters" onPress={handleApply} style={styles.applyButton} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  resetText: {
    fontSize: 15,
    fontWeight: '500',
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 14,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 14,
    fontWeight: '500',
  },
  datePickerContainer: {
    marginTop: 16,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  iosPickerContainer: {
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  confirmDateButton: {
    marginTop: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
  },
  switchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  sortOptions: {
    gap: 10,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  sortOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  filterSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    gap: 10,
  },
  filterSummaryText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  applyButton: {
    width: '100%',
  },
});
