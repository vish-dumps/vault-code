import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
  compact?: boolean;
}

const COOL_PALETTE = {
  containerBg: 'rgba(0,29,38,0.9)',
  containerShadow: '0 40px 140px rgba(148,210,189,0.32)',
  accentBullet: '#0a9396',
  focusClass: 'focus:border-[#0a9396] focus:ring-[#0a9396]/50',
  gradient: 'from-[#0a9396] via-[#94d2bd] to-[#e9d8a6]',
  buttonHoverShadow: 'hover:shadow-[0_32px_90px_rgba(148,210,189,0.35)]',
  buttonShadow: '0 24px 70px rgba(148,210,189,0.35)',
  selectBg: 'bg-[#001f29]',
  headerTextClass: 'text-[#94d2bd]/80',
  linkClass: 'text-[#0a9396] hover:text-[#ee9b00]',
  imageOverlay: 'from-[#0a9396]/15 via-transparent to-[#94d2bd]/28',
};

const WARM_PALETTE = {
  containerBg: 'rgba(59,12,8,0.9)',
  containerShadow: '0 40px 140px rgba(238,155,0,0.35)',
  accentBullet: '#ee9b00',
  focusClass: 'focus:border-[#ee9b00] focus:ring-[#ee9b00]/50',
  gradient: 'from-[#ee9b00] via-[#ca6702] to-[#9b2226]',
  buttonHoverShadow: 'hover:shadow-[0_32px_90px_rgba(238,155,0,0.38)]',
  buttonShadow: '0 24px 70px rgba(238,155,0,0.35)',
  selectBg: 'bg-[#3b1411]',
  headerTextClass: 'text-[#e9d8a6]/80',
  linkClass: 'text-[#ee9b00] hover:text-[#94d2bd]',
  imageOverlay: 'from-[#ee9b00]/22 via-transparent to-[#bb3e03]/30',
};

export function RegisterForm({ onSuccess, onSwitchToLogin, compact = false }: RegisterFormProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [avatarGender, setAvatarGender] = useState<'male' | 'female'>('male');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();

  const palette = compact ? WARM_PALETTE : COOL_PALETTE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      await register(username, email, password, name || undefined, avatarGender);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="w-full overflow-hidden rounded-3xl border border-white/10 p-8 backdrop-blur-2xl transition-all duration-700 ease-out"
      style={{ backgroundColor: palette.containerBg, boxShadow: palette.containerShadow }}
    >
      {!compact && (
        <>
          <div className="relative h-40 w-full overflow-hidden rounded-[26px] border border-white/5">
            <img
              src="/codevault%20signup%20image.png"
              alt="Welcome to CodeVault"
              className="h-full w-full object-cover"
            />
            <div className={`absolute inset-0 bg-gradient-to-br ${palette.imageOverlay}`} />
            <div className="absolute bottom-4 left-4 text-xs font-semibold uppercase tracking-[0.4em] text-white/80">
              Create Account
            </div>
          </div>

          <div className={`mt-6 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.35em] ${palette.headerTextClass}`}>
            <span className="inline-flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: palette.accentBullet }}
              />
              Join CodeVault
            </span>
            <span className="text-white/70">Step 01</span>
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className={`${compact ? 'mt-2' : 'mt-6'} space-y-6`}>
        {error && (
          <Alert variant="destructive" className="bg-rose-500/10 text-rose-100">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="username" className="text-slate-200">
            Username
          </Label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={30}
            disabled={isLoading}
            className={`h-12 rounded-2xl border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500 ${palette.focusClass}`}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-200">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className={`h-12 rounded-2xl border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500 ${palette.focusClass}`}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="name" className="text-slate-200">
            Full Name (Optional)
          </Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            className={`h-12 rounded-2xl border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500 ${palette.focusClass}`}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="avatar-gender" className="text-slate-200">
            Select Gender
          </Label>
          <Select
            value={avatarGender}
            onValueChange={(value) => setAvatarGender(value as 'male' | 'female')}
          >
            <SelectTrigger id="avatar-gender" className={`h-12 rounded-2xl border-white/10 bg-white/5 text-slate-100 ${palette.focusClass}`}>
              <SelectValue placeholder="Choose your avatar base" />
            </SelectTrigger>
            <SelectContent className={`${palette.selectBg} text-slate-100`}>
              <SelectItem value="male">Masculine • Adventurous</SelectItem>
              <SelectItem value="female">Feminine • Elegant</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-400">
            We use this to craft a personalised CodeVault avatar the moment you join.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password" className="text-slate-200">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={isLoading}
              className={`h-12 rounded-2xl border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500 pr-12 ${palette.focusClass}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={isLoading}
              className="absolute inset-y-0 right-4 flex items-center text-slate-400 transition hover:text-slate-100 disabled:cursor-not-allowed disabled:text-slate-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-slate-200">
            Confirm Password
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              className={`h-12 rounded-2xl border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500 pr-12 ${palette.focusClass}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              disabled={isLoading}
              className="absolute inset-y-0 right-4 flex items-center text-slate-400 transition hover:text-slate-100 disabled:cursor-not-allowed disabled:text-slate-600"
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        
        <Button
          type="submit"
          className={`h-12 w-full rounded-2xl bg-gradient-to-r ${palette.gradient} text-base font-semibold transition hover:scale-[1.01] ${palette.buttonHoverShadow}`}
          disabled={isLoading}
          style={{ boxShadow: palette.buttonShadow }}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Account
        </Button>
      </form>
      
      <div className="mt-8 text-center text-sm text-slate-300">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className={`font-semibold transition ${palette.linkClass}`}
          disabled={isLoading}
        >
          Sign in
        </button>
      </div>
    </div>
  );
}
