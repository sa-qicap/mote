"use client";

import { signIn } from "next-auth/react";
import { ThemeToggle } from "./theme-toggle";

export function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      <div className="text-center max-w-md">
        <h1 className="font-display text-4xl mb-2">Mote</h1>
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

      <div className="absolute bottom-8 text-2xl">🐱</div>
    </div>
  );
}
