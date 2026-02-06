"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type RunType = "translate" | "rewrite" | "reply";

type CollectionItem = {
  id: string;
  type: RunType;
  source: string;
  input_text: string;
  output_text: string | null;
  output_json: unknown | null;
  params: Record<string, unknown>;
  created_at: string;
  run_id: string | null;
};

type CollectionResponse = {
  collection: { id: string; name: string; createdAt: string };
  items: CollectionItem[];
};

async function fetchCollection(id: string): Promise<CollectionResponse> {
  const res = await fetch(`/api/collections/${id}`, { credentials: "same-origin" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to load collection");
  return data as CollectionResponse;
}

async function removeItem(collectionId: string, itemId: string) {
  const res = await fetch(`/api/collections/${collectionId}/items`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ itemId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to remove item");
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

export default function CollectionDetailClient() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [name, setName] = useState<string>("");
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchCollection(id);
        if (cancelled) return;
        setName(data.collection.name);
        setItems(data.items ?? []);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load collection";
        toast.error(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((it) => {
      const input = it.input_text?.toLowerCase() ?? "";
      const out =
        it.output_text?.toLowerCase() ??
        getReplies(it.output_json).join("\n\n").toLowerCase();
      return input.includes(needle) || out.includes(needle);
    });
  }, [items, q]);

  async function copyItem(it: CollectionItem) {
    const text =
      it.output_text ??
      getReplies(it.output_json).join("\n\n") ??
      "";
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  }

  async function onRemove(itemId: string) {
    if (!id) return;
    try {
      await removeItem(id, itemId);
      setItems((prev) => prev.filter((x) => x.id !== itemId));
      toast.success("Removed");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to remove";
      toast.error(msg);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{name || "Collection"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Saved items persist beyond 30-day history.
          </p>
        </div>
        <Link
          href="/app/collections"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Back to collections
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search</CardTitle>
        </CardHeader>
        <CardContent>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search in this collection…" />
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {filtered.map((it) => (
          <Card key={it.id}>
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge>{it.type}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(it.created_at)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => copyItem(it)}>
                    Copy
                  </Button>
                  <Button variant="destructive" onClick={() => onRemove(it.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div className="rounded-md border border-border bg-background p-3">
                <div className="mb-2 text-xs font-medium text-muted-foreground">Input</div>
                <div className="max-h-48 overflow-auto whitespace-pre-wrap text-sm text-muted-foreground">
                  {it.input_text}
                </div>
              </div>
              <div className="rounded-md border border-border bg-muted/20 p-3">
                <div className="mb-2 text-xs font-medium text-muted-foreground">Output</div>
                <div className="max-h-48 overflow-auto whitespace-pre-wrap text-sm">
                  {it.output_text ??
                    getReplies(it.output_json).join("\n\n")}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="rounded-md border border-border bg-muted/20 p-6 text-sm text-muted-foreground">
            No items found.
          </div>
        )}
      </div>
    </div>
  );
}

