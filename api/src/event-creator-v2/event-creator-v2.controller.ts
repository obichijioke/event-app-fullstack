import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EventCreatorSectionType } from '@prisma/client';
import { EventCreatorV2Service } from './event-creator-v2.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateDraftDto } from './dto/create-draft.dto';
import { UpdateDraftSectionDto } from './dto/update-draft-section.dto';
import { PublishDraftDto } from './dto/publish-draft.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Event Creator v2')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('creator-v2')
export class EventCreatorV2Controller {
  constructor(private readonly service: EventCreatorV2Service) {}

  @Post('drafts')
  @ApiOperation({ summary: 'Create a new event draft' })
  createDraft(@CurrentUser() user: any, @Body() dto: CreateDraftDto) {
    return this.service.createDraft(user.id, dto);
  }

  @Get('drafts')
  @ApiOperation({ summary: 'List drafts for the current user' })
  listDrafts(@CurrentUser() user: any) {
    return this.service.listDrafts(user.id);
  }

  @Get('drafts/:id')
  @ApiOperation({ summary: 'Get a draft with all section payloads' })
  getDraft(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.getDraft(user.id, id);
  }

  @Put('drafts/:id/sections/:section')
  @ApiOperation({ summary: 'Update a specific section' })
  updateSection(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('section') sectionParam: string,
    @Body() dto: UpdateDraftSectionDto,
  ) {
    const section = this.parseSection(sectionParam);
    return this.service.updateSection(user.id, id, section, dto);
  }

  @Post('drafts/:id/preview')
  @ApiOperation({ summary: 'Generate a preview link for the draft' })
  generatePreview(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.generatePreview(user.id, id);
  }

  @Post('drafts/:id/publish')
  @ApiOperation({ summary: 'Mark a draft as ready or scheduled to publish' })
  publishDraft(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: PublishDraftDto,
  ) {
    return this.service.publishDraft(user.id, id, dto);
  }

  @Post('drafts/:id/duplicate')
  @ApiOperation({ summary: 'Duplicate an existing draft' })
  duplicateDraft(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.duplicateDraft(user.id, id);
  }

  @Get('templates')
  @ApiOperation({ summary: 'List templates for an organization' })
  listTemplates(@CurrentUser() user: any, @Query('orgId') orgId?: string) {
    return this.service.listTemplates(user.id, orgId ?? '');
  }

  @Post('drafts/:id/cover')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a cover image for the draft' })
  uploadCover(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @UploadedFile() file: any,
  ) {
    return this.service.uploadCover(user.id, id, file);
  }

  @Get('slug/availability')
  @ApiOperation({ summary: 'Check slug availability within an organization' })
  checkSlug(@Query('orgId') orgId?: string, @Query('slug') slug?: string) {
    return this.service.checkSlugAvailability(
      orgId ?? '',
      (slug ?? '').toString(),
    );
  }

  @Get('drafts/:id/versions')
  @ApiOperation({ summary: 'List draft versions' })
  listVersions(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.listVersions(user.id, id);
  }

  @Post('drafts/:id/snapshot')
  @ApiOperation({ summary: 'Create a draft snapshot' })
  snapshot(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { section?: EventCreatorSectionType; reason?: string },
  ) {
    return this.service.snapshot(user.id, id, body.section, body.reason);
  }

  @Post('drafts/:id/restore/:versionId')
  @ApiOperation({ summary: 'Restore a draft from a snapshot' })
  restore(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.service.restore(user.id, id, versionId);
  }

  private parseSection(sectionParam: string): EventCreatorSectionType {
    const normalized = sectionParam.toLowerCase();
    const match = Object.values(EventCreatorSectionType).find(
      (value) => value === normalized,
    );

    if (!match) {
      throw new BadRequestException(`Unknown section: ${sectionParam}`);
    }

    return match as EventCreatorSectionType;
  }
}
