import { PartialType } from '@nestjs/mapped-types';
import { CreateEventDto } from './create-event.dto';

export class UpdateEventDto extends PartialType(CreateEventDto) {}

export class UpdateEventPoliciesDto extends PartialType(
  class {
    refundPolicy?: string;
    transferAllowed?: boolean;
    transferCutoff?: string;
    resaleAllowed?: boolean;
  },
) {}
