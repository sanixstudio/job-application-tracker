"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

/**
 * Card that shows the user's inbound email address (trackr+TOKEN@...)
 * so they can forward application emails to Trackr.
 */
export function EmailInboundCard() {
  const [forwardAddress, setForwardAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGetAddress = async () => {
    setLoading(true);
    setForwardAddress(null);
    try {
      const res = await fetch("/api/inbound/token", { method: "POST" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Failed to get address");
      setForwardAddress(data.data.forwardAddress);
      toast.success("Forward address ready. Copy and use it in your email client.");
    } catch (err) {
      toast.error("Could not get address", {
        description: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!forwardAddress) return;
    await navigator.clipboard.writeText(forwardAddress);
    setCopied(true);
    toast.success("Address copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="rounded-2xl border-2 border-(--border) bg-(--card) shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
      <CardHeader className="pb-4 pt-6 px-6 border-b border-(--border) bg-gradient-to-b from-(--primary)/5 to-transparent">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-(--primary)/10 text-(--primary)">
            <Mail className="size-6" strokeWidth={1.5} />
          </span>
          <div className="min-w-0">
            <CardTitle className="text-lg font-semibold text-(--foreground)">
              Forward application emails
            </CardTitle>
            <CardDescription className="mt-0.5">
              Get your unique forward address. Forward emails (rejections, interview invites, etc.) to it and we will suggest adding or updating applications.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-6 py-5">
        <Button
          onClick={handleGetAddress}
          disabled={loading}
          variant="outline"
          className="gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          {forwardAddress ? "Refresh address" : "Get forward address"}
        </Button>
        {forwardAddress && (
          <div className="flex items-center gap-2 rounded-lg border border-(--border) bg-(--muted)/30 px-3 py-2">
            <code className="flex-1 truncate text-sm text-(--foreground)">
              {forwardAddress}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-4 w-4 text-(--primary)" />
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
