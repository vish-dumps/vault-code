import { Question } from '../models/Question';
import { User as UserModel } from '../models/User';
import {
  LeaderboardSnapshot,
  ILeaderboardEntry,
  ILeaderboardSnapshot,
} from '../models/LeaderboardSnapshot';
import { broadcast } from './realtime';

function getWeekStart(date = new Date()): Date {
  const target = new Date(date);
  const day = target.getDay(); // 0 (Sun) - 6 (Sat)
  const diff = (day + 6) % 7; // convert Sunday=0 to Monday=0 reference
  target.setDate(target.getDate() - diff);
  target.setHours(0, 0, 0, 0);
  return target;
}

function getWeekKey(date = new Date()): string {
  const weekStart = getWeekStart(date);
  const onejan = new Date(weekStart.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((weekStart.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
  return `${weekStart.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
}

function formatWeekLabel(weekStart: Date): string {
  const end = new Date(weekStart);
  end.setDate(weekStart.getDate() + 6);
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return `Top Coders • ${formatter.format(weekStart)} - ${formatter.format(end)}`;
}

async function awardBadges(entries: ILeaderboardEntry[], weekKey: string) {
  const topTen = entries.slice(0, 10);
  const badgeOps = topTen.map((entry) =>
    UserModel.findByIdAndUpdate(
      entry.userId,
      {
        $addToSet: {
          badgesEarned: `Top 10 • ${weekKey}`,
        },
      },
      { new: false }
    )
  );

  const consistentCoders = entries.filter((entry) => entry.solvedCount >= 5);
  const consistentOps = consistentCoders.map((entry) =>
    UserModel.findByIdAndUpdate(
      entry.userId,
      {
        $addToSet: {
          badgesEarned: `Consistent Coder • ${weekKey}`,
        },
      },
      { new: false }
    )
  );

  await Promise.all([...badgeOps, ...consistentOps]);
}

export async function computeWeeklyLeaderboard(date = new Date()): Promise<ILeaderboardSnapshot> {
  const weekStart = getWeekStart(date);
  const weekKey = getWeekKey(weekStart);

  const solvedPipeline = [
    {
      $addFields: {
        solvedDate: {
          $ifNull: ['$solvedAt', '$dateSaved'],
        },
      },
    },
    {
      $match: {
        solvedDate: { $gte: weekStart },
      },
    },
    {
      $group: {
        _id: '$userId',
        solvedCount: { $sum: 1 },
      },
    },
    {
      $addFields: {
        userObjectId: { $toObjectId: '$userId' },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'userObjectId',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $match: {
        'user.hideFromLeaderboard': { $ne: true },
      },
    },
    {
      $project: {
        userId: '$user._id',
        username: '$user.username',
        handle: '$user.handle',
        displayName: '$user.displayName',
        badge: '$user.badge',
        xp: '$user.xp',
        solvedCount: 1,
      },
    },
    {
      $sort: {
        solvedCount: -1,
        xp: -1,
        username: 1,
      },
    },
    { $limit: 100 },
  ] as any[];

  const results = await Question.aggregate<any>(solvedPipeline);
  const entries: ILeaderboardEntry[] = results.map((entry: any, index: number) => ({
    userId: entry.userId?.toString?.() ?? String(entry.userId),
    username: entry.username,
    handle: entry.handle,
    displayName: entry.displayName ?? null,
    badge: entry.badge,
    solvedCount: entry.solvedCount,
    xp: entry.xp ?? 0,
    rank: index + 1,
  }));

  const label = formatWeekLabel(weekStart);
  let snapshot = await LeaderboardSnapshot.findOneAndUpdate(
    { weekKey },
    {
      weekKey,
      weekStart,
      label,
      entries,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (!snapshot) {
    snapshot = await LeaderboardSnapshot.create({
      weekKey,
      weekStart,
      label,
      entries,
    });
  }

  if (entries.length) {
    await awardBadges(entries, weekKey);
  }

  broadcast('leaderboard:update', {
    weekKey,
    label,
    entries,
  });

  return snapshot;
}

export async function getCurrentWeekLeaderboard(): Promise<ILeaderboardSnapshot | null> {
  const weekKey = getWeekKey();
  const snapshot = await LeaderboardSnapshot.findOne({ weekKey });
  if (snapshot) {
    return snapshot;
  }
  return computeWeeklyLeaderboard();
}

export async function getLeaderboardHistory(limit = 6): Promise<ILeaderboardSnapshot[]> {
  const snapshots = await LeaderboardSnapshot.find({})
    .sort({ weekStart: -1 })
    .limit(limit)
    .lean()
    .exec();

  return snapshots as unknown as ILeaderboardSnapshot[];
}

export function getWeekMeta(date = new Date()) {
  const weekStart = getWeekStart(date);
  const weekKey = getWeekKey(date);
  return {
    weekKey,
    weekStart,
    label: formatWeekLabel(weekStart),
  };
}

