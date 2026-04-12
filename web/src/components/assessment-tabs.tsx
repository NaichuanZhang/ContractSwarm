"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, GitBranch, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssessmentTabsProps {
  readonly assessmentId: string;
}

const tabs = [
  { label: "Swarm", href: "swarm", icon: Activity },
  { label: "Graph", href: "graph", icon: GitBranch },
  { label: "Report", href: "report", icon: FileText },
] as const;

export function AssessmentTabs({ assessmentId }: AssessmentTabsProps) {
  const pathname = usePathname();

  return (
    <div className="sticky top-14 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-1 px-6">
        {tabs.map((tab) => {
          const href = `/assessment/${assessmentId}/${tab.href}`;
          const isActive = pathname === href;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={href}
              className={cn(
                "relative flex items-center gap-2 px-4 py-3 text-sm transition-colors",
                isActive
                  ? "text-gold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-4 right-4 h-px bg-gold" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
