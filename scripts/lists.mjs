// Reads data/non-fiction.yaml and data/literature.yaml, checks them, and writes
// lib/lists.generated.json for the site. Runs before every dev server and build,
// so a mistake in the lists stops the deploy instead of breaking the live page.

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const LISTS = {
  learning: { file: "non-fiction.yaml", category: "area", sub: "topic", allowed: ["Self", "People", "Work", "World"] },
  pleasure: { file: "literature.yaml", category: "form", sub: "region", allowed: ["Novel", "Short stories", "Play", "Poetry", "Epic & myth"] },
};

const errors = [];
const seen = new Map();
const out = {};

for (const [key, spec] of Object.entries(LISTS)) {
  const where = `data/${spec.file}`;
  let stages;
  try {
    stages = YAML.parse(readFileSync(join(root, "data", spec.file), "utf8"));
  } catch (e) {
    errors.push(`${where}: not valid YAML (${e.message.split("\n")[0]})`);
    continue;
  }
  if (!Array.isArray(stages) || !stages.length) {
    errors.push(`${where}: expected a list of stages`);
    continue;
  }
  let n = 0;
  out[key] = stages.map((s, i) => {
    const at = `${where}, stage ${i + 1}`;
    if (!s?.stage) errors.push(`${at}: missing "stage" name`);
    if (!Array.isArray(s?.books) || !s.books.length) errors.push(`${at} (${s?.stage ?? "?"}): no books`);
    return {
      name: String(s?.stage ?? ""),
      books: (s?.books ?? []).map((b, j) => {
        const bat = `${at}, book ${j + 1} (${b?.title ?? "untitled"})`;
        for (const field of ["id", "title", "author", spec.category])
          if (!b?.[field] || typeof b[field] !== "string") errors.push(`${bat}: missing "${field}"`);
        if (b?.id && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(b.id)) errors.push(`${bat}: id "${b.id}" must be lowercase-with-dashes`);
        if (b?.id && seen.has(b.id)) errors.push(`${bat}: id "${b.id}" is already used by ${seen.get(b.id)}`);
        if (b?.id) seen.set(b.id, `"${b.title}" in ${spec.file}`);
        if (b?.[spec.category] && !spec.allowed.includes(b[spec.category]))
          errors.push(`${bat}: ${spec.category} "${b[spec.category]}" must be one of ${spec.allowed.join(", ")}`);
        const extra = Object.keys(b ?? {}).filter((k) => !["id", "title", "author", spec.category, spec.sub, "why"].includes(k));
        if (extra.length) errors.push(`${bat}: unknown field(s) ${extra.join(", ")}`);
        n += 1;
        return {
          id: b?.id ?? "",
          n,
          name: b?.title ?? "",
          author: b?.author ?? "",
          category: b?.[spec.category] ?? "",
          sub: b?.[spec.sub] ? String(b[spec.sub]) : "",
          why: b?.why ? String(b.why) : "",
        };
      }),
    };
  });
}

if (errors.length) {
  console.error(`The book lists have ${errors.length} problem(s):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

writeFileSync(join(root, "lib", "lists.generated.json"), JSON.stringify(out) + "\n");
for (const [k, v] of Object.entries(out)) console.log(`${LISTS[k].file}: ${v.length} stages, ${v.reduce((a, s) => a + s.books.length, 0)} books`);
