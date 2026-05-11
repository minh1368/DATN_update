import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { CarsProvider } from "./context/CarsContext.jsx";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <CarsProvider>
        <App />
      </CarsProvider>
    </BrowserRouter>
  </StrictMode>,
)
