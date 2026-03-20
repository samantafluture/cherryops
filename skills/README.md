# CherryOps Skill Packs

Skills are reusable workflow templates defined as YAML files. The app reads them from `skills/` in your project repo and surfaces them as one-tap actions.

## Schema Reference

See the full schema in `docs/cherryops-tdd.md` §4.

### Required Fields

| Field | Type | Description |
|---|---|---|
| `schema_version` | string | Always `"1"` |
| `id` | string | Unique skill identifier (kebab-case) |
| `name` | string | Display name |
| `description` | string | What the skill does |
| `version` | string | Semver version |
| `author` | string | GitHub username or `"community"` |
| `icon` | string | Emoji icon |
| `category` | enum | `client`, `content`, `dev`, `ops`, `finance`, `custom` |
| `persona` | enum | `builder`, `operator`, `both` |
| `agent_mode` | enum | `api_direct`, `cherry_agent` |
| `prompt_template` | string | The prompt sent to the AI |
| `output_file` | string | Where the output is written |
| `output_format` | enum | `markdown`, `plain`, `diff` |

### Template Tokens

| Token | Resolves to |
|---|---|
| `{{context}}` | Concatenated content of all `context_files` |
| `{{user_brief}}` | User's free-text input at dispatch |
| `{{project_name}}` | From `.cherryops.yaml` |
| `{{date}}` | ISO date at dispatch time |
| `{{variable_id}}` | Any declared variable value |

### Validation

All skills must pass `/skills/validate` before being surfaced in the app. Use the backend endpoint to validate during development.

## Included Packs

### Builder Pack
- `run-tests.yaml` — Run test suite
- `draft-changelog.yaml` — Draft changelog entry
- `summarize-pr.yaml` — Summarize PR diff
- `review-claude-md.yaml` — Review CLAUDE.md
- `release-notes.yaml` — Generate release notes

### Operator Pack
- `draft-client-email.yaml` — Draft client email
- `summarize-meeting.yaml` — Summarize meeting notes
- `proposal-outline.yaml` — Write proposal outline
- `weekly-review.yaml` — Create weekly review
- `invoice-brief.yaml` — Generate invoice brief

## Creating Custom Skills

1. Copy an existing skill YAML as a template
2. Update the fields for your workflow
3. Add `context_files` pointing to your project's relevant files
4. Write a clear `prompt_template` with specific instructions
5. Validate with `/skills/validate`
6. Commit to your repo's `skills/` folder
