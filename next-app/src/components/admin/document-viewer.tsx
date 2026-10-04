"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ExternalLink, FileWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { getAccessToken, refreshAccessToken } from "@/lib/api-client";

type LoadedDoc = { url: string; contentType: string; revoke: boolean };

async function fetchWithAuth(path: string, signal: AbortSignal) {
  const run = (token: string | null) =>
    fetch(path, {
      headers: token ? { authorization: `Bearer ${token}` } : {},
      credentials: "include",
      cache: "no-store",
      signal,
    });
  let res = await run(getAccessToken());
  if (res.status === 401) {
    const token = await refreshAccessToken();
    if (token) res = await run(token);
  }
  return res;
}

/**
 * ID documents are private: the API requires the bearer token, so we fetch
 * them ourselves (as a blob, or as a short-lived signed URL when on S3) and
 * preview them in a dialog. Object URLs are revoked on close.
 */
async function loadDocument(verificationId: string, signal: AbortSignal): Promise<LoadedDoc> {
  const res = await fetchWithAuth(`/api/admin/verifications/${verificationId}/document?mode=url`, signal);
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const json = (await res.json()) as {
      success: boolean;
      data?: { url: string; contentType: string };
      error?: string;
    };
    if (!res.ok || !json.success || !json.data) throw new Error(json.error ?? "Could not load the document");
    return { url: json.data.url, contentType: json.data.contentType, revoke: false };
  }
  if (!res.ok) throw new Error("Could not load the document");
  const blob = await res.blob();
  return { url: URL.createObjectURL(blob), contentType: blob.type || contentType, revoke: true };
}

export function DocumentViewer({
  verificationId,
  title,
  open,
  onOpenChange,
}: {
  verificationId: string | null;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [doc, setDoc] = useState<LoadedDoc | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !verificationId) return;
    const controller = new AbortController();
    let loaded: LoadedDoc | null = null;
    setDoc(null);
    setError(null);
    loadDocument(verificationId, controller.signal)
      .then((result) => {
        loaded = result;
        if (controller.signal.aborted) {
          if (result.revoke) URL.revokeObjectURL(result.url);
          return;
        }
        setDoc(result);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Could not load the document");
        }
      });
    return () => {
      controller.abort();
      if (loaded?.revoke) URL.revokeObjectURL(loaded.url);
    };
  }, [open, verificationId]);

  const isPdf = doc?.contentType.includes("pdf");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] max-w-3xl grid-rows-[auto_1fr_auto] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Confidential. Check the name and last 4 characters match the request. Do not download or share.
          </DialogDescription>
        </DialogHeader>
        <div className="relative min-h-[50dvh] overflow-hidden rounded-lg border bg-muted/40">
          {error ? (
            <div role="alert" className="flex h-full min-h-[50dvh] flex-col items-center justify-center gap-2 p-6 text-center text-sm">
              <FileWarning className="size-6 text-destructive" />
              {error}
            </div>
          ) : !doc ? (
            <div className="flex h-full min-h-[50dvh] items-center justify-center">
              <Spinner className="size-7 text-primary" label="Loading document" />
            </div>
          ) : isPdf ? (
            <iframe src={doc.url} title={title} className="h-[60dvh] w-full" />
          ) : (
            <Image
              src={doc.url}
              alt={title}
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-contain"
            />
          )}
        </div>
        {doc ? (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" asChild>
              <a href={doc.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink /> Open in new tab
              </a>
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
