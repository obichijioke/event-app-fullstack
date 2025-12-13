import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { eventsApi } from '@/lib/api';
import { useCheckoutStore } from '@/lib/stores/checkout-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Loading } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { TicketType } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/format';

export default function CheckoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { isAuthenticated } = useAuthStore();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'Please log in to purchase tickets',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => router.back(),
          },
          {
            text: 'Log In',
            onPress: () => {
              router.replace({
                pathname: '/(auth)/login',
                params: { redirect: `/events/${id}/checkout` },
              });
            },
          },
        ]
      );
    }
  }, [isAuthenticated, id]);

  const [promoInput, setPromoInput] = useState('');
  const [showPromoInput, setShowPromoInput] = useState(false);

  const {
    event: storeEvent,
    items,
    subtotal,
    discount,
    fees,
    total,
    currency,
    promoCode,
    promoValidation,
    isProcessing,
    error,
    setEvent,
    addItem,
    updateItemQuantity,
    removeItem,
    applyPromoCode,
    removePromoCode,
    setError,
  } = useCheckoutStore();

  // Fetch event data
  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.getEvent(id!),
    enabled: !!id,
  });

  // Set event in store when loaded
  useEffect(() => {
    if (event && (!storeEvent || storeEvent.id !== event.id)) {
      setEvent(event);
    }
  }, [event]);

  const handleQuantityChange = (ticketType: TicketType, delta: number) => {
    const existingItem = items.find((item) => item.ticketTypeId === ticketType.id);
    const currentQty = existingItem?.quantity || 0;
    const newQty = currentQty + delta;

    if (newQty <= 0) {
      removeItem(ticketType.id);
    } else if (newQty > ticketType.quantityAvailable) {
      Alert.alert('Limited Availability', `Only ${ticketType.quantityAvailable} tickets available`);
    } else if (newQty > ticketType.maxPerOrder) {
      Alert.alert('Limit Reached', `Maximum ${ticketType.maxPerOrder} tickets per order`);
    } else if (currentQty === 0) {
      addItem(ticketType, 1);
    } else {
      updateItemQuantity(ticketType.id, newQty);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    const success = await applyPromoCode(promoInput.trim().toUpperCase());
    if (success) {
      setShowPromoInput(false);
      setPromoInput('');
    }
  };

  const handleProceedToPayment = () => {
    if (items.length === 0) {
      setError('Please select at least one ticket');
      return;
    }
    router.push(`/events/${id}/payment`);
  };

  const formatPrice = (amount: number) => {
    return formatCurrency(amount, currency);
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (!event) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>Event not found</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const ticketTypes = event.ticketTypes || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              Select Tickets
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {event.title}
            </Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          {/* Event Info */}
          <Card style={styles.eventCard}>
            <View style={styles.eventInfo}>
              <Ionicons name="calendar-outline" size={18} color={colors.tint} />
              <Text style={[styles.eventDate, { color: colors.text }]}>
                {format(new Date(event.startDate), 'EEE, MMM d · h:mm a')}
              </Text>
            </View>
            <View style={styles.eventInfo}>
              <Ionicons name="location-outline" size={18} color={colors.tint} />
              <Text style={[styles.eventLocation, { color: colors.textSecondary }]}>
                {event.venue?.name || 'Online Event'}
              </Text>
            </View>
          </Card>

          {/* Ticket Types */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Tickets</Text>

            {ticketTypes.length === 0 ? (
              <Card>
                <Text style={[styles.noTickets, { color: colors.textSecondary }]}>
                  No tickets available for this event
                </Text>
              </Card>
            ) : (
              ticketTypes.map((ticketType) => {
                const cartItem = items.find((item) => item.ticketTypeId === ticketType.id);
                const quantity = cartItem?.quantity || 0;
                const isSoldOut = ticketType.quantityAvailable === 0;
                const isNotOnSale = !ticketType.isOnSale;

                return (
                  <Card key={ticketType.id} style={styles.ticketCard}>
                    <View style={styles.ticketInfo}>
                      <Text style={[styles.ticketName, { color: colors.text }]}>
                        {ticketType.name}
                      </Text>
                      {ticketType.description && (
                        <Text style={[styles.ticketDescription, { color: colors.textSecondary }]}>
                          {ticketType.description}
                        </Text>
                      )}
                      <Text style={[styles.ticketPrice, { color: colors.tint }]}>
                        {ticketType.price === 0 ? 'Free' : formatPrice(ticketType.price)}
                      </Text>
                      {ticketType.quantityAvailable <= 10 && ticketType.quantityAvailable > 0 && (
                        <Text style={[styles.ticketAvailability, { color: colors.warning }]}>
                          Only {ticketType.quantityAvailable} left
                        </Text>
                      )}
                    </View>

                    <View style={styles.quantityControl}>
                      {isSoldOut ? (
                        <Text style={[styles.soldOut, { color: colors.error }]}>Sold Out</Text>
                      ) : isNotOnSale ? (
                        <Text style={[styles.notOnSale, { color: colors.textSecondary }]}>
                          Not on sale
                        </Text>
                      ) : (
                        <>
                          <TouchableOpacity
                            style={[
                              styles.qtyButton,
                              {
                                backgroundColor: quantity > 0 ? colors.tint : colors.border,
                              },
                            ]}
                            onPress={() => handleQuantityChange(ticketType, -1)}
                            disabled={quantity === 0}
                          >
                            <Ionicons
                              name="remove"
                              size={20}
                              color={quantity > 0 ? '#FFFFFF' : colors.textSecondary}
                            />
                          </TouchableOpacity>
                          <Text style={[styles.qtyText, { color: colors.text }]}>{quantity}</Text>
                          <TouchableOpacity
                            style={[styles.qtyButton, { backgroundColor: colors.tint }]}
                            onPress={() => handleQuantityChange(ticketType, 1)}
                          >
                            <Ionicons name="add" size={20} color="#FFFFFF" />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </Card>
                );
              })
            )}
          </View>

          {/* Promo Code */}
          <View style={styles.section}>
            {promoCode && promoValidation?.valid ? (
              <Card style={styles.promoApplied}>
                <View style={styles.promoAppliedContent}>
                  <Ionicons name="pricetag" size={20} color={colors.success} />
                  <View style={styles.promoAppliedText}>
                    <Text style={[styles.promoCode, { color: colors.text }]}>{promoCode}</Text>
                    <Text style={[styles.promoDiscount, { color: colors.success }]}>
                      {promoValidation.discountType === 'percentage'
                        ? `${promoValidation.discountValue}% off`
                        : `${formatPrice(promoValidation.discountValue)} off`}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={removePromoCode}>
                  <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </Card>
            ) : showPromoInput ? (
              <Card style={styles.promoInputCard}>
                <TextInput
                  style={[styles.promoTextInput, { color: colors.text }]}
                  placeholder="Enter promo code"
                  placeholderTextColor={colors.textSecondary}
                  value={promoInput}
                  onChangeText={setPromoInput}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                <View style={styles.promoButtons}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowPromoInput(false);
                      setPromoInput('');
                      setError(null);
                    }}
                  >
                    <Text style={[styles.promoCancelText, { color: colors.textSecondary }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <Button
                    title="Apply"
                    size="sm"
                    onPress={handleApplyPromo}
                    loading={isProcessing}
                    disabled={!promoInput.trim()}
                  />
                </View>
              </Card>
            ) : (
              <TouchableOpacity
                style={styles.addPromoButton}
                onPress={() => setShowPromoInput(true)}
              >
                <Ionicons name="pricetag-outline" size={20} color={colors.tint} />
                <Text style={[styles.addPromoText, { color: colors.tint }]}>Add promo code</Text>
              </TouchableOpacity>
            )}
            {error && (
              <Text style={[styles.errorMessage, { color: colors.error }]}>{error}</Text>
            )}
          </View>

          {/* Order Summary */}
          {items.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Summary</Text>
              <Card>
                {items.map((item) => (
                  <View key={item.ticketTypeId} style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.text }]}>
                      {item.quantity}x {item.ticketType.name}
                    </Text>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>
                      {formatPrice(item.totalPrice)}
                    </Text>
                  </View>
                ))}
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                    Subtotal
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.textSecondary }]}>
                    {formatPrice(subtotal)}
                  </Text>
                </View>
                {discount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.success }]}>Discount</Text>
                    <Text style={[styles.summaryValue, { color: colors.success }]}>
                      -{formatPrice(discount)}
                    </Text>
                  </View>
                )}
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                    Service Fee
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.textSecondary }]}>
                    {formatPrice(fees)}
                  </Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.summaryRow}>
                  <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
                  <Text style={[styles.totalValue, { color: colors.text }]}>
                    {formatPrice(total)}
                  </Text>
                </View>
              </Card>
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Bottom Bar */}
        <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <View style={styles.bottomTotal}>
            <Text style={[styles.bottomTotalLabel, { color: colors.textSecondary }]}>Total</Text>
            <Text style={[styles.bottomTotalValue, { color: colors.text }]}>
              {formatPrice(total)}
            </Text>
          </View>
          <Button
            title={items.length === 0 ? 'Select Tickets' : 'Continue to Payment'}
            onPress={handleProceedToPayment}
            disabled={items.length === 0}
            style={styles.continueButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  eventCard: {
    margin: 16,
    marginBottom: 0,
  },
  eventInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  eventLocation: {
    fontSize: 14,
  },
  section: {
    padding: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  noTickets: {
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 20,
  },
  ticketCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketInfo: {
    flex: 1,
    marginRight: 16,
  },
  ticketName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  ticketDescription: {
    fontSize: 13,
    marginBottom: 6,
  },
  ticketPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  ticketAvailability: {
    fontSize: 12,
    marginTop: 4,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 18,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  soldOut: {
    fontSize: 14,
    fontWeight: '600',
  },
  notOnSale: {
    fontSize: 13,
  },
  addPromoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  addPromoText: {
    fontSize: 15,
    fontWeight: '500',
  },
  promoInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  promoTextInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  promoButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  promoCancelText: {
    fontSize: 14,
  },
  promoApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  promoAppliedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  promoAppliedText: {
    gap: 2,
  },
  promoCode: {
    fontSize: 14,
    fontWeight: '600',
  },
  promoDiscount: {
    fontSize: 12,
  },
  errorMessage: {
    fontSize: 13,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  bottomTotal: {
    flex: 1,
  },
  bottomTotalLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  bottomTotalValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  continueButton: {
    minWidth: 180,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
  },
});
