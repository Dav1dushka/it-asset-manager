import type { DeviceDraft } from "../types";

export function isValidIpv4(value: string): boolean {
  const octets = value.split(".");
  return octets.length === 4 && octets.every((octet) => {
    if (!/^(0|[1-9]\d{0,2})$/.test(octet)) return false;
    return Number(octet) <= 255;
  });
}

export function validateDevice(device: DeviceDraft): string {
  if (!device.device || !device.user || !device.ip) {
    return "Complete all fields before saving.";
  }

  if (!isValidIpv4(device.ip)) {
    return "Enter a valid IPv4 address, for example 192.168.1.24.";
  }

  return "";
}
