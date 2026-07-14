import { createRoot } from "react-dom/client";
import { TRPCProvider } from "./providers/trpc";
import { AuthProvider } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <TRPCProvider>
    <AuthProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </AuthProvider>
  </TRPCProvider>
);
