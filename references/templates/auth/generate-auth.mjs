# Auth Template Generator
# Usage: node generate-auth.mjs <project-root> [--provider sqlite|pg] [--app-name <name>]
# Generates working auth code from templates into the target project.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const projectRoot = args[0];
if (!projectRoot) {
  console.error("Usage: node generate-auth.mjs <project-root> [--provider sqlite|pg] [--app-name <name>]");
  process.exit(1);
}

let provider = "sqlite";
let appName = "App";
for (let i = 1; i < args.length; i++) {
  if (args[i] === "--provider") provider = args[++i];
  if (args[i] === "--app-name") appName = args[++i];
}

const template = JSON.parse(readFileSync(join(__dirname, "template.json"), "utf8"));
const today = new Date().toISOString().split("T")[0];

function render(content) {
  return content
    .replace(/{{provider}}/g, provider)
    .replace(/{{appName}}/g, appName)
    .replace(/{{date}}/g, today)
    .replace(/{% if google %}[\s\S]*?{% endif %}/g, "");
}

for (const file of template.files) {
  const source = readFileSync(join(__dirname, file.source), "utf8");
  const outputPath = join(projectRoot, file.output);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, render(source));
  console.log(`Generated: ${file.output}`);
}

console.log("\nPost-generate commands to run:");
for (const cmd of template.postGenerate) {
  console.log(`  ${cmd}`);
}
console.log("\nAuth template generated. Run the post-generate commands to complete setup.");
