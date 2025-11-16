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
import { PromotionsService } from './promotions.service';
import {
  CreatePromotionDto,
  CreatePromoCodeDto,
  ValidatePromoCodeDto,
} from './dto/create-promotion.dto';
import {
  UpdatePromotionDto,
  UpdatePromoCodeDto,
} from './dto/update-promotion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Promotions')
@Controller('promotions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  // Promotion endpoints
  @Post('orgs/:orgId/promotions')
  @ApiOperation({ summary: 'Create a new promotion' })
  @ApiResponse({ status: 201, description: 'Promotion created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  createPromotion(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Body() createPromotionDto: CreatePromotionDto,
  ) {
    return this.promotionsService.createPromotion(
      orgId,
      user.id,
      createPromotionDto,
    );
  }

  @Get('orgs/:orgId/promotions')
  @ApiOperation({ summary: 'Get all promotions for an organization' })
  @ApiResponse({
    status: 200,
    description: 'Promotions retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAllPromotions(@CurrentUser() user: any, @Param('orgId') orgId: string) {
    return this.promotionsService.findAllPromotions(orgId, user.id);
  }

  @Get('orgs/:orgId/promotions/:id')
  @ApiOperation({ summary: 'Get a promotion by ID' })
  @ApiResponse({ status: 200, description: 'Promotion retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Promotion not found' })
  findOnePromotion(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.promotionsService.findOnePromotion(id, orgId, user.id);
  }

  @Patch('orgs/:orgId/promotions/:id')
  @ApiOperation({ summary: 'Update a promotion' })
  @ApiResponse({ status: 200, description: 'Promotion updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Promotion not found' })
  updatePromotion(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() updatePromotionDto: UpdatePromotionDto,
  ) {
    return this.promotionsService.updatePromotion(
      id,
      orgId,
      user.id,
      updatePromotionDto,
    );
  }

  @Delete('orgs/:orgId/promotions/:id')
  @ApiOperation({ summary: 'Delete a promotion' })
  @ApiResponse({ status: 200, description: 'Promotion deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Promotion not found' })
  removePromotion(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.promotionsService.removePromotion(id, orgId, user.id);
  }

  // Promo code endpoints
  @Post('orgs/:orgId/promo-codes')
  @ApiOperation({ summary: 'Create a new promo code' })
  @ApiResponse({ status: 201, description: 'Promo code created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  createPromoCode(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Body() createPromoCodeDto: CreatePromoCodeDto,
  ) {
    return this.promotionsService.createPromoCode(
      orgId,
      user.id,
      createPromoCodeDto,
    );
  }

  @Get('orgs/:orgId/promo-codes')
  @ApiOperation({ summary: 'Get all promo codes for an organization' })
  @ApiResponse({
    status: 200,
    description: 'Promo codes retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAllPromoCodes(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Query('promotionId') promotionId?: string,
  ) {
    return this.promotionsService.findAllPromoCodes(
      orgId,
      user.id,
      promotionId,
    );
  }

  @Patch('orgs/:orgId/promo-codes/:id')
  @ApiOperation({ summary: 'Update a promo code' })
  @ApiResponse({ status: 200, description: 'Promo code updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Promo code not found' })
  updatePromoCode(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() updatePromoCodeDto: UpdatePromoCodeDto,
  ) {
    return this.promotionsService.updatePromoCode(
      id,
      orgId,
      user.id,
      updatePromoCodeDto,
    );
  }

  @Delete('orgs/:orgId/promo-codes/:id')
  @ApiOperation({ summary: 'Delete a promo code' })
  @ApiResponse({ status: 200, description: 'Promo code deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Promo code not found' })
  removePromoCode(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.promotionsService.removePromoCode(id, orgId, user.id);
  }

  // Public endpoint for validating promo codes
  @Post('validate')
  @ApiOperation({ summary: 'Validate a promo code' })
  @ApiResponse({
    status: 200,
    description: 'Promo code validated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Promo code not found' })
  validatePromoCode(
    @CurrentUser() user: any,
    @Body() validatePromoCodeDto: ValidatePromoCodeDto,
  ) {
    return this.promotionsService.validatePromoCode(
      validatePromoCodeDto,
      user.id,
    );
  }
}
