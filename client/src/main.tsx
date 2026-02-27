import { createRoot } from "react-dom/client";
import { Buffer } from "buffer";
// @ts-ignore
window.Buffer = Buffer;
import "./index.css";
import App from "./App";
import { Providers } from "@/app/providers";

createRoot(document.getElementById("root")!).render(
  <Providers>
    <App />
  </Providers>
);
