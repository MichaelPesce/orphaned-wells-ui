const clone = (value) => JSON.parse(JSON.stringify(value));

const expectOk = (status, label) => {
  expect(status, label).to.eq(200);
};

const findAttributeIndex = (attributes, key) => {
  const index = attributes.findIndex((attribute) => attribute.key === key);
  expect(index, `${key} index`).to.be.greaterThan(-1);
  return index;
};

const getRecord = (recordId) => {
  return cy.api("POST", `/get_record/${recordId}`, {}, { failOnStatusCode: false }).then(({ status, body }) => {
    expect(status, "get_record status").to.be.oneOf([200, 303]);
    expect(body.recordData, "record data").to.exist;
    return body.recordData;
  });
};

const updateRecord = (recordId, requestBody, label) => {
  return cy.api("POST", `/update_record/${recordId}`, requestBody).then(({ status, body }) => {
    expectOk(status, label);
    return body;
  });
};

describe("update API smoke coverage", () => {
  beforeEach(() => {
    cy.resetSeedData();
    cy.clearLocalStorage();
  });

  it("updates project, record group, processor, and default team data without errors", () => {
    cy.findSeededEntities().then(({ project, recordGroup }) => {
      cy.api("POST", `/update_project/${project._id}`, { name: project.name }).then(({ status, body }) => {
        expectOk(status, "update_project status");
        expect(body._id).to.eq(project._id);
        expect(body.name).to.eq(project.name);
      });

      cy.api("POST", `/update_record_group/${recordGroup._id}`, { name: recordGroup.name }).then(({ status, body }) => {
        expectOk(status, "update_record_group status");
        expect(body._id).to.eq(recordGroup._id);
        expect(body.name).to.eq(recordGroup.name);
      });

      expect(project.team, "seed project team").to.be.a("string").and.not.be.empty;
      cy.api("POST", "/update_default_team", { new_team: project.team }).then(({ status, body }) => {
        expectOk(status, "update_default_team status");
        expect(body.team).to.eq(project.team);
      });
    });

    cy.api("GET", "/get_schema").then(({ body }) => {
      const processor = body[0];
      expect(processor, "seeded processor").to.exist;

      cy.api("POST", "/update_processor", { name: processor.name }).then(({ status, body }) => {
        expectOk(status, "update_processor status");
        expect(body).to.eq("success");
      });
    });
  });

  it("supports record scalar update types without errors", () => {
    cy.findSeededEntities().then(({ record }) => {
      getRecord(record._id).then((originalRecord) => {
        const statusRestore = {
          review_status: originalRecord.review_status,
          verification_status: originalRecord.verification_status ?? null,
          defective_categories: originalRecord.defective_categories || [],
          defective_description: originalRecord.defective_description ?? null,
        };

        updateRecord(record._id, { data: { name: originalRecord.name }, type: "record" }, "record update type").then((body) => {
          expect(body.name).to.eq(originalRecord.name);
        });

        updateRecord(record._id, { data: { name: originalRecord.name }, type: "name" }, "name update type").then((body) => {
          expect(body.name).to.eq(originalRecord.name);
        });

        updateRecord(
          record._id,
          { data: { review_status: "incomplete" }, type: "review_status" },
          "review_status update type"
        ).then((body) => {
          expect(body.review_status).to.eq("incomplete");
          expect(body.verification_status).to.eq(null);
        });

        updateRecord(
          record._id,
          { data: { verification_status: originalRecord.verification_status ?? null }, type: "verification_status" },
          "verification_status update type"
        ).then((body) => {
          expect(body.verification_status).to.eq(originalRecord.verification_status ?? null);
        });

        updateRecord(
          record._id,
          { data: { attributesList: originalRecord.attributesList }, type: "attributesList" },
          "attributesList update type"
        ).then((body) => {
          expect(body.attributesList).to.be.an("array");
          expect(body.attributesList.length).to.eq(originalRecord.attributesList.length);
        });

        updateRecord(record._id, { data: statusRestore, type: "record" }, "restore record status fields").then((body) => {
          expect(body.review_status).to.eq(originalRecord.review_status);
        });
      });
    });
  });

  it("supports record field operation update types without errors", () => {
    const fieldKey = `cypress_temp_field_${Date.now()}`;
    const updatedValue = `Cypress updated value ${Date.now()}`;
    const coordinates = [
      [0.1, 0.1],
      [0.2, 0.1],
      [0.2, 0.2],
      [0.1, 0.2],
    ];

    cy.findSeededEntities().then(({ record }) => {
      getRecord(record._id).then((originalRecord) => {
        expect(originalRecord.attributesList, "seed record attributes").to.be.an("array");
        expect(originalRecord.attributesList.length, "seed record attribute count").to.be.greaterThan(0);

        updateRecord(
          record._id,
          {
            data: {
              fieldID: {
                key: fieldKey,
                primaryIndex: 0,
                indexes: [0],
              },
            },
            type: "insertField",
          },
          "insertField update type"
        ).then((insertBody) => {
          expect(insertBody.attributesList).to.be.an("array");
          const insertedIndex = findAttributeIndex(insertBody.attributesList, fieldKey);
          const insertedAttribute = insertBody.attributesList[insertedIndex];
          expect(insertedAttribute.user_added).to.eq(true);

          const updatedAttribute = {
            ...clone(insertedAttribute),
            value: updatedValue,
            text_value: updatedValue,
            raw_text: updatedValue,
          };

          updateRecord(
            record._id,
            {
              data: {
                key: fieldKey,
                idx: insertedIndex,
                indexes: [insertedIndex],
                v: updatedAttribute,
              },
              type: "attribute",
              fieldToClean: null,
            },
            "attribute update type"
          ).then((attributeBody) => {
            expect(attributeBody[`attributesList.${insertedIndex}`].value).to.eq(updatedValue);
          });

          updateRecord(
            record._id,
            {
              data: {
                fieldID: {
                  key: fieldKey,
                  primaryIndex: insertedIndex,
                  indexes: [insertedIndex],
                },
                new_coordinates: coordinates,
                pageNumber: 1,
              },
              type: "updateFieldCoordinates",
            },
            "updateFieldCoordinates update type"
          ).then((coordinatesBody) => {
            const coordinatesIndex = findAttributeIndex(coordinatesBody.attributesList, fieldKey);
            expect(coordinatesBody.attributesList[coordinatesIndex].user_provided_coordinates).to.deep.eq(coordinates);
            expect(coordinatesBody.attributesList[coordinatesIndex].page).to.eq(1);
          });

          updateRecord(
            record._id,
            {
              data: {
                fieldID: {
                  key: fieldKey,
                  primaryIndex: insertedIndex,
                  indexes: [insertedIndex],
                },
              },
              type: "deleteField",
            },
            "deleteField update type"
          ).then((deleteBody) => {
            expect(deleteBody.attributesList.map((attribute) => attribute.key)).not.to.include(fieldKey);
          });
        });
      });
    });
  });
});
