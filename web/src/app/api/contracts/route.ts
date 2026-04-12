import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

const CONTRACTS_DIR = path.resolve(process.cwd(), "..", "contracts");

export async function GET() {
  try {
    if (!fs.existsSync(CONTRACTS_DIR)) {
      return NextResponse.json({ files: [], directory: CONTRACTS_DIR });
    }

    const files = fs
      .readdirSync(CONTRACTS_DIR)
      .filter((f) => f.toLowerCase().endsWith(".pdf"))
      .map((fileName) => {
        const filePath = path.join(CONTRACTS_DIR, fileName);
        const stats = fs.statSync(filePath);
        // Derive client name from filename: "acme_corp_msa.pdf" -> "Acme Corp"
        const clientName = fileName
          .replace(/\.pdf$/i, "")
          .replace(/_(?:msa|dpa|nda|sow|services?|agreement|contract|engagement)$/i, "")
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

        return {
          fileName,
          filePath,
          clientName,
          size: stats.size,
          modified: stats.mtime.toISOString(),
        };
      });

    return NextResponse.json({ files, directory: CONTRACTS_DIR });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read contracts directory" },
      { status: 500 }
    );
  }
}
