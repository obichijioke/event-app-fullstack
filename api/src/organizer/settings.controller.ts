import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OrganizationsService } from '../organizations/organizations.service';
import { UpdateOrganizationDto } from '../organizations/dto/update-organization.dto';
import { AddMemberDto } from '../organizations/dto/add-member.dto';
import { UpdateMemberRoleDto } from '../organizations/dto/update-member-role.dto';

@ApiTags('Organizer Settings')
@Controller('organizer/organization')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizerSettingsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get organization profile' })
  @ApiQuery({ name: 'orgId', required: true })
  getOrganization(@CurrentUser() user: any, @Query('orgId') orgId: string) {
    return this.organizationsService.findOne(orgId, user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update organization profile' })
  @ApiQuery({ name: 'orgId', required: true })
  updateOrganization(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(orgId, user.id, dto);
  }

  @Get('members')
  @ApiOperation({ summary: 'List organization team members' })
  @ApiQuery({ name: 'orgId', required: true })
  getMembers(@CurrentUser() user: any, @Query('orgId') orgId: string) {
    return this.organizationsService.getMembers(orgId, user.id);
  }

  @Post('members')
  @ApiOperation({ summary: 'Invite a team member' })
  @ApiQuery({ name: 'orgId', required: true })
  addMember(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.organizationsService.addMember(orgId, user.id, dto);
  }

  @Patch('members/:memberId')
  @ApiOperation({ summary: 'Update a team member role' })
  @ApiQuery({ name: 'orgId', required: true })
  updateMember(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.organizationsService.updateMemberRole(
      orgId,
      user.id,
      memberId,
      dto,
    );
  }

  @Delete('members/:memberId')
  @ApiOperation({ summary: 'Remove a team member' })
  @ApiQuery({ name: 'orgId', required: true })
  removeMember(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.organizationsService.removeMember(orgId, user.id, memberId);
  }
}
