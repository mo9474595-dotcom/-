"use client";

import { useMemo, useState } from "react";

const PAGE_SIZE = 20;

/**
 * Client-side search + pagination for a list already loaded in full. Keeps
 * large rosters/result lists/exam-code lists scannable and fast to render
 * without needing a server-paginated API for every table in the app.
 */
export function usePagedSearch<T>(items: T[], matches: (item: T, query: string) => boolean) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => matches(item, q));
  }, [items, query, matches]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  return {
    query,
    setQuery: updateQuery,
    page: safePage,
    setPage,
    pageCount,
    pageItems,
    totalCount: filtered.length,
    pageSize: PAGE_SIZE,
  };
}
