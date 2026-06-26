import { useSyncExternalStore } from "react";
import { useStore } from "@/lib/store";
import { loadDemoData } from "@/lib/seed-demo";

const FLAG_KEY = "atelier-preview-mode";
const SNAPSHOT_KEY = "atelier-preview-snapshot";

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function isPreviewActive(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(FLAG_KEY) === "1";
}

export function enterPreviewMode() {
  if (typeof window === "undefined") return;
  if (isPreviewActive()) return;
  // Snapshot the current full state so we can restore it on exit.
  try {
    const snapshot = JSON.stringify(useStore.getState());
    window.sessionStorage.setItem(SNAPSHOT_KEY, snapshot);
  } catch {
    // fall back: read persisted blob
    const raw = window.localStorage.getItem("atelier-store-v2");
    if (raw) window.sessionStorage.setItem(SNAPSHOT_KEY, raw);
  }
  window.sessionStorage.setItem(FLAG_KEY, "1");
  // Load demo data on top of the (snapshotted) current state.
  loadDemoData();
  emit();
}

export function exitPreviewMode() {
  if (typeof window === "undefined") return;
  const raw = window.sessionStorage.getItem(SNAPSHOT_KEY);
  window.sessionStorage.removeItem(FLAG_KEY);
  window.sessionStorage.removeItem(SNAPSHOT_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      // Replace state entirely to discard any demo additions/edits.
      useStore.setState(parsed, true as any);
    } catch {
      // If parsing fails, hard reload restores from localStorage.
      window.location.reload();
      return;
    }
  }
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === FLAG_KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function usePreviewMode() {
  return useSyncExternalStore(
    subscribe,
    () => isPreviewActive(),
    () => false,
  );
}