import { formatCurrency, formatRelativeMonth } from "@/lib/format";
import type { DashboardMetrics } from "@/lib/types";

interface DashboardCardsProps {
  metrics: DashboardMetrics;
  isFilteredView: boolean;
}

const topCategoryLabel = (category: DashboardMetrics["topCategory"]): string => {
  if (!category) {
    return "No data";
  }

  return category;
};

export function DashboardCards({
  metrics,
  isFilteredView,
}: DashboardCardsProps): JSX.Element {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article className="card-surface card-animate p-5">
        <p className="text-sm text-slate-500">Total Spending</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">
          {formatCurrency(metrics.totalSpending)}
        </p>
        {isFilteredView ? (
          <p className="mt-2 text-xs text-slate-500">Filtered result set</p>
        ) : (
          <p className="mt-2 text-xs text-slate-500">All recorded expenses</p>
        )}
      </article>

      <article className="card-surface card-animate p-5">
        <p className="text-sm text-slate-500">Spending This Month</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">
          {formatCurrency(metrics.monthlySpending)}
        </p>
        <p className="mt-2 text-xs text-slate-500">{formatRelativeMonth()}</p>
      </article>

      <article className="card-surface card-animate p-5">
        <p className="text-sm text-slate-500">Average Expense</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">
          {formatCurrency(metrics.averageExpense)}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          {metrics.totalExpenses} expense
          {metrics.totalExpenses === 1 ? "" : "s"}
        </p>
      </article>

      <article className="card-surface card-animate p-5">
        <p className="text-sm text-slate-500">Top Category</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">
          {topCategoryLabel(metrics.topCategory)}
        </p>
        <p className="mt-2 text-xs text-slate-500">Highest spend segment</p>
      </article>
    </section>
  );
}
