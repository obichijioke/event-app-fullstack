import { PartialType } from '@nestjs/mapped-types';
import { CreatePayoutDto } from './create-payout.dto';

export class UpdatePayoutDto extends PartialType(CreatePayoutDto) {}

export class UpdatePayoutAccountDto extends PartialType(
  class {
    provider?: string;
    externalId?: string;
    accountType?: string;
    accountHolderName?: string;
    email?: string;
    defaultAccount?: boolean;
  },
) {}
