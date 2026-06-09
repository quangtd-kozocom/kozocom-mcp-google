import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import type { Grant } from "../lib/types";
import { formatDate } from "../lib/format";
import { CopyId } from "./CopyId";
import { EmptyVault } from "./EmptyVault";
import { GrantPermissions } from "./GrantPermissions";
import { KindIcon } from "./icons";
import { RevokeButton } from "./RevokeButton";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

type PermKey = "canRead" | "canWrite" | "canDelete";

function makeColumns({
  onToggle,
  onRevoke,
}: {
  onToggle: (id: number, key: PermKey, next: boolean) => void;
  onRevoke: (id: number) => void;
}): ColumnDef<Grant>[] {
  return [
    {
      id: "resource",
      header: "Resource",
      cell: ({ row }) => (
        <div className="resource-cell">
          <strong>{row.original.name ?? "Untitled resource"}</strong>
          <span>added {formatDate(row.original.createdAt)}</span>
        </div>
      ),
    },
    {
      accessorKey: "kind",
      header: "Kind",
      cell: ({ row }) => (
        <Badge className="badge" data-kind={row.original.kind} variant="outline">
          <KindIcon kind={row.original.kind} />
          {row.original.kind}
        </Badge>
      ),
    },
    {
      accessorKey: "googleId",
      header: "Google ID",
      cell: ({ row }) => <CopyId value={row.original.googleId} />,
    },
    {
      id: "permissions",
      header: "Permissions",
      cell: ({ row }) => <GrantPermissions grant={row.original} onToggle={onToggle} />,
    },
    {
      id: "action",
      header: "Action",
      cell: ({ row }) => <RevokeButton grantId={row.original.id} onRevoke={onRevoke} />,
    },
  ];
}

export function GrantsTable({
  grants,
  loading,
  onToggle,
  onRevoke,
}: {
  grants: Grant[];
  loading?: boolean;
  onToggle: (id: number, key: PermKey, next: boolean) => void;
  onRevoke: (id: number) => void;
}) {
  const columns = useMemo(() => makeColumns({ onToggle, onRevoke }), [onToggle, onRevoke]);
  const table = useReactTable({
    data: grants,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <section className="panel allowlist-panel" aria-labelledby="allowlist-head">
      <div className="panel-head table-panel-head">
        <div>
          <h2 id="allowlist-head">Allowlist</h2>
          <p>Designed for large Drive inventories. Search and filters can attach to this table model.</p>
        </div>
        <span className="count">
          {grants.length} {grants.length === 1 ? "grant" : "grants"}
        </span>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="grant-skeletons" aria-label="Loading grants">
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </div>
        ) : grants.length === 0 ? (
          <div className="empty">
            <div className="vault-ill">
              <EmptyVault />
            </div>
            <h3>No grants yet</h3>
            <p>
              Add a file, folder or spreadsheet. In strict mode, ungranted Drive data stays
              invisible to the agent.
            </p>
            <div className="arrow">add first grant</div>
          </div>
        ) : (
          <Table className="grants">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} scope="col">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </section>
  );
}
