"use client";

import { useQuery } from "@tanstack/react-query";

interface Contract {
  id: string;
  clientName: string;
  fileName: string;
  status: string;
  riskScore: string | null;
  recommendation: string | null;
}

interface Assessment {
  id: string;
  vendorName: string;
  vendorDescription: string;
  status: string;
  eligibleCount: number | null;
  totalCount: number | null;
  createdAt: string;
  completedAt: string | null;
  contracts: Contract[];
}

export function useAssessment(id: string) {
  return useQuery<Assessment>({
    queryKey: ["assessment", id],
    queryFn: async () => {
      const res = await fetch(`/api/assessments/${id}`);
      if (!res.ok) throw new Error("Failed to fetch assessment");
      return res.json();
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === "completed" || data?.status === "failed") return false;
      return 2000;
    },
  });
}
