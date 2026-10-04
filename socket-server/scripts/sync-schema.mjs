// Copies next-app/prisma/schema.prisma (the single source of truth) into this
// package so both services generate an identical Prisma client.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "../next-app/prisma/schema.prisma");
const target = resolve(root, "prisma/schema.prisma");

const HEADER = `// ---------------------------------------------------------------------------
// GENERATED COPY — DO NOT EDIT.
// Source of truth: next-app/prisma/schema.prisma (migrations live there).
// Keep in sync with \`yarn sync-schema\` whenever the source schema changes.
// ---------------------------------------------------------------------------

`;

writeFileSync(target, HEADER + readFileSync(source, "utf8"));
process.stdout.write(`synced ${source} -> ${target}\n`);
