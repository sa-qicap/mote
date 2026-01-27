"use client";

import { signIn } from "next-auth/react";
import { ThemeToggle } from "./theme-toggle";

function MoteIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Central mote */}
      <circle cx="20" cy="20" r="4" fill="currentColor" />

      {/* Surrounding motes - arranged organically */}
      <circle cx="20" cy="8" r="2.5" fill="currentColor" opacity="0.7" />
      <circle cx="30" cy="13" r="2" fill="currentColor" opacity="0.5" />
      <circle cx="32" cy="23" r="2.5" fill="currentColor" opacity="0.6" />
      <circle cx="27" cy="32" r="2" fill="currentColor" opacity="0.5" />
      <circle cx="15" cy="33" r="2.5" fill="currentColor" opacity="0.6" />
      <circle cx="8" cy="25" r="2" fill="currentColor" opacity="0.5" />
      <circle cx="9" cy="14" r="2.5" fill="currentColor" opacity="0.6" />

      {/* Subtle connection lines */}
      <path
        d="M20 16 L20 8 M24 18 L30 13 M24 22 L32 23 M22 24 L27 32 M18 24 L15 33 M16 20 L8 25 M16 18 L9 14"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.25"
      />
    </svg>
  );
}

export function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center gap-3 mb-2">
          <MoteIcon className="w-10 h-10 text-foreground" />
          <h1 className="font-display text-4xl font-medium">Mote</h1>
        </div>
        <p className="text-muted mb-12">Motes of knowledge, connected.</p>

        <p className="text-lg mb-8 leading-relaxed">
          Break down any book into small, digestible concepts.
          Learn at your own pace with a personal tutor by your side.
        </p>

        <button
          onClick={() => signIn()}
          className="btn btn-primary"
        >
          Get Started
        </button>
      </div>

      <div className="absolute bottom-8">
        <MoteIcon className="w-6 h-6 text-muted/40" />
      </div>
    </div>
  );
}
