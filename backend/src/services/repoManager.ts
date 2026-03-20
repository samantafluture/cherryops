import type { AppConfig } from "../types.js";

interface GitHubFile {
  path: string;
  content: string;
  sha: string;
  encoding: string;
}

interface GitHubTreeItem {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
}

const GITHUB_API = "https://api.github.com";

export class RepoManager {
  private readonly token: string;
  private readonly headers: Record<string, string>;

  constructor(config: AppConfig) {
    this.token = config.githubPat;
    this.headers = {
      Authorization: `Bearer ${this.token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "CherryOps-Backend",
    };
  }

  async getFileTree(repo: string, branch: string): Promise<GitHubTreeItem[]> {
    const branchData = await this.fetchJson<{ commit: { sha: string } }>(
      `${GITHUB_API}/repos/${repo}/branches/${branch}`
    );

    const treeData = await this.fetchJson<{
      tree: GitHubTreeItem[];
      truncated: boolean;
    }>(
      `${GITHUB_API}/repos/${repo}/git/trees/${branchData.commit.sha}?recursive=1`
    );

    return treeData.tree;
  }

  async getFileContent(
    repo: string,
    path: string,
    branch: string
  ): Promise<GitHubFile> {
    const data = await this.fetchJson<{
      content: string;
      sha: string;
      encoding: string;
    }>(`${GITHUB_API}/repos/${repo}/contents/${path}?ref=${branch}`);

    const content =
      data.encoding === "base64"
        ? Buffer.from(data.content, "base64").toString("utf-8")
        : data.content;

    return { path, content, sha: data.sha, encoding: data.encoding };
  }

  async createOrUpdateFile(
    repo: string,
    path: string,
    content: string,
    message: string,
    branch: string,
    sha?: string
  ): Promise<{ sha: string; commitSha: string }> {
    const body: Record<string, string> = {
      message,
      content: Buffer.from(content).toString("base64"),
      branch,
    };

    if (sha) {
      body["sha"] = sha;
    }

    const data = await this.fetchJson<{
      content: { sha: string };
      commit: { sha: string };
    }>(`${GITHUB_API}/repos/${repo}/contents/${path}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });

    return { sha: data.content.sha, commitSha: data.commit.sha };
  }

  async deleteFile(
    repo: string,
    path: string,
    message: string,
    branch: string,
    sha: string
  ): Promise<void> {
    await this.fetchJson(`${GITHUB_API}/repos/${repo}/contents/${path}`, {
      method: "DELETE",
      body: JSON.stringify({ message, branch, sha }),
    });
  }

  async getBranchSha(repo: string, branch: string): Promise<string> {
    const data = await this.fetchJson<{ commit: { sha: string } }>(
      `${GITHUB_API}/repos/${repo}/branches/${branch}`
    );
    return data.commit.sha;
  }

  private async fetchJson<T>(
    url: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...(options?.body ? { "Content-Type": "application/json" } : {}),
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `GitHub API error ${response.status}: ${errorBody}`
      );
    }

    return response.json() as Promise<T>;
  }
}
