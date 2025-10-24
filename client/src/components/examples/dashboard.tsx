import Dashboard from "../../pages/dashboard";
import { ThemeProvider } from "../theme-provider";

export default function DashboardExample() {
  return (
    <ThemeProvider>
      <Dashboard />
    </ThemeProvider>
  );
}
