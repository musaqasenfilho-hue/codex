"use client";

import { useEffect, useMemo, useState } from "react";

import {
  CLOUD_EXPORT_TEMPLATES,
  CLOUD_INTEGRATIONS,
  SCHEDULE_FREQUENCIES,
  buildPseudoQrMatrix,
  buildShareableLink,
  createId,
  loadCloudExportHistory,
  loadCloudIntegrationState,
  saveCloudExportHistory,
  saveCloudIntegrationState,
  summarizeTemplatePayload,
} from "@/lib/cloud-export";
import { formatCurrency, formatDisplayDate } from "@/lib/format";
import type {
  CloudExportHistoryItem,
  CloudExportTemplateId,
  CloudIntegrationId,
  CloudIntegrationState,
  ScheduleFrequency,
} from "@/lib/cloud-export";
import type { Expense, FeedbackMessage } from "@/lib/types";

interface CloudExportCenterProps {
  isOpen: boolean;
  expenses: Expense[];
  onClose: () => void;
  onNotify: (feedback: FeedbackMessage) => void;
}

type CloudExportTab =
  | "email"
  | "sheets"
  | "schedule"
  | "share"
  | "integrations"
  | "history";

const TABS: Array<{ id: CloudExportTab; label: string; caption: string }> = [
  {
    id: "email",
    label: "Email Delivery",
    caption: "Send curated exports to stakeholders",
  },
  {
    id: "sheets",
    label: "Google Sheets",
    caption: "Push data into collaborative models",
  },
  {
    id: "schedule",
    label: "Auto Backup",
    caption: "Configure recurring cloud exports",
  },
  {
    id: "share",
    label: "Share Hub",
    caption: "Create links and QR access",
  },
  {
    id: "integrations",
    label: "Integrations",
    caption: "Manage connected services",
  },
  {
    id: "history",
    label: "Export History",
    caption: "Audit trail and delivery log",
  },
];

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function getTemplateName(templateId: CloudExportTemplateId): string {
  return (
    CLOUD_EXPORT_TEMPLATES.find((template) => template.id === templateId)?.name ??
    templateId
  );
}

function getSyncBadge(status: CloudIntegrationState["syncStatus"]): string {
  if (status === "synced") {
    return "border-emerald-400/40 bg-emerald-400/10 text-emerald-200";
  }

  if (status === "syncing") {
    return "border-amber-400/40 bg-amber-400/10 text-amber-200";
  }

  return "border-rose-400/40 bg-rose-400/10 text-rose-200";
}

