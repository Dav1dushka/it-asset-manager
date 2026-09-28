const STORAGE_KEY = "devices";
const VALID_STATUSES = new Set(["Active", "Maintenance", "Inactive"]);

const form = document.getElementById("assetForm");
const formHeading = document.getElementById("formHeading");
const formMessage = document.getElementById("formMessage");
const deviceNameInput = document.getElementById("deviceName");
const userNameInput = document.getElementById("userName");
const ipAddressInput = document.getElementById("ipAddress");
const statusInput = document.getElementById("status");
const submitButton = document.getElementById("submitButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const searchInput = document.getElementById("search");
const statusFilter = document.getElementById("statusFilter");
const table = document.getElementById("deviceTable");
const tableBody = document.getElementById("assetTable");
const resultsSummary = document.getElementById("resultsSummary");
const emptyState = document.getElementById("emptyState");
const emptyTitle = document.getElementById("emptyTitle");
const emptyDescription = document.getElementById("emptyDescription");
const loadSampleButton = document.getElementById("loadSampleButton");
const clearFiltersButton = document.getElementById("clearFiltersButton");
const exportButton = document.getElementById("exportButton");

let editingId = null;
let storageWarning = "";
let devices = loadDevices();

const sampleDevices = [
    { device: "MacBook Pro 14-inch", user: "Elena Rossi", ip: "192.168.1.24", status: "Active" },
    { device: "Dell Latitude 5440", user: "Marco Bianchi", ip: "192.168.1.32", status: "Maintenance" },
    { device: "HP LaserJet Pro", user: "Reception", ip: "192.168.1.50", status: "Inactive" }
];

function createId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function loadDevices() {
    try {
        const savedValue = localStorage.getItem(STORAGE_KEY);
        if (!savedValue) return [];

        const parsedDevices = JSON.parse(savedValue);
        if (!Array.isArray(parsedDevices)) {
            storageWarning = "Saved inventory data could not be read. New records will replace it when you save.";
            return [];
        }

        return parsedDevices
            .filter((device) => device && typeof device === "object")
            .map((device) => ({
                id: typeof device.id === "string" ? device.id : createId(),
                device: String(device.device ?? ""),
                user: String(device.user ?? ""),
                ip: String(device.ip ?? ""),
                status: VALID_STATUSES.has(device.status) ? device.status : "Active"
            }));
    } catch {
        storageWarning = "Saved inventory data could not be read. New records will replace it when you save.";
        return [];
    }
}

function persistDevices() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(devices));
        return true;
    } catch {
        return false;
    }
}

function isValidIpv4(value) {
    const octets = value.split(".");
    return octets.length === 4 && octets.every((octet) => {
        if (!/^(0|[1-9]\d{0,2})$/.test(octet)) return false;
        return Number(octet) <= 255;
    });
}

function showFormMessage(message, type = "") {
    formMessage.textContent = message;
    formMessage.className = `form-message${type ? ` is-${type}` : ""}`;
}

function getVisibleDevices() {
    const query = searchInput.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;

    return devices.filter((device) => {
        const matchesQuery = [device.device, device.user, device.ip, device.status]
            .some((value) => value.toLowerCase().includes(query));
        const matchesStatus = selectedStatus === "All" || device.status === selectedStatus;
        return matchesQuery && matchesStatus;
    });
}

function updateSummary() {
    document.getElementById("totalCount").textContent = devices.length;
    document.getElementById("activeCount").textContent = devices.filter((device) => device.status === "Active").length;
    document.getElementById("maintenanceCount").textContent = devices.filter((device) => device.status === "Maintenance").length;
    document.getElementById("inactiveCount").textContent = devices.filter((device) => device.status === "Inactive").length;
    exportButton.disabled = devices.length === 0;
}

function createActionButton(label, action, device) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `row-action row-action-${action}`;
    button.dataset.action = action;
    button.dataset.id = device.id;
    button.textContent = label;
    button.setAttribute("aria-label", `${label} ${device.device}`);
    return button;
}

function createDeviceRow(device) {
    const row = document.createElement("tr");
    const values = [device.device, device.user, device.ip];

    values.forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
    });

    const statusCell = document.createElement("td");
    const statusBadge = document.createElement("span");
    statusBadge.className = `status-badge status-${device.status.toLowerCase()}`;
    statusBadge.textContent = device.status;
    statusCell.appendChild(statusBadge);
    row.appendChild(statusCell);

    const actionCell = document.createElement("td");
    actionCell.className = "row-actions";
    actionCell.append(
        createActionButton("Edit", "edit", device),
        createActionButton("Delete", "delete", device)
    );
    row.appendChild(actionCell);

    return row;
}

