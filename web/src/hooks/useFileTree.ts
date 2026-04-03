import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useFileTree(repo: string, branch = "main") {
  return useQuery({
    queryKey: ["fileTree", repo, branch],
    queryFn: () => api.fileTree(repo, branch),
    enabled: !!repo,
    staleTime: 30_000,
  });
}

export function useFileContent(repo: string, path: string, branch = "main") {
  return useQuery({
    queryKey: ["fileContent", repo, path, branch],
    queryFn: () => api.fileContent(repo, path, branch),
    enabled: !!repo && !!path,
    staleTime: 30_000,
  });
}