export function CloudExportCenter({
  isOpen,
  expenses,
  onClose,
  onNotify,
}: CloudExportCenterProps): JSX.Element | null {
  const [activeTab, setActiveTab] = useState<CloudExportTab>("email");
  const [selectedTemplate, setSelectedTemplate] =
    useState<CloudExportTemplateId>("monthly-summary");

  const [emailRecipient, setEmailRecipient] = useState("finance@example.com");
  const [emailSubject, setEmailSubject] = useState("Expense export ready");

  const [sheetName, setSheetName] = useState("Finance Ops Export");
  const [sheetMode, setSheetMode] = useState<"append" | "replace">("append");

  const [scheduleEnabled, setScheduleEnabled] = useState(true);
  const [scheduleFrequency, setScheduleFrequency] =
    useState<ScheduleFrequency>("weekly");
  const [scheduleTime, setScheduleTime] = useState("08:30");
  const [scheduleDestination, setScheduleDestination] =
    useState<"google-sheets" | "dropbox" | "onedrive" | "email">(
      "google-sheets",
    );

  const [shareLink, setShareLink] = useState("");
  const [shareExpiryDays, setShareExpiryDays] = useState("7");

  const [primaryStorage, setPrimaryStorage] =
    useState<"dropbox" | "onedrive" | "google-sheets">("dropbox");
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  const [history, setHistory] = useState<CloudExportHistoryItem[]>([]);
  const [integrationState, setIntegrationState] =
    useState<CloudIntegrationState[]>(loadCloudIntegrationState);

  const [isBusyAction, setIsBusyAction] = useState<string | null>(null);
  const [localNotice, setLocalNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setHistory(loadCloudExportHistory());
    setIntegrationState(loadCloudIntegrationState());
    setLocalNotice(null);
  }, [isOpen]);

  useEffect(() => {
    saveCloudExportHistory(history);
  }, [history]);

  useEffect(() => {
    saveCloudIntegrationState(integrationState);
  }, [integrationState]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const selectedTemplateMeta = useMemo(
    () =>
      CLOUD_EXPORT_TEMPLATES.find((template) => template.id === selectedTemplate) ??
      CLOUD_EXPORT_TEMPLATES[0],
    [selectedTemplate],
  );

  const templateRecordCount = expenses.length;

  const templateTotal = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses],
  );

  const templateSummary = useMemo(
    () => summarizeTemplatePayload(selectedTemplate, expenses),
    [expenses, selectedTemplate],
  );

  const previewRows = useMemo(() => expenses.slice(0, 6), [expenses]);

  const currentJobsCount = isBusyAction ? 1 : 0;

  const nextScheduledRun = useMemo(() => {
    const now = new Date();

    if (!scheduleEnabled) {
      return "Disabled";
    }

    if (scheduleFrequency === "daily") {
      now.setDate(now.getDate() + 1);
    } else if (scheduleFrequency === "weekly") {
      now.setDate(now.getDate() + 7);
    } else {
      now.setMonth(now.getMonth() + 1);
    }

    return `${new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }).format(now)} at ${scheduleTime}`;
  }, [scheduleEnabled, scheduleFrequency, scheduleTime]);

  const qrMatrix = useMemo(
    () => (shareLink ? buildPseudoQrMatrix(shareLink, 21) : []),
    [shareLink],
  );

  const googleSheetsState =
    integrationState.find((item) => item.id === "google-sheets") ?? null;

  function updateIntegrationState(
    integrationId: CloudIntegrationId,
    patch: Partial<CloudIntegrationState>,
  ): void {
    setIntegrationState((previous) =>
      previous.map((item) =>
        item.id === integrationId
          ? {
              ...item,
              ...patch,
            }
          : item,
      ),
    );
  }

  function appendHistory(
    payload: Omit<CloudExportHistoryItem, "id" | "createdAt">,
  ): void {
    const entry: CloudExportHistoryItem = {
      id: createId("history"),
      createdAt: new Date().toISOString(),
      ...payload,
    };

    setHistory((previous) => [entry, ...previous].slice(0, 25));
  }

  async function runSimulatedAction(
    actionId: string,
    callback: () => void,
  ): Promise<void> {
    setIsBusyAction(actionId);
    setLocalNotice(null);

    await new Promise<void>((resolve) => {
      window.setTimeout(() => resolve(), 850);
    });

    callback();
    setIsBusyAction(null);
  }

  async function handleSendEmail(): Promise<void> {
    if (!emailRecipient.includes("@")) {
      setLocalNotice("Enter a valid recipient email address.");
      return;
    }

    if (templateRecordCount === 0) {
      setLocalNotice("Add expenses before sending exports.");
      return;
    }

    await runSimulatedAction("send-email", () => {
      appendHistory({
        destination: "email",
        templateId: selectedTemplate,
        status: "success",
        details: `Delivered to ${emailRecipient} (${templateRecordCount} records).`,
      });

      const message = `Email export sent to ${emailRecipient}.`;
      setLocalNotice(message);
      onNotify({ type: "success", message });
    });
  }

  async function handlePushToSheets(): Promise<void> {
    if (!googleSheetsState?.connected) {
      setLocalNotice("Connect Google Sheets first.");
      return;
    }

    if (templateRecordCount === 0) {
      setLocalNotice("No data available to push.");
      return;
    }

    await runSimulatedAction("push-sheets", () => {
      updateIntegrationState("google-sheets", {
        syncStatus: "synced",
        lastSyncedAt: new Date().toISOString(),
      });

      appendHistory({
        destination: "google-sheets",
        templateId: selectedTemplate,
        status: "success",
        details: `${sheetMode === "append" ? "Appended" : "Replaced"} ${templateRecordCount} rows in \"${sheetName}\".`,
      });

      const message = "Google Sheets export finished.";
      setLocalNotice(message);
      onNotify({ type: "success", message });
    });
  }

  async function handleSaveSchedule(): Promise<void> {
    await runSimulatedAction("save-schedule", () => {
      appendHistory({
        destination: "schedule",
        templateId: selectedTemplate,
        status: "scheduled",
        details: `Backup ${scheduleEnabled ? "enabled" : "disabled"} (${scheduleFrequency}, ${scheduleDestination}).`,
      });

      const message = scheduleEnabled
        ? `Backup schedule saved. Next run: ${nextScheduledRun}.`
        : "Backup schedule disabled.";

      setLocalNotice(message);
      onNotify({ type: "info", message });
    });
  }

  async function handleGenerateShareLink(): Promise<void> {
    if (templateRecordCount === 0) {
      setLocalNotice("No data available for sharing.");
      return;
    }

    await runSimulatedAction("generate-link", () => {
      const link = `${buildShareableLink(selectedTemplate)}&expiresIn=${shareExpiryDays}`;
      setShareLink(link);

      appendHistory({
        destination: "share-link",
        templateId: selectedTemplate,
        status: "success",
        details: `Share link generated (expires in ${shareExpiryDays} days).`,
      });

      const message = "Share link created successfully.";
      setLocalNotice(message);
      onNotify({ type: "success", message });
    });
  }

  async function handleSyncIntegration(integrationId: CloudIntegrationId): Promise<void> {
    await runSimulatedAction(`sync-${integrationId}`, () => {
      updateIntegrationState(integrationId, {
        syncStatus: "synced",
        lastSyncedAt: new Date().toISOString(),
      });

      appendHistory({
        destination: integrationId,
        templateId: selectedTemplate,
        status: "success",
        details: `${CLOUD_INTEGRATIONS.find((item) => item.id === integrationId)?.name ?? integrationId} sync completed.`,
      });

      const message = `${CLOUD_INTEGRATIONS.find((item) => item.id === integrationId)?.name ?? integrationId} synced.`;
      setLocalNotice(message);
      onNotify({ type: "success", message });
    });
  }

  async function handleConnectToggle(integrationId: CloudIntegrationId): Promise<void> {
    const target = integrationState.find((item) => item.id === integrationId);
    if (!target) {
      return;
    }

    await runSimulatedAction(`connect-${integrationId}`, () => {
      const nextConnected = !target.connected;

      updateIntegrationState(integrationId, {
        connected: nextConnected,
        syncStatus: nextConnected ? "synced" : "attention",
        lastSyncedAt: nextConnected ? new Date().toISOString() : null,
      });

      const actionLabel = nextConnected ? "connected" : "disconnected";
      const integrationName =
        CLOUD_INTEGRATIONS.find((item) => item.id === integrationId)?.name ??
        integrationId;

      const message = `${integrationName} ${actionLabel}.`;
      setLocalNotice(message);
      onNotify({ type: "info", message });
    });
  }

  async function handleCopyShareLink(): Promise<void> {
    if (!shareLink) {
      setLocalNotice("Generate a share link first.");
      return;
    }

    try {
      await navigator.clipboard.writeText(shareLink);
      const message = "Share link copied to clipboard.";
      setLocalNotice(message);
      onNotify({ type: "success", message });
    } catch {
      const message = "Unable to copy automatically. Please copy manually.";
      setLocalNotice(message);
      onNotify({ type: "error", message });
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close cloud export center"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <aside className="absolute right-0 top-0 h-full w-full max-w-6xl overflow-hidden border-l border-slate-700/70 bg-slate-950 text-slate-100 shadow-2xl">
        <div className="flex h-full flex-col">
          <header className="border-b border-slate-800 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  Cloud Export Center
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-white">
                  Connected Delivery Workspace
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  Run exports across channels, automate backups, and manage sync
                  pipelines from one control surface.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                  Queue: {currentJobsCount}
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    isBusyAction
                      ? "border-amber-300/40 bg-amber-300/10 text-amber-200"
                      : "border-emerald-300/40 bg-emerald-300/10 text-emerald-200"
                  }`}
                >
                  {isBusyAction ? "Worker Active" : "Worker Idle"}
                </span>
                <button
                  type="button"
                  className="rounded-lg border border-slate-600 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </div>
          </header>

          <div className="grid min-h-0 flex-1 lg:grid-cols-[300px_minmax(0,1fr)]">
            <nav className="border-r border-slate-800 bg-slate-900/60 p-4 sm:p-5">
              <div className="mb-4 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Export Templates
                </h3>
                {CLOUD_EXPORT_TEMPLATES.map((template) => {
                  const selected = template.id === selectedTemplate;

                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                        selected
                          ? "border-cyan-400/60 bg-cyan-400/10"
                          : "border-slate-700 bg-slate-900 hover:border-slate-500 hover:bg-slate-800/80"
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-100">
                        {template.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {template.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Workflows
                </h3>
                {TABS.map((tab) => {
                  const active = tab.id === activeTab;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                        active
                          ? "border-indigo-400/60 bg-indigo-400/15"
                          : "border-slate-700 bg-slate-900 hover:border-slate-500 hover:bg-slate-800/80"
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-100">
                        {tab.label}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">{tab.caption}</p>
                    </button>
                  );
                })}
              </div>
            </nav>

            <section className="min-h-0 overflow-y-auto p-5 sm:p-6">
              <div className="mb-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Template</p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {selectedTemplateMeta.name}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Records</p>
                  <p className="mt-1 text-lg font-semibold text-white">{templateRecordCount}</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Value</p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {formatCurrency(templateTotal)}
                  </p>
                </div>
              </div>

              <div className="mb-5 rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Payload Brief</p>
                <p className="mt-1 text-sm text-slate-200">{templateSummary}</p>
              </div>

              {activeTab === "email" ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                    <h3 className="text-lg font-semibold text-white">Email Export Flow</h3>
                    <p className="mt-1 text-sm text-slate-300">
                      Simulate an outbound delivery with template payload and
                      stakeholder routing.
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="space-y-1">
                        <span className="text-sm font-medium text-slate-200">Recipient</span>
                        <input
                          className="input-control bg-slate-950/70 text-slate-100"
                          value={emailRecipient}
                          onChange={(event) => setEmailRecipient(event.target.value)}
                          placeholder="finance@example.com"
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="text-sm font-medium text-slate-200">Subject</span>
                        <input
                          className="input-control bg-slate-950/70 text-slate-100"
                          value={emailSubject}
                          onChange={(event) => setEmailSubject(event.target.value)}
                          placeholder="Expense export ready"
                        />
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={handleSendEmail}
                      disabled={Boolean(isBusyAction)}
                      className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-cyan-300"
                    >
                      {isBusyAction === "send-email"
                        ? "Sending..."
                        : `Send ${selectedTemplateMeta.name}`}
                    </button>
                  </div>

                  <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                      Delivery Preview
                    </h4>
                    <p className="mt-2 text-sm text-slate-200">
                      Subject: {emailSubject || "Expense export ready"}
                    </p>
                    <p className="text-sm text-slate-200">Template: {selectedTemplateMeta.name}</p>
                    <p className="text-sm text-slate-200">Records: {templateRecordCount}</p>
                  </div>
                </div>
              ) : null}

              {activeTab === "sheets" ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                    <h3 className="text-lg font-semibold text-white">Google Sheets Integration</h3>
                    <p className="mt-1 text-sm text-slate-300">
                      Mock a push to collaborative spreadsheets with append or replace behavior.
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          googleSheetsState?.connected
                            ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                            : "border-rose-400/40 bg-rose-400/10 text-rose-200"
                        }`}
                      >
                        {googleSheetsState?.connected ? "Connected" : "Not Connected"}
                      </span>

                      <button
                        type="button"
                        onClick={() => void handleConnectToggle("google-sheets")}
                        disabled={Boolean(isBusyAction)}
                        className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isBusyAction === "connect-google-sheets"
                          ? "Updating..."
                          : googleSheetsState?.connected
                            ? "Disconnect"
                            : "Connect"}
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="space-y-1">
                        <span className="text-sm font-medium text-slate-200">Spreadsheet Name</span>
                        <input
                          className="input-control bg-slate-950/70 text-slate-100"
                          value={sheetName}
                          onChange={(event) => setSheetName(event.target.value)}
                          placeholder="Finance Ops Export"
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="text-sm font-medium text-slate-200">Mode</span>
                        <select
                          className="input-control bg-slate-950/70 text-slate-100"
                          value={sheetMode}
                          onChange={(event) =>
                            setSheetMode(event.target.value as "append" | "replace")
                          }
                        >
                          <option value="append">Append rows</option>
                          <option value="replace">Replace sheet</option>
                        </select>
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={handlePushToSheets}
                      disabled={Boolean(isBusyAction)}
                      className="mt-4 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-indigo-300"
                    >
                      {isBusyAction === "push-sheets" ? "Pushing..." : "Push to Sheets"}
                    </button>
                  </div>

                  <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                      Preview Rows
                    </h4>
                    {previewRows.length === 0 ? (
                      <p className="mt-2 text-sm text-slate-300">No expenses available for preview.</p>
                    ) : (
                      <div className="mt-2 overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                          <thead>
                            <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-400">
                              <th className="py-2 pr-3">Date</th>
                              <th className="py-2 pr-3">Category</th>
                              <th className="py-2 pr-3 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {previewRows.map((row) => (
                              <tr key={row.id} className="border-b border-slate-800 text-slate-200">
                                <td className="py-2 pr-3">{formatDisplayDate(row.date)}</td>
                                <td className="py-2 pr-3">{row.category}</td>
                                <td className="py-2 pr-3 text-right">
                                  {formatCurrency(row.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {activeTab === "schedule" ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                    <h3 className="text-lg font-semibold text-white">Automatic Backup Scheduler</h3>
                    <p className="mt-1 text-sm text-slate-300">
                      Configure recurring exports as background jobs across connected destinations.
                    </p>

                    <div className="mt-4 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setScheduleEnabled((previous) => !previous)}
                        className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                          scheduleEnabled
                            ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                            : "border-slate-600 bg-slate-800 text-slate-200"
                        }`}
                      >
                        {scheduleEnabled ? "Enabled" : "Disabled"}
                      </button>
                      <span className="text-sm text-slate-300">Next run: {nextScheduledRun}</span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <label className="space-y-1">
                        <span className="text-sm font-medium text-slate-200">Frequency</span>
                        <select
                          className="input-control bg-slate-950/70 text-slate-100"
                          value={scheduleFrequency}
                          onChange={(event) =>
                            setScheduleFrequency(event.target.value as ScheduleFrequency)
                          }
                        >
                          {SCHEDULE_FREQUENCIES.map((frequency) => (
                            <option key={frequency} value={frequency}>
                              {frequency[0].toUpperCase() + frequency.slice(1)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="text-sm font-medium text-slate-200">Destination</span>
                        <select
                          className="input-control bg-slate-950/70 text-slate-100"
                          value={scheduleDestination}
                          onChange={(event) =>
                            setScheduleDestination(
                              event.target.value as
                                | "google-sheets"
                                | "dropbox"
                                | "onedrive"
                                | "email",
                            )
                          }
                        >
                          <option value="google-sheets">Google Sheets</option>
                          <option value="dropbox">Dropbox</option>
                          <option value="onedrive">OneDrive</option>
                          <option value="email">Email Digest</option>
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="text-sm font-medium text-slate-200">Run Time</span>
                        <input
                          type="time"
                          className="input-control bg-slate-950/70 text-slate-100"
                          value={scheduleTime}
                          onChange={(event) => setScheduleTime(event.target.value)}
                        />
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveSchedule}
                      disabled={Boolean(isBusyAction)}
                      className="mt-4 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-300"
                    >
                      {isBusyAction === "save-schedule"
                        ? "Saving schedule..."
                        : "Save Backup Schedule"}
                    </button>
                  </div>
                </div>
              ) : null}

              {activeTab === "share" ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                    <h3 className="text-lg font-semibold text-white">Sharing and Collaboration</h3>
                    <p className="mt-1 text-sm text-slate-300">
                      Generate secure links and QR access for collaborators and auditors.
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="space-y-1">
                        <span className="text-sm font-medium text-slate-200">Link expiry (days)</span>
                        <select
                          className="input-control bg-slate-950/70 text-slate-100"
                          value={shareExpiryDays}
                          onChange={(event) => setShareExpiryDays(event.target.value)}
                        >
                          <option value="1">1 day</option>
                          <option value="7">7 days</option>
                          <option value="30">30 days</option>
                          <option value="90">90 days</option>
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="text-sm font-medium text-slate-200">Access profile</span>
                        <input
                          className="input-control bg-slate-950/70 text-slate-100"
                          value="Read-only analytics view"
                          readOnly
                        />
                      </label>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleGenerateShareLink}
                        disabled={Boolean(isBusyAction)}
                        className="rounded-lg bg-fuchsia-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-fuchsia-400 disabled:cursor-not-allowed disabled:bg-fuchsia-300"
                      >
                        {isBusyAction === "generate-link"
                          ? "Generating..."
                          : "Generate Share Link"}
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleCopyShareLink()}
                        className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                      >
                        Copy Link
                      </button>
                    </div>

                    {shareLink ? (
                      <div className="mt-4 rounded-lg border border-slate-700 bg-slate-950/70 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Share URL</p>
                        <p className="mt-1 break-all text-sm text-cyan-300">{shareLink}</p>
                      </div>
                    ) : null}
                  </div>

                  {shareLink ? (
                    <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                        QR Access Token
                      </h4>
                      <div className="mt-3 inline-grid grid-cols-[repeat(21,minmax(0,1fr))] gap-[2px] rounded-lg bg-white p-2">
                        {qrMatrix.map((value, index) => (
                          <span
                            key={`${shareLink}-${index}`}
                            className={`h-[8px] w-[8px] rounded-[1px] ${
                              value ? "bg-slate-900" : "bg-white"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {activeTab === "integrations" ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                    <h3 className="text-lg font-semibold text-white">Service Integrations</h3>
                    <p className="mt-1 text-sm text-slate-300">
                      Connect destinations and monitor sync health across your export stack.
                    </p>

                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      {CLOUD_INTEGRATIONS.map((integration) => {
                        const state = integrationState.find(
                          (item) => item.id === integration.id,
                        );

                        return (
                          <article
                            key={integration.id}
                            className="rounded-xl border border-slate-700 bg-slate-950/70 p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-slate-100">
                                  {integration.name}
                                </p>
                                <p className="text-xs uppercase tracking-wide text-slate-400">
                                  {integration.kind}
                                </p>
                              </div>
                              <span
                                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getSyncBadge(
                                  state?.syncStatus ?? "attention",
                                )}`}
                              >
                                {state?.syncStatus ?? "attention"}
                              </span>
                            </div>

                            <p className="mt-2 text-sm text-slate-300">
                              {integration.description}
                            </p>

                            <p className="mt-2 text-xs text-slate-400">
                              Last sync: {state?.lastSyncedAt ? formatDateTime(state.lastSyncedAt) : "Never"}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => void handleConnectToggle(integration.id)}
                                disabled={Boolean(isBusyAction)}
                                className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isBusyAction === `connect-${integration.id}`
                                  ? "Updating..."
                                  : state?.connected
                                    ? "Disconnect"
                                    : "Connect"}
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleSyncIntegration(integration.id)}
                                disabled={!state?.connected || Boolean(isBusyAction)}
                                className="rounded-lg border border-cyan-500/50 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {isBusyAction === `sync-${integration.id}`
                                  ? "Syncing..."
                                  : "Sync now"}
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                      Cloud Storage Preferences
                    </h4>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => setPrimaryStorage("dropbox")}
                        className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                          primaryStorage === "dropbox"
                            ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-200"
                            : "border-slate-600 text-slate-200 hover:bg-slate-800"
                        }`}
                      >
                        Dropbox
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrimaryStorage("onedrive")}
                        className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                          primaryStorage === "onedrive"
                            ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-200"
                            : "border-slate-600 text-slate-200 hover:bg-slate-800"
                        }`}
                      >
                        OneDrive
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrimaryStorage("google-sheets")}
                        className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                          primaryStorage === "google-sheets"
                            ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-200"
                            : "border-slate-600 text-slate-200 hover:bg-slate-800"
                        }`}
                      >
                        Google Sheets
                      </button>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setAutoSyncEnabled((previous) => !previous)}
                        className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                          autoSyncEnabled
                            ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                            : "border-slate-600 bg-slate-800 text-slate-200"
                        }`}
                      >
                        {autoSyncEnabled ? "Auto Sync On" : "Auto Sync Off"}
                      </button>
                      <p className="text-sm text-slate-300">
                        Primary target: {primaryStorage}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {activeTab === "history" ? (
                <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                  <h3 className="text-lg font-semibold text-white">Export History</h3>
                  <p className="mt-1 text-sm text-slate-300">
                    Timeline of all export operations with destination and status metadata.
                  </p>

                  {history.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-400">No exports logged yet.</p>
                  ) : (
                    <ul className="mt-4 space-y-2">
                      {history.map((entry) => (
                        <li
                          key={entry.id}
                          className="rounded-lg border border-slate-700 bg-slate-950/70 p-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-100">
                                {getTemplateName(entry.templateId)}
                              </p>
                              <p className="text-xs uppercase tracking-wide text-slate-400">
                                {entry.destination}
                              </p>
                            </div>
                            <div className="text-right">
                              <span
                                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                  entry.status === "success"
                                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                                    : entry.status === "scheduled"
                                      ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
                                      : "border-rose-400/40 bg-rose-400/10 text-rose-200"
                                }`}
                              >
                                {entry.status}
                              </span>
                              <p className="mt-1 text-xs text-slate-400">
                                {formatDateTime(entry.createdAt)}
                              </p>
                            </div>
                          </div>
                          <p className="mt-2 text-sm text-slate-300">{entry.details}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}

              {localNotice ? (
                <div className="mt-4 rounded-lg border border-cyan-400/40 bg-cyan-400/10 p-3 text-sm text-cyan-100">
                  {localNotice}
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </aside>
    </div>
  );
}
