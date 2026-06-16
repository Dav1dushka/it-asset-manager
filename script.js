const form = document.getElementById("assetForm");
const table = document.getElementById("assetTable");
const search = document.getElementById("search");

let devices = JSON.parse(localStorage.getItem("devices")) || [];

const deviceCounter = document.getElementById("deviceCounter");

function updateCounter() {
    deviceCounter.textContent =
        `Total Devices: ${devices.length}`;
}

function saveDevices() {
    localStorage.setItem(
        "devices",
        JSON.stringify(devices)
    );
}

function renderDevices(data = devices) {

    table.innerHTML = "";

    data.forEach((device, index) => {

        table.innerHTML += `
            <tr>
                <td>${device.device}</td>
                <td>${device.user}</td>
                <td>${device.ip}</td>
                <td>${device.status}</td>

                <td>
                    <button
                        class="delete-btn"
                        onclick="deleteDevice(${index})">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });
}

form.addEventListener("submit", (e) => {

    e.preventDefault();

    const newDevice = {
        device: document.getElementById("deviceName").value,
        user: document.getElementById("userName").value,
        ip: document.getElementById("ipAddress").value,
        status: document.getElementById("status").value
    };

    devices.push(newDevice);

    saveDevices();
    renderDevices();

    form.reset();
});

function deleteDevice(index) {

    devices.splice(index, 1);

    saveDevices();
    renderDevices();
}

search.addEventListener("input", () => {

    const value = search.value.toLowerCase();

    const filtered = devices.filter(device =>
        device.device.toLowerCase().includes(value) ||
        device.user.toLowerCase().includes(value) ||
        device.ip.toLowerCase().includes(value)
    );

    renderDevices(filtered);
});

renderDevices();
