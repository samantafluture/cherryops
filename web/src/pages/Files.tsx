import { useState, useMemo, useCallback } from "react";
import { useFileTree, useFileContent } from "../hooks/useFileTree";
import { useQueryClient } from "@tanstack/react-query";
import { api, type GitHubTreeItem } from "../lib/api";
import { FolderOpen, File, ChevronRight, ChevronDown, Search } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface TreeNode {
  name: string;
  path: string;
  type: "blob" | "tree";
  children: TreeNode[];
}

function buildTree(items: GitHubTreeItem[]): TreeNode[] {
  const root: TreeNode[] = [];
  const map = new Map<string, TreeNode>();

  // Sort: folders first, then alphabetical
  const sorted = [...items].sort((a, b) => {
    if (a.type !== b.type) return a.type === "tree" ? -1 : 1;
    return a.path.localeCompare(b.path);
  });

  for (const item of sorted) {
    const parts = item.path.split("/");
    const name = parts[parts.length - 1]!;
    const node: TreeNode = { name, path: item.path, type: item.type, children: [] };
    map.set(item.path, node);

    if (parts.length === 1) {
      root.push(node);
    } else {
      const parentPath = parts.slice(0, -1).join("/");
      const parent = map.get(parentPath);
      if (parent) {
        parent.children.push(node);
      } else {
        root.push(node);
      }
    }
  }

  return root;
}

