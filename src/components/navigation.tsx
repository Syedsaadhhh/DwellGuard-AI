"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LockKeyhole, LogOut, Menu, X } from "lucide-react";

const navItems = [
  { name: "Shipment desk", href: "/" },
  { name: "Judge replay", href: "/demo" },
  { name: "How it works", href: "/about" },
];

export function Navigation() {
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setAuthenticated(data.authenticated === true))
      .catch(() => setAuthenticated(false));
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ operatorSecret: secret }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data.error || "Sign-in failed");
      setSubmitting(false);
      return;
    }

    setAuthenticated(true);
    setSecret("");
    setLoginOpen(false);
    window.location.reload();
  }

  async function signOut() {
    await fetch("/api/auth/session", { method: "DELETE" });
    setAuthenticated(false);
    window.location.assign("/demo");
  }

  const links = (
    <nav aria-label="Primary" className="space-y-1">
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`block rounded-md px-3 py-2.5 text-[15px] font-medium transition-colors duration-control ${
              active
                ? "bg-white/10 text-white"
                : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            {item.name}
          </Link>
        );
      })}
    </nav>
  );

  const sessionControl = authenticated ? (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        Operator secured
      </div>
      <button
        type="button"
        onClick={signOut}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-400 hover:text-white"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </div>
  ) : (
    <button
      type="button"
      onClick={() => setLoginOpen(true)}
      className="flex w-full items-center justify-center gap-2 rounded-md bg-[#F4F1EA] px-3 py-2.5 text-sm font-semibold text-nav-ink hover:bg-white"
    >
      <LockKeyhole className="h-4 w-4" />
      Operator sign in
    </button>
  );

  return (
    <>
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-white/10 bg-nav-ink px-4 py-5 text-white md:flex">
        <Link href="/" className="mb-9 flex items-center gap-3 px-2">
          <span className="grid h-10 w-10 place-items-center rounded-md border border-white/15 bg-white/[0.07] font-semibold tracking-wide">
            DG
          </span>
          <span>
            <span className="block text-[17px] font-semibold tracking-tight">DwellGuard</span>
            <span className="block text-[13px] text-slate-400">Dock recovery, proved</span>
          </span>
        </Link>
        {links}
        <div className="mt-auto">{sessionControl}</div>
      </aside>

      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-nav-ink px-4 py-3 text-white md:hidden">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-md border border-white/15 bg-white/[0.07] text-sm font-semibold">
            DG
          </span>
          <span className="font-semibold">DwellGuard</span>
        </Link>
        <button
          type="button"
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          onClick={() => setMobileOpen((open) => !open)}
          className="rounded-md p-2 hover:bg-white/10"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-x-0 top-[61px] z-30 border-b border-white/10 bg-nav-ink px-4 pb-5 text-white shadow-xl md:hidden">
          {links}
          <div className="mt-4">{sessionControl}</div>
        </div>
      )}

      {loginOpen && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-[#0D1B24]/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="operator-sign-in"
        >
          <form onSubmit={signIn} className="w-full max-w-md rounded-xl border border-edge bg-canvas-paper p-6 shadow-paper">
            <div className="mb-6">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-action-primary">
                Private operations
              </p>
              <h2 id="operator-sign-in" className="font-display text-3xl text-ink-primary">
                Enter the operator passphrase
              </h2>
              <p className="mt-2 text-[15px] text-ink-secondary">
                The public judge replay stays available without access to live shipment data.
              </p>
            </div>
            <label htmlFor="operator-secret" className="mb-2 block text-sm font-semibold text-ink-primary">
              Operator passphrase
            </label>
            <input
              id="operator-secret"
              type="password"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              autoComplete="current-password"
              required
              autoFocus
              className="w-full rounded-md border border-edge-dark bg-white px-3.5 py-3 text-base text-ink-primary shadow-sm"
            />
            {error && <p className="mt-3 text-sm font-medium text-state-failure-text">{error}</p>}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setLoginOpen(false);
                  setError("");
                }}
                className="flex-1 rounded-md border border-edge px-4 py-2.5 text-sm font-semibold text-ink-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-md bg-action-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-action-hover disabled:opacity-60"
              >
                {submitting ? "Checking…" : "Unlock desk"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
