import type { ContentDefinition, JsonValue } from './content.validation';

export type ContentKind =
  'glb' | 'atlas-scene' | 'atlas-label' | 'collection' | 'content';
export type ContentSearchEntry = {
  title: string;
  kind: ContentKind;
  identifier: string;
  names: string[];
  body: string;
};

export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function record(value: JsonValue | undefined): Record<string, JsonValue> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value
    : {};
}

function strings(value: JsonValue | undefined): string[] {
  if (typeof value === 'string') return [value];
  if (!value || typeof value !== 'object') return [];
  return Object.values(value).flatMap(strings);
}

export function contentSearchEntry(
  doc: ContentDefinition,
  payload = doc.payload,
): ContentSearchEntry {
  const value = record(payload.value);
  const name = value.title ?? value.name;
  const localized = record(name);
  const titles = [
    localized.vi,
    localized.en,
    localized.zh,
    ...strings(name),
  ].filter((item): item is string => typeof item === 'string');
  let title = titles.find((name) => name.trim()) ?? doc.title;
  const kind: ContentKind = doc.id.startsWith('atlas:')
    ? 'atlas-label'
    : doc.source.includes('humanAtlas/scenes/')
      ? 'atlas-scene'
      : typeof value.modelFile === 'string'
        ? 'glb'
        : doc.category === 'models'
          ? 'collection'
          : 'content';
  if (kind === 'collection') {
    const collectionTitles: Record<string, string> = {
      auditoryScenes: 'Bộ mô hình hệ thính giác',
      reproductiveScenes: 'Bộ mô hình hệ sinh sản nam',
      generatedVetModels: 'Bộ mô hình động vật',
    };
    title = collectionTitles[doc.title] ?? title;
    const visitNames = (node: JsonValue | undefined): void => {
      if (!node || typeof node !== 'object') return;
      const object = record(node);
      titles.push(...strings(object.title ?? object.name));
      Object.values(node).forEach(visitNames);
    };
    visitNames(payload.value);
  }
  return {
    title,
    kind,
    identifier:
      typeof value.slug === 'string'
        ? value.slug
        : typeof value.id === 'string'
          ? value.id
          : '',
    names: [
      title,
      ...titles,
      ...strings(value.latin ?? value.latinName),
      ...strings(value.label),
    ],
    // Index visible strings, not JSON property names, file paths or source code.
    body: normalizeSearch(strings(payload.value ?? payload.texts).join(' ')),
  };
}

function fieldScore(field: string, query: string, prefix: boolean): number {
  const text = normalizeSearch(field);
  if (text === query) return 100;
  if (` ${text} `.includes(` ${query} `))
    return text.startsWith(query) ? 90 : 80;
  const words = text.split(' ');
  const tokens = query.split(' ');
  if (
    tokens.every((token, i) =>
      words.some(
        (word) =>
          word === token ||
          (prefix &&
            i === tokens.length - 1 &&
            token.length >= 2 &&
            word.startsWith(token)),
      ),
    )
  )
    return 60;
  if (/\p{Script=Han}/u.test(query) && text.includes(query)) return 50;
  return 0;
}

export function contentSearchScore(
  entry: ContentSearchEntry,
  query: string,
  scope = 'title',
): number {
  const needle = normalizeSearch(query);
  if (!needle) return 1;
  const nameScore = Math.max(
    0,
    ...entry.names.map((name, i) => {
      const score = fieldScore(name, needle, true);
      return score && i === 0 ? score + 10 : score;
    }),
  );
  if (nameScore) return nameScore + (entry.kind === 'collection' ? 20 : 100);
  const identifierScore = fieldScore(entry.identifier, needle, true);
  if (identifierScore) return identifierScore;
  return scope === 'all' && fieldScore(entry.body, needle, false) ? 10 : 0;
}

export function matchesContentKind(
  entry: ContentSearchEntry,
  kind: string,
): boolean {
  return (
    !kind ||
    (kind === 'scenes'
      ? ['glb', 'atlas-scene'].includes(entry.kind)
      : entry.kind === kind)
  );
}
