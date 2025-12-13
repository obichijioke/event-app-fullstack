import { create } from 'zustand';
import type { Event, TicketType, PromoValidation } from '../types';
import { ordersApi } from '../api/orders';
import { useCurrencyStore } from './currency-store';

export interface CartItem {
  ticketTypeId: string;
  ticketType: TicketType;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface CheckoutState {
  // State
  event: Event | null;
  items: CartItem[];
  promoCode: string | null;
  promoValidation: PromoValidation | null;
  subtotal: number;
  discount: number;
  fees: number;
  total: number;
  currency: string;
  orderId: string | null;
  paymentProvider: 'stripe' | 'paystack' | null;
  isProcessing: boolean;
  error: string | null;

  // Actions
  setEvent: (event: Event) => void;
  addItem: (ticketType: TicketType, quantity: number) => void;
  updateItemQuantity: (ticketTypeId: string, quantity: number) => void;
  removeItem: (ticketTypeId: string) => void;
  clearCart: () => void;
  applyPromoCode: (code: string) => Promise<boolean>;
  removePromoCode: () => void;
  setPaymentProvider: (provider: 'stripe' | 'paystack') => void;
  createOrder: () => Promise<string | null>;
  setOrderId: (orderId: string) => void;
  setError: (error: string | null) => void;
  setProcessing: (isProcessing: boolean) => void;
  reset: () => void;
}

const FEE_PERCENTAGE = 0.029; // 2.9% platform fee
const FEE_FIXED = 0.30; // $0.30 fixed fee

const calculateTotals = (
  items: CartItem[],
  promoValidation: PromoValidation | null
): { subtotal: number; discount: number; fees: number; total: number } => {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  let discount = 0;
  if (promoValidation?.valid) {
    if (promoValidation.discountType === 'percentage') {
      discount = subtotal * (promoValidation.discountValue / 100);
    } else {
      discount = Math.min(promoValidation.discountValue, subtotal);
    }
  }

  const afterDiscount = subtotal - discount;
  const fees = afterDiscount > 0 ? afterDiscount * FEE_PERCENTAGE + FEE_FIXED : 0;
  const total = afterDiscount + fees;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    fees: Math.round(fees * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
};

export const useCheckoutStore = create<CheckoutState>((set, get) => ({
  // Initial state
  event: null,
  items: [],
  promoCode: null,
  promoValidation: null,
  subtotal: 0,
  discount: 0,
  fees: 0,
  total: 0,
  currency: useCurrencyStore.getState().config?.defaultCurrency || 'USD',
  orderId: null,
  paymentProvider: null,
  isProcessing: false,
  error: null,

  setEvent: (event: Event) => {
    set({
      event,
      currency: event.currency || useCurrencyStore.getState().config?.defaultCurrency || 'USD',
      items: [],
      promoCode: null,
      promoValidation: null,
      subtotal: 0,
      discount: 0,
      fees: 0,
      total: 0,
      orderId: null,
      error: null,
    });
  },

  addItem: (ticketType: TicketType, quantity: number) => {
    const { items, promoValidation } = get();
    const existingIndex = items.findIndex((item) => item.ticketTypeId === ticketType.id);

    let newItems: CartItem[];
    if (existingIndex >= 0) {
      newItems = items.map((item, index) => {
        if (index === existingIndex) {
          const newQuantity = Math.min(
            item.quantity + quantity,
            ticketType.maxPerOrder,
            ticketType.quantityAvailable
          );
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: newQuantity * ticketType.price,
          };
        }
        return item;
      });
    } else {
      const validQuantity = Math.min(quantity, ticketType.maxPerOrder, ticketType.quantityAvailable);
      newItems = [
        ...items,
        {
          ticketTypeId: ticketType.id,
          ticketType,
          quantity: validQuantity,
          unitPrice: ticketType.price,
          totalPrice: validQuantity * ticketType.price,
        },
      ];
    }

    const totals = calculateTotals(newItems, promoValidation);
    set({ items: newItems, ...totals, error: null });
  },

  updateItemQuantity: (ticketTypeId: string, quantity: number) => {
    const { items, promoValidation } = get();

    if (quantity <= 0) {
      get().removeItem(ticketTypeId);
      return;
    }

    const newItems = items.map((item) => {
      if (item.ticketTypeId === ticketTypeId) {
        const validQuantity = Math.min(
          quantity,
          item.ticketType.maxPerOrder,
          item.ticketType.quantityAvailable
        );
        return {
          ...item,
          quantity: validQuantity,
          totalPrice: validQuantity * item.unitPrice,
        };
      }
      return item;
    });

    const totals = calculateTotals(newItems, promoValidation);
    set({ items: newItems, ...totals, error: null });
  },

  removeItem: (ticketTypeId: string) => {
    const { items, promoValidation } = get();
    const newItems = items.filter((item) => item.ticketTypeId !== ticketTypeId);
    const totals = calculateTotals(newItems, promoValidation);
    set({ items: newItems, ...totals });
  },

  clearCart: () => {
    set({
      items: [],
      subtotal: 0,
      discount: 0,
      fees: 0,
      total: 0,
      promoCode: null,
      promoValidation: null,
      error: null,
    });
  },

  applyPromoCode: async (code: string) => {
    const { event, items } = get();
    if (!event) return false;

    set({ isProcessing: true, error: null });

    try {
      const validation = await ordersApi.validatePromoCode(code, event.id);

      if (validation.valid) {
        const totals = calculateTotals(items, validation);
        set({
          promoCode: code,
          promoValidation: validation,
          ...totals,
          isProcessing: false,
        });
        return true;
      } else {
        set({
          error: validation.message || 'Invalid promo code',
          isProcessing: false,
        });
        return false;
      }
    } catch (error) {
      set({
        error: 'Failed to validate promo code',
        isProcessing: false,
      });
      return false;
    }
  },

  removePromoCode: () => {
    const { items } = get();
    const totals = calculateTotals(items, null);
    set({
      promoCode: null,
      promoValidation: null,
      ...totals,
    });
  },

  setPaymentProvider: (provider: 'stripe' | 'paystack') => {
    set({ paymentProvider: provider, error: null });
  },

  createOrder: async () => {
    const { event, items, promoCode } = get();
    if (!event || items.length === 0) return null;

    set({ isProcessing: true, error: null });

    try {
      const order = await ordersApi.createOrder({
        eventId: event.id,
        items: items.map((item) => ({
          ticketTypeId: item.ticketTypeId,
          quantity: item.quantity,
        })),
        promoCode: promoCode || undefined,
      });

      set({ orderId: order.id, isProcessing: false });
      return order.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create order';
      set({ error: message, isProcessing: false });
      return null;
    }
  },

  setOrderId: (orderId: string) => {
    set({ orderId });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  setProcessing: (isProcessing: boolean) => {
    set({ isProcessing });
  },

  reset: () => {
    set({
      event: null,
      items: [],
      promoCode: null,
      promoValidation: null,
      subtotal: 0,
      discount: 0,
      fees: 0,
      total: 0,
      currency: useCurrencyStore.getState().config?.defaultCurrency || 'USD',
      orderId: null,
      paymentProvider: null,
      isProcessing: false,
      error: null,
    });
  },
}));

// Selectors
export const useCartItems = () => useCheckoutStore((state) => state.items);
export const useCartTotal = () => useCheckoutStore((state) => state.total);
export const useCartItemCount = () =>
  useCheckoutStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));
