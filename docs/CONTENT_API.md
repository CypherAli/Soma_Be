# Website content API

`ContentModule` implements the shared CMS used by Soma_Bo and Soma_Fe. Apply Prisma migrations and include `resources/cms/catalog.json` in deployment. Override its path with `CMS_CATALOG_PATH` when required.

The contract is generated from FE source with `npm run cms:sync` in Soma_Fe. It contains real source defaults, node names read from GLB JSON chunks, and valid BodyParts3D part IDs. No content seed operation overwrites saved drafts or publications.

Public endpoints:

- `GET /api/content/published`: schema version 2, source contract hash, published documents by stable ID and file-scoped copy templates. Data documents do not produce global replacement rules. No drafts, user data, actor identities, or revision history.
- `GET /api/content/preview/:token`: a 15-minute preview snapshot; only SHA-256 of the capability token is persisted.
- `GET /api/content/assets/:id`: validated binary image/GLB, immutable caching and nosniff.

Authenticated editor endpoints under `/api/admin/content`:

- `GET /`: pagination and category/full-text filters.
- `GET /:id`: source, draft, publication, optimistic version.
- `PUT /:id`: validate and save draft using `{version,payload}`.
- `POST /:id/preview`: snapshot a saved draft using `{version}`.
- `GET /:id/history?page=1`: revisions, 40 per page; source version zero remains accessible on older pages.
- `GET /:id/history/:revisionId`: inspect the selected revision before restoring it.
- `POST /:id/restore`: restore to draft using `{version,revisionId}`.
- `GET /assets?q=&kind=&page=1`: `{items,total,page,pageSize}` with 24 items per page; kind is empty, `image`, or `model`.
- `GET /models`: original models and all uploaded GLBs, independently of library pagination.
- `POST /assets`: multipart upload.
- `POST /:id/publish`: admin or super_admin only, using `{version}`.

Writes use compare-and-swap versions inside a transaction; stale saves return 409. Draft/publication, revision and audit log commit together. Publication validates the current schema again. Uploads are limited to 100 MB for GLB and 10 MB for images; only embedded GLB resources and PNG/JPEG/WebP signatures are accepted. Binary files live in PostgreSQL and are covered by normal database backups.

GLB upload also runs Khronos glTF Validator and rejects geometry/accessor/reference errors before writing an asset. Question schemas validate multi-answer membership, duplicates and grading flags. Nested option arrays accept fresh option IDs while existing source IDs remain immutable. Coordinate tuples retain their source length; clip percentages, axes, views and tints are constrained. Original FE source values are audited separately before deployment.

Run `node scripts/qa-cms.mjs` after building to verify authentication, role separation, publication isolation, preview, revision restore, concurrent writes, binary download and audit against PostgreSQL. Its fixtures have a private catalog and are removed automatically.
