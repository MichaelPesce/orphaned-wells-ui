---
name: ogrre-json-record-import
description: Generate, inspect, or validate JSON/CSV packages for importing processorless records into OGRRE. Use when creating LLM output intended for OGRRE review, converting extracted document data into OGRRE records, checking OGRRE import files, or working with OGRRE JSON/CSV exports.
---

# OGRRE JSON/CSV Record Import

Use this skill when producing JSON or CSV that OGRRE can import into processorless record groups.

## Workflow

1. Read [references/json-import-format-v1.md](references/json-import-format-v1.md) before generating or revising an import package.
2. Prefer the schema-less `attributesList` JSON format unless the user explicitly needs aliases, ordering, cleaning metadata, or CSV output.
3. Preserve source field names in `key`; use stable snake_case keys when generating new keys from unstructured documents.
4. Validate the final file with `scripts/validate_ogrre_json_import.py <path-to-file>` when a local JSON or CSV file is available.

## Required Shape

The top-level object should contain:

- `format`: `ogrre-json-records-v1`
- `records`: non-empty array of record objects

Each record should contain:

- `name`: display name in OGRRE
- `filename`: stable source filename or generated JSON filename
- `attributesList`: non-empty array of attributes

Optional `schema` metadata may be included, but OGRRE review does not require it.

OGRRE also accepts JSON exports shaped as an array of record objects where each attribute key maps to a full attribute object, and CSV exports with `file`, attribute columns, and optional bracketed subattribute columns such as `parent[child]`.
