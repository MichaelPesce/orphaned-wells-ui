import { EditProcessorImg, SchemaViewImg, UploadProcessorImg } from "@site/docs/screenshots";

export function NavigateSchemaTab() {
  return (
    <div>
      <ol>
        <li>
          Navigate to the <code>Schema</code> tab from the OGRRE UI header:
          {SchemaViewImg()}
        </li>
      </ol>
    </div>
  );
}

export function AddProcessorSchema() {
  return (
    <div>
      <ol>
        <li>
          In the <code>Schema</code> tab, upload a processor schema file in <code>.csv</code> or <code>.json</code> format:
          {UploadProcessorImg()}
        </li>
      </ol>
      <p>
        For the expected processor schema format, see{" "}
        <a href="../install/connect_processors#create-processor-list-and-schemas">Create Processor List and Schemas</a>.
      </p>
    </div>
  );
}

export function EditProcessorSchema() {
  return (
    <div>
      <ol>
        <li>
          Processors can also be updated directly in the UI by clicking the edit icon:
          {EditProcessorImg()}
        </li>
      </ol>
    </div>
  );
}
