import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { User as UserModel } from './models/User';
import { generateToken, authenticateToken, AuthRequest } from './auth';
import { z } from 'zod';
import { sendOtpEmail } from './services/email';
import { XP_REWARDS, getBadgeForXp } from '@shared/gamification';

const router = Router();
const OTP_LENGTH = parseInt(process.env.OTP_LENGTH || '6', 10);
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);
const OTP_EXPIRY_MS = OTP_EXPIRY_MINUTES * 60 * 1000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function generateOtpCode(length = OTP_LENGTH): string {
  const max = 10 ** length;
  const code = crypto.randomInt(0, max).toString().padStart(length, '0');
  return code;
}

function hashOtpCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function createOtpSessionToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

// Validation schemas
const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  avatarGender: z.enum(['male', 'female']),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(OTP_LENGTH),
  otpSession: z.string().min(16),
});

const resendRegisterOtpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Register endpoint
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, name, avatarGender } = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await UserModel.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'User already exists',
        field: existingUser.email === email ? 'email' : 'username'
      });
    }

    // Create new user
    const randomAvatarSeed = Date.now();
    const user = new UserModel({
      username,
      email,
      password,
      name,
      avatarType: 'random',
      avatarGender,
      randomAvatarSeed,
    });

    await user.save();

    const otpCode = generateOtpCode();
    const otpSession = createOtpSessionToken();
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    user.set({
      otpCodeHash: hashOtpCode(otpCode),
      otpSession,
      otpExpiresAt,
      otpVerifiedAt: undefined,
    });
    await user.save();

    await sendOtpEmail({
      to: user.email,
      code: otpCode,
      expiresAt: otpExpiresAt,
    });

    if (!IS_PRODUCTION) {
      console.info(
        `[Auth] Signup OTP for ${user.email}: ${otpCode} (expires in ${OTP_EXPIRY_MINUTES} minutes)`
      );
    }

    res.json({
      message: 'OTP verification required',
      otpRequired: true,
      otpSession,
      expiresIn: OTP_EXPIRY_MS,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Registration OTP verification endpoint
router.post('/register/verify', async (req: Request, res: Response) => {
  try {
    const { email, otp, otpSession } = verifyOtpSchema.parse(req.body);
    const user = await UserModel.findOne({ email }).select(
      '+otpCodeHash +otpExpiresAt +otpSession'
    );

    if (!user || !user.otpCodeHash || !user.otpExpiresAt || !user.otpSession) {
      return res.status(400).json({ error: 'Verification code not found' });
    }

    if (user.otpSession !== otpSession) {
      return res.status(400).json({ error: 'Invalid verification session' });
    }

    if (user.otpExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ error: 'Verification code expired' });
    }

    const providedHash = hashOtpCode(otp);
    if (providedHash !== user.otpCodeHash) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    const newXp = Math.max(0, (user.xp ?? 0) + XP_REWARDS.registrationBonus);
    const badgeTier = getBadgeForXp(newXp);

    user.set({
      otpCodeHash: undefined,
      otpExpiresAt: undefined,
      otpSession: undefined,
      otpVerifiedAt: new Date(),
      xp: newXp,
      badge: badgeTier.name,
    });
    await user.save();

    const token = generateToken({
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
    });

    res.json({
      message: 'Registration complete',
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        name: user.name,
        leetcodeUsername: user.leetcodeUsername,
        codeforcesUsername: user.codeforcesUsername,
        streak: user.streak,
        maxStreak: user.maxStreak,
        streakGoal: user.streakGoal,
        dailyGoal: user.dailyGoal,
        dailyProgress: user.dailyProgress,
        profileImage: user.profileImage,
        avatarType: user.avatarType,
        avatarGender: user.avatarGender,
        customAvatarUrl: user.customAvatarUrl,
        randomAvatarSeed: user.randomAvatarSeed,
        lastActiveDate: user.lastActiveDate,
        lastResetDate: user.lastResetDate,
        createdAt: user.createdAt,
        xp: user.xp ?? 0,
        badge: user.badge ?? badgeTier.name,
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    console.error('Registration verification error:', error);
    res.status(500).json({ error: 'Failed to verify registration' });
  }
});

router.post('/register/resend', async (req: Request, res: Response) => {
  try {
    const { email, password } = resendRegisterOtpSchema.parse(req.body);
    const user = await UserModel.findOne({ email }).select(
      '+otpCodeHash +otpExpiresAt +otpSession'
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.otpVerifiedAt) {
      return res.status(400).json({ error: 'Account already verified' });
    }

    const otpCode = generateOtpCode();
    const otpSession = createOtpSessionToken();
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    user.set({
      otpCodeHash: hashOtpCode(otpCode),
      otpSession,
      otpExpiresAt,
      otpVerifiedAt: undefined,
    });
    await user.save();

    await sendOtpEmail({
      to: user.email,
      code: otpCode,
      expiresAt: otpExpiresAt,
    });

    if (!IS_PRODUCTION) {
      console.info(
        `[Auth] Signup OTP resend for ${user.email}: ${otpCode} (expires in ${OTP_EXPIRY_MINUTES} minutes)`
      );
    }

    res.json({
      message: 'Verification code resent',
      otpSession,
      expiresIn: OTP_EXPIRY_MS,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }
    console.error('Registration resend error:', error);
    res.status(500).json({ error: 'Failed to resend verification code' });
  }
});

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user by email
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const otpCode = generateOtpCode();
    const otpSession = createOtpSessionToken();
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    user.set({
      otpCodeHash: hashOtpCode(otpCode),
      otpExpiresAt,
      otpSession,
      otpVerifiedAt: undefined,
    });
    await user.save();

    await sendOtpEmail({
      to: user.email,
      code: otpCode,
      expiresAt: otpExpiresAt,
    });

    if (!IS_PRODUCTION) {
      console.info(
        `[Auth] OTP for ${user.email}: ${otpCode} (expires in ${OTP_EXPIRY_MINUTES} minutes)`
      );
    }

    res.json({
      message: 'OTP verification required',
      otpRequired: true,
      otpSession,
      expiresIn: OTP_EXPIRY_MS,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// OTP verification endpoint
router.post('/login/verify', async (req: Request, res: Response) => {
  try {
    const { email, otp, otpSession } = verifyOtpSchema.parse(req.body);
    const user = await UserModel.findOne({ email }).select(
      '+otpCodeHash +otpExpiresAt +otpSession'
    );

    if (!user || !user.otpCodeHash || !user.otpExpiresAt || !user.otpSession) {
      return res.status(400).json({ error: 'Verification code not found' });
    }

    if (user.otpSession !== otpSession) {
      return res.status(400).json({ error: 'Invalid verification session' });
    }

    if (user.otpExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ error: 'Verification code expired' });
    }

    const providedHash = hashOtpCode(otp);
    if (providedHash !== user.otpCodeHash) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    user.set({
      otpCodeHash: undefined,
      otpExpiresAt: undefined,
      otpSession: undefined,
      otpVerifiedAt: new Date(),
    });
    await user.save();

    const token = generateToken({
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        name: user.name,
        leetcodeUsername: user.leetcodeUsername,
        codeforcesUsername: user.codeforcesUsername,
        streak: user.streak,
        maxStreak: user.maxStreak,
        streakGoal: user.streakGoal,
        dailyGoal: user.dailyGoal,
        dailyProgress: user.dailyProgress,
        profileImage: user.profileImage,
        avatarType: user.avatarType,
        avatarGender: user.avatarGender,
        customAvatarUrl: user.customAvatarUrl,
        randomAvatarSeed: user.randomAvatarSeed,
        lastActiveDate: user.lastActiveDate,
        lastResetDate: user.lastResetDate,
        createdAt: user.createdAt,
        xp: user.xp ?? 0,
        badge: user.badge ?? getBadgeForXp(user.xp ?? 0).name,
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Failed to verify code' });
  }
});

// Verify token endpoint
router.get('/verify', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await UserModel.findById(req.user?.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        name: user.name,
        leetcodeUsername: user.leetcodeUsername,
        codeforcesUsername: user.codeforcesUsername,
        streak: user.streak,
        maxStreak: user.maxStreak,
        streakGoal: user.streakGoal,
        dailyGoal: user.dailyGoal,
        dailyProgress: user.dailyProgress,
        profileImage: user.profileImage,
        avatarType: user.avatarType,
        avatarGender: user.avatarGender,
        customAvatarUrl: user.customAvatarUrl,
        randomAvatarSeed: user.randomAvatarSeed,
        lastActiveDate: user.lastActiveDate,
        lastResetDate: user.lastResetDate,
        createdAt: user.createdAt,
        xp: user.xp ?? 0,
        badge: user.badge ?? getBadgeForXp(user.xp ?? 0).name,
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Failed to verify token' });
  }
});

export default router;


