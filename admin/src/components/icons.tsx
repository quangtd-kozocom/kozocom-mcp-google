import type { Kind } from "../lib/types";
import { FileIcon } from "./FileIcon";
import { FolderIcon } from "./FolderIcon";
import { SheetIcon } from "./SheetIcon";

export function KindIcon({ kind, className }: { kind: Kind; className?: string }) {
  if (kind === "folder") return <FolderIcon className={className} />;
  if (kind === "spreadsheet") return <SheetIcon className={className} />;
  return <FileIcon className={className} />;
}
