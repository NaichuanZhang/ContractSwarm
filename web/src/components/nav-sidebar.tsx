"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  FileText,
  Bug as Swarm,
  GitBranch,
  ClipboardList,
  Home,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

export function NavSidebar({ assessmentId }: { assessmentId?: string }) {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/", label: "New Assessment", icon: Home },
  ];

  if (assessmentId) {
    items.push(
      {
        href: `/assessment/${assessmentId}/swarm`,
        label: "The Swarm",
        icon: Swarm,
      },
      {
        href: `/assessment/${assessmentId}/graph`,
        label: "Compliance Graph",
        icon: GitBranch,
      },
      {
        href: `/assessment/${assessmentId}/report`,
        label: "Report",
        icon: ClipboardList,
      }
    );
  }

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-card/50 p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 px-3 py-2 mb-4">
        <FileText className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm tracking-tight">ContractSwarm</span>
      </div>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
            pathname === item.href
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            item.disabled && "pointer-events-none opacity-40"
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </aside>
  );
}
