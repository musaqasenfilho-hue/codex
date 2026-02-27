import { downloadTextFile } from "./format";
import type { Expense } from "./types";

function escapeCsvValue(value: string): string {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replaceAll("\"", '""')}"`;
  }

  return value;
}

export function buildExpenseCsv(expenses: Expense[]): string {
  const header = ["Date", "Amount", "Category", "Description"];

  const rows = expenses.map((expense) => [
    expense.date,
    expense.amount.toFixed(2),
    expense.category,
    escapeCsvValue(expense.description),
  ]);

  const csvRows = [header, ...rows].map((row) => row.join(","));
  return csvRows.join("\n");
}

export function exportExpensesAsCsv(
  expenses: Expense[],
  fileName = `expenses-${new Date().toISOString().slice(0, 10)}.csv`,
): void {
  const content = buildExpenseCsv(expenses);
  downloadTextFile(content, fileName);
}
