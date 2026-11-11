"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function GlobalError({ error, reset }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="bg-white p-8 sm:p-10 wobbly-border hard-shadow max-w-lg w-full text-center space-y-5 rotate-[-0.5deg]">
        <div className="w-14 h-14 mx-auto bg-rose-100 wobbly-border-sm flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-rose-600" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-hand text-[#2d2d2d]">
            Something went sideways
          </h1>
          <p className="text-base text-slate-600">
            {error?.message || "An unexpected error interrupted this page."}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-300 text-[#2d2d2d] font-bold font-hand text-lg wobbly-border-sm hard-shadow-sm hover:bg-yellow-400 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#2d2d2d] font-bold font-hand text-lg wobbly-border-sm hard-shadow-sm hover:bg-slate-50 transition-all"
          >
            <Home className="w-4 h-4" />
            Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}

