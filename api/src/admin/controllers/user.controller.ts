import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PlatformRole } from '@prisma/client';
import { AdminUserService } from '../services/user.service';
import { UserQueryDto } from '../dto/query-params.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { GrantRoleDto, RevokeRoleDto } from '../dto/roles.dto';

@ApiTags('Admin - Users')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PlatformRole.admin)
@ApiBearerAuth()
export class AdminUserController {
  constructor(private readonly userService: AdminUserService) {}

  @Get()
  @ApiOperation({ summary: 'List all users with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getUsers(@Query() query: UserQueryDto) {
    const result = await this.userService.findAll(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  async getUser(@Param('id') id: string) {
    const user = await this.userService.findOne(id);
    return {
      success: true,
      data: user,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user details' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const user = await this.userService.update(id, dto);
    return {
      success: true,
      data: user,
    };
  }

  @Post(':id/suspend')
  @ApiOperation({ summary: 'Suspend user account' })
  @ApiResponse({ status: 200, description: 'User suspended successfully' })
  @HttpCode(HttpStatus.OK)
  async suspendUser(@Param('id') id: string) {
    const user = await this.userService.suspend(id);
    return {
      success: true,
      data: user,
    };
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate suspended user account' })
  @ApiResponse({ status: 200, description: 'User activated successfully' })
  @HttpCode(HttpStatus.OK)
  async activateUser(@Param('id') id: string) {
    const user = await this.userService.activate(id);
    return {
      success: true,
      data: user,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user (soft delete)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id') id: string) {
    const result = await this.userService.remove(id);
    return {
      success: true,
      ...result,
    };
  }

  @Post(':id/grant-role')
  @ApiOperation({ summary: 'Grant platform role to user' })
  @ApiResponse({ status: 200, description: 'Role granted successfully' })
  @HttpCode(HttpStatus.OK)
  async grantRole(@Param('id') id: string, @Body() dto: GrantRoleDto) {
    const user = await this.userService.grantRole(id, dto.role);
    return {
      success: true,
      data: user,
    };
  }

  @Post(':id/revoke-role')
  @ApiOperation({ summary: 'Revoke platform role from user' })
  @ApiResponse({ status: 200, description: 'Role revoked successfully' })
  @HttpCode(HttpStatus.OK)
  async revokeRole(@Param('id') id: string, @Body() dto: RevokeRoleDto) {
    const user = await this.userService.revokeRole(id, dto.fallback);
    return {
      success: true,
      data: user,
    };
  }
}
