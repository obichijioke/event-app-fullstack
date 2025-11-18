import { PartialType } from '@nestjs/mapped-types';
import { CreateFlagDto } from './create-moderation.dto';

export class UpdateFlagDto extends PartialType(CreateFlagDto) {}

export class UpdateModerationActionDto extends PartialType(
  class {
    moderatorId?: string;
    targetKind?: string;
    targetId?: string;
    action?: string;
    notes?: string;
    metadata?: string;
  },
) {}
