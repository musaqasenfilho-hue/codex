import type { Expense, ExpenseCategory } from "./types";

export const CLOUD_EXPORT_TEMPLATES = [
  {
    id: "tax-report",
    name: "Tax Report",
    description:
      "Detailed ledger with category and date metadata for accounting workflows.",
  },
  {
    id: "monthly-summary",
    name: "Monthly Summary",
    description:
      "Executive monthly digest with totals and trend-ready structure.",
  },
  {
    id: "category-analysis",
    name: "Category Analysis",
    description:
      "Spending distribution model optimized for category-level decisions.",
  },
] as const;

export const CLOUD_INTEGRATIONS = [
  {
    id: "google-sheets",
    name: "Google Sheets",
    kind: "Workspace",
    description: "Push live exports into shared spreadsheet models.",
  },
  {
    id: "dropbox",
    name: "Dropbox",
    kind: "Cloud Storage",
    description: "Store recurring backups in your Dropbox archive.",
  },
  {
    id: "onedrive",
    name: "OneDrive",
    kind: "Cloud Storage",
    description: "Sync export snapshots with Microsoft 365 folders.",
  },
  {
    id: "notion",
    name: "Notion",
    kind: "Knowledge Base",
    description: "Publish summaries into collaborative documentation pages.",
  },
  {
    id: "slack",
    name: "Slack",
    kind: "Messaging",
    description: "Broadcast export completions to finance channels.",
  },
] as const;

export const SCHEDULE_FREQUENCIES = ["daily", "weekly", "monthly"] as const;
export type ScheduleFrequency = (typeof SCHEDULE_FREQUENCIES)[number];

export type CloudExportTemplateId = (typeof CLOUD_EXPORT_TEMPLATES)[number]["id"];
export type CloudIntegrationId = (typeof CLOUD_INTEGRATIONS)[number]["id"];
export type CloudExportDestination =
  | "email"
  | "google-sheets"
  | "share-link"
  | "schedule"
  | CloudIntegrationId;

export interface CloudExportHistoryItem {
  id: string;
  createdAt: string;
  templateId: CloudExportTemplateId;
  destination: CloudExportDestination;
  status: "success" | "scheduled" | "failed";
  details: string;
}

export interface CloudIntegrationState {
  id: CloudIntegrationId;
  connected: boolean;
  syncStatus: "synced" | "syncing" | "attention";
  lastSyncedAt: string | null;
}

const HISTORY_KEY = "expense-tracker:v3:cloud-export-history";
const INTEGRATIONS_KEY = "expense-tracker:v3:cloud-integrations";

function isCloudExportHistoryItem(value: unknown): value is CloudExportHistoryItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.templateId === "string" &&
    typeof candidate.destination === "string" &&
    typeof candidate.status === "string" &&
    typeof candidate.details === "string"
  );
}

function isCloudIntegrationState(value: unknown): value is CloudIntegrationState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.connected === "boolean" &&
    typeof candidate.syncStatus === "string" &&
    (typeof candidate.lastSyncedAt === "string" || candidate.lastSyncedAt === null)
  );
}

