import type { FastifyInstance } from "fastify";
import yaml from "js-yaml";
import fs from "node:fs/promises";
import path from "node:path";
import type {
  SkillValidateRequest,
  SkillValidateResponse,
  SkillDefinition,
} from "../types.js";

const SKILLS_DIR = path.resolve("../skills");

export async function loadSkillById(skillId: string): Promise<SkillDefinition | null> {
  try {
    const entries = await fs.readdir(SKILLS_DIR);
    const yamlFiles = entries.filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
    for (const file of yamlFiles) {
      const content = await fs.readFile(path.join(SKILLS_DIR, file), "utf-8");
      const parsed = yaml.load(content) as SkillDefinition;
      if (parsed?.id === skillId) return parsed;
    }
  } catch {
    // Skills directory may not exist
  }
  return null;
}

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

const VALID_CATEGORIES = ["client", "content", "dev", "ops", "finance", "custom"];
const VALID_PERSONAS = ["builder", "operator", "both"];
const VALID_AGENT_MODES = ["api_direct", "cherry_agent"];
const VALID_OUTPUT_FORMATS = ["markdown", "plain", "diff"];
const VALID_VARIABLE_TYPES = ["string", "select", "file_picker"];

export async function skillRoutes(app: FastifyInstance): Promise<void> {
  // List all available skills from the skills/ directory
  app.get(
    "/skills",
    { onRequest: [app.authenticate] },
    async (_request, reply) => {
      try {
        const entries = await fs.readdir(SKILLS_DIR);
        const yamlFiles = entries.filter(
          (f) => f.endsWith(".yaml") || f.endsWith(".yml")
        );

        const skills: SkillDefinition[] = [];
        for (const file of yamlFiles) {
          try {
            const content = await fs.readFile(
              path.join(SKILLS_DIR, file),
              "utf-8"
            );
            const parsed = yaml.load(content) as SkillDefinition;
            if (parsed && typeof parsed === "object" && parsed.id) {
              skills.push(parsed);
            }
          } catch {
            // Skip files that fail to parse
          }
        }

        skills.sort((a, b) => a.category.localeCompare(b.category));
        return reply.send({ skills });
      } catch {
        return reply.send({ skills: [] });
      }
    }
  );

  app.post<{ Body: SkillValidateRequest }>(
    "/skills/validate",
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const { skill_yaml } = request.body;
      const errors: string[] = [];
      const warnings: string[] = [];

      let parsed: Record<string, unknown>;
      try {
        parsed = yaml.load(skill_yaml) as Record<string, unknown>;
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown parse error";
        return reply.status(422).send({
          valid: false,
          errors: [`Invalid YAML: ${message}`],
        } satisfies SkillValidateResponse);
      }

      if (!parsed || typeof parsed !== "object") {
        return reply.status(422).send({
          valid: false,
          errors: ["YAML must be an object"],
        } satisfies SkillValidateResponse);
      }

      for (const field of REQUIRED_FIELDS) {
        if (!(field in parsed) || parsed[field] === null || parsed[field] === undefined) {
          errors.push(`Missing required field: ${field}`);
        }
      }

      if (parsed["category"] && !VALID_CATEGORIES.includes(parsed["category"] as string)) {
        errors.push(`category must be one of: ${VALID_CATEGORIES.join(", ")}`);
      }

      if (parsed["persona"] && !VALID_PERSONAS.includes(parsed["persona"] as string)) {
        errors.push(`persona must be one of: ${VALID_PERSONAS.join(", ")}`);
      }

      if (parsed["agent_mode"] && !VALID_AGENT_MODES.includes(parsed["agent_mode"] as string)) {
        errors.push(`agent_mode must be one of: ${VALID_AGENT_MODES.join(", ")}`);
      }

      if (parsed["output_format"] && !VALID_OUTPUT_FORMATS.includes(parsed["output_format"] as string)) {
        errors.push(`output_format must be one of: ${VALID_OUTPUT_FORMATS.join(", ")}`);
      }

      if (Array.isArray(parsed["variables"])) {
        for (const variable of parsed["variables"] as Record<string, unknown>[]) {
          if (!variable["id"]) {
            errors.push("Each variable must have an id");
          }
          if (!variable["label"]) {
            errors.push(`Variable ${variable["id"] ?? "unknown"} must have a label`);
          }
          if (variable["type"] && !VALID_VARIABLE_TYPES.includes(variable["type"] as string)) {
            errors.push(
              `Variable ${variable["id"] ?? "unknown"}: type must be one of: ${VALID_VARIABLE_TYPES.join(", ")}`
            );
          }
          if (variable["type"] === "select" && !Array.isArray(variable["options"])) {
            errors.push(
              `Variable ${variable["id"] ?? "unknown"}: select type requires options array`
            );
          }
        }
      }

      if (!parsed["context_files"]) {
        warnings.push("No context_files defined — skill will run without file context");
      }

      if (!parsed["tags"] || (Array.isArray(parsed["tags"]) && (parsed["tags"] as unknown[]).length === 0)) {
        warnings.push("No tags defined — skill may be harder to discover");
      }

      if (errors.length > 0) {
        return reply.status(422).send({
          valid: false,
          errors,
        } satisfies SkillValidateResponse);
      }

      const response: SkillValidateResponse = {
        valid: true,
        skill_id: parsed["id"] as string,
        warnings,
      };

      return reply.send(response);
    }
  );
}
