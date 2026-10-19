import { glbMeshNames, validateContent } from './content.validation';

describe('CMS content contract', () => {
  it('allows editors to add a missing explanation without changing its field type', () => {
    expect(() =>
      validateContent(
        { explanation: 'Đã bổ sung giải thích' },
        { explanation: null },
      ),
    ).not.toThrow();
    expect(() =>
      validateContent({ explanation: 5 }, { explanation: null }),
    ).toThrow();
  });
  it('rejects prototype keys, new fields, unsafe URLs and identity changes', () => {
    expect(() => validateContent(JSON.parse('{"__proto__":{}}'), {})).toThrow();
    expect(() => validateContent({ extra: 'x' }, {})).toThrow();
    expect(() =>
      validateContent({ href: 'javascript:alert(1)' }, { href: '/' }),
    ).toThrow();
    expect(() =>
      validateContent({ slug: 'changed' }, { slug: 'stable' }),
    ).toThrow();
  });
  it('allows reorder by stable ID and rejects duplicate or empty required groups', () => {
    const template = [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ];
    expect(() =>
      validateContent([...template].reverse(), template),
    ).not.toThrow();
    expect(() =>
      validateContent([template[0], template[0]], template),
    ).toThrow();
    expect(() =>
      validateContent({ groups: [] }, { groups: template }),
    ).toThrow();
  });
  it('preserves interpolation variables while allowing rewritten sentences', () => {
    expect(() =>
      validateContent('Xem {0} trong {1}', 'Câu {0} / {1}'),
    ).not.toThrow();
    expect(() => validateContent('Xem {0}', 'Câu {0} / {1}')).toThrow();
  });
  it('keeps existing source values usable when editing a different field', () => {
    expect(() =>
      validateContent(
        { title: 'Mới', href: 'mailto:soma@example.com' },
        { title: 'Cũ', href: 'mailto:soma@example.com' },
      ),
    ).not.toThrow();
    expect(() =>
      validateContent({ href: 'mailto:editor@example.com' }, { href: '/' }),
    ).not.toThrow();
  });
  it('accepts uploaded localhost assets but rejects new external HTTP URLs', () => {
    expect(() =>
      validateContent(
        { modelFile: 'http://localhost:4000/api/content/assets/asset' },
        { modelFile: '' },
      ),
    ).not.toThrow();
    expect(() =>
      validateContent({ href: 'http://external.example/path' }, { href: '/' }),
    ).toThrow();
  });
  it('rejects broken GLB headers and external resource dependencies', () => {
    expect(() => glbMeshNames(Buffer.from('fake glb'))).toThrow();
    const json = Buffer.from(
      JSON.stringify({
        nodes: [{ mesh: 0, name: 'Heart' }],
        buffers: [{ uri: 'https://external.test/buffer.bin' }],
      }),
    );
    const data = Buffer.alloc(20 + json.length);
    data.write('glTF');
    data.writeUInt32LE(2, 4);
    data.writeUInt32LE(data.length, 8);
    data.writeUInt32LE(json.length, 12);
    data.writeUInt32LE(0x4e4f534a, 16);
    json.copy(data, 20);
    expect(() => glbMeshNames(data)).toThrow('phụ thuộc');
  });
  it('reads real mesh names from an embedded GLB', () => {
    const json = Buffer.from(
      JSON.stringify({
        asset: { version: '2.0' },
        meshes: [{ primitives: [{}] }],
        nodes: [{ name: 'Root' }, { mesh: 0, name: 'Heart' }],
      }),
    );
    const data = Buffer.alloc(20 + json.length);
    data.write('glTF');
    data.writeUInt32LE(2, 4);
    data.writeUInt32LE(data.length, 8);
    data.writeUInt32LE(json.length, 12);
    data.writeUInt32LE(0x4e4f534a, 16);
    json.copy(data, 20);
    expect(glbMeshNames(data)).toEqual(['Heart']);
  });
  it('rejects missing mesh geometry and invalid coordinate tuples', () => {
    const json = Buffer.from(
      JSON.stringify({
        asset: { version: '2.0' },
        nodes: [{ mesh: 999, name: 'Broken' }],
      }),
    );
    const data = Buffer.alloc(20 + json.length);
    data.write('glTF');
    data.writeUInt32LE(2, 4);
    data.writeUInt32LE(data.length, 8);
    data.writeUInt32LE(json.length, 12);
    data.writeUInt32LE(0x4e4f534a, 16);
    json.copy(data, 20);
    expect(() => glbMeshNames(data)).toThrow('hình học');
    expect(() =>
      validateContent({ offset: [0, 0, 0] }, { offset: [0, 0] }),
    ).toThrow('tọa độ');
    expect(() =>
      validateContent({ view: 'INVALID' }, { view: 'front' }),
    ).toThrow('góc nhìn');
  });
  it('checks multi-answer membership, grading flags and unique answers', () => {
    const source = {
      options: [
        { id: 'A', text: 'A' },
        { id: 'B', text: 'B' },
      ],
      answers: ['A'],
      gradable: true,
    };
    expect(() =>
      validateContent({ ...source, answers: ['X'] }, source),
    ).toThrow('đáp án');
    expect(() =>
      validateContent({ ...source, answers: ['A', 'A'] }, source),
    ).toThrow('đáp án');
    expect(() => validateContent({ ...source, answers: [] }, source)).toThrow(
      'chấm điểm',
    );
    expect(() =>
      validateContent(
        {
          ...source,
          options: [...source.options, { id: 'C', text: 'New' }],
          answers: ['C'],
        },
        source,
      ),
    ).not.toThrow();
  });
});
