# Expense Tracker (Next.js + TypeScript)

A modern personal finance web app built with Next.js App Router, TypeScript, and Tailwind CSS.

## Tech Stack

- Next.js `14.2.35` (App Router)
- TypeScript (strict mode)
- Tailwind CSS
- React hooks + localStorage persistence

## Features

- Add expenses with:
  - Date picker
  - Amount (currency)
  - Category
  - Description
- Edit and delete existing expenses
- Expense list with:
  - Search
  - Category filter
  - Date range filter
- Dashboard summary cards:
  - Total spending
  - Spending this month
  - Average expense
  - Top category
- Category spending chart (bar visualization)
- CSV export for current filtered dataset
- Loading, error, and action feedback states
- Responsive UI for desktop and mobile

## Available Categories

- Food
- Transportation
- Entertainment
- Shopping
- Bills
- Other

## Run Locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Production Build

```bash
npm run lint
npm run build
npm run start
```

## How Data Persistence Works

- Expenses are saved to browser `localStorage` using key:
  - `expense-tracker:v1:expenses`
- Data stays available across refreshes in the same browser/profile.

## Manual Test Checklist

1. Add 2-3 expenses across different categories and dates.
2. Verify dashboard cards update after each add.
3. Use search and category/date filters and confirm list/chart update.
4. Edit one expense and confirm updated values in cards/list/chart.
5. Delete one expense and confirm it is removed everywhere.
6. Click `Export CSV` and verify downloaded file content.
7. Refresh the page and confirm data persists.
8. Test on a narrow screen (browser mobile mode) and verify responsive layout.

## Project Structure

```text
app/
  page.tsx
  layout.tsx
  loading.tsx
  error.tsx
  globals.css
components/
  expense-tracker-app.tsx
  expense-form.tsx
  expense-filters.tsx
  expense-list.tsx
  dashboard-cards.tsx
  spending-chart.tsx
lib/
  types.ts
  constants.ts
  storage.ts
  expenses.ts
  analytics.ts
  format.ts
  csv.ts
```
