"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Mail, Loader2, Plus, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";

interface EmailSuggestion {
  id: string;
  emailId: string;
  from: string;
  subject: string;
  receivedDate: string;
  suggestedAction: "add" | "update" | "dismiss";
  suggestedStatus?: string;
  companyName?: string;
  jobTitle?: string;
}

interface JobOption {
  id: string;
  jobTitle: string;
  companyName: string;
}

export function EmailSuggestionsCard() {
  const queryClient = useQueryClient();
  const [updateModal, setUpdateModal] = useState<{
    suggestionId: string;
    suggestedStatus: string;
  } | null>(null);
  const [selectedAppId, setSelectedAppId] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["email-suggestions"],
    queryFn: async () => {
      const res = await fetch("/api/email-suggestions");
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to load");
      return json.data as EmailSuggestion[];
    },
  });

  const { data: jobs } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const res = await fetch("/api/jobs");
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to load jobs");
      return (json.data ?? []) as JobOption[];
    },
    enabled: !!updateModal,
  });

  const applyMutation = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: { action: string; applicationId?: string; status?: string; jobTitle?: string; companyName?: string; jobUrl?: string };
    }) => {
      const res = await fetch(`/api/email-suggestions/${id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to apply");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setUpdateModal(null);
      setSelectedAppId("");
      toast.success("Done");
    },
    onError: (err: Error) => {
      toast.error("Could not apply", { description: err.message });
    },
  });

  const handleAdd = (s: EmailSuggestion) => {
    applyMutation.mutate({
      id: s.id,
      body: {
        action: "add",
        companyName: s.companyName ?? "Unknown",
        jobTitle: s.jobTitle ?? "Application",
        jobUrl: "https://example.com",
      },
    });
  };

  const handleUpdateOpen = (s: EmailSuggestion) => {
    if (s.suggestedAction !== "update" || !s.suggestedStatus) return;
    setUpdateModal({ suggestionId: s.id, suggestedStatus: s.suggestedStatus });
    setSelectedAppId("");
  };

  const handleUpdateSubmit = () => {
    if (!updateModal || !selectedAppId) return;
    applyMutation.mutate({
      id: updateModal.suggestionId,
      body: { action: "update", applicationId: selectedAppId, status: updateModal.suggestedStatus },
    });
  };

  const handleDismiss = (id: string) => {
    applyMutation.mutate({ id, body: { action: "dismiss" } });
  };

  const suggestions = data ?? [];

  return (
    <>
      <Card className="rounded-2xl border border-(--border) bg-(--card) shadow-sm transition-all duration-200 hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email suggestions
          </CardTitle>
          <CardDescription>
            Forward application emails to Trackr; we parse them and suggest adding or updating applications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-(--muted-foreground)" />
            </div>
          ) : suggestions.length === 0 ? (
            <p className="text-sm text-(--muted-foreground) py-2">
              No pending suggestions. Forward application emails to your Trackr address to see them here.
            </p>
          ) : (
            <ul className="space-y-3">
              {suggestions.map((s) => (
                <li
                  key={s.id}
                  className="rounded-lg border border-(--border) bg-(--muted)/20 p-3 space-y-2"
                >
                  <p className="text-sm font-medium text-(--foreground) line-clamp-1">
                    {s.subject}
                  </p>
                  <p className="text-xs text-(--muted-foreground)">
                    From: {s.from} {s.companyName && ` · ${s.companyName}`}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {s.suggestedAction === "add" && (
                      <Button
                        size="sm"
                        variant="default"
                        className="gap-1"
                        onClick={() => handleAdd(s)}
                        disabled={applyMutation.isPending}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add application
                      </Button>
                    )}
                    {s.suggestedAction === "update" && s.suggestedStatus && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleUpdateOpen(s)}
                        disabled={applyMutation.isPending}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Update to {s.suggestedStatus.replace("_", " ")}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1"
                      onClick={() => handleDismiss(s.id)}
                      disabled={applyMutation.isPending}
                    >
                      <X className="h-3.5 w-3.5" />
                      Dismiss
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!updateModal} onOpenChange={() => setUpdateModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update application status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Application</label>
              <Select value={selectedAppId} onValueChange={setSelectedAppId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select application" />
                </SelectTrigger>
                <SelectContent>
                  {(jobs ?? []).map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.jobTitle} at {j.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {updateModal && (
              <p className="text-sm text-(--muted-foreground)">
                New status: <strong>{updateModal.suggestedStatus.replace("_", " ")}</strong>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateModal(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateSubmit}
              disabled={!selectedAppId || applyMutation.isPending}
            >
              {applyMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Update"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
