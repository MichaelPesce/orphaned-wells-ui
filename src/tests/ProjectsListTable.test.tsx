import { render, screen } from "@testing-library/react";
import ProjectsListTable from "../components/ProjectsListTable/ProjectsListTable";
import { HashRouter } from "react-router-dom";
import mockProjects from "./mockProjects.json";


test("project list table", (): void => {

  render( <HashRouter> <ProjectsListTable projects={mockProjects}/> </HashRouter> );

  //test for component elements
  screen.getByRole("table", {  name: /projects table/i});
  screen.getByRole("columnheader", {  name: /project name/i});
  screen.getByRole("columnheader", {  name: /date/i});
});

