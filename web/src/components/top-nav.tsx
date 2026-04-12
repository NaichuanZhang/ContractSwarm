"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";

export function TopNav() {
  const pathname = usePathname();
  const isAssessment = pathname.startsWith("/assessment");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Shield className="h-5 w-5 text-gold" />
          <span className="font-heading text-lg font-semibold tracking-tight text-gold">
            ContractSwarm
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          {isAssessment && (
            <Link
              href="/"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              New Analysis
            </Link>
          )}
          <div className="h-4 w-px bg-border" />
          <span className="text-xs text-muted-foreground">v1.0</span>
        </nav>
      </div>
    </header>
  );
}
