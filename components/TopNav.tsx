"use client";
import Link from "next/link";

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
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      </div>
    </header>
  );
}
