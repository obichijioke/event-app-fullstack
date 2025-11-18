import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { UserFollowsService } from './user-follows.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { CreatePersonalOrganizationDto } from './dto/create-personal-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly userFollowsService: UserFollowsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiResponse({
    status: 201,
    description: 'Organization created successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(
    @CurrentUser() user: any,
    @Body() createOrganizationDto: CreateOrganizationDto,
  ) {
    return this.organizationsService.create(user.id, createOrganizationDto);
  }

  @Post('personal')
  @ApiOperation({
    summary: 'Create or get personal organization',
    description:
      'Creates a simplified personal organization for individual event organizers. If user already has a personal organization, returns the existing one. Personal organizations are auto-approved and have simplified requirements.',
  })
  @ApiResponse({
    status: 201,
    description: 'Personal organization created or retrieved successfully',
  })
  createPersonal(
    @CurrentUser() user: any,
    @Body() dto: CreatePersonalOrganizationDto,
  ) {
    return this.organizationsService.createPersonalOrganization(user.id, dto);
  }

  @Get('default')
  @ApiOperation({
    summary: 'Get or create default organization for user',
    description:
      "Returns the user's first organization, or automatically creates a personal organization if they don't have one. Useful for simplified event creation flows.",
  })
  @ApiResponse({
    status: 200,
    description: 'Default organization retrieved or created successfully',
  })
  getOrCreateDefault(@CurrentUser() user: any) {
    return this.organizationsService.getOrCreatePersonalOrganization(user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all organizations for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Organizations retrieved successfully',
  })
  findAll(@CurrentUser() user: any) {
    return this.organizationsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an organization by ID' })
  @ApiResponse({
    status: 200,
    description: 'Organization retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.organizationsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an organization' })
  @ApiResponse({
    status: 200,
    description: 'Organization updated successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, user.id, updateOrganizationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an organization' })
  @ApiResponse({
    status: 200,
    description: 'Organization deleted successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.organizationsService.remove(id, user.id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add a member to an organization' })
  @ApiResponse({ status: 201, description: 'Member added successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Organization or user not found' })
  @ApiResponse({ status: 409, description: 'User is already a member' })
  addMember(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() addMemberDto: AddMemberDto,
  ) {
    return this.organizationsService.addMember(id, user.id, addMemberDto);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get all members of an organization' })
  @ApiResponse({ status: 200, description: 'Members retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getMembers(@CurrentUser() user: any, @Param('id') id: string) {
    return this.organizationsService.getMembers(id, user.id);
  }

  @Patch(':id/members/:memberId')
  @ApiOperation({ summary: 'Update a member role in an organization' })
  @ApiResponse({ status: 200, description: 'Member role updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Organization or member not found' })
  updateMemberRole(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
  ) {
    return this.organizationsService.updateMemberRole(
      id,
      user.id,
      memberId,
      updateMemberRoleDto,
    );
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remove a member from an organization' })
  @ApiResponse({ status: 200, description: 'Member removed successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Organization or member not found' })
  removeMember(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.organizationsService.removeMember(id, user.id, memberId);
  }

  @Post(':id/follow')
  @ApiOperation({ summary: 'Follow an organization' })
  @ApiResponse({
    status: 201,
    description: 'Successfully followed organization',
  })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  @ApiResponse({
    status: 409,
    description: 'Already following this organization',
  })
  followOrganization(@CurrentUser() user: any, @Param('id') id: string) {
    return this.userFollowsService.follow(user.id, id);
  }

  @Delete(':id/follow')
  @ApiOperation({ summary: 'Unfollow an organization' })
  @ApiResponse({
    status: 200,
    description: 'Successfully unfollowed organization',
  })
  @ApiResponse({ status: 404, description: 'Not following this organization' })
  unfollowOrganization(@CurrentUser() user: any, @Param('id') id: string) {
    return this.userFollowsService.unfollow(user.id, id);
  }

  @Get(':id/followers')
  @ApiOperation({ summary: 'Get followers of an organization' })
  @ApiResponse({ status: 200, description: 'Followers retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  getFollowers(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('includeUsers') includeUsers?: string,
  ) {
    // Only organization owners/managers can see the full list of followers
    const showUsers = includeUsers === 'true';
    return this.userFollowsService.getFollowers(id, showUsers);
  }
}
