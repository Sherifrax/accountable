import {
  type ColumnDef,
  type SortingFn,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { searchRows } from "../lib/search";
import { SearchBox } from "./SearchBox";

export type Column<T> = ColumnDef<T, unknown> & {
  meta?: { align?: "num"; strong?: boolean };
};

type Props<T> = {
  /** Plural noun for messages: "contacts". */
  noun: string;
  searchPlaceholder: string;
  data: T[];
  columns: Column<T>[];
  /** The text of every visible column, for search (R-TBL-1). */
  visibleText: (row: T) => (string | number | null | undefined)[];
  defaultSort: { id: string; desc?: boolean };
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  /** Shown at the end of each row (Edit and Delete). */
  rowActions?: (row: T) => ReactNode;
  /** Extra controls next to the search box, such as the status filter. */
  toolbar?: ReactNode;
  /** Said when the data is empty before any search. */
  emptyMessage?: string;
  /** The rows to search; defaults to all of `data`. Lets a page pre-filter first. */
  query?: string;
  onQueryChange?: (q: string) => void;
};

// Strings ignore case and numbers inside text sort naturally.
const compare: SortingFn<unknown> = (a, b, columnId) => {
  const x = a.getValue(columnId) as string | number | boolean;
  const y = b.getValue(columnId) as string | number | boolean;
  if (typeof x === "number" && typeof y === "number") return x - y;
  return String(x).localeCompare(String(y), undefined, { sensitivity: "base", numeric: true });
};

/** Empty values become `undefined` so they always sort last, in either direction. */
function withEmptyLast<T>(columns: Column<T>[]): ColumnDef<T, unknown>[] {
  return columns.map((column) => {
    const key = (column as { accessorKey?: string }).accessorKey;
    if (!key) return { ...column, sortUndefined: "last" } as ColumnDef<T, unknown>;
    const { accessorKey: _drop, ...rest } = column as Column<T> & { accessorKey: string };
    void _drop;
    return {
      ...rest,
      id: key,
      accessorFn: (row: T) => {
        const value = (row as Record<string, unknown>)[key];
        return value === null || value === "" ? undefined : value;
      },
      sortUndefined: "last",
    } as ColumnDef<T, unknown>;
  });
}

export function DataTable<T>({
  noun,
  searchPlaceholder,
  data,
  columns,
  visibleText,
  defaultSort,
  rowKey,
  onRowClick,
  rowActions,
  toolbar,
  emptyMessage,
  query: controlledQuery,
  onQueryChange,
}: Props<T>) {
  const [ownQuery, setOwnQuery] = useState("");
  const query = controlledQuery ?? ownQuery;
  const setQuery = onQueryChange ?? setOwnQuery;
  const [sorting, setSorting] = useState<SortingState>([{ id: defaultSort.id, desc: !!defaultSort.desc }]);

  const rows = useMemo(() => searchRows(data, query, visibleText), [data, query, visibleText]);

  const tableColumns = useMemo(() => withEmptyLast(columns), [columns]);

  const table = useReactTable({
    data: rows,
    columns: tableColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSortingRemoval: false,
    sortDescFirst: false,
    defaultColumn: { sortingFn: compare as SortingFn<T> },
  });

  const colCount = columns.length + (rowActions ? 1 : 0);
  const sorted = table.getRowModel().rows;

  return (
    <div>
      <div className="toolbar">
        <SearchBox value={query} onChange={setQuery} placeholder={searchPlaceholder} />
        {toolbar}
        <span className="count-note" aria-live="polite">
          {rows.length === data.length ? `${data.length} ${noun}` : `${rows.length} of ${data.length} ${noun}`}
        </span>
      </div>
      <div className="table-scroll">
        <table className="dt">
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const dir = header.column.getIsSorted();
                  const num = (header.column.columnDef as Column<T>).meta?.align === "num";
                  return (
                    <th
                      key={header.id}
                      className={num ? "num" : ""}
                      aria-sort={dir === "asc" ? "ascending" : dir === "desc" ? "descending" : "none"}
                    >
                      <button type="button" onClick={header.column.getToggleSortingHandler()}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {dir === "asc" && <ArrowUp aria-hidden="true" />}
                        {dir === "desc" && <ArrowDown aria-hidden="true" />}
                      </button>
                    </th>
                  );
                })}
                {rowActions && <th aria-label="Actions" />}
              </tr>
            ))}
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td className="empty" colSpan={colCount}>
                  {query.trim() ? `No ${noun} match '${query.trim()}'.` : (emptyMessage ?? `No ${noun} yet.`)}
                </td>
              </tr>
            ) : (
              sorted.map((row) => (
                <tr
                  key={rowKey(row.original)}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = (cell.column.columnDef as Column<T>).meta;
                    return (
                      <td key={cell.id} className={`${meta?.align === "num" ? "num" : ""} ${meta?.strong ? "strong" : ""}`.trim()}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                  {rowActions && (
                    <td className="actions" onClick={(e) => e.stopPropagation()}>
                      <div className="row-acts">{rowActions(row.original)}</div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
