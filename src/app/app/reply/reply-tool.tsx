"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { FORMALITY_LABELS } from "@/lib/octagram/tone";
import {
  SaveToCollectionDialog,
  type SavePayload,
} from "@/components/collections/save-to-collection-dialog";

const REQUEST_TIMEOUT_MS = 45000;
const MAX_CONTEXT_CHARS = 8000;

const INTENTS = [
  "Confirm",
  "Decline",
  "Apologize",
  "Follow up",
  "Ask clarification",
  "Thank you",
] as const;

const LENGTHS = ["Short", "Medium", "Long"] as const;

type Intent = (typeof INTENTS)[number];
type ReplyLength = (typeof LENGTHS)[number];

export default function ReplyTool() {
  const [conversationContext, setConversationContext] = useState("");
  const [whatIWantToSay, setWhatIWantToSay] = useState("");
  const [intent, setIntent] = useState<Intent>("Confirm");
  const [length, setLength] = useState<ReplyLength>("Medium");
  const [formality, setFormality] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replies, setReplies] = useState<string[]>([]);
  const [runId, setRunId] = useState<string | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [savePayload, setSavePayload] = useState<SavePayload | null>(null);
  const [dailyLimited, setDailyLimited] = useState(false);

  const formalityLabel = FORMALITY_LABELS[formality - 1] ?? "Friendly";

  const canRun = useMemo(
    () => !loading && !dailyLimited && conversationContext.trim().length > 0,
    [loading, dailyLimited, conversationContext]
  );

  async function run() {
    if (!canRun) return;
    setError(null);
    setDailyLimited(false);
    setLoading(true);
    setReplies([]);
    setRunId(null);

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("TIMEOUT")), REQUEST_TIMEOUT_MS);
    });

    const requestPromise = (async () => {
      const response = await fetch("/api/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          conversationContext,
          whatIWantToSay: whatIWantToSay.trim() ? whatIWantToSay : undefined,
          intent,
          length,
          formality,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status})`);
      }

      return {
        replies: (data.replies ?? []) as string[],
        runId: (data.runId ?? null) as string | null,
      };
    })();

    try {
      const result = await Promise.race([requestPromise, timeoutPromise]);
      const nextReplies = result.replies;
      if (!Array.isArray(nextReplies) || nextReplies.length !== 3) {
        setError("Invalid response. Please try again.");
      } else {
        setReplies(nextReplies);
        setRunId(result.runId);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Reply generation failed";
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

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
  }

  function openSave(optionText: string, optionIndex: number) {
    setSavePayload({
      runId,
      type: "reply",
      source: "web",
      inputText: [
        `Conversation context:\n${conversationContext}`,
        whatIWantToSay.trim() ? `\nWhat I want to say:\n${whatIWantToSay.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      outputText: optionText,
      outputJson: { replies, selectedIndex: optionIndex },
      params: { intent, length, formality, selectedIndex: optionIndex },
    });
    setSaveOpen(true);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reply</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste conversation context and generate exactly 3 reply options. Output is autosaved to History for
          30 days.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Controls</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Intent</Label>
            <Select value={intent} onValueChange={(v) => setIntent(v as Intent)}>
              <SelectTrigger>
                <SelectValue placeholder="Select intent" />
              </SelectTrigger>
              <SelectContent>
                {INTENTS.map((i) => (
                  <SelectItem key={i} value={i}>
                    {i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Length</Label>
            <Select value={length} onValueChange={(v) => setLength(v as ReplyLength)}>
              <SelectTrigger>
                <SelectValue placeholder="Select length" />
              </SelectTrigger>
              <SelectContent>
                {LENGTHS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-1">
            <Label>Formality: {formalityLabel}</Label>
            <Slider
              value={[formality]}
              onValueChange={(v) => setFormality(v[0] ?? 5)}
              min={1}
              max={8}
              step={1}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversation context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              value={conversationContext}
              onChange={(e) => setConversationContext(e.target.value)}
              placeholder="Paste the conversation here (messages, email thread, etc.)"
              maxLength={MAX_CONTEXT_CHARS}
              rows={10}
            />
            <div className="text-right text-xs text-muted-foreground">
              {conversationContext.length} / {MAX_CONTEXT_CHARS}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">What I want to say (optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={whatIWantToSay}
              onChange={(e) => setWhatIWantToSay(e.target.value)}
              placeholder="Optional: add your key point or constraints"
            />

            <div className="flex flex-wrap gap-2">
              <Button onClick={run} disabled={!canRun}>
                {loading ? "Generating..." : "Generate 3 replies"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {replies.map((r, idx) => (
          <Card key={idx}>
            <CardHeader>
              <CardTitle className="text-base">Option {idx + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="min-h-[120px] whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-3 text-sm">
                {r}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => copy(r)}>
                  Copy
                </Button>
                <Button variant="outline" onClick={() => openSave(r, idx)} disabled={!r}>
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {loading && replies.length === 0 && (
          <div className="md:col-span-3 rounded-md border border-border bg-muted/20 p-6 text-sm text-muted-foreground">
            Generating replies...
          </div>
        )}

        {!loading && replies.length === 0 && (
          <div className="md:col-span-3 rounded-md border border-border bg-muted/20 p-6 text-sm text-muted-foreground">
            Your 3 reply options will appear here.
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {savePayload && (
        <SaveToCollectionDialog
          open={saveOpen}
          onOpenChange={setSaveOpen}
          payload={savePayload}
        />
      )}
    </div>
  );
}

