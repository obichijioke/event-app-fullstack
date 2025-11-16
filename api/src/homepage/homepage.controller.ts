import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { HomepageService } from './homepage.service';
import { GetHomepageDto } from './dto/get-homepage.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';

type RequestWithUser = Request & {
  user?: {
    id?: string;
  };
};

@ApiTags('Homepage')
@Controller('homepage')
@UseGuards(OptionalJwtAuthGuard)
export class HomepageController {
  constructor(private readonly homepageService: HomepageService) {}

  @Get()
  @ApiOperation({
    summary:
      'Retrieve aggregated homepage sections (hero, trending, categories, recommendations)',
  })
  @ApiBearerAuth()
  getHomepage(@Query() query: GetHomepageDto, @Req() req: RequestWithUser) {
    const userId = req.user?.id;
    return this.homepageService.getHomepage(query, userId);
  }
}
