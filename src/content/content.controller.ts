import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
  DefaultValuePipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/roles';
import { MinRole } from '../auth/roles.decorator';
import {
  ContentVersionDto,
  RestoreContentDto,
  SaveSiteContentDto,
  ContentLibraryQueryDto,
} from './content.dto';
import { ContentService } from './content.service';

@ApiTags('content')
@Controller('content')
export class PublicContentController {
  constructor(private readonly content: ContentService) {}
  @Get('published')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Published public website documents; never returns drafts',
  })
  published() {
    return this.content.snapshot();
  }

  @Get('preview/:token')
  @Header('Cache-Control', 'private, no-store')
  @Header('Referrer-Policy', 'no-referrer')
  @ApiOperation({
    summary:
      'Read a 15-minute preview snapshot using an opaque capability token',
  })
  preview(@Param('token') token: string) {
    return this.content.previewSnapshot(token);
  }

  @Get('assets/:id')
  @ApiOperation({
    summary: 'Read a validated image or self-contained GLB asset',
  })
  async asset(@Param('id') id: string, @Res() response: Response) {
    const asset = await this.content.asset(id);
    response.set({
      'Content-Type': asset.mime,
      'Content-Length': String(asset.bytes),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    });
    response.send(Buffer.from(asset.data));
  }
}

@ApiTags('content-admin')
@MinRole(UserRole.editor)
@Controller('admin/content')
export class ContentAdminController {
  constructor(private readonly content: ContentService) {}

  @Get()
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({
    name: 'kind',
    required: false,
    enum: [
      'scenes',
      'glb',
      'atlas-scene',
      'atlas-label',
      'collection',
      'content',
    ],
  })
  @ApiQuery({ name: 'scope', required: false, enum: ['title', 'all'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiOperation({
    summary:
      'Search all managed FE content, model scenes, copy, and question banks',
  })
  list(
    @Query('category') category?: string,
    @Query('q') q?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('kind') kind = '',
    @Query('scope') scope = 'title',
  ) {
    return this.content.list(category, q, page, kind, scope);
  }

  @Get('assets')
  @ApiOperation({ summary: 'List uploaded assets and verified mesh names' })
  assets(@Query() query: ContentLibraryQueryDto) {
    return this.content.assets(query.q, query.page, query.kind);
  }

  @Get('models')
  @ApiOperation({ summary: 'Model library with the actual GLB node names' })
  models() {
    return this.content.models();
  }

  @Post('assets')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 100 * 1024 * 1024, files: 1 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: 'Upload a validated image (10 MB) or GLB (100 MB)' })
  upload(
    @CurrentUser() actor: AuthUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.content.upload(actor, file);
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Read source, saved draft, published content and optimistic version',
  })
  detail(@Param('id') id: string) {
    return this.content.detail(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Save a validated draft; does not change the live site',
  })
  save(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() dto: SaveSiteContentDto,
  ) {
    return this.content.save(actor, id, dto);
  }

  @Post(':id/publish')
  @MinRole(UserRole.admin)
  @ApiOperation({
    summary: 'Publish the saved version, atomically with its audit record',
  })
  publish(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() dto: ContentVersionDto,
  ) {
    return this.content.publish(actor, id, dto);
  }

  @Get(':id/history')
  @ApiOperation({
    summary: 'List the 40 most recent revisions, including the original source',
  })
  history(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
  ) {
    return this.content.history(id, page);
  }

  @Get(':id/history/:revisionId')
  @ApiOperation({ summary: 'Inspect a revision before restoring it' })
  revision(@Param('id') id: string, @Param('revisionId') revisionId: string) {
    return this.content.revision(id, revisionId);
  }

  @Post(':id/restore')
  @ApiOperation({
    summary:
      'Restore a previous revision to a new draft; requires publication to go live',
  })
  restore(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() dto: RestoreContentDto,
  ) {
    return this.content.restore(actor, id, dto);
  }

  @Post(':id/preview')
  @ApiOperation({ summary: 'Create a 15-minute preview for the saved draft' })
  preview(@Param('id') id: string, @Body() dto: ContentVersionDto) {
    return this.content.preview(id, dto);
  }
}
