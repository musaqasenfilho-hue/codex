import type { Expense, ExpenseFilters } from "./types";

export function sortExpenses(expenses: Expense[]): Expense[] {
  return [...expenses].sort((left, right) => {
    const byDate = right.date.localeCompare(left.date);
    if (byDate !== 0) {
      return byDate;
    }

    return right.updatedAt.localeCompare(left.updatedAt);
  });
}

export function filterExpenses(
  expenses: Expense[],
  filters: ExpenseFilters,
): Expense[] {
  const searchValue = filters.search.trim().toLowerCase();

  return expenses.filter((expense) => {
    const matchesSearch =
      searchValue.length === 0 ||
      expense.description.toLowerCase().includes(searchValue) ||
      expense.category.toLowerCase().includes(searchValue);

    const matchesCategory =
      filters.category === "All" || expense.category === filters.category;

    const matchesStartDate =
      !filters.startDate || expense.date >= filters.startDate;

    const matchesEndDate = !filters.endDate || expense.date <= filters.endDate;

    return (
      matchesSearch && matchesCategory && matchesStartDate && matchesEndDate
    );
  });
}
