import { useMemo } from "react";

/**
 * Format the current date for the footer status line.
 */
function useFormattedDate(): string {
  return useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);
}

export interface FooterBarProps {
  /** Override the status text (e.g. "Indexing…") */
  status?: string;
  /** Override the sync state label */
  syncState?: string;
  /** Override the peer count */
  peerCount?: number;
}

/**
 * Application footer / status bar.
 *
 * Shows readiness on the left and sync + peer count on the right.
 */
export default function FooterBar({
  status = "Ready",
  syncState = "idle",
  peerCount = 3,
}: FooterBarProps) {
  const date = useFormattedDate();

  return (
    <footer className="flex items-center justify-between border-t border-border bg-card px-4 py-1.5 text-xs text-muted-foreground">
      <span>
        {status} · {date}
      </span>
      <span>
        Sync: {syncState} · {peerCount} peer{peerCount !== 1 ? "s" : ""} online
      </span>
    </footer>
  );
}
