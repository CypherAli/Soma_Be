import { ConfigService } from '@nestjs/config';
import { ContentService } from './content.service';
import type { PrismaService } from '../prisma/prisma.service';

describe('CMS GLB semantic validation', () => {
  it('rejects a named mesh with invalid primitive data before writing an asset', async () => {
    const transaction = jest.fn();
    const service = new ContentService(
      { $transaction: transaction } as unknown as PrismaService,
      { get: () => undefined } as unknown as ConfigService,
    );
    const raw = Buffer.from(
      JSON.stringify({
        asset: { version: '2.0' },
        meshes: [{ primitives: [{}] }],
        nodes: [{ mesh: 0, name: 'Invalid' }],
      }),
    );
    const json = Buffer.concat([
      raw,
      Buffer.alloc((4 - (raw.length % 4)) % 4, 32),
    ]);
    const buffer = Buffer.alloc(20 + json.length);
    buffer.write('glTF');
    buffer.writeUInt32LE(2, 4);
    buffer.writeUInt32LE(buffer.length, 8);
    buffer.writeUInt32LE(json.length, 12);
    buffer.writeUInt32LE(0x4e4f534a, 16);
    json.copy(buffer, 20);
    await expect(
      service.upload(
        {
          id: 'qa',
          email: 'qa@example.invalid',
          name: 'QA',
          role: 'editor',
        },
        {
          buffer,
          size: buffer.length,
          originalname: 'invalid.glb',
        } as Express.Multer.File,
      ),
    ).rejects.toThrow('GLB không dựng được');
    expect(transaction).not.toHaveBeenCalled();
  });
});
