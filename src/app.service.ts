import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'Soma 3D API',
      description:
        'Atlas giải phẫu 3D tương tác — API dữ liệu đa ngữ Việt/Anh/Trung',
      version: '1.0',
      docs: '/api/docs',
      endpoints: [
        '/api/species',
        '/api/anatomy-systems',
        '/api/structures',
        '/api/pathologies',
        '/api/quizzes',
        '/api/collections',
        '/api/health',
      ],
    };
  }
}
