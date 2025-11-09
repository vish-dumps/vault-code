// Fix for Trusted Types policy (required for Excalidraw)
if ((window as any).trustedTypes && (window as any).trustedTypes.createPolicy) {
  (window as any).trustedTypes.createPolicy('default', {
    createHTML: (string: string) => string,
    createScriptURL: (string: string) => string,
    createScript: (string: string) => string,
  });
}

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
