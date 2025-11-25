export function ConnectProcessorsOverview() {
  return (
    <div>
            OGRRE relies on Google Document AI extractors for document processing. <i>These must be trained before incorporating into OGRRE</i>. To learn more about Document AI, check out their <a target='_blank' href='https://cloud.google.com/document-ai#documentation' rel="noreferrer">documentation</a>. To connect your processor to OGRRE, follow this guide.
    </div>
  );
}

export function ProcessorList() {
  return (
    <div>
            OGRRE relies on some JSON files to know which processors to look for and which versions of those processors to use. First, you must create JSON file containing a list of your processors, called <code>Extractor Processors.json</code>. Each processor should contain the following:
      <ol>
        <li><b>Processor Name</b>: The name of the processor</li>
        <li><b>Processor ID</b>: The processor ID on Google,</li>
        <li><b>Model ID</b>: The ID of the processor version you wish to use. Processors can have multiple trained versions. If not provided, OGRRE will use the default model.</li>
      </ol>
      <p>For an example of this file, see <a download href="/orphaned-wells-ui/downloads/Extractor Processors.json">here</a>.</p>
    </div>
  );
}

export function CreateSchemas() {
  return (
    <div>
            For each processor you want to incorporate, you must create a schema. Google does not provide an API for fetching processor schemas, so a schema is necessary to ensure all fields show up on each document, whether found by the processor or not. Schemas should be a JSON file containing a list of the fields that you want to extract. The name of the file should match the name of the processor in Google Document AI. Each field should contain the following:
      <ol>
        <li><b>page_order_sort</b>: Order you want the field to show up in OGRRE</li>
        <li><b>name</b>: The key of the field</li> 
        <li><b>google_data_type</b>: The google data type (one of <i>Plain text, Datetime, Checkbox, Parent, Address</i>)</li> 
        <li><b>occurrence</b>: Field occurrence (one of <i>Optional once, Optional multiple, Required once, Required multiple</i>)</li> 
        <li><b>grouping</b>: Group that this field is associated with, if any (<i>optional</i>, for fields/subfields)</li>
        <li><b>database_data_type</b>: The data type you want in your database (<i>optional</i>, one of <i>int, str, float, bool, date, table</i>)</li> 
        <li><b>cleaning_function</b>: The cleaning function you want applied to your field (<i>optional</i>, one of <code>clean_date</code>, <code>clean_bool</code>, <code>string_to_float</code>, <code>string_to_int</code>, <code>convert_hole_size_to_decimal</code>)</li>
        <li><b>model_enabled</b>: Boolean indicating whether the field is enabled <i>(optional)</i></li>
      </ol>
      <p>For an example of a processor schema, see <a download href="/orphaned-wells-ui/downloads/SampleProcessorName.json">here</a>.</p>
    </div>
  );
}

export function AddFilesToRepo() {
  return (
    <div>
            Once you have created the processor data files, you must add them to the proper location. OGRRE relies on a third repository, <code>OGRRE_data_cleaning</code>. This is where the processor schemas are defined. To include your processors in your version of OGRRE, follow these steps:
      <ol>
        <li>
                    Fork and clone <a target='_blank' href="https://github.com/CATALOG-Historic-Records/OGRRE_data_cleaning" rel="noreferrer">OGRRE_data_cleaning</a>
        </li>
        <li>
                    Inside the repository, you will find the directory <code>OGRRE_data_cleaning/src/ogrre_data_cleaning/processor_schemas</code>. Inside this directory, create a subdirectory called <code>&lt;your-project&gt;_extractors</code>. <i>Note: The project name must match the backend environment variable <code>ENVIRONMENT</code>. For more information see the <a href="install_ogrre#3-set-required-environment-variables-1">backend environment variables section.</a></i>
        </li>
        <li>
                    Inside <code>&lt;your-project&gt;_extractors</code>, add your <code>Extractor Processors.json</code> file and all your processor schemas.
        </li>
      </ol>
    </div>
  );
}
