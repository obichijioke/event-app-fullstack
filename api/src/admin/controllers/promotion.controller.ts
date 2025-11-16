import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
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
import { AdminPromotionService } from '../services/promotion.service';
import { PromotionQueryDto, PromoCodeQueryDto } from '../dto/promotion.dto';

@ApiTags('Admin - Promotions')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PlatformRole.admin)
@ApiBearerAuth()
export class AdminPromotionController {
  constructor(private readonly promotionService: AdminPromotionService) {}

  @Get('promotions')
  @ApiOperation({ summary: 'Get all promotions with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Promotions retrieved successfully' })
  async getPromotions(@Query() query: PromotionQueryDto) {
    const result = await this.promotionService.getPromotions(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('promotions/stats')
  @ApiOperation({ summary: 'Get promotion statistics' })
  @ApiResponse({ status: 200, description: 'Promotion stats retrieved successfully' })
  async getPromotionStats() {
    const stats = await this.promotionService.getPromotionStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('promotions/:id')
  @ApiOperation({ summary: 'Get promotion details' })
  @ApiResponse({ status: 200, description: 'Promotion retrieved successfully' })
  async getPromotion(@Param('id') id: string) {
    const promotion = await this.promotionService.getPromotion(id);
    return {
      success: true,
      data: promotion,
    };
  }

  @Post('promotions/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate promotion' })
  @ApiResponse({ status: 200, description: 'Promotion deactivated successfully' })
  @HttpCode(HttpStatus.OK)
  async deactivatePromotion(@Param('id') id: string) {
    const result = await this.promotionService.deactivatePromotion(id);
    return {
      success: true,
      ...result,
    };
  }

  @Get('promo-codes')
  @ApiOperation({ summary: 'Get all promo codes with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Promo codes retrieved successfully' })
  async getPromoCodes(@Query() query: PromoCodeQueryDto) {
    const result = await this.promotionService.getPromoCodes(query);
    return {
      success: true,
      data: result,
    };
  }
}
