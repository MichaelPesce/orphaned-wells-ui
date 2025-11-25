import { render, screen } from "@testing-library/react";
import Subheader from "../components/Subheader/Subheader";
import { HashRouter } from "react-router-dom";


test("Subheader", (): void => {

  render( <HashRouter><Subheader currentPage={""} buttonName="New Project"/> </HashRouter>);

  //test for component elements
    
});