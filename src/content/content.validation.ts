import { BadRequestException } from '@nestjs/common';

export type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export type ContentDefinition = {
  id: string;
  title: string;
  category: string;
  source: string;
  payload: Record<string, JsonValue>;
};

const unsafeKeys = new Set(['__proto__', 'prototype', 'constructor']);
const identities = new Set(['slug', 'id', 'code']);
const hotspotTemplate = {
  key: '',
  meshName: '',
  offset: [0, 0],
  label: { vi: '', en: '', zh: '' },
  note: { vi: '', en: '', zh: '' },
  latinName: '',
};

export function validateContent(
  value: unknown,
  template: unknown,
  path = '',
  depth = 0,
): void {
  if (depth > 35) throw new BadRequestException('Nội dung lồng quá sâu');
  if (
    template === null &&
    typeof value === 'string' &&
    /\/(?:explanation|description(?:Vi|En|Zh)?|note|sourceNote|latin|context|quote|pageOrSection)$/.test(
      path,
    )
  ) {
    validateContent(value, '', path, depth + 1);
    return;
  }
  if ((value === null || typeof value !== 'object') && value === template)
    return;
  if (value === null && template === null) return;
  if (Array.isArray(template)) {
    if (!Array.isArray(value) || value.length > 20000)
      throw new BadRequestException(`${path}: danh sách không hợp lệ`);
    const emptyTemplate = /\/hotspots$/.test(path)
      ? hotspotTemplate
      : /\/(?:answers|images|explanationImages|frameGroups|fadedGroups)$/.test(
            path,
          )
        ? ''
        : /\/options$/.test(path)
          ? { id: '', text: '' }
          : undefined;
    if (
      /\/(?:offset|position|rotation|target)$/.test(path) &&
      template.length > 0 &&
      template.every((item) => typeof item === 'number') &&
      value.length !== template.length
    )
      throw new BadRequestException(
        `${path}: cần đúng ${template.length} tọa độ`,
      );
    if (template.length === 0 && value.length && !emptyTemplate)
      throw new BadRequestException(`${path}: chưa có mẫu phần tử`);
    if (
      template.length > 0 &&
      value.length === 0 &&
      /\/(?:groups|parts|options|visibleSystems)$/.test(path)
    )
      throw new BadRequestException(`${path}: cần giữ ít nhất một mục`);
    const ids = value
      .filter((item) => item && typeof item === 'object')
      .map(
        (item) =>
          (item as Record<string, unknown>).key ??
          (item as Record<string, unknown>).id,
      )
      .filter((id) => typeof id === 'string');
    if (new Set(ids).size !== ids.length)
      throw new BadRequestException(`${path}: mã mục bị trùng`);
    value.forEach((item, i) => {
      const identity =
        item && typeof item === 'object'
          ? ['id', 'key', 'slug', 'code'].find(
              (key) =>
                typeof (item as Record<string, unknown>)[key] === 'string',
            )
          : undefined;
      const match: unknown = identity
        ? template.find(
            (source) =>
              source &&
              typeof source === 'object' &&
              (source as Record<string, unknown>)[identity] ===
                (item as Record<string, unknown>)[identity],
          )
        : undefined;
      let itemTemplate: unknown =
        match ?? template[i] ?? template[0] ?? emptyTemplate;
      if (
        !match &&
        identity === 'id' &&
        /\/options$/.test(path) &&
        item &&
        typeof item === 'object'
      ) {
        const id = (item as Record<string, unknown>).id;
        if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(id))
          throw new BadRequestException(
            `${path}/${i}/id: mã phương án không hợp lệ`,
          );
        itemTemplate = { ...(itemTemplate as object), id };
      }
      validateContent(item, itemTemplate, `${path}/${i}`, depth + 1);
    });
    return;
  }
  if (template !== null && typeof template === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new BadRequestException(`${path}: cần một nhóm nội dung`);
    const source = template as Record<string, unknown>;
    const input = value as Record<string, unknown>;
    for (const key of Object.keys(input)) {
      if (unsafeKeys.has(key) || !Object.hasOwn(source, key))
        throw new BadRequestException(
          `${path}/${key}: trường không được hỗ trợ`,
        );
    }
    for (const [key, original] of Object.entries(source)) {
      if (!Object.hasOwn(input, key))
        throw new BadRequestException(`${path}/${key}: thiếu trường`);
      if (identities.has(key) && input[key] !== original)
        throw new BadRequestException(
          `${path}/${key}: mã liên kết phải giữ ổn định`,
        );
      validateContent(input[key], original, `${path}/${key}`, depth + 1);
    }
    validateContentRelations(input, source, path);
    return;
  }
  if (
    typeof value !== typeof template ||
    (typeof value === 'number' && !Number.isFinite(value))
  )
    throw new BadRequestException(`${path}: sai kiểu dữ liệu`);
  if (typeof value === 'number') {
    if (/\/percent$/.test(path) && (value < 0 || value > 100))
      throw new BadRequestException(`${path}: tỷ lệ từ 0 đến 100`);
    if (/\/offset\/\d+$/.test(path) && Math.abs(value) > 2000)
      throw new BadRequestException(`${path}: độ lệch nhãn tối đa 2000 px`);
  }
  if (typeof value === 'string') {
    if (value.length > 100000)
      throw new BadRequestException(`${path}: nội dung quá dài`);
    if (typeof template === 'string' && /\{\d+\}/.test(template)) {
      const tokens = (text: string) =>
        [...text.matchAll(/\{\d+\}/g)]
          .map((match) => match[0])
          .sort()
          .join(',');
      if (tokens(value) !== tokens(template))
        throw new BadRequestException(
          `${path}: giữ nguyên các biến {0}, {1} trong câu`,
        );
    }
    if (/^(?:javascript|vbscript|data):/i.test(value.trim()))
      throw new BadRequestException(`${path}: địa chỉ không an toàn`);
    if (
      /\/(?:--[a-z-]+|tint)$/.test(path) &&
      !/^#(?:[a-f0-9]{3}|[a-f0-9]{4}|[a-f0-9]{6}|[a-f0-9]{8})$/i.test(value)
    )
      throw new BadRequestException(`${path}: cần mã màu hex`);
    if (
      /\/view$/.test(path) &&
      typeof template === 'string' &&
      ['front', 'back', 'left', 'right', 'top', 'bottom', 'iso'].includes(
        template,
      ) &&
      !['front', 'back', 'left', 'right', 'top', 'bottom', 'iso'].includes(
        value,
      )
    )
      throw new BadRequestException(`${path}: góc nhìn không được hỗ trợ`);
    if (/\/clip\/axis$/.test(path) && !['x', 'y', 'z'].includes(value))
      throw new BadRequestException(
        `${path}: trục mặt cắt phải là x, y hoặc z`,
      );
    if (
      /\b(?:url|href|src|file|image|img|thumbnail|modelFile)\b/i.test(
        path.split('/').at(-1) ?? '',
      ) &&
      value &&
      !/^(?:\/(?!\/)|https:\/\/|http:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/|$)|#[\w-]*$|mailto:[^\s@]+@[^\s@]+$|tel:\+?[\d ()-]+$)/.test(
        value,
      )
    )
      throw new BadRequestException(
        `${path}: dùng đường dẫn nội bộ, HTTPS, email hoặc điện thoại hợp lệ`,
      );
  }
}

