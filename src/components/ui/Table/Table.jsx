import { useState, useMemo } from "react";
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from "lucide-react";
import { Input } from "../Input/Input";
import "./Table.css";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export function DataTable({
  columns,
  data,
  loading = false,
  searchable = true,
  searchPlaceholder = "Tìm kiếm...",
  toolbar,
  onRowClick,
  emptyTitle = "Không có dữ liệu",
  emptyDesc = "Chưa có dữ liệu nào được tạo.",
  className = "",
  pageSize: defaultPageSize = DEFAULT_PAGE_SIZE,
  // Server-side pagination: { page (0-indexed), pageSize, total, totalPages, onPageChange }
  serverPagination,
}) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = col.accessor ? row[col.accessor] : "";
        return String(val).toLowerCase().includes(q);
      }),
    );
  }, [data, search, columns]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey] ?? "";
      const bVal = b[sortKey] ?? "";
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredData, sortKey, sortDir]);

  // When server pagination is active: show all received data (server already sliced it)
  const isServer = !!serverPagination;
  const internalTotalPages = isServer
    ? 1
    : Math.ceil(sortedData.length / pageSize);
  const pagedData = isServer
    ? sortedData
    : sortedData.slice((page - 1) * pageSize, page * pageSize);

  // Unified pagination values
  const sp = serverPagination;
  const activePage = isServer ? sp.page + 1 : page; // 1-indexed
  const activePSize = isServer ? sp.pageSize : pageSize;
  const activeTPages = isServer ? sp.totalPages : internalTotalPages;
  const activeTotal = isServer ? sp.total : sortedData.length;
  const goToPage = isServer
    ? (p) => sp.onPageChange(p - 1) // convert back to 0-indexed
    : setPage;

  const handleSort = (accessor) => {
    if (!accessor) return;
    if (sortKey === accessor) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(accessor);
      setSortDir("asc");
    }
  };

  return (
    <div className={`data-table-wrapper ${className}`}>
      {(searchable || toolbar) && (
        <div className="data-table-toolbar">
          {searchable && (
            <div className="data-table-toolbar__search">
              <Input
                icon={Search}
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (!isServer) setPage(1);
                }}
              />
            </div>
          )}
          {toolbar && (
            <div className="data-table-toolbar__actions">{toolbar}</div>
          )}
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col, ci) => (
                <th
                  key={col.key || col.accessor || `col-${ci}`}
                  className={`${col.sortable ? "sortable" : ""} ${sortKey === col.accessor ? "sorted" : ""}`}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.accessor)}
                >
                  {col.header}
                  {col.sortable && (
                    <span className="sort-icon">
                      {sortKey === col.accessor ? (
                        sortDir === "asc" ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )
                      ) : (
                        <ChevronUp size={14} />
                      )}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="data-table-empty">
                    <Inbox size={48} className="data-table-empty__icon" />
                    <p className="data-table-empty__title">{emptyTitle}</p>
                    <p className="data-table-empty__desc">{emptyDesc}</p>
                  </div>
                </td>
              </tr>
            ) : (
              pagedData.map((row, i) => (
                <tr
                  key={row.id || i}
                  onClick={() => onRowClick?.(row)}
                  style={{ cursor: onRowClick ? "pointer" : "default" }}
                >
                  {columns.map((col, ci) => (
                    <td key={col.key || col.accessor || `td-${ci}`}>
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {activeTPages > 1 && (
        <div className="data-table-pagination">
          <div className="data-table-pagination__left">
            <span className="data-table-pagination__info">
              Hiển thị {(activePage - 1) * activePSize + 1}–
              {Math.min(activePage * activePSize, activeTotal)} / {activeTotal}
            </span>
            {!isServer && (
              <select
                className="data-table-pagination__size-select"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                aria-label="Số dòng mỗi trang"
              >
                {PAGE_SIZE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s} / trang
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="data-table-pagination__controls">
            <button
              className="data-table-pagination__btn"
              onClick={() => goToPage(1)}
              disabled={activePage === 1}
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              className="data-table-pagination__btn"
              onClick={() => goToPage(activePage - 1)}
              disabled={activePage === 1}
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(5, activeTPages) }, (_, i) => {
              let p;
              if (activeTPages <= 5) p = i + 1;
              else if (activePage <= 3) p = i + 1;
              else if (activePage >= activeTPages - 2) p = activeTPages - 4 + i;
              else p = activePage - 2 + i;
              return (
                <button
                  key={p}
                  className={`data-table-pagination__btn ${p === activePage ? "data-table-pagination__btn--active" : ""}`}
                  onClick={() => goToPage(p)}
                >
                  {p}
                </button>
              );
            })}
            <button
              className="data-table-pagination__btn"
              onClick={() => goToPage(activePage + 1)}
              disabled={activePage === activeTPages}
            >
              <ChevronRight size={16} />
            </button>
            <button
              className="data-table-pagination__btn"
              onClick={() => goToPage(activeTPages)}
              disabled={activePage === activeTPages}
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
