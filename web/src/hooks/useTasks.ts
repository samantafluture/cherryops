import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useTasks(params?: { status?: string; repo?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ["tasks", params],
    queryFn: () => api.listTasks(params),
    refetchInterval: 10_000,
  });
}

export function useTaskStatus(taskId: string) {
  return useQuery({
    queryKey: ["task", taskId, "status"],
    queryFn: () => api.taskStatus(taskId),
    refetchInterval: 3_000,
  });
}

export function useTaskResult(taskId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["task", taskId, "result"],
    queryFn: () => api.taskResult(taskId),
    enabled,
  });
}
