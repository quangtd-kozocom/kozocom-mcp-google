import { useState } from "react";
import { Button } from "./ui/button";

export function RevokeButton({
  grantId,
  onRevoke,
}: {
  grantId: number;
  onRevoke: (id: number) => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <Button
      type="button"
      variant={confirming ? "destructive" : "outline"}
      size="sm"
      className="revoke"
      data-confirm={confirming}
      onClick={() => {
        if (confirming) {
          onRevoke(grantId);
        } else {
          setConfirming(true);
          window.setTimeout(() => setConfirming(false), 3000);
        }
      }}
    >
      {confirming ? "Confirm" : "Revoke"}
    </Button>
  );
}