function validateContentRelations(
  input: Record<string, unknown>,
  source: Record<string, unknown>,
  path: string,
) {
  if (!Array.isArray(input.answers) || !Array.isArray(input.options)) return;
  const options = input.options as { id?: unknown; text?: unknown }[];
  const ids = new Set(options.map((option) => option.id));
  if (
    options.length < 2 ||
    options.some(
      (option) =>
        typeof option.id !== 'string' ||
        !option.id.trim() ||
        typeof option.text !== 'string' ||
        !option.text.trim(),
    )
  )
    throw new BadRequestException(
      `${path}/options: cần ít nhất hai phương án có mã và nội dung`,
    );
  if (
    new Set(input.answers).size !== input.answers.length ||
    input.answers.some(
      (answer) => typeof answer !== 'string' || !ids.has(answer),
    )
  )
    throw new BadRequestException(
      `${path}/answers: đáp án phải thuộc các phương án và không trùng`,
    );
  if (
    typeof input.gradable === 'boolean' &&
    input.gradable !== input.answers.length > 0
  )
    throw new BadRequestException(
      `${path}/gradable: trạng thái chấm điểm phải khớp đáp án`,
    );
  for (const key of ['images', 'explanationImages']) {
    if (!Array.isArray(input[key]) || !Array.isArray(source[key])) continue;
    const images = input[key] as unknown[];
    if (
      new Set(images).size !== images.length ||
      images.some(
        (image) =>
          typeof image !== 'string' ||
          !/^(?:\/kb\/dr-lam\/images\/[a-f0-9]{20}\.webp|(?:https?:\/\/[^/]+)?\/api\/content\/assets\/[a-f0-9-]+)$/.test(
            image,
          ),
      )
    )
      throw new BadRequestException(
        `${path}/${key}: đường dẫn ảnh không được hỗ trợ`,
      );
  }
}

