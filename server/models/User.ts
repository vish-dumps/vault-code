import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';

export interface IUser extends Document {
  _id: string;
  username: string;
  handle: string;
  email: string;
  password: string;
  name?: string | null;
  displayName?: string | null;
  profileImage?: string | null;
  bio?: string | null;
  college?: string | null;
  profileVisibility?: "public" | "friends";
  hideFromLeaderboard?: boolean;
  badgesEarned?: string[];
  bookmarkedAnswerIds?: string[];
  leetcodeUsername?: string | null;
  codeforcesUsername?: string | null;
  streak: number;
  maxStreak?: number;
  streakGoal?: number;
  dailyGoal?: number;
  dailyProgress?: number;
  xp: number;
  badge: string;
  lastActiveDate?: Date;
  lastResetDate?: Date;
  avatarType?: 'initials' | 'random' | 'custom';
  avatarGender?: 'male' | 'female';
  customAvatarUrl?: string | null;
  randomAvatarSeed?: number;
  lastGoalAwardDate?: Date;
  lastPenaltyDate?: Date;
  createdAt: Date;
  friendRequestPolicy?: 'anyone' | 'auto_mutual' | 'disabled';
  searchVisibility?: 'public' | 'hidden';
  notificationPreferences?: {
    friendRequests?: boolean;
    activityVisibility?: 'friends' | 'private';
  };
  xpVisibility?: 'public' | 'private';
  showProgressGraphs?: boolean;
  streakReminders?: boolean;
  otpCodeHash?: string;
  otpExpiresAt?: Date;
  otpSession?: string;
  otpVerifiedAt?: Date;
  lastSolveAt?: Date;
  solveComboCount?: number;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  handle: {
    type: String,
    required: false,
    unique: true,
    trim: true,
    lowercase: true,
    minlength: 4,
    maxlength: 48
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    trim: true
  },
  displayName: {
    type: String,
    trim: true
  },
  profileImage: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 512
  },
  college: {
    type: String,
    trim: true,
    maxlength: 120
  },
  profileVisibility: {
    type: String,
    enum: ['public', 'friends'],
    default: 'public'
  },
  hideFromLeaderboard: {
    type: Boolean,
    default: false
  },
  friendRequestPolicy: {
    type: String,
    enum: ['anyone', 'auto_mutual', 'disabled'],
    default: 'anyone',
  },
  searchVisibility: {
    type: String,
    enum: ['public', 'hidden'],
    default: 'public',
  },
  notificationPreferences: {
    friendRequests: {
      type: Boolean,
      default: true,
    },
    activityVisibility: {
      type: String,
      enum: ['friends', 'private'],
      default: 'friends',
    },
  },
  badgesEarned: [{
    type: String,
    trim: true
  }],
  bookmarkedAnswerIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Answer'
  }],
  leetcodeUsername: {
    type: String,
    trim: true
  },
  codeforcesUsername: {
    type: String,
    trim: true
  },
  streak: {
    type: Number,
    default: 0
  },
  maxStreak: {
    type: Number,
    default: 0
  },
  streakGoal: {
    type: Number,
    default: 7
  },
  dailyGoal: {
    type: Number,
    default: 3
  },
  dailyProgress: {
    type: Number,
    default: 0
  },
  lastActiveDate: {
    type: Date
  },
  lastResetDate: {
    type: Date
  },
  avatarType: {
    type: String,
    enum: ['initials', 'random', 'custom'],
    default: 'initials'
  },
  avatarGender: {
    type: String,
    enum: ['male', 'female'],
    default: 'male'
  },
  customAvatarUrl: {
    type: String,
    trim: true
  },
  randomAvatarSeed: {
    type: Number
  },
  xp: {
    type: Number,
    default: 0
  },
  badge: {
    type: String,
    default: 'Novice',
    trim: true
  },
  lastSolveAt: {
    type: Date
  },
  solveComboCount: {
    type: Number,
    default: 0
  },
  lastGoalAwardDate: {
    type: Date
  },
  lastPenaltyDate: {
    type: Date
  },
  xpVisibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public',
  },
  showProgressGraphs: {
    type: Boolean,
    default: true,
  },
  streakReminders: {
    type: Boolean,
    default: true,
  },
  otpCodeHash: {
    type: String,
    select: false
  },
  otpExpiresAt: {
    type: Date,
    select: false
  },
  otpSession: {
    type: String,
    select: false
  },
  otpVerifiedAt: {
    type: Date,
    select: false
  }
}, {
  timestamps: true
});

UserSchema.index({ handle: 1 }, { unique: true, sparse: true });
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ displayName: 1 });
UserSchema.index({ name: 1 });

export function sanitizeHandle(rawHandle: string): string {
  const trimmed = rawHandle.trim();
  const withoutAt = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
  const normalized = withoutAt
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  const base = normalized || 'coder';
  return `@${base.slice(0, 30)}`;
}

async function generateUniqueHandle(
  user: mongoose.HydratedDocument<IUser>,
  baseUsername: string
): Promise<string> {
  const model = user.constructor as mongoose.Model<IUser>;
  const base = sanitizeHandle(baseUsername).slice(1) || 'coder';

  for (let attempt = 0; attempt < 6; attempt++) {
    const suffix = randomInt(1000, 9999);
    const candidate = `@${(base + suffix).slice(0, 30)}`;
    const existing = await model.exists({ handle: candidate });
    if (!existing) {
      return candidate;
    }
  }

  const fallback = `@${base}${Date.now().toString().slice(-4)}`.slice(0, 30);
  return fallback;
}

UserSchema.pre('save', async function ensureHandle(next) {
  try {
    if (this.isModified('handle') && this.handle) {
      const sanitized = sanitizeHandle(this.handle);
      const model = this.constructor as mongoose.Model<IUser>;
      const conflict = await model.exists({
        handle: sanitized,
        _id: { $ne: this._id },
      });

      if (conflict) {
        return next(new Error('Handle already taken.'));
      }

      this.handle = sanitized;
      return next();
    }

    if (this.handle) {
      this.handle = sanitizeHandle(this.handle);
      return next();
    }

    const generated = await generateUniqueHandle(this, this.username);
    this.handle = generated;
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);



