import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../api/client";

/** Loading, not-found and error states for a page's main query. */
export function Async<T>({
  query,
  back,
  children,
}: {
  query: UseQueryResult<T>;
  back: { to: string; label: string };
  children: (data: T) => ReactNode;
}) {
  if (query.isLoading) return <p className="loading">Loading…</p>;
  if (query.isError) {
    const missing = query.error instanceof ApiError && query.error.status === 404;
    return (
      <p className="error-note">
        {missing ? "That record doesn't exist any more. " : "Couldn't load this page. "}
        <Link to={back.to}>{back.label}</Link>
      </p>
    );
  }
  return <>{children(query.data as T)}</>;
}