export function glbMeshNames(data: Buffer): string[] {
  if (
    data.length < 20 ||
    data.toString('ascii', 0, 4) !== 'glTF' ||
    data.readUInt32LE(4) !== 2 ||
    data.readUInt32LE(8) !== data.length ||
    data.readUInt32LE(16) !== 0x4e4f534a
  )
    throw new BadRequestException('Tệp GLB 2.0 không hợp lệ');
  const length = data.readUInt32LE(12);
  if (length < 2 || length > data.length - 20)
    throw new BadRequestException('Khối JSON của GLB bị hỏng');
  let json: {
    asset?: { version?: string };
    nodes?: { name?: string; mesh?: number }[];
    meshes?: { primitives?: unknown[] }[];
    buffers?: { uri?: string }[];
    images?: { uri?: string }[];
  };
  try {
    json = JSON.parse(data.toString('utf8', 20, 20 + length)) as typeof json;
  } catch {
    throw new BadRequestException('Không đọc được cấu trúc GLB');
  }
  if (
    !json ||
    typeof json !== 'object' ||
    !Array.isArray(json.nodes) ||
    json.nodes.some((node) => !node || typeof node !== 'object') ||
    (json.buffers !== undefined && !Array.isArray(json.buffers)) ||
    (json.images !== undefined && !Array.isArray(json.images))
  )
    throw new BadRequestException('Cấu trúc node/tài nguyên GLB không hợp lệ');
  if (
    [...(json.buffers ?? []), ...(json.images ?? [])].some(
      (item) => item.uri && !item.uri.startsWith('data:'),
    )
  )
    throw new BadRequestException(
      'GLB phải đóng gói đầy đủ, không được phụ thuộc tệp bên ngoài',
    );
  const names = [
    ...new Set(
      (json.nodes ?? [])
        .filter((node) => typeof node.mesh === 'number' && node.name)
        .map((node) => node.name!),
    ),
  ];
  if (!names.length)
    throw new BadRequestException('GLB không chứa mesh có tên');
  if (
    json.asset?.version !== '2.0' ||
    (json.nodes ?? []).some(
      (node) =>
        node.mesh !== undefined &&
        (!Number.isInteger(node.mesh) ||
          node.mesh < 0 ||
          !json.meshes?.[node.mesh]?.primitives?.length),
    )
  )
    throw new BadRequestException(
      'GLB tham chiếu mesh không có dữ liệu hình học',
    );
  return names;
}
