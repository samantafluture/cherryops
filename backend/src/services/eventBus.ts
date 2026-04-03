import { EventEmitter } from "node:events";
import type { TaskStatus } from "../types.js";

export interface TaskEvent {
  task_id: string;
  status: TaskStatus;
  repo: string;
  error?: string | null;
}

export class EventBus {
  private emitter = new EventEmitter();

  emitTaskUpdate(event: TaskEvent): void {
    this.emitter.emit("task:status", event);
  }

  onTaskUpdate(listener: (event: TaskEvent) => void): () => void {
    this.emitter.on("task:status", listener);
    return () => this.emitter.off("task:status", listener);
  }
}
