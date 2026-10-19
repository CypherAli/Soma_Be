import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { SearchMedicalKnowledgeDto } from './search-medical-knowledge.dto';

describe('public medical search input', () => {
  const errors = (value: object) =>
    validateSync(plainToInstance(SearchMedicalKnowledgeDto, value));

  it('accepts a query with the default or integer limit', () => {
    expect(errors({ q: 'thần kinh' })).toHaveLength(0);
    expect(errors({ q: 'gan', limit: '6' })).toHaveLength(0);
  });
  for (const limit of ['NaN', 'Infinity', '2.5', '0', '-1', '31']) {
    it(`rejects limit ${limit}`, () => {
      expect(errors({ q: 'gan', limit })).not.toHaveLength(0);
    });
  }
  it('rejects missing, repeated or oversized query fields', () => {
    expect(errors({})).not.toHaveLength(0);
    expect(errors({ q: ['gan', 'tim'] })).not.toHaveLength(0);
    expect(errors({ q: 'a'.repeat(501) })).not.toHaveLength(0);
  });
});
