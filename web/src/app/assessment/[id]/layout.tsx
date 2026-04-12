"use client";

import { use } from "react";
import { AssessmentTabs } from "@/components/assessment-tabs";

export default function AssessmentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div>
      <AssessmentTabs assessmentId={id} />
      <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
    </div>
  );
}
