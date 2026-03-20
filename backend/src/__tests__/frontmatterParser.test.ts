import { describe, it, expect } from "vitest";
import { FrontmatterParser } from "../services/frontmatterParser.js";

const parser = new FrontmatterParser();

describe("FrontmatterParser", () => {
  describe("parse", () => {
    it("parses valid frontmatter and body", () => {
      const content = `---
id: task-001
status: pending
agent_mode: api_direct
---

# Task Brief
Do something useful.`;

      const result = parser.parse(content);
      expect(result.frontmatter.id).toBe("task-001");
      expect(result.frontmatter.status).toBe("pending");
      expect(result.frontmatter.agent_mode).toBe("api_direct");
      expect(result.body).toContain("Do something useful.");
    });

    it("returns empty frontmatter when no YAML block exists", () => {
      const content = "Just plain text without frontmatter.";
      const result = parser.parse(content);
      expect(result.frontmatter).toEqual({});
      expect(result.body).toBe(content);
    });

    it("handles empty frontmatter", () => {
      const content = `---
---
Body content here.`;
      const result = parser.parse(content);
      expect(result.body).toContain("Body content here.");
    });
  });

  describe("updateField", () => {
    it("updates an existing field in frontmatter", () => {
      const content = `---
id: task-001
status: pending
---

# Brief`;

      const updated = parser.updateField(content, "status", "complete");
      const reparsed = parser.parse(updated);
      expect(reparsed.frontmatter.status).toBe("complete");
      expect(reparsed.frontmatter.id).toBe("task-001");
      expect(reparsed.body).toContain("# Brief");
    });

    it("adds a new field to frontmatter", () => {
      const content = `---
id: task-001
---

Body`;

      const updated = parser.updateField(content, "output_file", "outputs/result.md");
      const reparsed = parser.parse(updated);
      expect(reparsed.frontmatter.output_file).toBe("outputs/result.md");
    });

    it("returns content unchanged when no frontmatter", () => {
      const content = "No frontmatter here.";
      const updated = parser.updateField(content, "status", "done");
      expect(updated).toBe(content);
    });
  });

  describe("serialize", () => {
    it("creates a new document from frontmatter and body", () => {
      const frontmatter = { id: "new-task", status: "pending" };
      const body = "# New Task\nDo this.";
      const result = parser.serialize(frontmatter, body);

      expect(result).toContain("---");
      expect(result).toContain("id: new-task");
      expect(result).toContain("status: pending");
      expect(result).toContain("# New Task");

      const reparsed = parser.parse(result);
      expect(reparsed.frontmatter.id).toBe("new-task");
    });
  });
});
