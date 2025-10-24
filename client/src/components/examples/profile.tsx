import Profile from "../../pages/profile";
import { ThemeProvider } from "../theme-provider";

export default function ProfileExample() {
  return (
    <ThemeProvider>
      <Profile />
    </ThemeProvider>
  );
}
