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

type ManualJobDraft = {
  title: string;
  description: string;
  url: string;
  budget: string;
  proposals: string;
  clientRating: string;
  postedDate: string;
  sourceJobId: string;
};

const defaultManualJob: ManualJobDraft = {
  title: "Automation expert needed",
  description: "Build workflows in n8n and Zapier.",
  url: "upwork.com/jobs/123",
  budget: "",
  proposals: "",
  clientRating: "",
  postedDate: "",
  sourceJobId: ""
};

function normalizeJobUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("www.")) return `https://${trimmed}`;
  if (trimmed.startsWith("upwork.com") || trimmed.startsWith("/")) {
    return `https://www.${trimmed.replace(/^\/+/, "")}`;
  }

  return `https://${trimmed}`;
}

export function SearchPanel({ onComplete }: SearchPanelProps) {
  const [query, setQuery] = useState("n8n automation");
  const [mode, setMode] = useState<"scrape" | "manual">("scrape");
  const [manualJobs, setManualJobs] = useState<ManualJobDraft[]>([defaultManualJob]);
  const [message, setMessage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  function updateManualJob(index: number, patch: Partial<ManualJobDraft>) {
    setManualJobs((prev) => prev.map((job, jobIndex) => (jobIndex === index ? { ...job, ...patch } : job)));
  }

  function addManualJob() {
    setManualJobs((prev) => [...prev, { ...defaultManualJob, title: "", description: "", url: "" }]);
  }

  function removeManualJob(index: number) {
    setManualJobs((prev) => prev.filter((_, jobIndex) => jobIndex !== index));
  }

  async function runSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSearching(true);
    setMessage(mode === "manual" ? "Importing jobs and scoring matches..." : "Collecting jobs and scoring matches...");

    let body: Record<string, unknown> = { query };

    if (mode === "manual") {
      const missingRequired = manualJobs.some((job) => !job.title.trim() || !job.description.trim());
      if (missingRequired) {
        setIsSearching(false);
        setMessage("Please provide a title and description for each job.");
        return;
      }

      const jobs = manualJobs.map((job) => {
        const clientRating = Number(job.clientRating);
        return {
          title: job.title.trim(),
          description: job.description.trim(),
          url: normalizeJobUrl(job.url),
          budget: job.budget.trim() || undefined,
          proposals: job.proposals.trim() || undefined,
          clientRating: Number.isFinite(clientRating) ? clientRating : undefined,
          postedDate: job.postedDate.trim() || undefined,
          sourceJobId: job.sourceJobId.trim() || undefined
        };
      });

      body = {
        mode: "manual",
        query: query.trim().length ? query : undefined,
        jobs
      };
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
        <CardDescription>Search Upwork by niche or add job details manually.</CardDescription>
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
          {mode === "manual"
            ? manualJobs.map((job, index) => (
                <div key={`${job.title}-${index}`} className="rounded-md border border-border p-3">
                  <div className="flex flex-col gap-2">
                    <Input
                      value={job.title}
                      onChange={(event) => updateManualJob(index, { title: event.target.value })}
                      placeholder="Job title"
                    />
                    <Textarea
                      value={job.description}
                      onChange={(event) => updateManualJob(index, { description: event.target.value })}
                      placeholder="Job description"
                    />
                    <Input
                      value={job.url}
                      onChange={(event) => updateManualJob(index, { url: event.target.value })}
                      placeholder="Upwork job URL (paste without https:// to auto-fix)"
                    />
                    <div className="grid gap-2 md:grid-cols-2">
                      <Input
                        value={job.budget}
                        onChange={(event) => updateManualJob(index, { budget: event.target.value })}
                        placeholder="Budget"
                      />
                      <Input
                        value={job.proposals}
                        onChange={(event) => updateManualJob(index, { proposals: event.target.value })}
                        placeholder="Proposals"
                      />
                      <Input
                        value={job.clientRating}
                        onChange={(event) => updateManualJob(index, { clientRating: event.target.value })}
                        placeholder="Client rating (0-5)"
                      />
                      <Input
                        value={job.postedDate}
                        onChange={(event) => updateManualJob(index, { postedDate: event.target.value })}
                        placeholder="Posted date"
                      />
                      <Input
                        value={job.sourceJobId}
                        onChange={(event) => updateManualJob(index, { sourceJobId: event.target.value })}
                        placeholder="Source job id (optional)"
                      />
                    </div>
                    {manualJobs.length > 1 ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="self-start"
                        onClick={() => removeManualJob(index)}
                      >
                        Remove job
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))
            : null}
          {mode === "manual" ? (
            <Button type="button" variant="outline" size="sm" className="self-start" onClick={addManualJob}>
              Add another job
            </Button>
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
