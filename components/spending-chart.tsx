import { CATEGORY_COLORS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import type { CategoryBreakdown } from "@/lib/types";

interface SpendingChartProps {
  data: CategoryBreakdown[];
}

export function SpendingChart({ data }: SpendingChartProps): JSX.Element {
  return (
    <section className="card-surface card-animate p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Category Breakdown</h2>
        <p className="text-sm text-slate-500">
          Visual distribution of spending across categories.
        </p>
      </div>

      {data.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          Add expenses to see spending trends by category.
        </div>
      ) : (
        <ul className="space-y-4">
          {data.map((item) => (
            <li key={item.category} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[item.category] }}
                  />
                  <span className="font-medium text-slate-800">{item.category}</span>
                  <span className="text-slate-500">({item.count})</span>
                </div>

                <div className="text-right">
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(item.total)}
                  </span>
                  <span className="ml-2 text-xs text-slate-500">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.max(4, item.percentage)}%`,
                    backgroundColor: CATEGORY_COLORS[item.category],
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
