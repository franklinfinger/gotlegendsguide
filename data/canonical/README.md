# Canonical evidence data (metadata only)

This directory holds schemas, evidence metadata, and future extracted records. It must never contain source screenshot binaries. The external archive remains outside the repository; a filename, checksum, and archive locator are sufficient to trace an evidence source.

## Layout

- `*.schema.json` — portable record contracts. They document the fields expected by the lightweight validator and map directly to future relational tables.
- `staged/` — registered source metadata and unreviewed extraction candidates. Nothing here is available to the application.
- `reviewed/` — human-reviewed records that may still be unresolved or conflicted. Nothing here is available to the application.
- `canonical/` — accepted records only. Every factual claim here must have evidence, resolved identity references, and no blocking conflict.

Each future collection file uses this envelope:

```json
{
  "schema_version": "1.0.0",
  "record_type": "claims",
  "state": "staged",
  "records": []
}
```

The state must match its directory. Files are moved forward rather than copied, so a record has one active state. Example files carry `synthetic_example: true` and `loadable: false`; they demonstrate format only and are excluded from canonical loading.

Run the dependency-free validator with:

```sh
node scripts/validate-canonical-data.mjs
```

