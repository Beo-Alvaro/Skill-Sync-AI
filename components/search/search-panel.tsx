"use client";

import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SearchPanelProps = {
  onComplete?: () => void;
};

export function SearchPanel({ onComplete }: SearchPanelProps) {
  const [query, setQuery] = useState("n8n automation");
  const [message, setMessage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  async function runSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSearching(true);
    setMessage("Collecting jobs and scoring matches...");

    const response = await fetch("/api/searches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
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
        <CardDescription>Search Upwork by niche and generate match insights.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={runSearch}>
          <Input value={query} onChange={(event) => setQuery(event.target.value)} />
          <Button className="sm:w-36" disabled={isSearching}>
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </Button>
        </form>
        <p className="mt-3 min-h-5 text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}
