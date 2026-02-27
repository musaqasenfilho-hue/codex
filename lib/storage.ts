import { STORAGE_KEY } from "./constants";
import type { Expense } from "./types";

function isExpense(value: unknown): value is Expense {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.date === "string" &&
    typeof candidate.amount === "number" &&
    typeof candidate.category === "string" &&
    typeof candidate.description === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string"
  );
}

export function loadExpenses(): Expense[] {
  if (typeof window === "undefined") {
    return [];
  }

  const payload = window.localStorage.getItem(STORAGE_KEY);
  if (!payload) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    throw new Error("Stored expenses data is not valid JSON.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Stored expenses data has an unexpected format.");
  }

  const normalized = parsed.filter(isExpense);
  if (normalized.length !== parsed.length) {
    throw new Error("Stored expenses contain invalid records.");
  }

  return normalized;
}

export function saveExpenses(expenses: Expense[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

export function clearExpenseStorage(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}
