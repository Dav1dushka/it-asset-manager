import { DEVICE_STATUSES, type Device, type DeviceStatus, type InventoryLoadResult } from "../types";

const STORAGE_KEY = "devices";

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isDeviceStatus(value: unknown): value is DeviceStatus {
  return typeof value === "string" && DEVICE_STATUSES.some((status) => status === value);
}

export function loadInventory(): InventoryLoadResult {
  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    if (!storedValue) return { devices: [], warning: "" };

    const parsedValue: unknown = JSON.parse(storedValue);
    if (!Array.isArray(parsedValue)) throw new Error("Inventory is not an array");

    const devices = parsedValue
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item): Device => ({
        id: typeof item.id === "string" ? item.id : createId(),
        device: String(item.device ?? ""),
        user: String(item.user ?? ""),
        ip: String(item.ip ?? ""),
        status: isDeviceStatus(item.status) ? item.status : "Active",
      }));

    return { devices, warning: "" };
  } catch {
    return {
      devices: [],
      warning: "Saved inventory could not be read. Your next change will replace the unreadable data.",
    };
  }
}

export function saveInventory(devices: Device[]): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(devices));
    return true;
  } catch {
    return false;
  }
}

export function createDeviceId(): string {
  return createId();
}
