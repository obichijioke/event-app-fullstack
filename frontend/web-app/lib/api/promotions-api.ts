import { apiClient } from './client';

export interface ValidatePromoCodeDto {
  code: string;
  eventId: string;
  ticketTypeIds?: string[];
  orderAmount?: number;
}

export interface ValidatePromoCodeResponse {
  valid: boolean;
  isValid?: boolean;
  promotion?: {
    id: string;
    name: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
  };
  discountAmount?: number;
  message?: string;
}

export const promotionsApi = {
  async validatePromoCode(data: ValidatePromoCodeDto): Promise<ValidatePromoCodeResponse> {
    return apiClient.post<ValidatePromoCodeResponse>('/promotions/validate', data);
  },
};
