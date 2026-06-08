"use client";

import { CheckCircle, Home, Loader2, Scissors } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";

import { useTimeTheme } from "@/components/TimeThemeProvider";

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function ClipForm() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url") ?? "";
  const title = searchParams.get("title") ?? "";

  const [thoughts, setThoughts] = useState("");
  const [tags, setTags] = useState("");
  const [adminSecret, setAdminSecret] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          thoughts,
          tags: parseTags(tags),
          adminSecret,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        success?: boolean;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to save article");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save article");
    } finally {
      setSubmitting(false);
    }
  }

  if (!url) {
    return (
      <p className="theme-text-muted text-sm">
        No URL provided. Use the bookmarklet on a webpage to open this form.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="theme-section-label mb-1 block text-xs font-medium uppercase tracking-wide">
          Page Title
        </label>
        <p className="theme-field-readonly rounded-md border px-3 py-2 text-sm">
          {title || "Untitled"}
        </p>
      </div>

      <div>
        <label className="theme-section-label mb-1 block text-xs font-medium uppercase tracking-wide">
          URL
        </label>
        <p className="theme-field-readonly break-all rounded-md border px-3 py-2 text-sm">
          {url}
        </p>
      </div>

      <div>
        <label
          htmlFor="thoughts"
          className="theme-section-label mb-1 block text-xs font-medium uppercase tracking-wide"
        >
          My Thoughts
        </label>
        <textarea
          id="thoughts"
          value={thoughts}
          onChange={(e) => setThoughts(e.target.value)}
          rows={4}
          placeholder="What stood out to you?"
          className="theme-input w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="tags"
          className="theme-section-label mb-1 block text-xs font-medium uppercase tracking-wide"
        >
          Tags
        </label>
        <input
          id="tags"
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="ai, productivity, design"
          className="theme-input w-full rounded-md border px-3 py-2 text-sm"
        />
        <p className="theme-text-muted mt-1 text-xs">Comma-separated</p>
      </div>

      <div>
        <label
          htmlFor="adminSecret"
          className="theme-section-label mb-1 block text-xs font-medium uppercase tracking-wide"
        >
          Admin Secret
        </label>
        <input
          id="adminSecret"
          type="password"
          value={adminSecret}
          onChange={(e) => setAdminSecret(e.target.value)}
          required
          autoComplete="off"
          className="theme-input w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {error && (
        <p
          className="rounded-md px-3 py-2 text-sm"
          style={{
            background: "color-mix(in srgb, var(--theme-danger) 12%, transparent)",
            color: "var(--theme-danger)",
          }}
        >
          {error}
        </p>
      )}

      {success && (
        <div className="space-y-3">
          <p
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm"
            style={{
              background: "color-mix(in srgb, var(--theme-accent) 18%, transparent)",
              color: "var(--theme-fg)",
            }}
          >
            <CheckCircle className="h-4 w-4 shrink-0" />
            Saved to your knowledge graph.
          </p>
          <Link
            href="/"
            className="theme-accent flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition"
          >
            <Home className="h-4 w-4" />
            View Serena's Knowledge Graph
          </Link>
        </div>
      )}

      {!success && (
        <button
          type="submit"
          disabled={submitting}
          className="theme-accent flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save to Graph"
          )}
        </button>
      )}
    </form>
  );
}

export default function ClipPage() {
  const theme = useTimeTheme();

  return (
    <div className="theme-page min-h-screen px-4 py-8">
      <div className="theme-surface theme-border mx-auto w-full max-w-md rounded-xl border p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <Scissors className="h-5 w-5" style={{ color: theme.accent }} />
          <h1 className="theme-text text-lg font-semibold">Clip Article</h1>
        </div>

        <Suspense
          fallback={
            <p className="theme-text-muted text-sm">Loading clip form…</p>
          }
        >
          <ClipForm />
        </Suspense>
      </div>
    </div>
  );
}
