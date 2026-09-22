import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AttributesTable from "../components/RecordAttributesTable/RecordAttributesTable";
import { Attribute, RecordAttributesTableProps } from "../types";
import { convertFiltersToMongoFormat, deriveAttribute, getActiveAttributeEntries } from "../util";

jest.mock("../usercontext", () => ({ useUserContext: () => ({ hasPermission: () => true }) }));

const fields = [
  { key: "retired_parent", deleted: true, value: "hidden", subattributes: [{ key: "hidden_child", value: "hidden" }] },
  { key: "parent", value: "", subattributes: [
    { key: "retired_child", deleted: true, value: "hidden" },
    { key: "visible_child", value: "visible", parentAttribute: "parent" },
  ] },
  { key: "last", value: "visible" },
] as Attribute[];

test("active traversal skips retired subtrees while retaining stored indexes", () => {
  expect(getActiveAttributeEntries(fields).map(({ attribute, indexes }) => [attribute.key, indexes])).toEqual([
    ["parent", [1]], ["visible_child", [1, 1]], ["last", [2]],
  ]);
  expect(deriveAttribute([0, 0], fields)).toBeUndefined();
  expect(deriveAttribute([1, 0], fields)).toBeUndefined();
  expect(deriveAttribute([1, 1], fields)?.key).toBe("visible_child");
});

test("record rows hide retired fields and send the original index when selected", () => {
  const onSelect = jest.fn();
  const props: RecordAttributesTableProps = {
    attribute_revision: "revision", handleClickField: onSelect, handleChangeValue: jest.fn(),
    fullscreen: null, displayIndexes: [], locked: true, recordSchema: {}, forceEditMode: [],
    insertField: jest.fn(), handleSuccessfulAttributeUpdate: jest.fn(), showError: jest.fn(),
    deleteField: jest.fn(), reviewStatus: "unreviewed", setUpdateFieldLocationID: jest.fn(), parentIndexes: [],
  };
  render(<MemoryRouter><AttributesTable {...props} attributesList={fields} /></MemoryRouter>);
  expect(screen.queryByText("retired_parent")).not.toBeInTheDocument();
  expect(screen.queryByText("hidden_child")).not.toBeInTheDocument();
  expect(screen.queryByText("retired_child")).not.toBeInTheDocument();
  fireEvent.click(screen.getByText("visible_child"));
  expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ key: "visible_child", indexes: [1, 1] }), undefined);
  fireEvent.click(screen.getByText("last"));
  expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ key: "last", indexes: [2] }), undefined);
});

test("cleaning-error filters use the backend's active-field summary", () => {
  const filter = { key: "error_status", displayName: "Cleaning errors", type: "select", operator: "eq" };
  expect(convertFiltersToMongoFormat([{ ...filter, selectedOptions: ["has cleaning errors"] }])).toEqual({ has_errors: true });
  expect(convertFiltersToMongoFormat([{ ...filter, selectedOptions: ["no cleaning errors"] }])).toEqual({ has_errors: false });
});
