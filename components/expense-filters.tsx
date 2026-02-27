import { ALL_CATEGORIES } from "@/lib/constants";
import { EXPENSE_CATEGORIES } from "@/lib/types";
import type { ExpenseFilters } from "@/lib/types";

interface ExpenseFiltersPanelProps {
  filters: ExpenseFilters;
  filteredCount: number;
  totalCount: number;
  onChange: (next: Partial<ExpenseFilters>) => void;
  onClear: () => void;
}

function hasActiveFilters(filters: ExpenseFilters): boolean {
  return Boolean(
    filters.search ||
      filters.category !== ALL_CATEGORIES ||
      filters.startDate ||
      filters.endDate,
  );
}

export function ExpenseFiltersPanel({
  filters,
  filteredCount,
  totalCount,
  onChange,
  onClear,
}: ExpenseFiltersPanelProps): JSX.Element {
  return (
    <section className="card-surface card-animate space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
          <p className="text-sm text-slate-500">
            Showing {filteredCount} of {totalCount} expenses
          </p>
        </div>

        {hasActiveFilters(filters) ? (
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            onClick={onClear}
          >
            Reset filters
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Search</span>
          <input
            value={filters.search}
            type="search"
            placeholder="Search descriptions or categories"
            onChange={(event) => onChange({ search: event.target.value })}
            className="input-control"
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Category</span>
          <select
            value={filters.category}
            onChange={(event) =>
              onChange({
                category: event.target.value as ExpenseFilters["category"],
              })
            }
            className="input-control"
          >
            <option value={ALL_CATEGORIES}>All categories</option>
            {EXPENSE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">From date</span>
          <input
            value={filters.startDate}
            type="date"
            onChange={(event) => onChange({ startDate: event.target.value })}
            className="input-control"
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">To date</span>
          <input
            value={filters.endDate}
            type="date"
            onChange={(event) => onChange({ endDate: event.target.value })}
            className="input-control"
          />
        </label>
      </div>
    </section>
  );
}
