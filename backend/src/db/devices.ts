import type { Database } from "better-sqlite3";
import type { DeviceRecord } from "../types.js";
import { ulid } from "ulid";

export function upsertDevice(
  db: Database,
  deviceId: string,
  fcmToken: string,
  platform: string
): void {
  const stmt = db.prepare(`
    INSERT INTO devices (id, fcm_token, device_id, platform)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(device_id) DO UPDATE SET
      fcm_token = excluded.fcm_token,
      updated_at = datetime('now')
  `);
  stmt.run(ulid(), fcmToken, deviceId, platform);
}

export function getAllDevices(db: Database): DeviceRecord[] {
  const stmt = db.prepare("SELECT * FROM devices");
  return stmt.all() as DeviceRecord[];
}

export function getDeviceByDeviceId(
  db: Database,
  deviceId: string
): DeviceRecord | undefined {
  const stmt = db.prepare("SELECT * FROM devices WHERE device_id = ?");
  return stmt.get(deviceId) as DeviceRecord | undefined;
}