export function createId(prefix = "cx"): string {
  const randomToken = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${randomToken}`;
}

export function getDefaultIntegrationState(): CloudIntegrationState[] {
  const nowIso = new Date().toISOString();

  return CLOUD_INTEGRATIONS.map((integration, index) => ({
    id: integration.id,
    connected: integration.id === "google-sheets",
    syncStatus: integration.id === "google-sheets" ? "synced" : "attention",
    lastSyncedAt: integration.id === "google-sheets" ? nowIso : null,
    // distribute connected default behavior through index for visual variety
    ...(index === 2
      ? { connected: true, syncStatus: "synced" as const, lastSyncedAt: nowIso }
      : {}),
  }));
}

export function loadCloudIntegrationState(): CloudIntegrationState[] {
  if (typeof window === "undefined") {
    return getDefaultIntegrationState();
  }

  const payload = window.localStorage.getItem(INTEGRATIONS_KEY);
  if (!payload) {
    return getDefaultIntegrationState();
  }

  try {
    const parsed = JSON.parse(payload);

    if (!Array.isArray(parsed)) {
      return getDefaultIntegrationState();
    }

    const valid = parsed.filter(isCloudIntegrationState);

    if (valid.length !== parsed.length) {
      return getDefaultIntegrationState();
    }

    return valid;
  } catch {
    return getDefaultIntegrationState();
  }
}

export function saveCloudIntegrationState(value: CloudIntegrationState[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(INTEGRATIONS_KEY, JSON.stringify(value));
}

export function createSeedExportHistory(): CloudExportHistoryItem[] {
  const now = Date.now();

  return [
    {
      id: createId("history"),
      createdAt: new Date(now - 1000 * 60 * 15).toISOString(),
      templateId: "monthly-summary",
      destination: "google-sheets",
      status: "success",
      details: "Updated \"Finance Ops / Monthly Overview\"",
    },
    {
      id: createId("history"),
      createdAt: new Date(now - 1000 * 60 * 90).toISOString(),
      templateId: "tax-report",
      destination: "email",
      status: "success",
      details: "Sent to accounting@example.com",
    },
    {
      id: createId("history"),
      createdAt: new Date(now - 1000 * 60 * 60 * 8).toISOString(),
      templateId: "category-analysis",
      destination: "schedule",
      status: "scheduled",
      details: "Recurring weekly backup configured",
    },
  ];
}

export function loadCloudExportHistory(): CloudExportHistoryItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const payload = window.localStorage.getItem(HISTORY_KEY);
  if (!payload) {
    const seeded = createSeedExportHistory();
    saveCloudExportHistory(seeded);
    return seeded;
  }

  try {
    const parsed = JSON.parse(payload);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isCloudExportHistoryItem);
  } catch {
    return [];
  }
}

export function saveCloudExportHistory(value: CloudExportHistoryItem[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(value));
}

export function buildShareableLink(templateId: CloudExportTemplateId): string {
  const token = Math.random().toString(36).slice(2, 10);
  return `https://share.expensesuite.app/export/${templateId}?token=${token}`;
}

export function buildPseudoQrMatrix(value: string, size = 21): boolean[] {
  let seed = 0;

  for (let index = 0; index < value.length; index += 1) {
    seed = (seed * 31 + value.charCodeAt(index)) >>> 0;
  }

  const matrix = Array.from({ length: size * size }, (_, index) => {
    seed = (1664525 * seed + 1013904223 + index) >>> 0;
    return (seed & 1) === 1;
  });

  const applyFinder = (startRow: number, startCol: number): void => {
    for (let row = 0; row < 7; row += 1) {
      for (let col = 0; col < 7; col += 1) {
        const isBorder = row === 0 || col === 0 || row === 6 || col === 6;
        const isInner = row >= 2 && row <= 4 && col >= 2 && col <= 4;
        const value = isBorder || isInner;
        matrix[(startRow + row) * size + (startCol + col)] = value;
      }
    }
  };

  applyFinder(0, 0);
  applyFinder(0, size - 7);
  applyFinder(size - 7, 0);

  return matrix;
}

export function summarizeTemplatePayload(
  templateId: CloudExportTemplateId,
  expenses: Expense[],
): string {
  if (templateId === "tax-report") {
    const taxableTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    return `${expenses.length} ledger entries, taxable base ${taxableTotal.toFixed(2)}.`;
  }

  if (templateId === "monthly-summary") {
    const monthTotals = new Map<string, number>();

    expenses.forEach((expense) => {
      const key = expense.date.slice(0, 7);
      monthTotals.set(key, (monthTotals.get(key) ?? 0) + expense.amount);
    });

    const months = monthTotals.size;
    return `${months} monthly buckets prepared from ${expenses.length} records.`;
  }

  const categoryTotals = new Map<ExpenseCategory, number>();

  expenses.forEach((expense) => {
    categoryTotals.set(
      expense.category,
      (categoryTotals.get(expense.category) ?? 0) + expense.amount,
    );
  });

  const topCategory = Array.from(categoryTotals.entries()).sort(
    (left, right) => right[1] - left[1],
  )[0];

  if (!topCategory) {
    return "No category signals available for analysis.";
  }

  return `Top category: ${topCategory[0]} (${topCategory[1].toFixed(2)}).`;
}
