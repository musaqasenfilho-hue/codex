import { formatCurrency, formatDisplayDate } from "@/lib/format";
import type { Expense } from "@/lib/types";

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ExpenseList({
  expenses,
  onEdit,
  onDelete,
}: ExpenseListProps): JSX.Element {
  return (
    <section className="card-surface card-animate p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">Expense History</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {expenses.length} records
        </span>
      </div>

      {expenses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          No expenses match your current filters.
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Description</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3 text-right">Amount</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-3 py-3 text-sm text-slate-700">
                      {formatDisplayDate(expense.date)}
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-900">
                      {expense.description}
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-700">
                      {expense.category}
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-semibold text-slate-900">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                          onClick={() => onEdit(expense.id)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                          onClick={() => onDelete(expense.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 lg:hidden">
            {expenses.map((expense) => (
              <article
                key={expense.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {expense.description}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDisplayDate(expense.date)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatCurrency(expense.amount)}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                    {expense.category}
                  </span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
                      onClick={() => onEdit(expense.id)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700"
                      onClick={() => onDelete(expense.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
