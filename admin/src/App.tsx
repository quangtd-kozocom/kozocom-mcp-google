import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, isUsingFallback } from "./lib/api";
import type { Grant, Health, Mode } from "./lib/types";
import { Masthead } from "./components/Masthead";
import { ModeSwitcher } from "./components/ModeSwitcher";
import { GrantsTable } from "./components/GrantsTable";
import { AddGrant } from "./components/AddGrant";
import { useToast } from "./components/Toasts";
import { ThemeControls } from "./components/ThemeControls";
import type { ThemeMode, ThemeTone } from "./components/ThemeControls";

type PermKey = "canRead" | "canWrite" | "canDelete";
const POLL_MS = 4000;
const queryKeys = {
  health: ["health"] as const,
  grants: ["grants"] as const,
};
const THEME_KEY = "terra-admin-theme";
const MODE_KEY = "terra-admin-mode";

export function App() {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [themeTone, setThemeTone] = useState<ThemeTone>(() => readStored("theme", "graphite"));
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => readStored("mode", "light"));

  useEffect(() => {
    document.documentElement.dataset.theme = themeTone;
    document.documentElement.dataset.mode = themeMode;
    window.localStorage.setItem(THEME_KEY, themeTone);
    window.localStorage.setItem(MODE_KEY, themeMode);
  }, [themeTone, themeMode]);

  const { data: healthData } = useQuery({
    queryKey: queryKeys.health,
    queryFn: api.getHealth,
  });
  const { data: grantsData, isLoading: grantsLoading } = useQuery({
    queryKey: queryKeys.grants,
    queryFn: api.getGrants,
    refetchInterval: POLL_MS,
  });

  const health = healthData ?? null;
  const grants = grantsData ?? [];
  const demo = isUsingFallback();

  const setModeMutation = useMutation({
    mutationFn: api.setMode,
    onMutate: async (mode: Mode) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.health });
      const previous = queryClient.getQueryData<Health>(queryKeys.health);
      queryClient.setQueryData<Health>(queryKeys.health, (current) =>
        current ? { ...current, mode } : current,
      );
      return { previous };
    },
    onError: (_error, _mode, context) => {
      queryClient.setQueryData(queryKeys.health, context?.previous);
      notify("Could not change the gate posture.", "error");
    },
    onSuccess: (confirmed) => {
      queryClient.setQueryData<Health>(queryKeys.health, (current) =>
        current ? { ...current, mode: confirmed } : current,
      );
      notify(`Gate posture set to ${labelForMode(confirmed)}`, "success");
    },
  });

  const patchGrantMutation = useMutation({
    mutationFn: ({ id, key, next }: { id: number; key: PermKey; next: boolean }) =>
      api.patchGrant(id, { [key]: next }),
    onMutate: async ({ id, key, next }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.grants });
      const previous = queryClient.getQueryData<Grant[]>(queryKeys.grants);
      queryClient.setQueryData<Grant[]>(queryKeys.grants, (current = []) =>
        current.map((g) => (g.id === id ? { ...g, [key]: next } : g)),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(queryKeys.grants, context?.previous);
      notify("Could not update permission.", "error");
    },
  });

  const deleteGrantMutation = useMutation({
    mutationFn: api.deleteGrant,
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.grants });
      const previous = queryClient.getQueryData<Grant[]>(queryKeys.grants);
      const target = previous?.find((g) => g.id === id);
      queryClient.setQueryData<Grant[]>(queryKeys.grants, (current = []) =>
        current.filter((g) => g.id !== id),
      );
      return { previous, target };
    },
    onError: (_error, _id, context) => {
      queryClient.setQueryData(queryKeys.grants, context?.previous);
      notify("Could not revoke access.", "error");
    },
    onSuccess: (_result, _id, context) => {
      notify(`Revoked ${context?.target?.name ?? "resource"}`, "info");
    },
  });

  const changeMode = useCallback(
    async (mode: Mode) => {
      setModeMutation.mutate(mode);
    },
    [setModeMutation],
  );

  const togglePerm = useCallback(
    async (id: number, key: PermKey, next: boolean) => {
      patchGrantMutation.mutate({ id, key, next });
    },
    [patchGrantMutation],
  );

  const revoke = useCallback(
    async (id: number) => {
      deleteGrantMutation.mutate(id);
    },
    [deleteGrantMutation],
  );

  const refreshGrants = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.grants });
  }, [queryClient]);

  const signedIn = health?.signedIn ?? false;

  return (
    <div className="shell">
      <Masthead health={health} />
      <ThemeControls
        tone={themeTone}
        mode={themeMode}
        onToneChange={setThemeTone}
        onModeChange={setThemeMode}
      />

      {!signedIn && health && (
        <div className="notice stagger" style={{ animationDelay: "120ms" }}>
          <div>
            <h3>No account is signed in</h3>
            <p>
              Terra Gate can't guard a Drive it can't reach. Open a terminal and run{" "}
              <code>terra-mcp auth login</code> to grant Terra Gate access to your Google
              account, then refresh this page.
            </p>
          </div>
        </div>
      )}

      {demo && (
        <div className="demo-banner stagger" style={{ animationDelay: "160ms" }}>
          <span className="ddot" aria-hidden="true" />
          backend unreachable — showing live demo data
        </div>
      )}

      <div className="control-grid stagger" style={{ animationDelay: "200ms" }}>
        <ModeSwitcher mode={health?.mode ?? "read_open"} onChange={changeMode} />

        <AddGrant onAdded={refreshGrants} />
      </div>

      <div className="stagger" style={{ animationDelay: "300ms" }}>
        <GrantsTable
          grants={grants}
          loading={grantsLoading}
          onToggle={togglePerm}
          onRevoke={revoke}
        />
      </div>

      <footer className="footer">
        <span>Terra Gate · guarding Google Drive &amp; Sheets</span>
        <span>read · write · delete — you hold the keys</span>
      </footer>
    </div>
  );
}

function readStored<T extends string>(key: "theme" | "mode", fallback: T): T {
  const storageKey = key === "theme" ? THEME_KEY : MODE_KEY;
  try {
    return (window.localStorage.getItem(storageKey) as T | null) ?? fallback;
  } catch {
    return fallback;
  }
}

function labelForMode(mode: Mode): string {
  if (mode === "read_open") return "read-open";
  if (mode === "strict") return "strict";
  return "off";
}
