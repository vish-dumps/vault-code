import { describe, expect, it } from "vitest";
import {
  computeAverageRatings,
  sanitizeTags,
  sanitizeVisibility,
  serializeAnswer,
} from "../server/controllers/answers";

describe("Answer controller helpers", () => {
  it("computes average ratings with precision", () => {
    const ratings = [
      { clarity: 5, correctness: 4, efficiency: 4 } as any,
      { clarity: 3, correctness: 5, efficiency: 5 } as any,
    ];

    const result = computeAverageRatings(ratings);
    expect(result).toEqual({
      clarity: 4,
      correctness: 4.5,
      efficiency: 4.5,
    });
  });

  it("sanitizes tags and removes duplicates", () => {
    const tags = [" Array ", "array", "", "Hash "];
    expect(sanitizeTags(tags)).toEqual(["array", "hash"]);
    expect(sanitizeTags(undefined)).toEqual([]);
  });

  it("normalizes visibility to public by default", () => {
    expect(sanitizeVisibility("friends")).toBe("friends");
    expect(sanitizeVisibility("hidden" as any)).toBe("public");
    expect(sanitizeVisibility(undefined)).toBe("public");
  });

  it("serializes answers with user state metadata", () => {
    const answer: any = {
      _id: "answer-1",
      questionTitle: "Two Sum",
      platform: "LeetCode",
      language: "TypeScript",
      code: "const twoSum = () => [];",
      explanation: "Use a hashmap.",
      difficulty: "Easy",
      tags: ["array"],
      visibility: "public",
      createdAt: new Date("2024-01-01").toISOString(),
      updatedAt: new Date("2024-01-02").toISOString(),
      upvotes: ["user-a"],
      bookmarks: [],
      ratings: [{ clarity: 5, correctness: 5, efficiency: 4 }],
      comments: [
        {
          _id: "comment-1",
          userId: "user-b",
          content: "Nice approach!",
          createdAt: new Date().toISOString(),
        },
      ],
    };

    const summaries = new Map<string, any>([
      [
        "author-1",
        {
          id: "author-1",
          username: "coder",
          displayName: "Elite Coder",
        },
      ],
      [
        "user-b",
        {
          id: "user-b",
          username: "reviewer",
        },
      ],
    ]);

    const friendSet = new Set<string>(["author-1"]);
    answer.authorId = "author-1";

    const serialized = serializeAnswer(answer, summaries, "user-a", friendSet, {
      includeComments: true,
    });

    expect(serialized.author?.displayName).toBe("Elite Coder");
    expect(serialized.userState.hasUpvoted).toBe(true);
    expect(serialized.stats.ratings.count).toBe(1);
    expect(serialized.comments?.length).toBe(1);
  });
});

