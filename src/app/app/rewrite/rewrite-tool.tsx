"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FORMALITY_LABELS, CREATIVITY_LABELS } from "@/lib/octagram/tone";
import {
  SaveToCollectionDialog,
  type SavePayload,
} from "@/components/collections/save-to-collection-dialog";

const REQUEST_TIMEOUT_MS = 45000;
const MAX_TEXT_CHARS = 5000;

const GOALS = [
  "Clearer",
  "Shorter",
  "More Formal",
  "More Friendly",
  "Street",
  "More Persuasive",
] as const;

type GoalPreset = (typeof GOALS)[number];

const GOAL_DESCRIPTIONS: Record<GoalPreset, string> = {
  Clearer: "Simplify wording and improve readability without changing meaning.",
  Shorter: "Reduce length while keeping the core message intact.",
  "More Formal": "Use professional, respectful language.",
  "More Friendly": "Use warm, approachable language.",
  Street: "Use casual slang and a more informal vibe.",
  "More Persuasive": "Strengthen intent and make the message more compelling.",
};

export default function RewriteTool() {
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");
  const [runId, setRunId] = useState<string | null>(null);
  const [goalPreset, setGoalPreset] = useState<GoalPreset>("Clearer");
  const [formality, setFormality] = useState(5);
  const [creativity, setCreativity] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [dailyLimited, setDailyLimited] = useState(false);

  const formalityLabel = FORMALITY_LABELS[formality - 1] ?? "Friendly";
  const creativityLabel = CREATIVITY_LABELS[creativity - 1] ?? "Natural";

  const canRun = useMemo(
    () => !loading && !dailyLimited && text.trim().length > 0,
    [loading, dailyLimited, text]
  );

  async function run() {
    if (!canRun) return;
    setError(null);
    setDailyLimited(false);
    setLoading(true);
    setOutput("");
    setRunId(null);

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("TIMEOUT")), REQUEST_TIMEOUT_MS);
    });

    const requestPromise = (async () => {
      const response = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ text, goalPreset, formality, creativity }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status})`);
      }
      return {
        output: (data.output ?? "") as string,
        runId: (data.runId ?? null) as string | null,
      };
    })();

    try {
      const result = await Promise.race([requestPromise, timeoutPromise]);
      setOutput(result.output);
      setRunId(result.runId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Rewrite failed";
      if (message === "TIMEOUT") {
        setError("Request timed out. Try again or use shorter text.");
      } else if (message.toLowerCase().includes("daily limit reached")) {
        setDailyLimited(true);
        setError(message);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function copyOutput() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
  }

  function clearAll() {
    setText("");
    setOutput("");
    setError(null);
    setDailyLimited(false);
    setRunId(null);
  }

  const savePayload: SavePayload = useMemo(
    () => ({
      runId,
      type: "rewrite",
      source: "web",
      inputText: text,
      outputText: output,
      params: { goalPreset, formality, creativity },
    }),
    [runId, text, output, goalPreset, formality, creativity]
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Rewrite</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Rewrite English text with presets and tone. Output is autosaved to
            History for 30 days.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={clearAll} disabled={!text && !output}>
            Clear
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preset</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="min-h-[7.5rem] w-full min-w-0">
                <ToggleGroup
                  type="single"
                  value={goalPreset}
                  onValueChange={(v) => {
                    if (!v) return;
                    setGoalPreset(v as GoalPreset);
                  }}
                  className="!grid w-full grid-cols-2 gap-2 sm:grid-cols-3"
                >
                  {GOALS.map((g) => (
                    <ToggleGroupItem key={g} value={g} className="justify-center">
                      {g}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
              <div className="mt-4 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                {GOAL_DESCRIPTIONS[goalPreset]}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Formality: {formalityLabel}</Label>
                  <Slider
                    value={[formality]}
                    onValueChange={(v) => setFormality(v[0] ?? 5)}
                    min={1}
                    max={8}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Highly Literary</span>
                    <span>Very Street</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Creativity: {creativityLabel}</Label>
                  <Slider
                    value={[creativity]}
                    onValueChange={(v) => setCreativity(v[0] ?? 2)}
                    min={1}
                    max={4}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Faithful</span>
                    <span>Creative</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Input</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste English text to rewrite..."
                maxLength={MAX_TEXT_CHARS}
                rows={12}
              />
              <div className="text-right text-xs text-muted-foreground">
                {text.length} / {MAX_TEXT_CHARS}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <div className="text-xs text-muted-foreground">
                  Tip: choose a preset, then adjust tone if needed.
                </div>
                <Button onClick={run} disabled={!canRun}>
                  {loading ? "Rewriting..." : "Rewrite"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="lg:sticky lg:top-6">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">Output</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={copyOutput} disabled={!output}>
                  Copy
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSaveOpen(true)}
                  disabled={!output}
                >
                  Save
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border border-border bg-background px-2.5 py-1">
                  Preset: <span className="text-foreground">{goalPreset}</span>
                </span>
                <span className="rounded-full border border-border bg-background px-2.5 py-1">
                  Formality:{" "}
                  <span className="text-foreground">{formalityLabel}</span>
                </span>
                <span className="rounded-full border border-border bg-background px-2.5 py-1">
                  Creativity:{" "}
                  <span className="text-foreground">{creativityLabel}</span>
                </span>
              </div>
              <div className="min-h-[320px] whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-3 text-sm">
                {loading && !output ? (
                  <span className="text-muted-foreground">Rewriting...</span>
                ) : output ? (
                  output
                ) : (
                  <span className="text-muted-foreground">Rewrite will appear here</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <SaveToCollectionDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        payload={savePayload}
      />
    </div>
  );
}

