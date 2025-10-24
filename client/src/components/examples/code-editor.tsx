import { useState } from "react";
import { CodeEditor } from "../code-editor";
import { ThemeProvider } from "../theme-provider";

export default function CodeEditorExample() {
  const [code, setCode] = useState(`function twoSum(nums, target) {
  const map = new Map();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    
    map.set(nums[i], i);
  }
  
  return [];
}`);

  return (
    <ThemeProvider>
      <div className="p-8">
        <CodeEditor
          value={code}
          language="javascript"
          onChange={(value) => setCode(value || "")}
        />
      </div>
    </ThemeProvider>
  );
}
