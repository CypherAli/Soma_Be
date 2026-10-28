import {
  modelFromScene,
  type MobileScene,
  type PreparedTarget,
} from './mobile.models';
import { questionsFromModels } from './mobile.catalog';

describe('shared web/mobile model catalogue', () => {
  const scene: MobileScene = {
    slug: 'bo-phan-tim',
    title: { vi: 'Tim theo lớp', en: 'Heart' },
    intro: { vi: 'Nội dung Atlas hiện tại.' },
    groups: ['a', 'b', 'c', 'd'].map((key) => ({
      key,
      name: { vi: `Nhóm ${key}` },
      latin: `Latin ${key}`,
      note: {
        vi: 'Chú giải đã được xuất bản trên web và sử dụng chung trên điện thoại.',
      },
      parts: [`FJ-${key}`, `FJ-${key}-2`],
    })),
  };
  const target: PreparedTarget = {
    id: scene.slug,
    kind: 'atlas',
    system: 'cardiovascular',
    definition: scene,
    thumbnailAsset: 'thumb.jpg',
  };
  it('preserves group identities, exact source parts and web review keys', () => {
    const model = modelFromScene(target, scene, 'atlas.json');
    expect(model.kind).toBe('atlas');
    expect(model.structures[0].meshNames).toEqual(['FJ-a', 'FJ-a-2']);
    expect(model.modelPath).toBe('/mobile/assets/atlas.json');
    expect(model.thumbnailPath).toBe('/mobile/assets/thumb.jpg');
    expect(model.attribution).toContain('CC BY 4.0');
    expect(questionsFromModels([model])[0].itemKey).toBe('model:bo-phan-tim/a');
  });
  it('uses published names and explanations and versions the changed content', () => {
    const original = questionsFromModels([modelFromScene(target, scene, '')]);
    const edited = {
      ...scene,
      title: { vi: 'Tên mới' },
      groups: scene.groups!.map((group, i) =>
        i
          ? group
          : {
              ...group,
              note: { vi: 'Nội dung mới đã được biên tập và xuất bản đầy đủ.' },
            },
      ),
    };
    const model = modelFromScene(target, edited, '');
    expect(model.title).toBe('Tên mới');
    expect(questionsFromModels([model])[0].version).not.toBe(
      original[0].version,
    );
  });
  it('opens an uploaded GLB replacement instead of the previous atlas geometry', () => {
    const replacement = {
      modelFile: '/api/content/assets/abc',
      hotspots: [
        {
          key: 'real-node',
          meshName: 'Actual_node',
          label: { vi: 'Cấu trúc thay thế' },
        },
      ],
    };
    const model = modelFromScene(
      target,
      { ...scene, replacement },
      'atlas.json',
    );
    expect(model.kind).toBe('glb');
    expect(model.structures).toHaveLength(1);
    expect(model.structures[0].meshName).toBe('Actual_node');
    expect(model.modelPath).toBe('/mobile/models/bo-phan-tim/file');
  });
});
