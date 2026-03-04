"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Key, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

/**
 * Card that lets the user generate an API key for the Chrome extension
 * and copy it to paste into the extension.
 */
export function ExtensionKeyCard() {
  const [key, setKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setKey(null);
    try {
      const res = await fetch("/api/ext/key", { method: "POST" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Failed to generate key");
      setKey(data.data.key);
      toast.success("API key generated. Copy it and paste into the extension.");
    } catch (err) {
      toast.error("Could not generate key", {
        description: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!key) return;
    await navigator.clipboard.writeText(key);
    setCopied(true);
    toast.success("API key copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="rounded-2xl border-[var(--border)] bg-[var(--card)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Key className="h-5 w-5" />
          Save from browser
        </CardTitle>
        <CardDescription>
          Generate an API key for the Trackr Chrome extension. Paste the key into the extension to save jobs from any job board.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={handleGenerate}
          disabled={loading}
          variant="outline"
          className="gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Key className="h-4 w-4" />
          )}
          {key ? "Regenerate API key" : "Generate API key"}
        </Button>
        {key && (
          <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 px-3 py-2">
            <code className="flex-1 truncate text-sm text-[var(--foreground)]">
              {key}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-4 w-4 text-[var(--primary)]" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
