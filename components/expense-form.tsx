import { useEffect, useMemo, useState } from "react";

import { EXPENSE_CATEGORIES } from "@/lib/types";
import type { Expense, ExpenseCategory, ExpenseInput } from "@/lib/types";

interface ExpenseFormProps {
  expenseToEdit: Expense | null;
  isSaving: boolean;
  onSubmit: (payload: ExpenseInput) => Promise<void>;
  onCancelEdit: () => void;
}

interface FormValues {
  date: string;
  amount: string;
  category: ExpenseCategory;
  description: string;
}

interface FormErrors {
  date?: string;
  amount?: string;
  category?: string;
  description?: string;
  form?: string;
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getInitialValues(expenseToEdit: Expense | null): FormValues {
  if (!expenseToEdit) {
    return {
      date: getToday(),
      amount: "",
      category: EXPENSE_CATEGORIES[0],
      description: "",
    };
  }

  return {
    date: expenseToEdit.date,
    amount: String(expenseToEdit.amount),
    category: expenseToEdit.category,
    description: expenseToEdit.description,
  };
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.date) {
    errors.date = "Please select an expense date.";
  }

  const amount = Number(values.amount);
  if (!values.amount || Number.isNaN(amount)) {
    errors.amount = "Please provide a valid amount.";
  } else if (amount <= 0) {
    errors.amount = "Amount must be greater than 0.";
  }

  if (!EXPENSE_CATEGORIES.includes(values.category)) {
    errors.category = "Please select a valid category.";
  }

  const description = values.description.trim();
  if (description.length < 3) {
    errors.description = "Description should be at least 3 characters.";
  }

  if (description.length > 120) {
    errors.description = "Description should be 120 characters or less.";
  }

  return errors;
}

export function ExpenseForm({
  expenseToEdit,
  isSaving,
  onSubmit,
  onCancelEdit,
}: ExpenseFormProps): JSX.Element {
  const [values, setValues] = useState<FormValues>(() =>
    getInitialValues(expenseToEdit),
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const isEditing = Boolean(expenseToEdit);

  useEffect(() => {
    setValues(getInitialValues(expenseToEdit));
    setErrors({});
  }, [expenseToEdit]);

  const remainingChars = useMemo(
    () => 120 - values.description.length,
    [values.description],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validate(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      await onSubmit({
        date: values.date,
        amount: Number(values.amount),
        category: values.category,
        description: values.description.trim(),
      });

      if (!isEditing) {
        setValues(getInitialValues(null));
      }
    } catch {
      setErrors({
        form: "Unable to save this expense right now. Please try again.",
      });
    }
  }

  return (
    <section className="card-surface card-animate p-5">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {isEditing ? "Edit Expense" : "Add Expense"}
          </h2>
          <p className="text-sm text-slate-500">
            Capture spending with category and context.
          </p>
        </div>

        {isEditing ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            Editing
          </span>
        ) : null}
      </div>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Date</span>
          <input
            value={values.date}
            type="date"
            onChange={(event) =>
              setValues((previous) => ({ ...previous, date: event.target.value }))
            }
            className="input-control"
          />
          {errors.date ? <p className="field-error">{errors.date}</p> : null}
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Amount</span>
          <input
            value={values.amount}
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            onChange={(event) =>
              setValues((previous) => ({
                ...previous,
                amount: event.target.value,
              }))
            }
            className="input-control"
          />
          {errors.amount ? <p className="field-error">{errors.amount}</p> : null}
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Category</span>
          <select
            value={values.category}
            onChange={(event) =>
              setValues((previous) => ({
                ...previous,
                category: event.target.value as ExpenseCategory,
              }))
            }
            className="input-control"
          >
            {EXPENSE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.category ? (
            <p className="field-error">{errors.category}</p>
          ) : null}
        </label>

        <label className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-700">Description</span>
            <span className="text-xs text-slate-500">{remainingChars} chars left</span>
          </div>
          <textarea
            value={values.description}
            rows={3}
            maxLength={120}
            placeholder="e.g. Team lunch downtown"
            onChange={(event) =>
              setValues((previous) => ({
                ...previous,
                description: event.target.value,
              }))
            }
            className="input-control resize-none"
          />
          {errors.description ? (
            <p className="field-error">{errors.description}</p>
          ) : null}
        </label>

        {errors.form ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {errors.form}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Add Expense"}
          </button>

          {isEditing ? (
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              onClick={onCancelEdit}
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
