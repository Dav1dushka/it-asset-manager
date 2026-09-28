const form = document.getElementById("assetForm");
const table = document.getElementById("assetTable");
const search = document.getElementById("search");
const deviceCounter = document.getElementById("deviceCounter");

let devices = JSON.parse(localStorage.getItem("devices")) || [];

function updateCounter() {
    deviceCounter.textContent = `Total Devices: ${devices.length}`;
}

function saveDevices() {
    localStorage.setItem("devices", JSON.stringify(devices));
}

function renderDevices(data = devices) {
    table.innerHTML = "";

    data.forEach((device) => {
        const row = document.createElement("tr");

        [device.device, device.user, device.ip, device.status].forEach((value) => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        const actionCell = document.createElement("td");
        const deleteButton = document.createElement("button");

        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => deleteDevice(device));

        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);
        table.appendChild(row);
    });

    updateCounter();
}

form.addEventListener("submit", (event) => {
    event.preventDefault();

    const ip = document.getElementById("ipAddress").value.trim();

    const ipRegex =
        /^(25[0-5]|2[0-4][0-9]|1?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|1?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|1?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|1?[0-9][0-9]?)$/;

    if (!ipRegex.test(ip)) {
        alert("Please enter a valid IP address.");
        return;
    }

    const newDevice = {
        id: crypto.randomUUID(),
        device: document.getElementById("deviceName").value.trim(),
        user: document.getElementById("userName").value.trim(),
        ip,
        status: document.getElementById("status").value
    };

    devices.push(newDevice);
    saveDevices();
    renderDevices();
    form.reset();
});

function deleteDevice(deviceToDelete) {
    devices = devices.filter((device) => device !== deviceToDelete);
    saveDevices();
    renderDevices();
}

search.addEventListener("input", () => {
    const value = search.value.toLowerCase().trim();

    const filtered = devices.filter((device) =>
        device.device.toLowerCase().includes(value) ||
        device.user.toLowerCase().includes(value) ||
        device.ip.toLowerCase().includes(value) ||
        device.status.toLowerCase().includes(value)
    );

    renderDevices(filtered);
});

renderDevices();
