// Builds data/lists.json from the notes repo, so the site needs no access to it.
// Usage: node scripts/build-data.mjs [path to notes folder]   (default: ../knowledge-base)
//
// Each list is every note in "30 Library" with that list's order property
// (`learning` or `pleasure`), grouped by `stage`. Literature books take their
// `form` and `region` from the note, or from scripts/literature-tags.tsv.

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const here = dirname(fileURLToPath(import.meta.url));
const notes = process.argv[2] ?? join(here, "..", "..", "knowledge-base");
const library = join(notes, "30 Library");
const topicsDir = join(notes, "10 Topics");

const str = (v) => (v === null || v === undefined ? "" : v instanceof Date ? v.toISOString().slice(0, 10) : String(v).trim());
const link = (v) => str(Array.isArray(v) ? v[0] : v).replace(/^\[\[|\]\]$/g, "").split("|")[0];
const slug = (s) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Topic name -> part of life (Self/People/Work/World), from the topic tree.
const partOf = new Map();
for (const part of readdirSync(topicsDir)) {
  for (const f of readdirSync(join(topicsDir, part))) if (f.endsWith(".md")) partOf.set(f.slice(0, -3), part);
}

const tags = new Map(
  readFileSync(join(here, "literature-tags.tsv"), "utf8")
    .split(/\r?\n/)
    .slice(1)
    .filter(Boolean)
    .map((l) => l.split("\t"))
    .map(([book, form, region]) => [book, { form, region }]),
);

const why = (body) =>
  (/^\*\*Why read it:\*\*[ \t]*(.*)$/m.exec(body)?.[1] ?? "").replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, t, a) => a ?? t).trim();

const lists = { learning: new Map(), pleasure: new Map() };
const ids = new Set();
for (const file of readdirSync(library).filter((f) => f.endsWith(".md"))) {
  const name = file.slice(0, -3);
  const { data, content } = matter(readFileSync(join(library, file), "utf8"));
  for (const prop of ["learning", "pleasure"]) {
    const order = Number(data[prop]);
    if (data[prop] === undefined || data[prop] === null || data[prop] === "" || Number.isNaN(order)) continue;
    const id = slug(name);
    if (ids.has(id)) throw new Error(`Two books share the id "${id}"`);
    ids.add(id);
    const topic = link(data.topic);
    const t = tags.get(name);
    const book = {
      id,
      n: order,
      name,
      author: str(data.author),
      category: prop === "learning" ? partOf.get(topic) ?? "" : str(data.form) || t?.form || "",
      sub: prop === "learning" ? topic : str(data.region) || t?.region || "",
      why: why(content),
    };
    if (!book.category) console.warn(`No ${prop === "learning" ? "area" : "form"} for ${name}`);
    const stage = str(data.stage) || "Unsorted";
    lists[prop].set(stage, [...(lists[prop].get(stage) ?? []), book]);
  }
}

const out = Object.fromEntries(
  Object.entries(lists).map(([prop, stages]) => [
    prop,
    [...stages.entries()]
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
      .map(([stage, books]) => ({ name: stage.replace(/^\d+\s+/, ""), books: books.sort((a, b) => a.n - b.n) })),
  ]),
);

mkdirSync(join(here, "..", "data"), { recursive: true });
writeFileSync(join(here, "..", "data", "lists.json"), JSON.stringify(out, null, 1) + "\n");
for (const [k, v] of Object.entries(out)) console.log(`${k}: ${v.length} stages, ${v.reduce((n, s) => n + s.books.length, 0)} books`);
