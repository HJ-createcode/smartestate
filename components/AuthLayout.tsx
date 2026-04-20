"use client";
import React from "react";
import { TopNav } from "@/components/TopNav";

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
    <div className="min-h-screen bg-cream-50 flex flex-col">
      <TopNav />
      <div className="flex-1 flex items-start justify-center px-4 pt-10 pb-12 sm:pt-16">
        <div className="w-full max-w-md">
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
    </div>
  );
}
