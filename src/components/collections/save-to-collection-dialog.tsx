"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

type RunType = "translate" | "rewrite" | "reply";

export type SavePayload = {
  runId?: string | null;
  type: RunType;
  source?: string;
  inputText: string;
  outputText?: string | null;
  outputJson?: unknown | null;
  params?: Record<string, unknown>;
};

type Collection = {
  id: string;
  name: string;
  itemCount: number;
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
  const item = data.item as { id: string; name: string };
  return { id: item.id, name: item.name, itemCount: 0 };
}

async function addItemToCollection(collectionId: string, payload: SavePayload) {
  const res = await fetch(`/api/collections/${collectionId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      runId: payload.runId || undefined,
      type: payload.type,
      source: payload.source || "web",
      inputText: payload.inputText,
      outputText: payload.outputText ?? null,
      outputJson: payload.outputJson ?? null,
      params: payload.params ?? {},
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to save to collection");
  return data.id as string;
}

export function SaveToCollectionDialog({
  open,
  onOpenChange,
  payload,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: SavePayload;
}) {
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const items = await fetchCollections();
        if (!cancelled) setCollections(items);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load collections";
        toast.error(msg);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return collections;
    return collections.filter((c) => c.name.toLowerCase().includes(q));
  }, [collections, query]);

  const canCreate = useMemo(() => {
    const name = query.trim();
    if (!name) return false;
    return !collections.some((c) => c.name.toLowerCase() === name.toLowerCase());
  }, [collections, query]);

  async function handlePickCollection(collectionId: string) {
    setLoading(true);
    try {
      await addItemToCollection(collectionId, payload);
      toast.success("Saved to collection");
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAndSave() {
    const name = query.trim();
    if (!name) return;
    setLoading(true);
    try {
      const created = await createCollection(name);
      setCollections((prev) => [created, ...prev]);
      await addItemToCollection(created.id, payload);
      toast.success("Saved to new collection");
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create collection";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save to collection</DialogTitle>
          <DialogDescription>
            Choose an existing collection or create a new one.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-border">
          <Command>
            <CommandInput
              placeholder="Search or create…"
              value={query}
              onValueChange={setQuery}
              disabled={loading}
            />
            <CommandList>
              <CommandEmpty>No collections found.</CommandEmpty>
              <CommandGroup heading="Collections">
                {filtered.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={c.name}
                    onSelect={() => handlePickCollection(c.id)}
                  >
                    <span className="truncate">{c.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {c.itemCount}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>

              {canCreate && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Create">
                    <CommandItem
                      value={`Create ${query.trim()}`}
                      onSelect={handleCreateAndSave}
                    >
                      Create “{query.trim()}”
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </div>

        <DialogFooter className="mt-2">
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

