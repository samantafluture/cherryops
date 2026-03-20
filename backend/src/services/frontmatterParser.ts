import yaml from "js-yaml";

const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;

interface ParseResult {
  frontmatter: Record<string, unknown>;
  body: string;
}

export class FrontmatterParser {
  parse(content: string): ParseResult {
    const match = content.match(FRONTMATTER_REGEX);
    if (!match) {
      return { frontmatter: {}, body: content };
    }

    const [, yamlBlock, body] = match;
    const frontmatter = yaml.load(yamlBlock ?? "") as Record<string, unknown>;

    return {
      frontmatter: frontmatter ?? {},
      body: body ?? "",
    };
  }

  updateField(
    content: string,
    key: string,
    value: string
  ): string {
    const match = content.match(FRONTMATTER_REGEX);
    if (!match) {
      return content;
    }

    const [, yamlBlock, body] = match;
    const frontmatter = yaml.load(yamlBlock ?? "") as Record<string, unknown>;
    frontmatter[key] = value;

    const updatedYaml = yaml.dump(frontmatter, {
      lineWidth: -1,
      noRefs: true,
    }).trim();

    return `---\n${updatedYaml}\n---\n${body ?? ""}`;
  }

  serialize(
    frontmatter: Record<string, unknown>,
    body: string
  ): string {
    const yamlContent = yaml.dump(frontmatter, {
      lineWidth: -1,
      noRefs: true,
    }).trim();

    return `---\n${yamlContent}\n---\n\n${body}`;
  }
}