export default function Files() {
  const [repo, setRepo] = useState(() => localStorage.getItem("cherryops_default_repo") ?? "");
  const [activeRepo, setActiveRepo] = useState(repo);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const { data, isLoading, error } = useFileTree(activeRepo);
  const tree = useMemo(() => buildTree(data?.tree ?? []), [data]);

  const handleLoad = () => {
    if (repo.trim()) {
      setActiveRepo(repo.trim());
      setSelectedFile(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <FolderOpen className="w-6 h-6 text-cherry-400" />
        <h1 className="text-2xl font-semibold">Files</h1>
      </div>

      <div className="flex items-center gap-3">
        <input
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLoad()}
          placeholder="owner/repo"
          className="flex-1 max-w-sm px-3 py-2 bg-surface-alt border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-cherry-500"
        />
        <button
          onClick={handleLoad}
          disabled={!repo.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-cherry-600 hover:bg-cherry-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition cursor-pointer"
        >
          <Search className="w-4 h-4" /> Browse
        </button>
      </div>

      {error && (
        <p className="text-sm text-status-error">
          Failed to load file tree. Check that the repo exists and your token has access.
        </p>
      )}

      {isLoading && <p className="text-sm text-text-muted">Loading file tree...</p>}

      {activeRepo && tree.length > 0 && (
        <div className="flex gap-4 min-h-[500px]">
          {/* Tree panel */}
          <div className="w-72 shrink-0 bg-surface-alt border border-border rounded-xl p-3 overflow-y-auto max-h-[calc(100vh-220px)]">
            {tree.map((node) => (
              <TreeItem
                key={node.path}
                node={node}
                depth={0}
                selectedPath={selectedFile}
                onSelect={setSelectedFile}
              />
            ))}
          </div>

          {/* Content panel */}
          <div className="flex-1 bg-surface-alt border border-border rounded-xl overflow-hidden">
            {selectedFile ? (
              <FileViewer repo={activeRepo} path={selectedFile} />
            ) : (
              <div className="flex items-center justify-center h-full text-text-muted text-sm">
                Select a file to view its contents
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TreeItem({ node, depth, selectedPath, onSelect }: {
  node: TreeNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}) {
  const [open, setOpen] = useState(depth < 1);
  const isFolder = node.type === "tree";
  const isSelected = node.path === selectedPath;

  const handleClick = () => {
    if (isFolder) {
      setOpen(!open);
    } else {
      onSelect(node.path);
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        className={`flex items-center gap-1.5 py-1 px-1 rounded text-sm cursor-pointer transition ${
          isSelected
            ? "bg-cherry-600/15 text-cherry-400"
            : "text-text-muted hover:text-text hover:bg-surface-hover"
        }`}
      >
        {isFolder ? (
          open ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <File className="w-3.5 h-3.5 shrink-0" />
        )}
        <span className="truncate">{node.name}</span>
      </div>
      {isFolder && open && node.children.map((child) => (
        <TreeItem
          key={child.path}
          node={child}
          depth={depth + 1}
          selectedPath={selectedPath}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function FileViewer({ repo, path }: { repo: string; path: string }) {
  const { data, isLoading, error } = useFileContent(repo, path);
  const queryClient = useQueryClient();
  const isMarkdown = path.endsWith(".md") || path.endsWith(".mdx");
  const [saving, setSaving] = useState(false);

  const toggleCheckbox = useCallback(async (lineIndex: number) => {
    if (!data || saving) return;
    const lines = data.content.split("\n");
    const line = lines[lineIndex];
    if (!line) return;

    // Toggle [ ] <-> [x]
    let updated: string;
    if (line.includes("- [ ] ")) {
      updated = line.replace("- [ ] ", "- [x] ");
    } else if (line.includes("- [x] ")) {
      updated = line.replace("- [x] ", "- [ ] ");
    } else {
      return;
    }

    lines[lineIndex] = updated;
    const newContent = lines.join("\n");

    setSaving(true);
    try {
      await api.updateFileContent({
        repo,
        path,
        content: newContent,
        sha: data.sha,
        message: `Toggle checkbox in ${path}`,
      });
      // Invalidate to refetch with new sha
      void queryClient.invalidateQueries({ queryKey: ["fileContent", repo, path] });
    } catch {
      // Silently fail — user can retry
    } finally {
      setSaving(false);
    }
  }, [data, repo, path, saving, queryClient]);

  if (isLoading) return <div className="p-4 text-sm text-text-muted">Loading...</div>;
  if (error) return <div className="p-4 text-sm text-status-error">Failed to load file</div>;
  if (!data) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b border-border text-xs text-text-muted font-mono bg-surface flex items-center justify-between">
        <span>{path}</span>
        {saving && <span className="text-cherry-400">Saving...</span>}
      </div>
      <div className="flex-1 overflow-auto p-4">
        {isMarkdown ? (
          <MarkdownWithCheckboxes content={data.content} onToggle={toggleCheckbox} />
        ) : (
          <pre className="text-sm font-mono text-text whitespace-pre-wrap break-words">
            {data.content}
          </pre>
        )}
      </div>
    </div>
  );
}

function MarkdownWithCheckboxes({ content, onToggle }: { content: string; onToggle: (lineIndex: number) => void }) {
  // Build a map of checkbox line indices
  const lines = content.split("\n");
  const checkboxLines = new Map<number, boolean>();
  let checkboxIndex = 0;
  const checkboxOrder: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.includes("- [ ] ") || line.includes("- [x] ")) {
      checkboxLines.set(checkboxIndex, line.includes("- [x] "));
      checkboxOrder.push(i);
      checkboxIndex++;
    }
  }

  let cbCounter = 0;

  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <ReactMarkdown
        components={{
          li: ({ children, ...props }) => {
            // Check if this list item has a checkbox (react-markdown adds input for GFM checkboxes)
            const childArray = Array.isArray(children) ? children : [children];
            const hasCheckbox = childArray.some(
              (child) => typeof child === "object" && child !== null && "type" in child && child.type === "input"
            );

            if (hasCheckbox && cbCounter < checkboxOrder.length) {
              const lineIdx = checkboxOrder[cbCounter]!;
              const checked = checkboxLines.get(cbCounter) ?? false;
              cbCounter++;

              // Filter out the default input and render our own
              const filteredChildren = childArray.filter(
                (child) => !(typeof child === "object" && child !== null && "type" in child && child.type === "input")
              );

              return (
                <li {...props} className="flex items-start gap-2 list-none -ml-4">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(lineIdx)}
                    className="mt-1 cursor-pointer accent-cherry-500"
                  />
                  <span className={checked ? "line-through text-text-muted" : ""}>{filteredChildren}</span>
                </li>
              );
            }

            return <li {...props}>{children}</li>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
