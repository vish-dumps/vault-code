import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth, type LoginResult } from '@/contexts/AuthContext';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';

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
  const [otpSession, setOtpSession] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<string | null>(null);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
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
      setDebugOtp(result.debugOtp ?? null);
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
    setDebugOtp(null);
  };

  return (
    <div className="w-full rounded-3xl border border-white/10 bg-[#0b1a2d]/80 p-8 shadow-[0_40px_120px_rgba(56,189,248,0.35)] backdrop-blur-2xl">
      <div className="flex items-center justify-between text-sm font-semibold uppercase tracking-[0.35em] text-slate-300/70">
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#f97316]" />
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
                className="h-12 rounded-2xl border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500 focus:border-[#38bdf8] focus:ring-[#38bdf8]/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading || isResending}
                className="h-12 rounded-2xl border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500 focus:border-[#38bdf8] focus:ring-[#38bdf8]/50"
              />
            </div>

            <Button
              type="submit"
              className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#38bdf8] via-[#60a5fa] to-[#f97316] text-base font-semibold shadow-[0_20px_60px_rgba(56,189,248,0.45)] transition hover:scale-[1.01] hover:shadow-[0_28px_80px_rgba(249,115,22,0.45)]"
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
                <ShieldCheck className="h-4 w-4 text-[#38bdf8]" />
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
                      className="h-14 w-14 rounded-2xl border-white/10 bg-white/5 text-xl font-semibold text-slate-100 shadow-[0_12px_40px_rgba(56,189,248,0.20)] backdrop-blur-sm"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              <p className="text-xs text-slate-500">
                Enter the 6-digit code sent to <span className="text-slate-200">{email}</span>
              </p>
            </div>

            {debugOtp && import.meta.env.DEV && (
              <div className="rounded-xl border border-dashed border-[#38bdf8]/40 bg-[#38bdf8]/10 p-3 text-center text-xs text-[#38bdf8]/80">
                Dev mode preview: <span className="font-semibold tracking-[0.4em]">{debugOtp}</span>
              </div>
            )}

            <Button
              type="submit"
              className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#f97316] via-[#fb923c] to-[#38bdf8] text-base font-semibold shadow-[0_20px_60px_rgba(249,115,22,0.45)] transition hover:scale-[1.01] hover:shadow-[0_28px_80px_rgba(56,189,248,0.45)]"
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
                className="text-[#38bdf8] transition hover:text-[#f97316]"
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
          className="font-semibold text-[#38bdf8] transition hover:text-[#f97316]"
          disabled={isLoading || isResending}
        >
          Sign up
        </button>
      </div>
    </div>
  );
}


