"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SaveToCollectionDialog, type SavePayload } from "@/components/collections/save-to-collection-dialog";

type RunType = "translate" | "rewrite" | "reply";

type RunItem = {
  id: string;
  type: RunType;
  source: string;
  input_text: string;
  output_text: string | null;
  output_json: unknown | null;
  params: Record<string, unknown>;
  created_at: string;
};

type Collection = { id: string; name: string; itemCount: number };

async function fetchCollections(): Promise<Collection[]> {
  const res = await fetch("/api/collections", { credentials: "same-origin" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to load collections");
  return (data.items ?? []) as Collection[];
}

async function fetchHistory(opts: {
  type: RunType;
  q: string;
  collectionId: string;
  notInCollection: boolean;
}): Promise<RunItem[]> {
  const sp = new URLSearchParams();
  sp.set("type", opts.type);
  if (opts.q.trim()) sp.set("q", opts.q.trim());
  if (opts.collectionId) sp.set("collectionId", opts.collectionId);
  if (opts.notInCollection) sp.set("notInCollection", "1");
  const res = await fetch(`/api/history?${sp.toString()}`, {
    credentials: "same-origin",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to load history");
  return (data.items ?? []) as RunItem[];
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function getReplies(outputJson: unknown): string[] {
  if (!outputJson || typeof outputJson !== "object") return [];
  const replies = (outputJson as Record<string, unknown>)["replies"];
  if (!Array.isArray(replies)) return [];
  return replies.filter((r): r is string => typeof r === "string");
}

export default function HistoryClient() {
  const [tab, setTab] = useState<RunType>("translate");
  const [q, setQ] = useState("");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionId, setCollectionId] = useState<string>("all");
  const [items, setItems] = useState<RunItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<RunItem | null>(null);

  const [saveOpen, setSaveOpen] = useState(false);
  const [savePayload, setSavePayload] = useState<SavePayload | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const cols = await fetchCollections();
        setCollections(cols);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load collections";
        toast.error(msg);
      }
    })();
  }, []);

  const notInCollection = collectionId === "none";
  const actualCollectionId = collectionId === "all" || collectionId === "none" ? "" : collectionId;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const next = await fetchHistory({
          type: tab,
          q,
          collectionId: actualCollectionId,
          notInCollection,
        });
        if (!cancelled) setItems(next);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load history";
        toast.error(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, q, actualCollectionId, notInCollection]);

  const countLabel = useMemo(() => {
    if (loading) return "Loading…";
    return `${items.length} items`;
  }, [items.length, loading]);

  function openSaveFromRun(run: RunItem) {
    const outputText = run.type === "reply" ? getReplies(run.output_json)[0] ?? null : run.output_text;

    setSavePayload({
      runId: run.id,
      type: run.type,
      source: run.source,
      inputText: run.input_text,
      outputText,
      outputJson: run.output_json,
      params: run.params,
    });
    setSaveOpen(true);
  }

  async function copyFromRun(run: RunItem) {
    const text =
      run.type === "reply"
        ? getReplies(run.output_json).join("\n\n")
        : run.output_text ?? "";
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Autosaved outputs for 30 days. Save important items into collections to keep them longer.
        </p>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">Browse</CardTitle>
            <div className="text-xs text-muted-foreground">{countLabel}</div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search input/output…"
              />
            </div>
            <div>
              <Select value={collectionId} onValueChange={setCollectionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by collection" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="none">Not in any collection</SelectItem>
                  {collections.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as RunType)}>
            <TabsList>
              <TabsTrigger value="translate">Translations</TabsTrigger>
              <TabsTrigger value="rewrite">Rewrites</TabsTrigger>
              <TabsTrigger value="reply">Replies</TabsTrigger>
            </TabsList>

            <TabsContent value={tab}>
              <div className="mt-4 grid gap-3">
                {items.map((run) => (
                  <button
                    key={run.id}
                    onClick={() => setSelected(run)}
                    className="text-left"
                  >
                    <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{run.type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(run.created_at)}
                        </span>
                      </div>
                      <div className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                        {run.input_text}
                      </div>
                    </div>
                  </button>
                ))}

                {!loading && items.length === 0 && (
                  <div className="rounded-md border border-border bg-muted/20 p-6 text-sm text-muted-foreground">
                    No items found.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selected)} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Badge>{selected.type}</Badge>
                  <span className="text-base">Run details</span>
                </DialogTitle>
                <DialogDescription>{formatDate(selected.created_at)}</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-md border border-border bg-background p-3">
                  <div className="mb-2 text-xs font-medium text-muted-foreground">Input</div>
                  <div className="max-h-64 overflow-auto whitespace-pre-wrap text-sm">
                    {selected.input_text}
                  </div>
                </div>
                <div className="rounded-md border border-border bg-muted/20 p-3">
                  <div className="mb-2 text-xs font-medium text-muted-foreground">Output</div>
                  <div className="max-h-64 overflow-auto whitespace-pre-wrap text-sm">
                    {selected.type === "reply"
                      ? getReplies(selected.output_json).join("\n\n")
                      : selected.output_text}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => copyFromRun(selected)}>
                  Copy
                </Button>
                <Button variant="outline" onClick={() => openSaveFromRun(selected)}>
                  Save to collection
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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

