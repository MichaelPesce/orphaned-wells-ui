import { render, screen } from "@testing-library/react";
import RecordsTable from "../components/RecordsTable/RecordsTable";
import { HashRouter } from "react-router-dom";
import mockRecordGroups from "./mockRecordGroups.json";

const mockFunction = (): void => {};

test("records table", (): void => {

  render( 
    <HashRouter> 
      <RecordsTable
        location="project"
        params="1"
        handleUpdate={mockFunction}
      /> 
    </HashRouter> );

  //test for component elements
  screen.getByRole("table", {  name: /records table/i});
  screen.getByRole("columnheader", {  name: /date uploaded/i});
  screen.getByRole("columnheader", {  name: /digitization status/i});
  screen.getByRole("columnheader", {  name: /review status/i});
});