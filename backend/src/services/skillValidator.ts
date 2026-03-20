import yaml from "js-yaml";
import type { SkillDefinition, SkillValidateResponse } from "../types.js";

const REQUIRED_FIELDS: (keyof SkillDefinition)[] = [
  "schema_version",
  "id",
  "name",
  "description",
  "version",
  "author",
  "icon",
  "category",
  "persona",
  "agent_mode",
  "prompt_template",
  "output_file",
  "output_format",
];

const VALID_CATEGORIES = new Set(["client", "content", "dev", "ops", "finance", "custom"]);
const VALID_PERSONAS = new Set(["builder", "operator", "both"]);
const VALID_AGENT_MODES = new Set(["api_direct", "cherry_agent"]);
const VALID_OUTPUT_FORMATS = new Set(["markdown", "plain", "diff"]);
const VALID_VARIABLE_TYPES = new Set(["string", "select", "file_picker"]);

export class SkillValidator {
  validate(yamlContent: string): SkillValidateResponse {
    let parsed: Record<string, unknown>;
    try {
      parsed = yaml.load(yamlContent) as Record<string, unknown>;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown parse error";
      return { valid: false, errors: [`Invalid YAML: ${message}`] };
    }

    if (!parsed || typeof parsed !== "object") {
      return { valid: false, errors: ["YAML must be an object"] };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    for (const field of REQUIRED_FIELDS) {
      if (parsed[field] === null || parsed[field] === undefined) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    this.validateEnum(parsed, "category", VALID_CATEGORIES, errors);
    this.validateEnum(parsed, "persona", VALID_PERSONAS, errors);
    this.validateEnum(parsed, "agent_mode", VALID_AGENT_MODES, errors);
    this.validateEnum(parsed, "output_format", VALID_OUTPUT_FORMATS, errors);

    if (Array.isArray(parsed["variables"])) {
      this.validateVariables(parsed["variables"] as Record<string, unknown>[], errors);
    }

    if (!parsed["context_files"]) {
      warnings.push("No context_files defined — skill will run without file context");
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return {
      valid: true,
      skill_id: parsed["id"] as string,
      warnings,
    };
  }

  parseSkill(yamlContent: string): SkillDefinition {
    const parsed = yaml.load(yamlContent) as SkillDefinition;
    return parsed;
  }

  private validateEnum(
    parsed: Record<string, unknown>,
    field: string,
    validValues: Set<string>,
    errors: string[]
  ): void {
    const value = parsed[field];
    if (value && !validValues.has(value as string)) {
      errors.push(`${field} must be one of: ${[...validValues].join(", ")}`);
    }
  }

  private validateVariables(
    variables: Record<string, unknown>[],
    errors: string[]
  ): void {
    for (const variable of variables) {
      if (!variable["id"]) {
        errors.push("Each variable must have an id");
      }
      if (!variable["label"]) {
        errors.push(`Variable ${String(variable["id"] ?? "unknown")} must have a label`);
      }
      if (variable["type"] && !VALID_VARIABLE_TYPES.has(variable["type"] as string)) {
        errors.push(
          `Variable ${String(variable["id"] ?? "unknown")}: type must be one of: ${[...VALID_VARIABLE_TYPES].join(", ")}`
        );
      }
      if (variable["type"] === "select" && !Array.isArray(variable["options"])) {
        errors.push(
          `Variable ${String(variable["id"] ?? "unknown")}: select type requires options array`
        );
      }
    }
  }
}
