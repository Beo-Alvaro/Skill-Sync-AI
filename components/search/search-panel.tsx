"use client";

import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type SearchPanelProps = {
  onComplete?: () => void;
};

export function SearchPanel({ onComplete }: SearchPanelProps) {
  const [query, setQuery] = useState("n8n automation");
  const [mode, setMode] = useState<"scrape" | "manual">("scrape");
  const [importText, setImportText] = useState(`[
  {
    "title": "Automation expert needed",
    "description": "Build workflows in n8n and Zapier.",
    "url": "https://www.upwork.com/jobs/123"
  }
]`);
  const [message, setMessage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  async function runSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSearching(true);
    setMessage(mode === "manual" ? "Importing jobs and scoring matches..." : "Collecting jobs and scoring matches...");

    let body: Record<string, unknown> = { query };

    if (mode === "manual") {
      try {
        const parsed = JSON.parse(importText);
        if (!Array.isArray(parsed)) {
          throw new Error("Manual import expects a JSON array of jobs.");
        }
        body = {
          mode: "manual",
          query: query.trim().length ? query : undefined,
          jobs: parsed
        };
      } catch (error) {
        setIsSearching(false);
        setMessage(error instanceof Error ? error.message : "Invalid JSON for manual import.");
        return;
      }
    }

    const response = await fetch("/api/searches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const payload = await response.json();
    setIsSearching(false);

    if (!response.ok) {
      setMessage(payload.error ?? "Search failed");
      return;
    }

    setMessage(`Found ${payload.data.matches.length} matched jobs`);
    onComplete?.();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job search</CardTitle>
        <CardDescription>
          Search Upwork by niche or paste job data to generate match insights.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === "scrape" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("scrape")}
          >
            Upwork search
          </Button>
          <Button
            type="button"
            variant={mode === "manual" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("manual")}
          >
            Manual import
          </Button>
        </div>
        <form className="mt-3 flex flex-col gap-3" onSubmit={runSearch}>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={mode === "manual" ? "Optional label for this import" : "Search query"}
          />
          {mode === "manual" ? (
            <Textarea
              className="min-h-40 font-mono text-xs"
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
            />
          ) : null}
          <Button className="sm:w-40" disabled={isSearching}>
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {mode === "manual" ? "Import" : "Search"}
          </Button>
        </form>
        <p className="mt-3 min-h-5 text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}
