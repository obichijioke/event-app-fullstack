import { ApiProperty } from '@nestjs/swagger';

export class FollowOrganizationResponseDto {
  @ApiProperty({ description: 'Follow record ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Organization ID' })
  organizationId: string;

  @ApiProperty({ description: 'Follow creation timestamp' })
  createdAt: Date;
}

export class FollowerCountResponseDto {
  @ApiProperty({ description: 'Number of followers' })
  count: number;
}

export class FollowersListResponseDto {
  @ApiProperty({ description: 'Total number of followers' })
  total: number;

  @ApiProperty({ description: 'List of followers', type: [Object] })
  followers: {
    id: string;
    userId: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
    createdAt: Date;
  }[];
}
