import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCheckoutStore } from '@/lib/stores/checkout-store';
import { ordersApi } from '@/lib/api/orders';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingOverlay } from '@/components/ui/loading';
import { useStripe } from '@/lib/stripe';

type PaymentProvider = 'stripe' | 'paystack';

interface PaymentMethod {
  id: PaymentProvider;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  available: boolean;
}

const getPaymentMethods = (): PaymentMethod[] => [
  {
    id: 'stripe',
    name: 'Credit / Debit Card',
    icon: 'card-outline',
    description: Platform.OS === 'web'
      ? 'Not available on web (use mobile app)'
      : 'Pay securely with Stripe',
    available: Platform.OS !== 'web',
  },
  {
    id: 'paystack',
    name: 'Paystack',
    icon: 'wallet-outline',
    description: 'Pay with Paystack (Africa)',
    available: true,
  },
];

export default function PaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [selectedMethod, setSelectedMethod] = useState<PaymentProvider | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const {
    event,
    items,
    subtotal,
    discount,
    fees,
    total,
    currency,
    promoCode,
    orderId,
    createOrder,
    setOrderId,
    setError,
    reset,
  } = useCheckoutStore();

  // Redirect if no items
  useEffect(() => {
    if (items.length === 0) {
      router.replace(`/events/${id}/checkout`);
    }
  }, [items.length, id]);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const handleStripePayment = async (orderIdToUse: string) => {
    setLoadingMessage('Preparing payment...');

    try {
      // Get payment intent from backend
      const { clientSecret, paymentIntentId } = await ordersApi.initiatePayment(
        orderIdToUse,
        'stripe'
      );

      // Initialize payment sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'EventFlow',
        style: colorScheme === 'dark' ? 'alwaysDark' : 'alwaysLight',
        returnURL: 'eventflow://payment-complete',
      });

      if (initError) {
        throw new Error(initError.message);
      }

      setLoadingMessage('');
      setIsLoading(false);

      // Present payment sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === 'Canceled') {
          // User canceled, do nothing
          return;
        }
        throw new Error(presentError.message);
      }

      // Payment successful - process on backend
      setIsLoading(true);
      setLoadingMessage('Confirming payment...');

      await ordersApi.processPayment(orderIdToUse, paymentIntentId);

      // Navigate to confirmation
      reset();
      router.replace(`/orders/confirmation/${orderIdToUse}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payment failed';
      Alert.alert('Payment Error', message);
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handlePaystackPayment = async (orderIdToUse: string) => {
    setLoadingMessage('Preparing payment...');

    try {
      // Get Paystack payment URL from backend
      const response = await ordersApi.initiatePayment(orderIdToUse, 'paystack');

      // Paystack returns an authorization URL for redirect
      const authorizationUrl = (response as unknown as { authorizationUrl: string }).authorizationUrl;

      if (authorizationUrl) {
        // Open Paystack payment page in browser
        const canOpen = await Linking.canOpenURL(authorizationUrl);
        if (canOpen) {
          await Linking.openURL(authorizationUrl);
          // Note: In a real app, you'd handle the callback via deep linking
          Alert.alert(
            'Payment Opened',
            'Complete your payment in the browser. Return here when done.',
            [
              {
                text: 'I\'ve Completed Payment',
                onPress: () => {
                  // In production, verify payment status via webhook or polling
                  reset();
                  router.replace(`/orders/confirmation/${orderIdToUse}`);
                },
              },
              {
                text: 'Cancel',
                style: 'cancel',
              },
            ]
          );
        } else {
          throw new Error('Cannot open payment page');
        }
      }

      setIsLoading(false);
      setLoadingMessage('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payment failed';
      Alert.alert('Payment Error', message);
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      Alert.alert('Select Payment Method', 'Please select a payment method to continue');
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Creating order...');

    try {
      // Create order if not already created
      let orderIdToUse = orderId;
      if (!orderIdToUse) {
        orderIdToUse = await createOrder();
        if (!orderIdToUse) {
          throw new Error('Failed to create order');
        }
      }

      // Process payment based on selected method
      if (selectedMethod === 'stripe') {
        await handleStripePayment(orderIdToUse);
      } else if (selectedMethod === 'paystack') {
        await handlePaystackPayment(orderIdToUse);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      Alert.alert('Error', message);
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  if (!event || items.length === 0) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {isLoading && <LoadingOverlay message={loadingMessage} />}

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Payment</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Summary</Text>
          <Card>
            <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={2}>
              {event.title}
            </Text>
            <View style={styles.divider} />
            {items.map((item) => (
              <View key={item.ticketTypeId} style={styles.itemRow}>
                <Text style={[styles.itemLabel, { color: colors.textSecondary }]}>
                  {item.quantity}x {item.ticketType.name}
                </Text>
                <Text style={[styles.itemValue, { color: colors.text }]}>
                  {formatPrice(item.totalPrice)}
                </Text>
              </View>
            ))}
            {promoCode && discount > 0 && (
              <View style={styles.itemRow}>
                <Text style={[styles.itemLabel, { color: colors.success }]}>
                  Discount ({promoCode})
                </Text>
                <Text style={[styles.itemValue, { color: colors.success }]}>
                  -{formatPrice(discount)}
                </Text>
              </View>
            )}
            <View style={styles.itemRow}>
              <Text style={[styles.itemLabel, { color: colors.textSecondary }]}>
                Service Fee
              </Text>
              <Text style={[styles.itemValue, { color: colors.textSecondary }]}>
                {formatPrice(fees)}
              </Text>
            </View>
            <View style={[styles.totalDivider, { backgroundColor: colors.border }]} />
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
              <Text style={[styles.totalValue, { color: colors.text }]}>
                {formatPrice(total)}
              </Text>
            </View>
          </Card>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Method</Text>
          {getPaymentMethods().map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentMethod,
                {
                  backgroundColor: colors.card,
                  borderColor: selectedMethod === method.id ? colors.tint : colors.border,
                  borderWidth: selectedMethod === method.id ? 2 : 1,
                  opacity: method.available ? 1 : 0.5,
                },
              ]}
              onPress={() => setSelectedMethod(method.id)}
              disabled={!method.available}
            >
              <View style={[styles.methodIcon, { backgroundColor: colors.tint + '15' }]}>
                <Ionicons name={method.icon} size={24} color={method.available ? colors.tint : colors.textSecondary} />
              </View>
              <View style={styles.methodInfo}>
                <Text style={[styles.methodName, { color: method.available ? colors.text : colors.textSecondary }]}>{method.name}</Text>
                <Text style={[styles.methodDescription, { color: colors.textSecondary }]}>
                  {method.description}
                </Text>
              </View>
              <View
                style={[
                  styles.radioOuter,
                  {
                    borderColor: selectedMethod === method.id ? colors.tint : colors.border,
                  },
                ]}
              >
                {selectedMethod === method.id && (
                  <View style={[styles.radioInner, { backgroundColor: colors.tint }]} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.securityText, { color: colors.textSecondary }]}>
            Your payment information is secure and encrypted
          </Text>
        </View>

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
          title="Pay Now"
          onPress={handlePayment}
          disabled={!selectedMethod || isLoading}
          loading={isLoading}
          style={styles.payButton}
        />
      </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemLabel: {
    fontSize: 14,
  },
  itemValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalDivider: {
    height: 1,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  methodDescription: {
    fontSize: 13,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  securityText: {
    fontSize: 12,
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
  payButton: {
    minWidth: 140,
  },
});
