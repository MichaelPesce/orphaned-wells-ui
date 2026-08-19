#!/usr/bin/env python3
import argparse
import csv
import json
import os
import sys


METADATA_KEYS = {
    "_id",
    "id",
    "record_id",
    "record_group_id",
    "rg_id",
    "project_id",
    "name",
    "file",
    "filename",
    "original_filename",
    "api_number",
    "contributor",
    "status",
    "review_status",
    "verification_status",
    "URL",
    "url",
    "image_files",
    "img_urls",
    "image_whitespace",
    "source_type",
    "dateCreated",
    "lastUpdated",
    "lastUpdatedBy",
    "record_notes",
    "notes",
    "previous_id",
    "next_id",
    "rank",
    "record_number",
}


def get_records(data):
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        return data.get("records")
    return None


def looks_like_attribute(value):
    if not isinstance(value, dict):
        return False
    return any(
        key in value
        for key in (
            "key",
            "name",
            "value",
            "raw_text",
            "text_value",
            "normalized_value",
            "normalized_vertices",
            "coordinates",
            "subattributes",
            "properties",
            "page",
            "confidence",
            "ai_confidence",
        )
    )


def get_record_attributes(record):
    attributes = record.get("attributesList")
    if attributes is None:
        attributes = record.get("attributes")
    if attributes is None and isinstance(record.get("fields"), dict):
        return [
            {"key": key, "value": value, "subattributes": []}
            for key, value in record["fields"].items()
        ]
    if attributes is not None:
        return attributes

    export_attributes = []
    for key, value in record.items():
        if key in METADATA_KEYS:
            continue
        if looks_like_attribute(value):
            attribute = value.copy()
            attribute.setdefault("key", key)
            export_attributes.append(attribute)
        else:
            export_attributes.append({"key": key, "value": value, "subattributes": []})
    return export_attributes


def validate_attribute(attribute, path, errors):
    if not isinstance(attribute, dict):
        errors.append(f"{path} must be an object")
        return
    key = attribute.get("key") or attribute.get("name")
    if not key:
        errors.append(f"{path}.key is required")
    subattributes = attribute.get("subattributes", attribute.get("properties", []))
    if subattributes is None:
        return
    if not isinstance(subattributes, list):
        errors.append(f"{path}.subattributes must be an array")
        return
    for idx, subattribute in enumerate(subattributes):
        validate_attribute(subattribute, f"{path}.subattributes[{idx}]", errors)


def validate_record(record, idx, errors):
    path = f"records[{idx}]"
    if not isinstance(record, dict):
        errors.append(f"{path} must be an object")
        return
    attributes = get_record_attributes(record)
    if not isinstance(attributes, list):
        errors.append(
            f"{path} must include attributesList, attributes, fields, or exported attribute columns"
        )
        return
    if len(attributes) == 0:
        errors.append(f"{path} must contain at least one attribute")
        return
    for attr_idx, attribute in enumerate(attributes):
        validate_attribute(attribute, f"{path}.attributesList[{attr_idx}]", errors)


def validate_schema(data, errors):
    if not isinstance(data, dict):
        return
    schema = data.get("schema")
    if schema is None:
        return
    if not isinstance(schema, dict):
        errors.append("schema must be an object")
        return
    fields = schema.get("fields", schema.get("attributes", []))
    if not isinstance(fields, list):
        errors.append("schema.fields must be an array")
        return
    for idx, field in enumerate(fields):
        if not isinstance(field, dict):
            errors.append(f"schema.fields[{idx}] must be an object")
            continue
        if not field.get("name") and not field.get("key"):
            errors.append(f"schema.fields[{idx}].name is required")


def validate_csv_file(file_path):
    errors = []
    try:
        with open(file_path, "r", encoding="utf-8-sig", newline="") as file_handle:
            reader = csv.DictReader(file_handle)
            rows = list(reader)
    except Exception as exc:
        print(f"Invalid CSV: {exc}", file=sys.stderr)
        return 1

    if not reader.fieldnames:
        errors.append("CSV must include a header row")
    attribute_columns = [
        column for column in reader.fieldnames or [] if column not in METADATA_KEYS
    ]
    if not attribute_columns:
        errors.append("CSV must include at least one attribute column")
    if not rows:
        errors.append("CSV must include at least one record row")

    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1

    print(f"OK: {len(rows)} records, CSV attribute columns: {len(attribute_columns)}")
    return 0


def main():
    parser = argparse.ArgumentParser(
        description="Validate an OGRRE JSON or CSV record import package."
    )
    parser.add_argument("import_file")
    args = parser.parse_args()

    if os.path.splitext(args.import_file)[1].lower() == ".csv":
        return validate_csv_file(args.import_file)

    try:
        with open(args.import_file, "r", encoding="utf-8") as file_handle:
            data = json.load(file_handle)
    except Exception as exc:
        print(f"Invalid JSON: {exc}", file=sys.stderr)
        return 1

    errors = []
    records = get_records(data)
    if not isinstance(records, list) or len(records) == 0:
        errors.append("records must be a non-empty array")
    else:
        for idx, record in enumerate(records):
            validate_record(record, idx, errors)
    validate_schema(data, errors)

    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1

    schema_count = 0
    if isinstance(data, dict) and isinstance(data.get("schema"), dict):
        fields = data["schema"].get("fields") or data["schema"].get("attributes") or []
        if isinstance(fields, list):
            schema_count = len(fields)
    print(f"OK: {len(records)} records, {schema_count} schema fields")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
