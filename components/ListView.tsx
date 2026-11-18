"use client";

import { useState } from "react";
import { LISTS, type Book, type ListKey } from "@/lib/data";
import { useProgress } from "./Progress";
import Icon from "./Icon";

type Show = "all" | "unread" | "read";

const rowId = (b: Book) => "book-" + b.id;
const key = (a: string) => a.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function day(iso: string) {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(sameYear ? {} : { year: "2-digit" }) });
}

export default function ListView({ list }: { list: ListKey }) {
  const { title, stages, categories, categoryLabel } = LISTS[list];
  const { read, ready, toggle, error } = useProgress();
  const isRead = (b: Book) => Boolean(read[b.id]);

  const all = stages.flatMap((s) => s.books);
  const cats = categories.filter((g) => all.some((b) => b.category === g));
  const readCount = all.filter(isRead).length;
  const currentBook = ready ? all.find((b) => !isRead(b)) : undefined;
  const currentStage = ready ? Math.max(0, stages.findIndex((s) => s.books.some((b) => !isRead(b)))) : -1;

  const [show, setShow] = useState<Show>("all");
  const [cat, setCat] = useState<string | null>(null);
  const [sub, setSub] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const match = (b: Book) =>
    (show === "all" || (show === "unread" ? !isRead(b) : isRead(b))) &&
    (!cat || b.category === cat) &&
    (!sub || b.sub === sub) &&
    (!q.trim() || `${b.name} ${b.author} ${b.sub}`.toLowerCase().includes(q.trim().toLowerCase()));
  const filtering = show !== "all" || !!cat || !!sub || !!q.trim();
  const shown = stages.map((s, i) => ({ ...s, i, rows: s.books.filter(match) }));
  const shownCount = shown.reduce((n, s) => n + s.rows.length, 0);
  const reset = () => (setShow("all"), setCat(null), setSub(null), setQ(""));
  const counts: Record<Show, number> = { all: all.length, unread: all.length - readCount, read: readCount };

  return (
    <div className="page">
      {/* The tab names the page; the heading stays for screen readers. */}
      <h1 className="sr-only">{title}</h1>

      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}

      <div className="filters">
        <div className="scroller">
          <div className="segmented" role="group" aria-label="Show">
            {(
              [
                ["all", "All"],
                ["unread", "To read"],
                ["read", "Read"],
              ] as [Show, string][]
            ).map(([k, label]) => (
              <button key={k} aria-pressed={show === k} onClick={() => setShow(k)}>
                {label} <span className="count num">{counts[k]}</span>
              </button>
            ))}
          </div>
          <div className="cat-filters" role="group" aria-label={categoryLabel}>
            {cats.map((g) => (
              <button key={g} className={`cat-filter c-${key(g)}`} aria-pressed={cat === g} onClick={() => (setSub(null), setCat(cat === g ? null : g))}>
                <i className="dot" aria-hidden />
                {g} <span className="count num">{all.filter((b) => b.category === g).length}</span>
              </button>
            ))}
          </div>
        </div>
        <label className={`find${q ? " has-value" : ""}`}>
          <Icon name="search" size={16} />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find" aria-label="Find a title, author or topic" />
        </label>
      </div>

      {filtering && (
        <p className="filter-note">
          <span className="num">{shownCount}</span> of <span className="num">{all.length}</span>
          {sub && <span className="sub-pill">{sub}</span>}
          <button className="clear" onClick={reset}>
            <Icon name="x" size={13} /> Clear
          </button>
        </p>
      )}
      {filtering && shownCount === 0 && <p className="empty">No books match.</p>}

      {shown.map((s) => {
        if (filtering && s.rows.length === 0) return null;
        const done = s.books.filter(isRead).length;
        const finished = done === s.books.length;
        return (
          <section key={s.name} className={`stage${s.i === currentStage ? " is-current" : ""}${finished ? " is-done" : ""}`} aria-labelledby={`stage-${s.i + 1}-h`}>
            <div className="stage-head">
              <span className="stage-num num" aria-hidden>
                {s.i + 1}
              </span>
              <h2 id={`stage-${s.i + 1}-h`}>
                <span className="sr-only">Stage {s.i + 1}: </span>
                {s.name}
                {finished && <Icon name="check" size={16} />}
              </h2>
              <span className="stage-count num" aria-label={`${done} of ${s.books.length} read`}>
                {done}/{s.books.length}
              </span>
            </div>

            {/* The stage's mix of categories; each colour is solid for books read, faint for books to read. */}
            <div
              className="mix"
              role="img"
              aria-label={`${categoryLabel}: ${cats
                .map((g) => [g, s.books.filter((b) => b.category === g)] as const)
                .filter(([, bs]) => bs.length)
                .map(([g, bs]) => `${g} ${bs.filter(isRead).length} of ${bs.length} read`)
                .join(", ")}`}
            >
              {cats.map((g) => {
                const bs = s.books.filter((b) => b.category === g);
                if (!bs.length) return null;
                const r = bs.filter(isRead).length;
                return (
                  <span key={g} className={`mix-seg c-${key(g)}`} style={{ flexGrow: bs.length }} title={`${g} · ${r} of ${bs.length} read`}>
                    <span className="mix-read" style={{ width: `${(r / bs.length) * 100}%` }} />
                  </span>
                );
              })}
            </div>

            <ul className="rows">
              {s.rows.map((b) => {
                const isNow = b.id === currentBook?.id;
                const done = isRead(b);
                return (
                  <li key={b.id} id={rowId(b)} className={`row${done ? " is-read" : ""}${isNow ? " is-now" : ""}`}>
                    <span className="n num">
                      {isNow ? (
                        <span className="now" title="Current book" aria-label={`Current book, number ${b.n}`}>
                          <Icon name="bookmark" size={16} />
                        </span>
                      ) : (
                        b.n
                      )}
                    </span>
                    <div className="main">
                      <p className="b-title">{b.name}</p>
                      <p className="b-author">{b.author}</p>
                      {isNow && b.why && <p className="b-why">{b.why}</p>}
                    </div>
                    <div className="tags">
                      {b.category && <span className={`cat-pill c-${key(b.category)}`}>{b.category}</span>}
                      {b.sub && (
                        <button className="sub-pill" aria-pressed={sub === b.sub} onClick={() => (setCat(null), setSub(sub === b.sub ? null : b.sub))} title={`Show only ${b.sub}`}>
                          {b.sub}
                        </button>
                      )}
                    </div>
                    <div className="ctl">
                      <button
                        className="check"
                        role="checkbox"
                        aria-checked={done}
                        disabled={!ready}
                        onClick={() => toggle(b.id)}
                        title={done ? `Read on ${day(read[b.id])}. Click to unmark` : "Mark as read"}
                        aria-label={`${b.name}: ${done ? "read" : "not read"}`}
                      >
                        <span className="box" aria-hidden>
                          <Icon name="check" size={15} />
                        </span>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
