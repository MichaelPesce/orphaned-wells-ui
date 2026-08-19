# OGRRE JSON/CSV Import Format v1

Use these formats to create processorless records that can be reviewed in OGRRE without a processor schema.

## Package

```json
{
  "format": "ogrre-json-records-v1",
  "records": [
    {
      "name": "record-001",
      "filename": "record-001.json",
      "attributesList": [
        {
          "key": "well_name",
          "value": "Smith 1",
          "raw_text": "Smith 1",
          "normalized_value": "Smith 1",
          "confidence": null,
          "normalized_vertices": null,
          "page": null,
          "subattributes": []
        }
      ]
    }
  ]
}
```

`records` may also be supplied as the top-level JSON array, but the object package is preferred for new LLM output.

## OGRRE JSON Export

OGRRE can also import its own JSON export shape. Each array item is one record. Metadata such as `file`, `filename`, `name`, `URL`, and `image_files` is treated as record metadata; other keys are treated as attributes:

```json
[
  {
    "file": "record-001.png",
    "operator_name": {
      "key": "operator_name",
      "value": "Acadiana Oil & Environmental",
      "normalized_vertices": null,
      "subattributes": [],
      "page": 0
    }
  }
]
```

## OGRRE CSV Export

OGRRE can import CSV exports with a `file` column plus attribute columns. Subattributes may use bracket notation:

```csv
file,operator_name,operator_address[street]
record-001.png,Acadiana Oil & Environmental,PO Box 12033
```

CSV import preserves column names as attribute keys. Use JSON when coordinates, pages, confidence, or nested metadata are important.

## Attributes

Required:

- `key`: stable field identifier.

Recommended:

- `value`: reviewed/display value.
- `raw_text`: source text from the model or source document.
- `normalized_value`: normalized value when available; otherwise repeat `value`.
- `confidence`: model confidence as 0-1 number, or `null`.
- `normalized_vertices`: four normalized `[x, y]` points, or `null`.
- `page`: zero-based page number when known, or `null`.
- `subattributes`: nested attributes for table rows or parent fields.

For nested attributes, keep the child `key` relative to its parent. OGRRE will derive parent paths.

## Optional Schema

Use schema only when the user asks for aliases, ordering, or cleaning support:

```json
{
  "format": "ogrre-json-records-v1",
  "schema": {
    "documentType": "Lab Report",
    "fields": [
      {
        "name": "well_name",
        "alias": "Well Name",
        "data_type": "Plain text",
        "database_data_type": "str",
        "occurrence": "Optional once",
        "page_order_sort": 1
      }
    ]
  },
  "records": []
}
```

Without schema, OGRRE derives columns from the imported records and preserves record field order.
