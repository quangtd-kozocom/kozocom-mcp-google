import type { Health } from "../lib/types";

export function Masthead({ health, demo }: { health: Health | null; demo: boolean }) {
  const signedIn = health?.signedIn ?? false;
  const email = health?.email ?? null;

  return (
    <div className="masthead">
      <div className="brand">
        <div className="mark" aria-hidden="true" />
        <div>
          <h1>Terra Gate</h1>
        </div>
      </div>

      <div className="account-chip" data-state={signedIn ? "in" : "out"}>
        <span className="status-dot" aria-hidden="true" />
        <span>{signedIn ? (email ?? "signed in") : "not signed in"}</span>
        {demo && <em>demo</em>}
      </div>
    </div>
  );
}
