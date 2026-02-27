import { EXPENSE_CATEGORIES } from "./types";
import type { CategoryBreakdown, DashboardMetrics, Expense } from "./types";

function isSameYearMonth(targetDate: string, referenceDate: Date): boolean {
  const parsed = new Date(`${targetDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return (
    parsed.getFullYear() === referenceDate.getFullYear() &&
    parsed.getMonth() === referenceDate.getMonth()
  );
}

export function calculateDashboardMetrics(
  expenses: Expense[],
  now = new Date(),
): DashboardMetrics {
  const totalSpending = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const monthlySpending = expenses
    .filter((expense) => isSameYearMonth(expense.date, now))
    .reduce((sum, expense) => sum + expense.amount, 0);
  const averageExpense = expenses.length > 0 ? totalSpending / expenses.length : 0;

  const categoryTotals = EXPENSE_CATEGORIES.map((category) => {
    const total = expenses
      .filter((expense) => expense.category === category)
      .reduce((sum, expense) => sum + expense.amount, 0);

    return { category, total };
  });

  const topCategory =
    categoryTotals
      .sort((a, b) => b.total - a.total)
      .find((item) => item.total > 0)?.category ?? null;

  return {
    totalSpending,
    monthlySpending,
    averageExpense,
    totalExpenses: expenses.length,
    topCategory,
  };
}

export function calculateCategoryBreakdown(
  expenses: Expense[],
): CategoryBreakdown[] {
  const totalSpending = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const breakdown = EXPENSE_CATEGORIES.map((category) => {
    const categoryExpenses = expenses.filter(
      (expense) => expense.category === category,
    );

    const total = categoryExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    );

    return {
      category,
      total,
      count: categoryExpenses.length,
      percentage: totalSpending > 0 ? (total / totalSpending) * 100 : 0,
    };
  })
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);

  return breakdown;
}
