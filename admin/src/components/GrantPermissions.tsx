import type { Grant } from "../lib/types";
import { Switch } from "./ui/switch";

type PermKey = "canRead" | "canWrite" | "canDelete";

const PERMS: { key: PermKey; perm: string; label: string; help: string }[] = [
  { key: "canRead", perm: "read", label: "Read", help: "View" },
  { key: "canWrite", perm: "write", label: "Write", help: "Edit" },
  { key: "canDelete", perm: "delete", label: "Delete", help: "Remove" },
];

export function GrantPermissions({
  grant,
  onToggle,
}: {
  grant: Grant;
  onToggle: (id: number, key: PermKey, next: boolean) => void;
}) {
  return (
    <div className="perms" aria-label={`Permissions for ${grant.name ?? grant.googleId}`}>
      {PERMS.map(({ key, perm, label, help }) => {
        const on = grant[key];
        return (
          <label key={key} className="perm-pill" data-perm={perm} data-on={on}>
            <span>
              <strong>{label}</strong>
              <small>{help}</small>
            </span>
            <Switch
              size="sm"
              checked={on}
              aria-label={`${label} permission for ${grant.name ?? grant.googleId}`}
              onCheckedChange={(next) => onToggle(grant.id, key, next)}
            />
          </label>
        );
      })}
    </div>
  );
}
