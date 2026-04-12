"use client";

import { use } from "react";
import { NavSidebar } from "@/components/nav-sidebar";

export default function AssessmentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="flex h-screen">
      <NavSidebar assessmentId={id} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
