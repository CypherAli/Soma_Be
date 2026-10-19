import "dotenv/config";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

type CatalogSource = { id: string; title: string; publisher: string; year?: number; url: string; file?: string; status: string; licenseNote?: string };
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const catalogPath = process.env.MEDICAL_KB_CATALOG || resolve(process.env.MEDICAL_KB_ROOT || resolve(process.cwd(), "resources", "medical_kb"), "catalog.json");
  const catalog = JSON.parse(await readFile(catalogPath, "utf8")) as { sources: CatalogSource[] };
  for (const source of catalog.sources) {
    await prisma.medicalSource.upsert({
      where: { id: source.id },
      update: {}, // BO owns existing source metadata; sync only adds missing sources.
      create: { id: source.id, title: source.title, publisher: source.publisher, year: source.year, url: source.url, localFile: source.file, status: source.status, licenseNote: source.licenseNote },
    });
  }
  console.log(`Synced ${catalog.sources.length} medical sources.`);
}

main().finally(() => prisma.$disconnect());