function renderDevices() {
    const visibleDevices = getVisibleDevices();
    tableBody.replaceChildren(...visibleDevices.map(createDeviceRow));
    updateSummary();

    const hasNoDevices = devices.length === 0;
    const hasNoMatches = !hasNoDevices && visibleDevices.length === 0;
    table.hidden = visibleDevices.length === 0;
    emptyState.hidden = visibleDevices.length > 0;
    loadSampleButton.hidden = !hasNoDevices;
    clearFiltersButton.hidden = !hasNoMatches;

    if (hasNoDevices) {
        emptyTitle.textContent = "Your inventory is empty";
        emptyDescription.textContent = "Add a device to get started, or load a few sample records to explore the app.";
        resultsSummary.textContent = "No devices yet";
        return;
    }

    if (hasNoMatches) {
        emptyTitle.textContent = "No devices match these filters";
        emptyDescription.textContent = "Try another search or clear the selected filters.";
        resultsSummary.textContent = `Showing 0 of ${devices.length} devices`;
        return;
    }

    const visibleCount = visibleDevices.length;
    const totalCount = devices.length;
    const noun = totalCount === 1 ? "device" : "devices";
    resultsSummary.textContent = visibleCount === totalCount
        ? `${totalCount} ${noun} in inventory`
        : `Showing ${visibleCount} of ${totalCount} devices`;
}

function resetForm() {
    form.reset();
    editingId = null;
    formHeading.textContent = "Add a device";
    submitButton.textContent = "Add device";
    cancelEditButton.hidden = true;
}

function startEditing(device) {
    editingId = device.id;
    deviceNameInput.value = device.device;
    userNameInput.value = device.user;
    ipAddressInput.value = device.ip;
    statusInput.value = device.status;
    formHeading.textContent = "Edit device";
    submitButton.textContent = "Save changes";
    cancelEditButton.hidden = false;
    showFormMessage("");
    deviceNameInput.focus();
}

function validateDevice(device) {
    if (!device.device || !device.user || !device.ip) {
        return "Complete all fields before saving.";
    }

    if (!isValidIpv4(device.ip)) {
        return "Enter a valid IPv4 address, for example 192.168.1.24.";
    }

    return "";
}

form.addEventListener("submit", (event) => {
    event.preventDefault();

    const nextDevice = {
        device: deviceNameInput.value.trim(),
        user: userNameInput.value.trim(),
        ip: ipAddressInput.value.trim(),
        status: statusInput.value
    };
    const validationMessage = validateDevice(nextDevice);

    if (validationMessage) {
        showFormMessage(validationMessage, "error");
        return;
    }

    if (editingId) {
        devices = devices.map((device) => device.id === editingId
            ? { ...device, ...nextDevice }
            : device);
    } else {
        devices.push({ id: createId(), ...nextDevice });
    }

    const wasEditing = Boolean(editingId);
    const saved = persistDevices();
    resetForm();
    renderDevices();
    showFormMessage(
        saved
            ? (wasEditing ? "Device updated and saved in this browser." : "Device added and saved in this browser.")
            : "Change applied for this session, but browser storage is unavailable.",
        saved ? "success" : "error"
    );
});

cancelEditButton.addEventListener("click", () => {
    resetForm();
    showFormMessage("Editing cancelled.");
});

tableBody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const device = devices.find((item) => item.id === button.dataset.id);
    if (!device) return;

    if (button.dataset.action === "edit") {
        startEditing(device);
        return;
    }

    const shouldDelete = window.confirm(`Delete ${device.device}? This action cannot be undone.`);
    if (!shouldDelete) return;

    devices = devices.filter((item) => item.id !== device.id);
    const saved = persistDevices();
    if (editingId === device.id) resetForm();
    renderDevices();
    showFormMessage(
        saved ? "Device deleted." : "Device deleted for this session, but browser storage is unavailable.",
        saved ? "success" : "error"
    );
});

searchInput.addEventListener("input", renderDevices);
statusFilter.addEventListener("change", renderDevices);

clearFiltersButton.addEventListener("click", () => {
    searchInput.value = "";
    statusFilter.value = "All";
    searchInput.focus();
    renderDevices();
});

loadSampleButton.addEventListener("click", () => {
    devices = sampleDevices.map((device) => ({ id: createId(), ...device }));
    const saved = persistDevices();
    renderDevices();
    resultsSummary.textContent = saved
        ? "Sample devices loaded. Edit or delete them to explore the app."
        : "Sample devices loaded for this session. Browser storage is unavailable.";
});

function csvCell(value) {
    const text = String(value ?? "");
    const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safeText.replace(/"/g, '""')}"`;
}

exportButton.addEventListener("click", () => {
    if (devices.length === 0) return;

    const rows = [
        ["Device", "Assigned user", "IPv4 address", "Status"],
        ...devices.map((device) => [device.device, device.user, device.ip, device.status])
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
    const file = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = `it-assets-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadLink.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
});

renderDevices();
if (storageWarning) showFormMessage(storageWarning, "error");
