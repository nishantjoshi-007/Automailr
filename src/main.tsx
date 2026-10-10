import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
