"use client";
import Link from "next/link";
import React from "react";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 font-bold text-stone-900 hover:text-sun-700 transition-colors mb-8"
        >
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-sun-300 text-stone-900 text-base">
            ◉
          </span>
          <span className="text-xl">SmartEstate</span>
        </Link>

        <div className="card">
          <h1 className="text-xl font-semibold text-stone-900">{title}</h1>
          {subtitle && (
            <p className="text-sm text-stone-600 mt-1.5">{subtitle}</p>
          )}
          <div className="mt-6">{children}</div>
        </div>

        {footer && (
          <div className="text-center mt-5 text-sm text-stone-600">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
