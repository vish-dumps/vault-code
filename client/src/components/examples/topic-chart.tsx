import { TopicChart } from "../topic-chart";

export default function TopicChartExample() {
  const mockData = [
    { topic: "Arrays", solved: 45 },
    { topic: "Strings", solved: 32 },
    { topic: "DP", solved: 28 },
    { topic: "Graphs", solved: 21 },
    { topic: "Trees", solved: 30 },
  ];

  return (
    <div className="p-8 max-w-4xl">
      <TopicChart data={mockData} />
    </div>
  );
}
