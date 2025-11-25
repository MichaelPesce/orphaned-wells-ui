import { render, screen } from "@testing-library/react";
import Header from "../components/Header/Header";
import { HashRouter } from "react-router-dom";

test("header", (): void => {
  render(<HashRouter><Header /></HashRouter>);

});