import Questions from "../../pages/questions";
import { ThemeProvider } from "../theme-provider";

export default function QuestionsExample() {
  return (
    <ThemeProvider>
      <Questions />
    </ThemeProvider>
  );
}
