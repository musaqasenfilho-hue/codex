"use client";

import { useEffect, useMemo, useState } from "react";

import { DashboardCards } from "@/components/dashboard-cards";
import { ExpenseForm } from "@/components/expense-form";
import { ExpenseFiltersPanel } from "@/components/expense-filters";
import { ExpenseList } from "@/components/expense-list";
import { SpendingChart } from "@/components/spending-chart";
import { ALL_CATEGORIES, DEFAULT_FILTERS } from "@/lib/constants";
import {
  calculateCategoryBreakdown,
  calculateDashboardMetrics,
} from "@/lib/analytics";
import { exportExpensesAsCsv } from "@/lib/csv";
import { filterExpenses, sortExpenses } from "@/lib/expenses";
import {
  clearExpenseStorage,
  loadExpenses,
  saveExpenses,
} from "@/lib/storage";
import type {
  Expense,
  ExpenseFilters,
  ExpenseInput,
  FeedbackMessage,
} from "@/lib/types";

const FEEDBACK_TIMEOUT_MS = 3500;

function hasActiveFilters(filters: ExpenseFilters): boolean {
  return Boolean(
    filters.search ||
      filters.category !== ALL_CATEGORIES ||
      filters.startDate ||
      filters.endDate,
  );
}

function createExpense(payload: ExpenseInput): Expense {
  const nowIso = new Date().toISOString();
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    id,
    date: payload.date,
    amount: payload.amount,
    category: payload.category,
    description: payload.description,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

function buildFeedbackClass(type: FeedbackMessage["type"]): string {
  if (type === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (type === "error") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-sky-200 bg-sky-50 text-sky-700";
}

function LoadingPanel(): JSX.Element {
  return (
    <div className="space-y-6">
      <div className="grid animate-pulse gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 rounded-2xl border border-slate-200 bg-white/70"
          />
        ))}
      </div>

      <div className="grid animate-pulse gap-6 xl:grid-cols-[350px_minmax(0,1fr)]">
        <div className="h-[420px] rounded-2xl border border-slate-200 bg-white/70" />
        <div className="space-y-6">
          <div className="h-36 rounded-2xl border border-slate-200 bg-white/70" />
          <div className="h-64 rounded-2xl border border-slate-200 bg-white/70" />
          <div className="h-80 rounded-2xl border border-slate-200 bg-white/70" />
        </div>
      </div>
    </div>
  );
}

