#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const clientId = process.env.KOZOCOM_GOOGLE_OAUTH_CLIENT_ID;
const outputPath = join("dist", "google", "generated", "oauth-client.js");

if (!clientId) {
  console.error("No embedded OAuth client configured.");
  process.exit(0);
}

const contents = `export const EMBEDDED_OAUTH_CLIENT = ${JSON.stringify(
  { client_id: clientId },
  null,
  2,
)};\n`;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, contents);
console.error("Embedded OAuth client into dist.");
