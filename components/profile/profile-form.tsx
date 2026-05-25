"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FreelancerProfile } from "@/types/profile";
import type { ExperienceLevel } from "@/types/profile";

function splitKeywords(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ProfileForm({ initialProfile }: { initialProfile: FreelancerProfile | null }) {
  const [niche, setNiche] = useState(initialProfile?.niche ?? "AI automation");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    initialProfile?.experienceLevel ?? "intermediate"
  );
  const [bio, setBio] = useState(initialProfile?.bio ?? "");
  const [skills, setSkills] = useState(initialProfile?.skills.join(", ") ?? "automation, api integration");
  const [tools, setTools] = useState(initialProfile?.tools.join(", ") ?? "n8n, zapier");
  const [technologies, setTechnologies] = useState(initialProfile?.technologies.join(", ") ?? "javascript, rest api");
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialProfile) setStatus("Profile loaded");
  }, [initialProfile]);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setStatus(null);

    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        niche,
        experienceLevel,
        bio,
        skills: splitKeywords(skills),
        tools: splitKeywords(tools),
        technologies: splitKeywords(technologies)
      })
    });

    const payload = await response.json();
    setIsSaving(false);
    setStatus(response.ok ? "Profile saved" : payload.error ?? "Unable to save profile");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Freelancer profile</CardTitle>
        <CardDescription>Your matching baseline for search scoring and AI insights.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={saveProfile}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="niche">Niche</Label>
              <Input id="niche" value={niche} onChange={(event) => setNiche(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experienceLevel">Experience</Label>
              <select
                id="experienceLevel"
                className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                value={experienceLevel}
                onChange={(event) => setExperienceLevel(event.target.value as ExperienceLevel)}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" value={bio} onChange={(event) => setBio(event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">Skills</Label>
            <Input id="skills" value={skills} onChange={(event) => setSkills(event.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tools">Tools</Label>
              <Input id="tools" value={tools} onChange={(event) => setTools(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="technologies">Technologies</Label>
              <Input
                id="technologies"
                value={technologies}
                onChange={(event) => setTechnologies(event.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="min-h-5 text-sm text-muted-foreground">{status}</p>
            <Button disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
