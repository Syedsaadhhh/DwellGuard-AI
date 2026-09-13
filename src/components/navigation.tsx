"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { name: "Shipments", href: "/" },
    { name: "Demo", href: "/demo" },
    { name: "How it works", href: "/about" },
  ];

  return (
    <header className="bg-nav-ink text-white border-b border-nav-hover px-6 py-3.5 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center space-x-8">
        <Link href="/" className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded bg-[#254B62] border border-[#3E657D] flex items-center justify-center font-bold text-sm tracking-wider text-canvas-paper">
            DG
          </div>
          <div>
            <span className="font-semibold tracking-tight text-base text-white">DwellGuard</span>
            <span className="ml-2 text-xs text-ink-muted hidden sm:inline">Keep the dock plan moving</span>
          </div>
        </Link>

        <nav className="flex space-x-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors duration-control ${
                  isActive
                    ? "bg-[#254B62] text-white"
                    : "text-gray-300 hover:text-white hover:bg-nav-hover"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center space-x-3">
        <span className="text-xs px-2.5 py-1 rounded bg-[#1F3A4E] text-gray-300 border border-[#2B4B61] tabular-nums">
          CALL-E Connected
        </span>
      </div>
    </header>
  );
}
