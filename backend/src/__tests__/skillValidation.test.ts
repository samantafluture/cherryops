import { describe, it, expect } from "vitest";
import yaml from "js-yaml";

// Test the validation logic directly (extracted from routes/skills.ts)
const REQUIRED_FIELDS = [
  "schema_version", "id", "name", "description", "version",
  "author", "icon", "category", "persona", "agent_mode",
  "prompt_template", "output_file", "output_format",
];

const VALID_CATEGORIES = ["client", "content", "dev", "ops", "finance", "custom"];
const VALID_PERSONAS = ["builder", "operator", "both"];
const VALID_AGENT_MODES = ["api_direct", "cherry_agent"];
const VALID_OUTPUT_FORMATS = ["markdown", "plain", "diff"];
const VALID_VARIABLE_TYPES = ["string", "select", "file_picker"];

function validateSkillYaml(skillYaml: string): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  let parsed: Record<string, unknown>;
  try {
    parsed = yaml.load(skillYaml) as Record<string, unknown>;
  } catch (e) {
    return { valid: false, errors: [`Invalid YAML: ${(e as Error).message}`], warnings: [] };
  }

  if (!parsed || typeof parsed !== "object") {
    return { valid: false, errors: ["YAML must be an object"], warnings: [] };
  }

  for (const field of REQUIRED_FIELDS) {
    if (!(field in parsed) || parsed[field] === null || parsed[field] === undefined) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (parsed.category && !VALID_CATEGORIES.includes(parsed.category as string)) {
    errors.push(`category must be one of: ${VALID_CATEGORIES.join(", ")}`);
  }
  if (parsed.persona && !VALID_PERSONAS.includes(parsed.persona as string)) {
    errors.push(`persona must be one of: ${VALID_PERSONAS.join(", ")}`);
  }
  if (parsed.agent_mode && !VALID_AGENT_MODES.includes(parsed.agent_mode as string)) {
    errors.push(`agent_mode must be one of: ${VALID_AGENT_MODES.join(", ")}`);
  }
  if (parsed.output_format && !VALID_OUTPUT_FORMATS.includes(parsed.output_format as string)) {
    errors.push(`output_format must be one of: ${VALID_OUTPUT_FORMATS.join(", ")}`);
  }

  if (Array.isArray(parsed.variables)) {
    for (const v of parsed.variables as Record<string, unknown>[]) {
      if (!v.id) errors.push("Each variable must have an id");
      if (!v.label) errors.push(`Variable ${v.id ?? "unknown"} must have a label`);
      if (v.type && !VALID_VARIABLE_TYPES.includes(v.type as string)) {
        errors.push(`Variable ${v.id ?? "unknown"}: type must be one of: ${VALID_VARIABLE_TYPES.join(", ")}`);
      }
      if (v.type === "select" && !Array.isArray(v.options)) {
        errors.push(`Variable ${v.id ?? "unknown"}: select type requires options array`);
      }
    }
  }

  if (!parsed.context_files) {
    warnings.push("No context_files defined — skill will run without file context");
  }

  return { valid: errors.length === 0, errors, warnings };
}

describe("Skill YAML Validation", () => {
  const validSkill = `
schema_version: "1"
id: test-skill
name: Test Skill
description: A test skill
version: "1.0"
author: test
icon: "🧪"
category: dev
persona: builder
agent_mode: api_direct
context_files:
  - README.md
variables:
  - id: input1
    label: Input One
    type: string
    required: true
prompt_template: "Do {{input1}}"
output_file: outputs/test.md
output_format: markdown
tags:
  - test
`;

  it("validates a correct skill YAML", () => {
    const result = validateSkillYaml(validSkill);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects invalid YAML syntax", () => {
    const result = validateSkillYaml("{ invalid: yaml: :");
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("Invalid YAML");
  });

  it("reports missing required fields", () => {
    const result = validateSkillYaml("id: only-id\nname: Only Name");
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("Missing required field"))).toBe(true);
  });

  it("rejects invalid category", () => {
    const skill = validSkill.replace("category: dev", "category: invalid");
    const result = validateSkillYaml(skill);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("category"))).toBe(true);
  });

  it("rejects invalid persona", () => {
    const skill = validSkill.replace("persona: builder", "persona: invalid");
    const result = validateSkillYaml(skill);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("persona"))).toBe(true);
  });

  it("rejects invalid agent_mode", () => {
    const skill = validSkill.replace("agent_mode: api_direct", "agent_mode: invalid");
    const result = validateSkillYaml(skill);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("agent_mode"))).toBe(true);
  });

  it("validates variable definitions", () => {
    const skill = validSkill.replace(
      "variables:\n  - id: input1\n    label: Input One\n    type: string\n    required: true",
      "variables:\n  - id: select1\n    label: Select One\n    type: select\n    options:\n      - a\n      - b"
    );
    const result = validateSkillYaml(skill);
    expect(result.valid).toBe(true);
  });

  it("rejects select variable without options", () => {
    const skill = validSkill.replace(
      "variables:\n  - id: input1\n    label: Input One\n    type: string\n    required: true",
      "variables:\n  - id: sel1\n    label: Select\n    type: select"
    );
    const result = validateSkillYaml(skill);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("select type requires options"))).toBe(true);
  });

  it("warns when context_files is missing", () => {
    const skill = validSkill.replace("context_files:\n  - README.md\n", "");
    const result = validateSkillYaml(skill);
    expect(result.warnings.some(w => w.includes("context_files"))).toBe(true);
  });
});
