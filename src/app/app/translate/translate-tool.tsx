"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { FORMALITY_LABELS, CREATIVITY_LABELS } from "@/lib/octagram/tone";
import {
  SaveToCollectionDialog,
  type SavePayload,
} from "@/components/collections/save-to-collection-dialog";

const REQUEST_TIMEOUT_MS = 45000;
const MAX_TEXT_CHARS = 5000;

export default function TranslateTool() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [runId, setRunId] = useState<string | null>(null);
  const [formality, setFormality] = useState(4);
  const [creativity, setCreativity] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [dailyLimited, setDailyLimited] = useState(false);

  const formalityLabel = FORMALITY_LABELS[formality - 1] ?? "Formal";
  const creativityLabel = CREATIVITY_LABELS[creativity - 1] ?? "Natural";

  const canRun = useMemo(
    () => !loading && !dailyLimited && inputText.trim().length > 0,
    [loading, dailyLimited, inputText]
  );

  async function run() {
    if (!canRun) return;
    setError(null);
    setDailyLimited(false);
    setLoading(true);
    setOutputText("");
    setRunId(null);

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("TIMEOUT")), REQUEST_TIMEOUT_MS);
    });

    const requestPromise = (async () => {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ text: inputText, formality, creativity }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status})`);
      }

      return {
        translation: (data.translation ?? "") as string,
        runId: (data.runId ?? null) as string | null,
      };
    })();

    try {
      const result = await Promise.race([requestPromise, timeoutPromise]);
      setOutputText(result.translation);
      setRunId(result.runId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Translation failed";
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
    if (!outputText) return;
    await navigator.clipboard.writeText(outputText);
  }

  const savePayload: SavePayload = useMemo(
    () => ({
      runId,
      type: "translate",
      source: "web",
      inputText: inputText,
      outputText,
      params: { formality, creativity },
    }),
    [runId, inputText, outputText, formality, creativity]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Translate</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Translate any language to English. Output is autosaved to History for
          30 days.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Controls</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Formality: {formalityLabel}</Label>
            <Slider
              value={[formality]}
              onValueChange={(v) => setFormality(v[0] ?? 4)}
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
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Input</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste text to translate to English..."
              maxLength={MAX_TEXT_CHARS}
              rows={10}
            />
            <div className="text-right text-xs text-muted-foreground">
              {inputText.length} / {MAX_TEXT_CHARS}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">English output</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="min-h-[240px] whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-3 text-sm">
              {loading && !outputText ? (
                <span className="text-muted-foreground">Translating...</span>
              ) : outputText ? (
                outputText
              ) : (
                <span className="text-muted-foreground">
                  Translation will appear here
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={run} disabled={!canRun}>
                {loading ? "Translating..." : "Translate"}
              </Button>
              <Button
                variant="secondary"
                onClick={copyOutput}
                disabled={!outputText}
              >
                Copy
              </Button>
              <Button
                variant="outline"
                onClick={() => setSaveOpen(true)}
                disabled={!outputText}
              >
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
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

