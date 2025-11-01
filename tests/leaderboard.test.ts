import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { computeWeeklyLeaderboard, getWeekMeta } from "../server/services/leaderboard";
import { Question } from "../server/models/Question";
import { LeaderboardSnapshot } from "../server/models/LeaderboardSnapshot";
import { User as UserModel } from "../server/models/User";

vi.mock("../server/services/realtime", () => ({
  broadcast: vi.fn(),
}));

describe("Leaderboard services", () => {
  const originalDateNow = Date.now;

  beforeEach(() => {
    const base = new Date("2024-10-07T00:00:00Z").getTime();
    Date.now = vi.fn(() => base);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Date.now = originalDateNow;
  });

  it("computes week metadata", () => {
    const meta = getWeekMeta(new Date("2024-10-08T12:00:00Z"));
    expect(meta.weekKey).toMatch(/^2024-W/);
    expect(meta.label).toContain("Top Coders");
  });

  it("produces a ranked leaderboard snapshot", async () => {
    const aggregateSpy = vi.spyOn(Question, "aggregate").mockResolvedValue([
      {
        userId: "507f1f77bcf86cd799439011",
        username: "coder1",
        handle: "@coder1",
        displayName: "Coder One",
        xp: 1200,
        badge: "Pro",
        solvedCount: 12,
      },
      {
        userId: "507f191e810c19729de860ea",
        username: "coder2",
        handle: "@coder2",
        displayName: "Coder Two",
        xp: 800,
        badge: "Rising",
        solvedCount: 9,
      },
    ] as any);

    const findOneAndUpdateSpy = vi
      .spyOn(LeaderboardSnapshot, "findOneAndUpdate")
      .mockResolvedValue(null as any);

    let capturedPayload: any;
    const createSpy = vi
      .spyOn(LeaderboardSnapshot, "create")
      .mockImplementation(async (payload: any) => {
        capturedPayload = payload;
        return {
          ...payload,
          createdAt: new Date(),
        };
      });

    const badgeSpy = vi.spyOn(UserModel, "findByIdAndUpdate").mockResolvedValue(null as any);

    const snapshot = await computeWeeklyLeaderboard(new Date("2024-10-09T10:00:00Z"));

    expect(aggregateSpy).toHaveBeenCalled();
    expect(findOneAndUpdateSpy).toHaveBeenCalled();
    expect(createSpy).toHaveBeenCalled();
    expect(badgeSpy).toHaveBeenCalled();
    expect(capturedPayload.entries.length).toBe(2);

    expect(Array.isArray((snapshot as any).entries)).toBe(true);
    const top = (snapshot as any).entries?.[0];
    expect(top.rank).toBe(1);
    expect(top.username).toBe("coder1");
  });
});
