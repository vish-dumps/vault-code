import Workspace from "../../pages/workspace";
import { ThemeProvider } from "../theme-provider";

export default function WorkspaceExample() {
  return (
    <ThemeProvider>
      <Workspace />
    </ThemeProvider>
  );
}
