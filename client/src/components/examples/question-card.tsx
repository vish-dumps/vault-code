import { QuestionCard } from "../question-card";

export default function QuestionCardExample() {
  return (
    <div className="p-8 max-w-3xl space-y-4">
      <QuestionCard
        id="1"
        title="Two Sum"
        platform="LeetCode"
        difficulty="Easy"
        tags={["Array", "Hash Table"]}
        language="Python"
        link="https://leetcode.com/problems/two-sum"
        onEdit={(id) => console.log("Edit", id)}
        onDelete={(id) => console.log("Delete", id)}
        onClick={(id) => console.log("View", id)}
      />
      <QuestionCard
        id="2"
        title="Longest Palindromic Substring"
        platform="LeetCode"
        difficulty="Medium"
        tags={["String", "Dynamic Programming", "Manacher"]}
        language="C++"
        link="https://leetcode.com"
        onEdit={(id) => console.log("Edit", id)}
        onDelete={(id) => console.log("Delete", id)}
        onClick={(id) => console.log("View", id)}
      />
    </div>
  );
}
