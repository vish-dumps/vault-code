import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: string;
  username: string;
  email: string;
  password: string;
  name?: string;
  profileImage?: string;
  leetcodeUsername?: string;
  codeforcesUsername?: string;
  streak: number;
  maxStreak?: number;
  streakGoal?: number;
  dailyGoal?: number;
  dailyProgress?: number;
  lastActiveDate?: Date;
  avatarType?: 'initials' | 'random' | 'custom';
  avatarGender?: 'male' | 'female';
  customAvatarUrl?: string;
  randomAvatarSeed?: number;
  createdAt: Date;
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
  profileImage: {
    type: String,
    trim: true
  },
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
  }
}, {
  timestamps: true
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

