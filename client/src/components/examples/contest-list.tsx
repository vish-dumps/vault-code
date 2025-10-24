import { ContestList } from "../contest-list";

export default function ContestListExample() {
  const mockContests = [
    {
      id: "1",
      name: "Codeforces Round #912 (Div. 2)",
      platform: "Codeforces",
      startTime: "Oct 25, 2025 at 8:35 PM",
      url: "https://codeforces.com",
    },
    {
      id: "2",
      name: "Weekly Contest 419",
      platform: "LeetCode",
      startTime: "Oct 27, 2025 at 10:00 AM",
      url: "https://leetcode.com",
    },
    {
      id: "3",
      name: "CodeChef Starters 110",
      platform: "CodeChef",
      startTime: "Oct 28, 2025 at 8:00 PM",
      url: "https://codechef.com",
    },
  ];

  return (
    <div className="p-8 max-w-2xl">
      <ContestList contests={mockContests} />
    </div>
  );
}
