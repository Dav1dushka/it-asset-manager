# IT Asset Manager

A small React and TypeScript app for tracking IT devices, assigned users, IPv4 addresses, and device status. It runs entirely in the browser and keeps its inventory in `localStorage`.

![IT Asset Manager showing a sample inventory](assets/asset-manager.png)

## What it does

- Add, edit, search, filter, and delete devices.
- Validate IPv4 addresses before a record is saved.
- See inventory totals by device status and export all records as CSV.
- Keep records between visits in the current browser.
- Load sample records to explore the app without entering data first.
- Use the layout on desktop and mobile screens.

## Run locally

You need Node.js 20.19+ or 22.12+.

```bash
pnpm install
pnpm dev
```

Vite prints the local URL in the terminal. To create a production build, run:

```bash
pnpm build
```

## Implementation notes

- React state drives the form, filters, summary cards, and inventory table.
- TypeScript models the device record and its three allowed statuses.
- Saved data is checked and normalized when it is loaded. If browser storage is unavailable, the app keeps changes for the current session and explains that they could not be saved.
- CSV values are escaped, and values that could be interpreted as spreadsheet formulas are prefixed before export.
- The form and table include labels, live status messages, keyboard focus styles, and responsive behavior.

## Data storage

This is a frontend demo. Inventory data stays in the current browser and is not sent to a server or shared across devices. Clearing the browser's site data will remove saved records. Use **Export CSV** to keep a separate copy.

## Project structure

```text
src/
  lib/
    storage.ts       Read and save inventory in localStorage
    validation.ts    Validate IPv4 addresses and device fields
  App.tsx            Inventory interface and React state
  main.tsx           React entry point
  styles.css         Responsive layout and visual styles
```

## Built with

React · TypeScript · Vite · HTML · CSS · Browser `localStorage` API
