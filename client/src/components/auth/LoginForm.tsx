import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth, type LoginResult } from '@/contexts/AuthContext';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ArrowLeft, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [stage, setStage] = useState<'credentials' | 'otp'>('credentials');
  const [showPassword, setShowPassword] = useState(false);
  const [otpSession, setOtpSession] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<string | null>(null);
  const { login, verifyOtp } = useAuth();

  useEffect(() => {
    if (!expiresAt) {
      setCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const diff = expiresAt - Date.now();
      if (diff <= 0) {
        setCountdown('00:00');
        return;
      }
      const minutes = Math.floor(diff / 60000)
        .toString()
        .padStart(2, '0');
      const seconds = Math.floor((diff % 60000) / 1000)
        .toString()
        .padStart(2, '0');
      setCountdown(`${minutes}:${seconds}`);
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  const handleLoginResult = (result: LoginResult) => {
    if (result.status === 'otp_required') {
      setStage('otp');
      setOtpSession(result.otpSession);
      setOtpValue('');
      setExpiresAt(Date.now() + result.expiresIn);
    } else {
      onSuccess?.();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stage === 'otp') {
      await handleOtpSubmit();
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
      handleLoginResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (!otpSession) {
      setError('Verification session has expired. Please request a new code.');
      setStage('credentials');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await verifyOtp(email, otpValue, otpSession);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setIsResending(true);
    try {
      const result = await login(email, password);
      handleLoginResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToCredentials = () => {
    setStage('credentials');
    setOtpSession(null);
    setOtpValue('');
    setExpiresAt(null);
  };

  return (
    <div className="w-full rounded-3xl border border-white/10 bg-[#001d26]/90 p-8 shadow-[0_40px_120px_rgba(0,18,25,0.55)] backdrop-blur-2xl transition-colors duration-700">
      <div className="flex items-center justify-between text-sm font-semibold uppercase tracking-[0.35em] text-[#94d2bd]/80">
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ee9b00]" />
          {stage === 'credentials' ? 'Secure Login' : 'Verify Access'}
        </span>
        <span>{stage === 'credentials' ? 'Step 01' : 'Step 02'}</span>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {error && (
          <Alert variant="destructive" className="bg-rose-500/10 text-rose-100">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {stage === 'credentials' ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || isResending}
                className="h-12 rounded-2xl border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500 focus:border-[#0a9396] focus:ring-[#0a9396]/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading || isResending}
                  className="h-12 rounded-2xl border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500 pr-12 focus:border-[#0a9396] focus:ring-[#0a9396]/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={isLoading || isResending}
                  className="absolute inset-y-0 right-4 flex items-center text-slate-400 transition hover:text-slate-100 disabled:cursor-not-allowed disabled:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#0a9396] via-[#94d2bd] to-[#e9d8a6] text-base font-semibold text-[#001219] shadow-[0_20px_60px_rgba(148,210,189,0.35)] transition hover:scale-[1.01] hover:shadow-[0_28px_80px_rgba(238,155,0,0.35)]"
              disabled={isLoading || isResending}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm text-slate-400">
              <button
                type="button"
                onClick={handleBackToCredentials}
                className="inline-flex items-center gap-1 text-slate-400 transition hover:text-slate-200"
                disabled={isLoading}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                <ShieldCheck className="h-4 w-4 text-[#ee9b00]" />
                <span className="text-xs uppercase tracking-[0.25em] text-slate-300">
                  2FA Active
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-slate-300">One-Time Passcode</Label>
              <InputOTP
                maxLength={6}
                value={otpValue}
                onChange={setOtpValue}
                containerClassName="justify-between"
                disabled={isLoading}
              >
                <InputOTPGroup className="flex w-full justify-between">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className="h-14 w-14 rounded-2xl border-white/10 bg-white/5 text-xl font-semibold text-slate-100 shadow-[0_12px_40px_rgba(148,210,189,0.20)] backdrop-blur-sm"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              <p className="text-xs text-slate-500">
                Enter the 6-digit code sent to <span className="text-slate-200">{email}</span>
              </p>
            </div>

            <Button
              type="submit"
              className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#ee9b00] via-[#ca6702] to-[#0a9396] text-base font-semibold text-[#001219] shadow-[0_20px_60px_rgba(238,155,0,0.4)] transition hover:scale-[1.01] hover:shadow-[0_28px_80px_rgba(148,210,189,0.35)]"
              disabled={isLoading || otpValue.length !== 6}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify & Enter
            </Button>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                {countdown && countdown !== '00:00'
                  ? `Code expires in ${countdown}`
                  : 'Code expired'}
              </span>
              <button
                type="button"
                onClick={handleResendCode}
                className="text-[#ee9b00] transition hover:text-[#0a9396]"
                disabled={isResending || isLoading}
              >
                {isResending ? 'Sending...' : 'Resend code'}
              </button>
            </div>
          </>
        )}
      </form>

      <div className="mt-8 text-center text-sm text-slate-400">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-semibold text-[#0a9396] transition hover:text-[#ee9b00]"
          disabled={isLoading || isResending}
        >
          Sign up
        </button>
      </div>
    </div>
  );
}



