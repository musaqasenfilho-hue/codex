import type { ExpenseCategory, ExpenseFilters } from "./types";

export const STORAGE_KEY = "expense-tracker:v1:expenses";
export const ALL_CATEGORIES = "All" as const;

export const DEFAULT_FILTERS: ExpenseFilters = {
  search: "",
  category: ALL_CATEGORIES,
  startDate: "",
  endDate: "",
};

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Food: "#0ea5e9",
  Transportation: "#f97316",
  Entertainment: "#14b8a6",
  Shopping: "#ec4899",
  Bills: "#6366f1",
  Other: "#64748b",
};

export const CURRENCY_CODE = "USD";
