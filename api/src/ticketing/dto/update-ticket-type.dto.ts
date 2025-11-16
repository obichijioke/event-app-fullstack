import { PartialType } from '@nestjs/mapped-types';
import { CreateTicketTypeDto } from './create-ticket-type.dto';

export class UpdateTicketTypeDto extends PartialType(CreateTicketTypeDto) {}

export class UpdateTicketPriceTierDto extends PartialType(
  class {
    startsAt?: string;
    endsAt?: string;
    minQty?: number;
    priceCents?: number;
    feeCents?: number;
  },
) {}
