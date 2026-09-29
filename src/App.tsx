import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createDeviceId, loadInventory, saveInventory } from "./lib/storage";
import { validateDevice } from "./lib/validation";
import { DEVICE_STATUSES, type Device, type DeviceDraft, type DeviceStatus, type StatusFilter } from "./types";

const EMPTY_DRAFT: DeviceDraft = {
  device: "",
  user: "",
  ip: "",
  status: "Active",
};

const SAMPLE_DEVICES: DeviceDraft[] = [
  { device: "MacBook Pro 14-inch", user: "Elena Rossi", ip: "192.168.1.24", status: "Active" },
  { device: "Dell Latitude 5440", user: "Marco Bianchi", ip: "192.168.1.32", status: "Maintenance" },
  { device: "HP LaserJet Pro", user: "Reception", ip: "192.168.1.50", status: "Inactive" },
];

function csvCell(value: string): string {
  const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replace(/"/g, '""')}"`;
}

function exportInventory(devices: Device[]): void {
  const rows = [
    ["Device", "Assigned user", "IPv4 address", "Status"],
    ...devices.map(({ device, user, ip, status }) => [device, user, ip, status]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
  const fileUrl = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = fileUrl;
  link.download = `it-assets-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
}

function App() {
  const [inventory, setInventory] = useState(loadInventory);
  const [draft, setDraft] = useState<DeviceDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [notice, setNotice] = useState(inventory.warning);
  const [noticeType, setNoticeType] = useState<"error" | "success" | "">(inventory.warning ? "error" : "");
  const deviceNameRef = useRef<HTMLInputElement>(null);

  const devices = inventory.devices;
  const visibleDevices = useMemo(() => {
    const query = search.trim().toLowerCase();
    return devices.filter((device) => {
      const matchesSearch = [device.device, device.user, device.ip, device.status]
        .some((value) => value.toLowerCase().includes(query));
      const matchesStatus = statusFilter === "All" || device.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [devices, search, statusFilter]);

  const counts = useMemo(() => ({
    total: devices.length,
    active: devices.filter((device) => device.status === "Active").length,
    maintenance: devices.filter((device) => device.status === "Maintenance").length,
    inactive: devices.filter((device) => device.status === "Inactive").length,
  }), [devices]);

  useEffect(() => {
    if (editingId) deviceNameRef.current?.focus();
  }, [editingId]);

  function updateInventory(nextDevices: Device[], successMessage: string): void {
    const saved = saveInventory(nextDevices);
    setInventory({ devices: nextDevices, warning: "" });
    setNotice(saved
      ? successMessage
      : `${successMessage} This change is only available for this browser session because browser storage is unavailable.`);
    setNoticeType(saved ? "success" : "error");
  }

  function resetForm(): void {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const nextDraft: DeviceDraft = {
      device: draft.device.trim(),
      user: draft.user.trim(),
      ip: draft.ip.trim(),
      status: draft.status,
    };
    const validationMessage = validateDevice(nextDraft);
    if (validationMessage) {
      setNotice(validationMessage);
      setNoticeType("error");
      return;
    }

    const wasEditing = editingId !== null;
    const nextDevices = wasEditing
      ? devices.map((device) => device.id === editingId ? { ...device, ...nextDraft } : device)
      : [...devices, { id: createDeviceId(), ...nextDraft }];
    updateInventory(nextDevices, wasEditing ? "Device updated." : "Device added.");
    resetForm();
  }

  function startEditing(device: Device): void {
    setDraft({ device: device.device, user: device.user, ip: device.ip, status: device.status });
    setEditingId(device.id);
    setNotice("");
    setNoticeType("");
  }

  function deleteDevice(device: Device): void {
    if (!window.confirm(`Delete ${device.device}? This action cannot be undone.`)) return;
    const nextDevices = devices.filter((item) => item.id !== device.id);
    updateInventory(nextDevices, "Device deleted.");
    if (editingId === device.id) resetForm();
  }

  function loadSampleDevices(): void {
    const nextDevices = SAMPLE_DEVICES.map((device) => ({ id: createDeviceId(), ...device }));
    updateInventory(nextDevices, "Sample devices loaded. Edit or delete them to explore the app.");
  }

  function clearFilters(): void {
    setSearch("");
    setStatusFilter("All");
  }

  const hasNoDevices = devices.length === 0;
  const hasNoMatches = !hasNoDevices && visibleDevices.length === 0;
  const resultsSummary = hasNoDevices
    ? "No devices yet"
    : hasNoMatches
      ? `Showing 0 of ${devices.length} devices`
      : visibleDevices.length === devices.length
        ? `${devices.length} ${devices.length === 1 ? "device" : "devices"} in inventory`
        : `Showing ${visibleDevices.length} of ${devices.length} devices`;

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">INVENTORY WORKSPACE</p>
          <h1>IT Asset Manager</h1>
          <p className="page-subtitle">Keep track of devices, assigned users, and current status.</p>
        </div>
        <button className="button button-secondary" type="button" disabled={hasNoDevices} onClick={() => exportInventory(devices)}>
          Export CSV
        </button>
      </header>

      <section className="summary-grid" aria-label="Inventory summary">
        <SummaryCard label="Total devices" value={counts.total} />
        <SummaryCard label="Active" value={counts.active} />
        <SummaryCard label="In maintenance" value={counts.maintenance} />
        <SummaryCard label="Inactive" value={counts.inactive} />
      </section>

      <div className="workspace">
        <section className="panel form-panel" aria-labelledby="formHeading">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">DEVICE DETAILS</p>
              <h2 id="formHeading">{editingId ? "Edit device" : "Add a device"}</h2>
            </div>
          </div>

          <form id="assetForm" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="deviceName">Device name</label>
              <input
                ref={deviceNameRef}
                id="deviceName"
                name="deviceName"
                type="text"
                maxLength={80}
                placeholder="e.g. MacBook Pro 14-inch"
                autoComplete="off"
                required
                value={draft.device}
                onChange={(event) => setDraft({ ...draft, device: event.target.value })}
              />
            </div>

            <div className="field">
              <label htmlFor="userName">Assigned user</label>
              <input
                id="userName"
                name="userName"
                type="text"
                maxLength={80}
                placeholder="e.g. Elena Rossi"
                autoComplete="off"
                required
                value={draft.user}
                onChange={(event) => setDraft({ ...draft, user: event.target.value })}
              />
            </div>

            <div className="field">
              <label htmlFor="ipAddress">IPv4 address</label>
              <input
                id="ipAddress"
                name="ipAddress"
                type="text"
                inputMode="decimal"
                maxLength={15}
                placeholder="192.168.1.24"
                autoComplete="off"
                aria-describedby="ipHint"
                required
                value={draft.ip}
                onChange={(event) => setDraft({ ...draft, ip: event.target.value })}
              />
              <small id="ipHint">Enter an address in dotted decimal format.</small>
            </div>

            <div className="field">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={draft.status}
                onChange={(event) => setDraft({ ...draft, status: event.target.value as DeviceStatus })}
              >
                {DEVICE_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>

            <p className={`form-message${noticeType ? ` is-${noticeType}` : ""}`} role="status" aria-live="polite">
              {notice}
            </p>

            <div className="form-actions">
              <button className="button button-primary" type="submit">
                {editingId ? "Save changes" : "Add device"}
              </button>
              {editingId && (
                <button className="button button-quiet" type="button" onClick={() => { resetForm(); setNotice("Editing cancelled."); setNoticeType(""); }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="panel inventory-panel" aria-labelledby="inventoryHeading">
          <div className="inventory-toolbar">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">INVENTORY</p>
                <h2 id="inventoryHeading">Devices</h2>
              </div>
            </div>

            <div className="filters">
              <div className="search-field">
                <label className="visually-hidden" htmlFor="search">Search devices</label>
                <input id="search" type="search" placeholder="Search devices..." autoComplete="off" value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
              <div className="filter-field">
                <label className="visually-hidden" htmlFor="statusFilter">Filter by status</label>
                <select id="statusFilter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
                  <option value="All">All statuses</option>
                  {DEVICE_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
            </div>
          </div>

          <p className="results-summary" aria-live="polite">{resultsSummary}</p>

          {!hasNoMatches && !hasNoDevices ? (
            <div className="table-wrap">
              <table>
                <caption className="visually-hidden">Devices in the IT asset inventory</caption>
                <thead>
                  <tr>
                    <th scope="col">Device</th>
                    <th scope="col">Assigned user</th>
                    <th scope="col">IPv4 address</th>
                    <th scope="col">Status</th>
                    <th scope="col"><span className="visually-hidden">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleDevices.map((device) => (
                    <tr key={device.id}>
                      <td>{device.device}</td>
                      <td>{device.user}</td>
                      <td>{device.ip}</td>
                      <td><span className={`status-badge status-${device.status.toLowerCase()}`}>{device.status}</span></td>
                      <td className="row-actions">
                        <button className="row-action row-action-edit" type="button" aria-label={`Edit ${device.device}`} onClick={() => startEditing(device)}>Edit</button>
                        <button className="row-action row-action-delete" type="button" aria-label={`Delete ${device.device}`} onClick={() => deleteDevice(device)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true">▦</div>
              <h3>{hasNoDevices ? "Your inventory is empty" : "No devices match these filters"}</h3>
              <p>{hasNoDevices
                ? "Add a device to get started, or load a few sample records to explore the app."
                : "Try another search or clear the selected filters."}</p>
              {hasNoDevices ? (
                <button className="button button-secondary" type="button" onClick={loadSampleDevices}>Load sample devices</button>
              ) : (
                <button className="button button-quiet" type="button" onClick={clearFilters}>Clear filters</button>
              )}
            </div>
          )}
        </section>
      </div>

      <footer className="page-footer">
        <p>Data is saved in this browser only. This demo does not connect to a server.</p>
      </footer>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="summary-card">
      <span className="summary-label">{label}</span>
      <strong className="summary-value">{value}</strong>
    </article>
  );
}

export default App;
