import { createHash } from 'node:crypto';

export const EDIT_FIELDS = {
  pathology: [
    'nameVi',
    'nameEn',
    'nameZh',
    'latin',
    'icdCode',
    'severity',
    'clinicalSystem',
    'source',
    'sourcePage',
    'needsReview',
  ],
  pathology_content: [
    'description',
    'clinical',
    'imaging',
    'progression',
    'treatment',
    'machineTranslated',
  ],
  species: ['nameVi', 'nameEn', 'nameZh', 'latin'],
  anatomy_system: ['nameVi', 'nameEn', 'nameZh', 'latin', 'order'],
  structure: [
    'nameVi',
    'nameEn',
    'nameZh',
    'latin',
    'taCode',
    'descriptionVi',
    'descriptionEn',
    'descriptionZh',
  ],
  quiz_question: ['promptVi', 'promptEn', 'promptZh', 'explanation', 'source'],
  quiz_option: ['textVi', 'textEn', 'textZh', 'latin', 'isCorrect'],
  medical_source: [
    'title',
    'publisher',
    'year',
    'url',
    'localFile',
    'status',
    'licenseNote',
  ],
} as const;
export type EditableEntity = keyof typeof EDIT_FIELDS;
export const EDIT_MODELS = {
  pathology: 'pathology',
  pathology_content: 'pathologyContent',
  species: 'species',
  anatomy_system: 'anatomySystem',
  structure: 'structure',
  quiz_question: 'quizQuestion',
  quiz_option: 'quizOption',
  medical_source: 'medicalSource',
} as const;
export function revisionOf(entity: EditableEntity, row: object | null): string {
  if (!row) return 'missing';
  const record = row as Record<string, unknown>;
  return createHash('sha256')
    .update(
      JSON.stringify(
        [
          ...EDIT_FIELDS[entity],
          ...(entity === 'pathology' ? ['structureId'] : []),
        ].map((key) => record[key] ?? null),
      ),
    )
    .digest('hex');
}
export function withRevision<T extends object>(entity: EditableEntity, row: T) {
  return { ...row, revision: revisionOf(entity, row) };
}
