import type { MobileModel, Structure } from './mobile.catalog';

export type Localized = { vi?: string; en?: string; zh?: string };
export type MobileScene = {
  slug: string;
  title: Localized;
  description?: Localized;
  intro?: Localized;
  system?: string;
  modelFile?: string;
  hotspots?: {
    key: string;
    meshName: string;
    label?: Localized;
    latinName?: string;
    note?: Localized;
  }[];
  groups?: {
    key: string;
    name: Localized;
    latin?: string;
    note?: Localized;
    parts: string[];
    tint?: string;
    landmarks?: {
      name: Localized;
      latin: string;
      note: Localized;
      source: string;
    }[];
  }[];
  replacement?: {
    modelFile: string;
    hotspots: NonNullable<MobileScene['hotspots']>;
  } | null;
  layers?: { key: string; name: Localized; groups: string[]; on?: boolean }[];
  frameGroups?: string[];
  fadedGroups?: string[];
  clip?: { axis: 'x' | 'y' | 'z'; percent: number; keepPositive?: boolean };
  view?: string;
};
export type PreparedTarget = {
  id: string;
  kind: 'atlas' | 'glb';
  sourceId?: string;
  system: string;
  definition: MobileScene;
  asset?: string;
  thumbnailAsset?: string;
};
export type PreparedManifest = {
  schemaVersion: number;
  models: PreparedTarget[];
  atlasKey: string;
  assets: Record<
    string,
    {
      file: string;
      type: string;
      bytes: number;
      sha256: string;
      source: string;
    }
  >;
  parts: Record<string, Structure & { category: string }>;
  systems: { id: string; name: string; color: string }[];
};

export function modelFromScene(
  target: PreparedTarget,
  scene: MobileScene,
  atlasKey: string,
): MobileModel {
  const atlas = target.kind === 'atlas' && !scene.replacement?.modelFile;
  const structures: Structure[] = atlas
    ? (scene.groups ?? [])
        .filter((group) => group.parts.length && group.name?.vi)
        .map((group) => ({
          id: group.key,
          meshName: group.key,
          meshNames: group.parts,
          label: group.name.vi!,
          english: group.name.en ?? '',
          latin: group.latin ?? '',
          note: group.note?.vi ?? '',
          landmarks: group.landmarks?.map((item) => ({
            label: item.name.vi ?? '',
            latin: item.latin,
            note: item.note.vi ?? '',
            source: item.source,
          })),
        }))
    : (scene.replacement?.hotspots ?? scene.hotspots ?? [])
        .filter((h) => h.key && h.meshName && h.label?.vi)
        .map((h) => ({
          id: h.key,
          meshName: h.meshName,
          label: h.label!.vi!,
          english: h.label?.en ?? '',
          latin: h.latinName ?? '',
          note: h.note?.vi ?? '',
        }));
  return {
    id: target.id,
    kind: atlas ? 'atlas' : 'glb',
    title: scene.title.vi ?? '',
    english: scene.title.en ?? '',
    description: (scene.intro ?? scene.description)?.vi ?? '',
    system: scene.system ?? target.system,
    modelPath: atlas
      ? `/mobile/assets/${atlasKey}`
      : `/mobile/models/${target.id}/file`,
    viewerPath: `/mobile/viewer/${target.id}`,
    structures,
    ...(target.thumbnailAsset
      ? { thumbnailPath: `/mobile/assets/${target.thumbnailAsset}` }
      : {}),
    attribution: atlas
      ? 'BodyParts3D 4.0 © Database Center for Life Science · CC BY 4.0. Nội dung và thuật ngữ: thư viện Soma.'
      : 'Z-Anatomy / BodyParts3D · CC-BY-SA. Nội dung và thuật ngữ: thư viện Soma.',
  };
}
