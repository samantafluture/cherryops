import type { Database } from "better-sqlite3";
import { getAllDevices } from "../db/devices.js";
import type { TaskStatus } from "../types.js";

interface FcmPayload {
  to: string;
  data: {
    type: string;
    task_id: string;
    status: string;
    project_id: string;
    output_file?: string;
  };
  notification: {
    title: string;
    body: string;
  };
}

export class FcmSender {
  private readonly serviceAccount: string;

  constructor(serviceAccountJson: string) {
    this.serviceAccount = serviceAccountJson;
  }

  async sendTaskUpdate(
    taskId: string,
    status: TaskStatus,
    projectId: string,
    outputFile?: string
  ): Promise<void> {
    const db = await this.getDb();
    if (!db) return;

    const devices = getAllDevices(db);
    if (devices.length === 0) return;

    const title = this.buildTitle(status);
    const body = this.buildBody(status, taskId);

    for (const device of devices) {
      const payload: FcmPayload = {
        to: device.fcm_token,
        data: {
          type: "task_update",
          task_id: taskId,
          status,
          project_id: projectId,
          ...(outputFile ? { output_file: outputFile } : {}),
        },
        notification: { title, body },
      };

      await this.send(payload);
    }
  }

  private async send(payload: FcmPayload): Promise<void> {
    if (!this.serviceAccount || this.serviceAccount === "{}") {
      console.warn("FCM not configured — skipping push notification");
      return;
    }

    try {
      const response = await fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: {
          Authorization: `key=${this.serviceAccount}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(`FCM send failed: ${response.status}`);
      }
    } catch (error) {
      console.error("FCM send error:", error);
    }
  }

  private buildTitle(status: TaskStatus): string {
    switch (status) {
      case "complete":
        return "Task complete";
      case "error":
        return "Task failed";
      case "running":
        return "Task started";
      default:
        return "Task update";
    }
  }

  private buildBody(status: TaskStatus, taskId: string): string {
    const shortId = taskId.slice(0, 8);
    switch (status) {
      case "complete":
        return `Task ${shortId} is ready for review.`;
      case "error":
        return `Task ${shortId} encountered an error. Tap to see details.`;
      case "running":
        return `Task ${shortId} is now running.`;
      default:
        return `Task ${shortId} status: ${status}`;
    }
  }

  private dbInstance: Database | null = null;

  setDb(db: Database): void {
    this.dbInstance = db;
  }

  private async getDb(): Promise<Database | null> {
    return this.dbInstance;
  }
}
