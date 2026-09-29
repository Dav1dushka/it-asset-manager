export const DEVICE_STATUSES = ["Active", "Maintenance", "Inactive"] as const;

export type DeviceStatus = (typeof DEVICE_STATUSES)[number];
export type StatusFilter = "All" | DeviceStatus;

export interface Device {
  id: string;
  device: string;
  user: string;
  ip: string;
  status: DeviceStatus;
}

export type DeviceDraft = Omit<Device, "id">;

export interface InventoryLoadResult {
  devices: Device[];
  warning: string;
}
