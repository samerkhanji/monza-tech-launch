import { v4 as uuidv4 } from 'uuid';

export interface TrustedDevice {
  deviceId: string;
  label: string;
  userAgent: string;
  platform: string;
  screen: { width: number; height: number; pixelRatio: number };
  locale: string;
  timezone: string;
  registeredAt: string;
}

/**
 * Local trusted-device registry for owners.
 * Stores per-owner device lists in localStorage.
 */
class DeviceTrustService {
  private static instance: DeviceTrustService;
  private readonly STORAGE_KEY = 'monza_trusted_owner_devices';
  private readonly DEVICE_SEED_KEY = 'monza_device_seed';

  private constructor() {}

  static getInstance(): DeviceTrustService {
    if (!this.instance) {
      this.instance = new DeviceTrustService();
    }
    return this.instance;
  }

  // Generate or read a stable local device seed
  private getOrCreateDeviceSeed(): string {
    let seed = localStorage.getItem(this.DEVICE_SEED_KEY);
    if (!seed) {
      seed = uuidv4();
      localStorage.setItem(this.DEVICE_SEED_KEY, seed);
    }
    return seed;
  }

  // Lightweight fingerprint that is stable for this browser profile
  getCurrentDeviceId(): string {
    const seed = this.getOrCreateDeviceSeed();
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';
    const lang = navigator.language || '';
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const width = window.screen?.width || 0;
    const height = window.screen?.height || 0;
    const dpr = (window.devicePixelRatio || 1).toString();
    // Simple hash composition without heavy crypto to avoid permissions
    const raw = [seed, ua, platform, lang, tz, width, height, dpr].join('|');
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return `mdid_${Math.abs(hash)}`;
  }

  private readAll(): Record<string, TrustedDevice[]> {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed ? parsed : {};
    } catch {
      return {};
    }
  }

  private writeAll(map: Record<string, TrustedDevice[]>): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(map));
  }

  listTrustedDevices(ownerUserId: string): TrustedDevice[] {
    const all = this.readAll();
    return all[ownerUserId] || [];
  }

  isTrustedOwnerDevice(ownerUserId: string): boolean {
    const deviceId = this.getCurrentDeviceId();
    return this.listTrustedDevices(ownerUserId).some(d => d.deviceId === deviceId);
  }

  registerCurrentDevice(ownerUserId: string, label?: string): TrustedDevice {
    const all = this.readAll();
    const list = all[ownerUserId] || [];
    const device: TrustedDevice = {
      deviceId: this.getCurrentDeviceId(),
      label: label?.trim() || this.defaultLabel(),
      userAgent: navigator.userAgent || '',
      platform: navigator.platform || '',
      screen: {
        width: window.screen?.width || 0,
        height: window.screen?.height || 0,
        pixelRatio: window.devicePixelRatio || 1,
      },
      locale: navigator.language || '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      registeredAt: new Date().toISOString(),
    };
    // Upsert by deviceId
    const existingIndex = list.findIndex(d => d.deviceId === device.deviceId);
    if (existingIndex >= 0) {
      list[existingIndex] = device;
    } else {
      list.push(device);
    }
    all[ownerUserId] = list;
    this.writeAll(all);
    return device;
  }

  removeTrustedDevice(ownerUserId: string, deviceId: string): void {
    const all = this.readAll();
    const list = (all[ownerUserId] || []).filter(d => d.deviceId !== deviceId);
    all[ownerUserId] = list;
    this.writeAll(all);
  }

  private defaultLabel(): string {
    const os = navigator.platform || 'Device';
    const width = window.screen?.width || 0;
    const height = window.screen?.height || 0;
    return `${os} ${width}x${height}`;
  }
}

export default DeviceTrustService;


