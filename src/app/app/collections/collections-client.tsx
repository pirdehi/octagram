"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Collection = {
  id: string;
  name: string;
  itemCount: number;
  createdAt: string;
};

async function fetchCollections(): Promise<Collection[]> {
  const res = await fetch("/api/collections", { credentials: "same-origin" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to load collections");
  return (data.items ?? []) as Collection[];
}

async function createCollection(name: string): Promise<Collection> {
  const res = await fetch("/api/collections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ name }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to create collection");
  return {
    id: data.item.id,
    name: data.item.name,
    createdAt: data.item.createdAt,
    itemCount: 0,
  };
}

export default function CollectionsClient() {
  const [items, setItems] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const next = await fetchCollections();
        if (!cancelled) setItems(next);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load collections";
        toast.error(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const canCreate = useMemo(() => name.trim().length > 0 && !loading, [name, loading]);

  async function onCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const created = await createCollection(trimmed);
      setItems((prev) => [created, ...prev]);
      setName("");
      toast.success("Collection created");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create collection";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Collections</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Curate important outputs so they persist beyond the 30-day history window.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create a collection</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Support replies"
          />
          <Button onClick={onCreate} disabled={!canCreate}>
            Create
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((c) => (
          <Link key={c.id} href={`/app/collections/${c.id}`}>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-colors hover:bg-accent">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.itemCount}</div>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Open collection
              </div>
            </div>
          </Link>
        ))}

        {!loading && items.length === 0 && (
          <div className="rounded-md border border-border bg-muted/20 p-6 text-sm text-muted-foreground md:col-span-2">
            No collections yet.
          </div>
        )}
      </div>
    </div>
  );
}

