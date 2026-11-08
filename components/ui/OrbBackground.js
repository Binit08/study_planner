"use client";

export default function OrbBackground({ children }) {
  return (
    <div className="relative min-h-screen bg-canvas text-text-primary selection:bg-accent-blue/30 selection:text-white overflow-x-hidden">
      {/* Background Dot Matrix Grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20 z-0 bg-dot-grid"
        aria-hidden="true"
      />

      {/* Floating Radial Glow Orbs */}
      <div
        className="fixed -top-40 left-1/4 w-96 h-96 rounded-full bg-gradient-to-tr from-accent-amber/20 to-accent-yellow/15 blur-3xl pointer-events-none z-0 animate-orb-float"
        aria-hidden="true"
      />
      <div
        className="fixed top-1/3 -right-20 w-96 h-96 rounded-full bg-gradient-to-br from-accent-blue/20 to-accent-sky/15 blur-3xl pointer-events-none z-0 animate-pulse-slow"
        aria-hidden="true"
      />
      <div
        className="fixed -bottom-40 left-1/3 w-80 h-80 rounded-full bg-gradient-to-t from-accent-amber/15 via-accent-sky/10 to-transparent blur-3xl pointer-events-none z-0"
        aria-hidden="true"
      />

      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col min-h-screen">{children}</div>
    </div>
  );
}
