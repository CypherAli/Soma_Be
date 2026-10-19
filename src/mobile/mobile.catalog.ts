import { createHash } from 'node:crypto';

export const MOBILE_MODELS = [
  { id: 'ban-tay', file: 'hand_bones.glb', system: 'skeletal' },
  { id: 'giai-phau-tim', file: 'heart_anatomy.glb', system: 'cardiovascular' },
  { id: 'giai-phau-phoi', file: 'lung_anatomy.glb', system: 'visceral' },
  { id: 'giai-phau-gan', file: 'liver_anatomy.glb', system: 'visceral' },
  {
    id: 'than-nao-day-so',
    file: 'brainstem_cranial_nerves.glb',
    system: 'nervous',
  },
] as const;

export type MobileModelId = (typeof MOBILE_MODELS)[number]['id'];
export type Structure = {
  id: string;
  meshName: string;
  label: string;
  english: string;
  latin: string;
  note: string;
};
export type MobileModel = {
  id: string;
  title: string;
  english: string;
  description: string;
  system: string;
  modelPath: string;
  viewerPath: string;
  structures: Structure[];
  attribution: string;
};
export type MobileQuestion = {
  itemKey: string;
  source: 'model';
  scope: string;
  modelId: string;
  meshName: string;
  prompt: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
  citation: string;
  version: string;
};

export function digest(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

/** Uses the same model:<scene>/<hotspot> identity as the existing web review queue. */
export function questionsFromModels(models: MobileModel[]): MobileQuestion[] {
  const result: MobileQuestion[] = [];
  for (const model of models) {
    for (const fact of model.structures) {
      if (!fact.latin || fact.note.length < 30) continue;
      const seen = new Set([fact.latin.trim().toLowerCase()]);
      const distractors = model.structures
        .filter((other) => {
          const key = other.latin.trim().toLowerCase();
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, 3);
      if (distractors.length < 3) continue;
      const value = {
        itemKey: `model:${model.id}/${fact.id}`,
        source: 'model' as const,
        scope: model.system,
        modelId: model.id,
        meshName: fact.meshName,
        prompt: `Tên Latin của “${fact.label}” là gì?`,
        options: [
          { id: fact.id, text: fact.latin },
          ...distractors.map((d) => ({ id: d.id, text: d.latin })),
        ],
        correctOptionId: fact.id,
        explanation: fact.note,
        citation: `Thư viện Soma · ${model.title}. Thuật ngữ Terminologia Anatomica; mô hình Z-Anatomy (CC-BY-SA).`,
      };
      result.push({ ...value, version: digest(value) });
    }
  }
  return result;
}
