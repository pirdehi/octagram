"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "bg-card text-foreground border border-border shadow-sm",
          title: "text-sm font-medium",
          description: "text-sm text-muted-foreground",
          actionButton:
            "bg-primary text-primary-foreground hover:bg-primary/90",
          cancelButton:
            "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        },
      }}
    />
  );
}

