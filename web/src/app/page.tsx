"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Zap, BarChart3, FileText, Check, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ContractFile {
  fileName: string;
  filePath: string;
  clientName: string;
  size: number;
  modified: string;
}

export default function HomePage() {
  const router = useRouter();
  const [files, setFiles] = useState<ContractFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [vendorName, setVendorName] = useState("");
  const [vendorDescription, setVendorDescription] = useState("");

  useEffect(() => {
    fetch("/api/contracts")
      .then((res) => res.json())
      .then((data) => setFiles(data.files ?? []))
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim() || !vendorDescription.trim() || files.length === 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorName: vendorName.trim(),
          vendorDescription: vendorDescription.trim(),
          contractFiles: files.map((f) => ({
            fileName: f.fileName,
            filePath: f.filePath,
            clientName: f.clientName,
          })),
        }),
      });
      const data = await res.json();
      router.push(`/assessment/${data.id}/swarm`);
    } catch {
      setSubmitting(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
              Vendor Compliance,{" "}
              <span className="text-gold">Automated</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              Deploy AI agent swarms to analyze every client contract in parallel.
              Know which clients&apos; data can be shared with a new vendor — in minutes,
              not weeks.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            {[
              {
                icon: Zap,
                title: "Parallel Analysis",
                desc: "One agent per contract, all running simultaneously",
              },
              {
                icon: Shield,
                title: "Legal Research",
                desc: "Real-time case law lookup via Midpage API",
              },
              {
                icon: BarChart3,
                title: "Risk Assessment",
                desc: "Clause-level risk scoring with amendment suggestions",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-3 rounded-lg border border-border bg-card/50 p-4"
              >
                <feature.icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <div>
                  <p className="text-sm font-medium">{feature.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Main content */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-5">
          {/* Contract list */}
          <div className="lg:col-span-3">
            <h2 className="font-heading text-2xl font-semibold tracking-tight mb-1">
              Client Contracts
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {loading
                ? "Scanning contracts directory..."
                : `${files.length} contracts loaded for compliance analysis`}
            </p>
            {!loading && files.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No PDF files found. Place contract PDFs in the{" "}
                <code className="text-xs bg-surface px-1 py-0.5 rounded font-mono">
                  contracts/
                </code>{" "}
                directory.
              </p>
            ) : (
              <motion.div
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.08 } },
                }}
              >
                {files.map((file) => (
                  <motion.div
                    key={file.fileName}
                    variants={{
                      hidden: { opacity: 0, y: 16 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
                    }}
                    className="group relative flex items-start gap-3.5 rounded-lg border border-border bg-card p-4 transition-colors hover:border-gold/30"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface">
                      <FileText className="h-4.5 w-4.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-tight text-foreground">
                        {file.clientName}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {file.fileName}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground/60">
                        {formatSize(file.size)}
                      </p>
                    </div>
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/10">
                      <Check className="h-3 w-3 text-gold" />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Vendor form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <h2 className="font-heading text-2xl font-semibold tracking-tight mb-1">
                Vendor Details
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Describe the vendor to assess data sharing eligibility
              </p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="vendor-name" className="text-sm text-foreground">
                    Vendor Name
                  </Label>
                  <Input
                    id="vendor-name"
                    placeholder="e.g., DataVault Analytics"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    className="bg-card border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor-desc" className="text-sm text-foreground">
                    Description
                  </Label>
                  <Textarea
                    id="vendor-desc"
                    rows={4}
                    placeholder="Describe what the vendor does, what client data it will receive, how it processes and stores data, and where it operates..."
                    value={vendorDescription}
                    onChange={(e) => setVendorDescription(e.target.value)}
                    className="bg-card border-border resize-none"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={
                    !vendorName.trim() ||
                    !vendorDescription.trim() ||
                    files.length === 0 ||
                    submitting
                  }
                  className="w-full bg-gold text-background hover:bg-gold/90 font-medium h-11"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Initializing Swarm...
                    </>
                  ) : (
                    <>
                      Start Swarm Analysis
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
