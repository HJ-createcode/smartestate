"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

export function TopNav({
  crumb,
  actions,
}: {
  crumb?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="bg-white border-b border-sun-100 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-stone-900 hover:text-sun-700 transition-colors shrink-0"
          >
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-sun-300 text-stone-900 text-sm"
              aria-hidden
            >
              ◉
            </span>
            <span>SmartEstate</span>
          </Link>
          {crumb && (
            <>
              <span className="text-stone-300">/</span>
              <div className="text-sm text-stone-600 truncate">{crumb}</div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {actions}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (status === "loading") {
    return <div className="w-8 h-8" />;
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className="btn-ghost text-xs">
          Se connecter
        </Link>
        <Link href="/signup" className="btn-primary text-xs">
          Créer un compte
        </Link>
      </div>
    );
  }

  const initial = (session.user.name || session.user.email || "?")
    .slice(0, 1)
    .toUpperCase();

  return (
    <div className="flex items-center gap-1">
      {session.user.isAdmin && (
        <Link
          href="/admin"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-sun-100 text-sun-800 hover:bg-sun-200 transition-colors font-medium"
          title="Accès administration"
        >
          <span aria-hidden>🛠</span>
          <span>Admin</span>
        </Link>
      )}
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-sun-50 transition-colors"
        >
          <span className="w-8 h-8 rounded-full bg-sun-200 text-stone-900 flex items-center justify-center font-semibold text-sm">
            {initial}
          </span>
          <span className="text-sm text-stone-800 max-w-[140px] truncate hidden sm:block">
            {session.user.name || session.user.email}
          </span>
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-sun-100 rounded-lg shadow-soft py-1 z-30">
            <div className="px-3 py-2 border-b border-stone-100">
              <div className="text-xs text-stone-500">Connecté avec</div>
              <div className="text-sm text-stone-900 truncate">
                {session.user.email}
              </div>
            </div>
            {session.user.isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-sm text-stone-700 hover:bg-sun-50 sm:hidden"
              >
                🛠 Administration
              </Link>
            )}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full text-left px-3 py-2 text-sm text-stone-700 hover:bg-sun-50"
            >
              Se déconnecter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
