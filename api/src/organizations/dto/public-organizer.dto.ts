import { ApiProperty } from '@nestjs/swagger';

export class PublicOrganizerDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  website?: string | null;

  @ApiProperty({ required: false })
  country?: string | null;

  @ApiProperty()
  followerCount: number;

  @ApiProperty()
  eventCount: number;

  @ApiProperty({ type: [Object] })
  upcomingEvents: Array<{
    id: string;
    title: string;
    startAt: string;
  }>;
}
