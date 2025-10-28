import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
  compact?: boolean;
}

export function RegisterForm({ onSuccess, onSwitchToLogin, compact = false }: RegisterFormProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [avatarGender, setAvatarGender] = useState<'male' | 'female'>('male');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

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

  const containerBg = compact ? '#221132cc' : '#0b1a2dcc';
  const containerShadow = compact
    ? '0 40px 140px rgba(236,72,153,0.32)'
    : '0 40px 140px rgba(56,189,248,0.28)';
  const buttonGradient = compact
    ? 'from-[#f472b6] via-[#c084fc] to-[#f97316]'
    : 'from-[#38bdf8] via-[#60a5fa] to-[#f97316]';
  const accentBullet = compact ? '#f472b6' : '#f97316';
  const buttonHoverShadow = compact
    ? 'hover:shadow-[0_32px_90px_rgba(236,72,153,0.42)]'
    : 'hover:shadow-[0_32px_90px_rgba(249,115,22,0.4)]';
  const buttonBoxShadow = compact
    ? '0 24px 70px rgba(236,72,153,0.35)'
    : '0 24px 70px rgba(56,189,248,0.4)';

  return (
    <div
      className="w-full overflow-hidden rounded-3xl border border-white/10 p-8 backdrop-blur-2xl transition-all duration-700 ease-out"
      style={{ backgroundColor: containerBg, boxShadow: containerShadow }}
    >
      {!compact && (
        <>
          <div className="relative h-40 w-full overflow-hidden rounded-[26px] border border-white/5">
            <img
              src="/codevault%20signup%20image.png"
              alt="Welcome to CodeVault"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#0b1a2d]/10 via-transparent to-[#f97316]/35" />
            <div className="absolute bottom-4 left-4 text-xs font-semibold uppercase tracking-[0.4em] text-white/80">
              Create Account
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.35em] text-[#38bdf8]/70">
            <span className="inline-flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: accentBullet }}
              />
              Join CodeVault
            </span>
            <span className="text-white/70">Step 01</span>
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className={`${compact ? "mt-2" : "mt-6"} space-y-6`}>
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
            className="h-12 rounded-2xl border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500 focus:border-[#38bdf8] focus:ring-[#38bdf8]/50"
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
            className="h-12 rounded-2xl border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500 focus:border-[#38bdf8] focus:ring-[#38bdf8]/50"
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
            className="h-12 rounded-2xl border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500 focus:border-[#38bdf8] focus:ring-[#38bdf8]/50"
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
            <SelectTrigger id="avatar-gender" className="h-12 rounded-2xl border-white/10 bg-white/5 text-slate-100 focus:border-[#38bdf8] focus:ring-[#38bdf8]/50">
              <SelectValue placeholder="Choose your avatar base" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 text-slate-100">
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
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            disabled={isLoading}
            className="h-12 rounded-2xl border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500 focus:border-[#38bdf8] focus:ring-[#38bdf8]/50"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-slate-200">
            Confirm Password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
            className="h-12 rounded-2xl border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500 focus:border-[#38bdf8] focus:ring-[#38bdf8]/50"
          />
        </div>
        
        <Button
          type="submit"
          className={`h-12 w-full rounded-2xl bg-gradient-to-r ${buttonGradient} text-base font-semibold transition hover:scale-[1.01] ${buttonHoverShadow}`}
          disabled={isLoading}
          style={{ boxShadow: buttonBoxShadow }}
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
          className="font-semibold text-[#38bdf8] transition hover:text-[#f97316]"
          disabled={isLoading}
        >
          Sign in
        </button>
      </div>
    </div>
  );
}