export default function ExpenseTrackerApp(): JSX.Element {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filters, setFilters] = useState<ExpenseFilters>(DEFAULT_FILTERS);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    try {
      const loaded = loadExpenses();
      setExpenses(sortExpenses(loaded));
    } catch (loadError) {
      console.error(loadError);
      setError(
        "Stored data appears corrupted or inaccessible. You can reset local data and start fresh.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setFeedback(null);
    }, FEEDBACK_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [feedback]);

  const filteredExpenses = useMemo(
    () => sortExpenses(filterExpenses(expenses, filters)),
    [expenses, filters],
  );

  const metrics = useMemo(
    () => calculateDashboardMetrics(filteredExpenses),
    [filteredExpenses],
  );

  const chartData = useMemo(
    () => calculateCategoryBreakdown(filteredExpenses),
    [filteredExpenses],
  );

  const expenseToEdit = useMemo(
    () => expenses.find((expense) => expense.id === editingExpenseId) ?? null,
    [expenses, editingExpenseId],
  );

  const isFilteredView = hasActiveFilters(filters);

  async function handleSubmitExpense(payload: ExpenseInput): Promise<void> {
    setIsSaving(true);

    try {
      setError(null);

      setExpenses((previous) => {
        const next = editingExpenseId
          ? previous.map((expense) => {
              if (expense.id !== editingExpenseId) {
                return expense;
              }

              return {
                ...expense,
                ...payload,
                updatedAt: new Date().toISOString(),
              };
            })
          : [createExpense(payload), ...previous];

        saveExpenses(next);
        return sortExpenses(next);
      });

      setFeedback({
        type: "success",
        message: editingExpenseId
          ? "Expense updated successfully."
          : "Expense added successfully.",
      });

      setEditingExpenseId(null);
    } catch (saveError) {
      console.error(saveError);
      setError("Could not save data to local storage.");
      setFeedback({
        type: "error",
        message: "Save failed. Please check browser storage permissions.",
      });
      throw saveError;
    } finally {
      setIsSaving(false);
    }
  }

  function handleEditExpense(id: string): void {
    setEditingExpenseId(id);

    const formEl = document.querySelector("#expense-form");
    if (formEl instanceof HTMLElement) {
      formEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function handleCancelEdit(): void {
    setEditingExpenseId(null);
  }

  function handleDeleteExpense(id: string): void {
    const target = expenses.find((expense) => expense.id === id);
    if (!target) {
      return;
    }

    const approved = window.confirm(
      `Delete \"${target.description}\" from ${target.date}?`,
    );

    if (!approved) {
      return;
    }

    try {
      setExpenses((previous) => {
        const next = previous.filter((expense) => expense.id !== id);
        saveExpenses(next);
        return next;
      });

      if (editingExpenseId === id) {
        setEditingExpenseId(null);
      }

      setFeedback({
        type: "info",
        message: "Expense deleted.",
      });
    } catch (deleteError) {
      console.error(deleteError);
      setError("Could not update local storage after delete.");
      setFeedback({
        type: "error",
        message: "Delete failed. Please try again.",
      });
    }
  }

  function handleExport(): void {
    if (filteredExpenses.length === 0) {
      setFeedback({
        type: "error",
        message: "No data to export. Add expenses or broaden filters.",
      });
      return;
    }

    try {
      exportExpensesAsCsv(filteredExpenses);
      setFeedback({
        type: "success",
        message: `Exported ${filteredExpenses.length} expenses to CSV.`,
      });
    } catch (exportError) {
      console.error(exportError);
      setFeedback({
        type: "error",
        message: "CSV export failed.",
      });
    }
  }

  function handleClearFilters(): void {
    setFilters(DEFAULT_FILTERS);
  }

  function handleResetCorruptStorage(): void {
    clearExpenseStorage();
    setExpenses([]);
    setFilters(DEFAULT_FILTERS);
    setEditingExpenseId(null);
    setError(null);
    setFeedback({
      type: "info",
      message: "Stored data reset successfully.",
    });
  }

  return (
    <div className="relative isolate min-h-screen pb-10">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-indigo-200/25 blur-3xl" />
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="card-surface mb-6 card-animate p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
                Personal Finance
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
                Expense Tracker
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                Monitor spending, filter trends, and export your records with a
                clean workflow optimized for daily budgeting.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExport}
              disabled={filteredExpenses.length === 0 || isLoading}
              className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-sky-300"
            >
              Export CSV
            </button>
          </div>
        </header>

        {error ? (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p>{error}</p>
              <button
                type="button"
                onClick={handleResetCorruptStorage}
                className="rounded-lg border border-rose-300 px-3 py-1.5 font-semibold text-rose-700 hover:bg-rose-100"
              >
                Reset local data
              </button>
            </div>
          </div>
        ) : null}

        {feedback ? (
          <div
            className={`mb-6 rounded-xl border p-3 text-sm ${buildFeedbackClass(feedback.type)}`}
            role="status"
            aria-live="polite"
          >
            {feedback.message}
          </div>
        ) : null}

        {isLoading ? (
          <LoadingPanel />
        ) : (
          <>
            <DashboardCards
              metrics={metrics}
              isFilteredView={isFilteredView}
            />

            <div className="mt-6 grid gap-6 xl:grid-cols-[350px_minmax(0,1fr)]">
              <div id="expense-form" className="xl:sticky xl:top-6 xl:self-start">
                <ExpenseForm
                  expenseToEdit={expenseToEdit}
                  isSaving={isSaving}
                  onSubmit={handleSubmitExpense}
                  onCancelEdit={handleCancelEdit}
                />
              </div>

              <div className="space-y-6">
                <ExpenseFiltersPanel
                  filters={filters}
                  filteredCount={filteredExpenses.length}
                  totalCount={expenses.length}
                  onChange={(next) =>
                    setFilters((previous) => ({ ...previous, ...next }))
                  }
                  onClear={handleClearFilters}
                />

                <SpendingChart data={chartData} />

                <ExpenseList
                  expenses={filteredExpenses}
                  onEdit={handleEditExpense}
                  onDelete={handleDeleteExpense}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
