export default function PaginationBar({
  page,
  pageCount,
  totalCount,
  pageSize,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  if (totalCount === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
      <span>
        {from}–{to} من {totalCount}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium disabled:opacity-40"
        >
          السابق
        </button>
        <span className="text-xs text-slate-500">
          {page} / {pageCount}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium disabled:opacity-40"
        >
          التالي
        </button>
      </div>
    </div>
  );
}
