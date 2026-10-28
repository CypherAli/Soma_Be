import {
  Body,
  Controller,
  Get,
  Header,
  Headers,
  NotFoundException,
  Param,
  Post,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MobileService } from './mobile.service';
import { SubmitMobileAttemptDto } from './mobile.dto';

@ApiTags('mobile')
@Controller('mobile')
export class MobileController {
  constructor(private readonly mobile: MobileService) {}

  @Get('bootstrap')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary:
      'Versioned mobile catalogue and practice questions from the same published content as the web',
  })
  bootstrap() {
    return this.mobile.bootstrap();
  }

  @Get('due')
  @ApiBearerAuth()
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({
    summary:
      'Due questions supported by the mobile catalogue, filtered before limiting',
  })
  due(@Headers('authorization') auth?: string) {
    return this.mobile.due(
      auth?.startsWith('Bearer ') ? auth.slice(7) : undefined,
    );
  }

  @Post('attempts')
  @ApiBearerAuth()
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({
    summary:
      'Grade published question answers and persist exactly one attempt per client UUID',
  })
  submit(
    @Body() dto: SubmitMobileAttemptDto,
    @Headers('authorization') auth?: string,
  ) {
    return this.mobile.submit(
      dto,
      auth?.startsWith('Bearer ') ? auth.slice(7) : undefined,
    );
  }

  @Get('models/:id/file')
  @Header('Cache-Control', 'no-cache')
  @Header('X-Content-Type-Options', 'nosniff')
  @ApiOperation({
    summary: 'Read a published GLB model from the shared web catalogue',
  })
  async model(@Param('id') id: string) {
    return new StreamableFile(await this.mobile.modelFile(id), {
      type: 'model/gltf-binary',
    });
  }

  @Get('assets/:key')
  @Header('Cache-Control', 'public, max-age=31536000, immutable')
  @Header('X-Content-Type-Options', 'nosniff')
  @ApiOperation({
    summary:
      'Read a versioned atlas chunk or thumbnail from the prepared asset manifest',
  })
  asset(@Param('key') key: string) {
    const asset = this.mobile.asset(key);
    return new StreamableFile(asset.data, { type: asset.type });
  }

  @Get('viewer/:id')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'no-store')
  @Header('Referrer-Policy', 'no-referrer')
  @Header(
    'Content-Security-Policy',
    "default-src 'none'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'none'",
  )
  @ApiOperation({
    summary: 'Touch viewer for the mobile app; contains no account token',
  })
  viewer(@Param('id') id: string, @Query('theme') theme?: string) {
    return this.mobile.viewer(id, theme === 'dark');
  }

  @Get('runtime/:filename')
  @Header('Cache-Control', 'public, max-age=3600')
  @Header('X-Content-Type-Options', 'nosniff')
  runtime(@Param('filename') filename: string) {
    const types: Record<string, string> = {
      'viewer.js': 'text/javascript',
      'draco_decoder.wasm': 'application/wasm',
      'draco_wasm_wrapper.js': 'text/javascript',
      'draco_decoder.js': 'text/javascript',
    };
    // Reuse the service's allowlist error; arbitrary paths are never read.
    if (!Object.hasOwn(types, filename))
      throw new NotFoundException('Tài nguyên không tồn tại');
    return new StreamableFile(this.mobile.readAsset(`viewer/${filename}`), {
      type: types[filename],
    });
  }
}
