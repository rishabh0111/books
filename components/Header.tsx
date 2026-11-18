"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LISTS, bookIds, type ListKey } from "@/lib/data";
import { useProgress } from "./Progress";
import ThemeToggle from "./ThemeToggle";
import Icon from "./Icon";

export default function Header() {
  const pathname = usePathname();
  const { read, ready, user, canSignIn, signIn, signOut } = useProgress();
  const count = (k: ListKey) => bookIds(k).filter((id) => read[id]).length;

  return (
    <header className="top">
      <div className="top-inner">
        <Link href="/" className="brand" aria-label="Books, home">
          {/* The mark: an open book with the current-book ribbon. */}
          <svg viewBox="0 0 24 24" className="mark" aria-hidden fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round">
            <path d="M12 6.5C10 5 7 4.5 3 5v13c4-.5 7 0 9 1.5 2-1.5 5-2 9-1.5V5c-4-.5-7 0-9 1.5z" />
            <path d="M12 6.5v13" />
            <path d="M15 5.4V11l1.75-1.3L18.5 11V5.1" fill="currentColor" strokeWidth={1.2} />
          </svg>
          <span className="brand-name">Books</span>
        </Link>
        <nav className="tabs" aria-label="Book lists">
          {(Object.keys(LISTS) as ListKey[]).map((k) => {
            const total = bookIds(k).length;
            const done = count(k);
            const current = pathname.replace(/\/$/, "") === LISTS[k].href.replace(/\/$/, "");
            return (
              <Link key={k} href={LISTS[k].href} className="tab" aria-current={current ? "page" : undefined}>
                {LISTS[k].title}
                <span className="tab-count num" aria-label={`${done} of ${total} read`}>
                  {ready ? done : "–"}/{total}
                </span>
              </Link>
            );
          })}
        </nav>
        <ThemeToggle />
        {canSignIn &&
          (user ? (
            <button className="account" onClick={signOut} title={`Signed in as ${user.name}. Sign out`} aria-label={`Signed in as ${user.name}. Sign out`}>
              {user.photo ? <img src={user.photo} alt="" referrerPolicy="no-referrer" /> : <span>{user.name.slice(0, 1)}</span>}
            </button>
          ) : (
            <button className="sign-in" onClick={signIn}>
              <Icon name="login" size={15} /> Sign in
            </button>
          ))}
      </div>
    </header>
  );
}
