"""Extract text from PDF contract files using pdfplumber."""

from __future__ import annotations

import pdfplumber


def extract_text(file_path: str) -> str:
    """Extract all text from a PDF file, joining pages with newlines."""
    with pdfplumber.open(file_path) as pdf:
        pages = [page.extract_text() or "" for page in pdf.pages]
    return "\n".join(pages)
