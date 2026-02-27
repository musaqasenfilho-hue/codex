export const EXPENSE_CATEGORIES = [
  "Food",
  "Transportation",
  "Entertainment",
  "Shopping",
  "Bills",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type CategoryFilter = ExpenseCategory | "All";

export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseInput {
  date: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
}

export interface ExpenseFilters {
  search: string;
  category: CategoryFilter;
  startDate: string;
  endDate: string;
}

export interface DashboardMetrics {
  totalSpending: number;
  monthlySpending: number;
  averageExpense: number;
  totalExpenses: number;
  topCategory: ExpenseCategory | null;
}

export interface CategoryBreakdown {
  category: ExpenseCategory;
  total: number;
  count: number;
  percentage: number;
}

export interface FeedbackMessage {
  type: "success" | "error" | "info";
  message: string;
}
