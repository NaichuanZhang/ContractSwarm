"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { NavSidebar } from "@/components/nav-sidebar";
import { FileText, Loader2, Zap } from "lucide-react";

interface ContractFile {
  fileName: string;
  filePath: string;
  clientName: string;
  size: number;
  modified: string;
}

export default function InputPage() {
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

  const handleSubmit = async () => {
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
    <div className="flex h-screen">
      <NavSidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8 space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ContractSwarm</h1>
            <p className="text-muted-foreground mt-1">
              AI agents swarm your contracts so you don&apos;t have to.
            </p>
          </div>

          {/* Contract Files */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client Contracts</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Scanning contracts directory...
                </div>
              ) : files.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No PDF files found. Place contract PDFs in the{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">
                    contracts/
                  </code>{" "}
                  directory.
                </p>
              ) : (
                <div className="space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.fileName}
                      className="flex items-center gap-3 rounded-lg border border-border p-3"
                    >
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {file.clientName}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {file.fileName}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {formatSize(file.size)}
                      </Badge>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground pt-1">
                    {files.length} contract{files.length !== 1 ? "s" : ""} found
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vendor Use Case */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vendor Use Case</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vendorName">Vendor Name</Label>
                <Input
                  id="vendorName"
                  placeholder="e.g., AcmeScan"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendorDescription">Description</Label>
                <Textarea
                  id="vendorDescription"
                  placeholder="Describe what the vendor does, what client data it will receive, how it processes and stores data, and where it operates..."
                  rows={5}
                  value={vendorDescription}
                  onChange={(e) => setVendorDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Start Button */}
          <Button
            size="lg"
            className="w-full"
            disabled={
              !vendorName.trim() ||
              !vendorDescription.trim() ||
              files.length === 0 ||
              submitting
            }
            onClick={handleSubmit}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Launching Swarm...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Start Swarm ({files.length} contract
                {files.length !== 1 ? "s" : ""})
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
