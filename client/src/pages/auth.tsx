import { useState, type CSSProperties, type MouseEvent } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });

  const handleSuccess = () => {
    // Redirect will be handled by the router
    window.location.href = '/';
  };

  const handleHeroPointer = (event: MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    setGlowPos({ x, y });
  };

  const handleHeroLeave = () => {
    setGlowPos({ x: 50, y: 50 });
  };

  const heroGlowStyle = {
    '--glow-x': `${glowPos.x}%`,
    '--glow-y': `${glowPos.y}%`,
  } as CSSProperties;

  const heroImage = isLogin ? '/codevault%20login%20image.png' : '/codevault%20signup%20image.png';
  const radialTop = isLogin ? 'rgba(56,189,248,0.18)' : 'rgba(236,72,153,0.22)';
  const radialBottom = isLogin ? 'rgba(249,115,22,0.18)' : 'rgba(168,85,247,0.25)';
  const topBlob = isLogin ? '#38bdf8' : '#ec4899';
  const bottomBlob = isLogin ? '#f97316' : '#8b5cf6';
  const badgeBg = isLogin ? '#0b172c' : '#2a0f2f';
  const badgeText = isLogin ? '#fbbf24' : '#f472b6';
  const formGradientFrom = isLogin ? '#38bdf8' : '#ec4899';
  const formGradientTo = isLogin ? '#f97316' : '#8b5cf6';
  const heroCardShade = isLogin ? '#0b172c' : '#1f1030';
  const heroShadow = isLogin
    ? '0 30px 120px rgba(249,115,22,0.25)'
    : '0 30px 120px rgba(236,72,153,0.3)';
  const cardShadow = isLogin
    ? '0 60px 150px rgba(56,189,248,0.25)'
    : '0 60px 150px rgba(236,72,153,0.28)';
  const heroCardStyle: CSSProperties = {
    ...heroGlowStyle,
    backgroundColor: `${heroCardShade}bf`,
    boxShadow: cardShadow,
  };

  return (
    <div className="relative h-dvh overflow-hidden bg-[#070f1f] text-slate-100">
      <div
        className="pointer-events-none absolute inset-0 transition-all duration-700 ease-out"
        style={{
          background: `radial-gradient(circle at top, ${radialTop}, transparent 45%), radial-gradient(circle at bottom, ${radialBottom}, transparent 42%)`,
        }}
      />
      <div
        className="pointer-events-none absolute -top-[25%] right-[-6%] h-[60vh] w-[60vh] rounded-full blur-3xl transition-all duration-700 ease-out"
        style={{ backgroundColor: topBlob, opacity: 0.25 }}
      />
      <div
        className="pointer-events-none absolute -bottom-[25%] left-[-12%] h-[70vh] w-[70vh] rounded-full blur-3xl transition-all duration-700 ease-out"
        style={{ backgroundColor: bottomBlob, opacity: 0.22 }}
      />

      <div className="relative z-10 flex h-full flex-col lg:flex-row">
        <div
          className={`flex w-full flex-col justify-center ${
            isLogin
              ? "gap-6 px-6 py-8 sm:px-10 lg:w-[34%] lg:px-14 xl:px-16"
              : "gap-6 px-6 py-12 sm:px-12 lg:w-[40%] lg:px-16"
          }`}
        >
          {isLogin && (
            <div className="space-y-4">
              <span
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.45em] sm:text-sm transition-colors duration-700"
                style={{ backgroundColor: `${badgeBg}b3`, color: badgeText }}
              >
                Build for CODERS
              </span>
              <h1 className="text-3xl font-semibold leading-tight text-white sm:text-[2.5rem] sm:leading-tight">
                Save your journey. Master your craft. One problem at a time.
              </h1>
              <p className="max-w-md text-sm text-slate-300/80 sm:text-base">
                Log in, pick up your streak, and keep your problem-solving momentum alive.
              </p>
            </div>
          )}

          <div className={`relative ${isLogin ? "" : "mt-2"}`}>
            <div
              className="absolute -inset-4 rounded-[32px] bg-gradient-to-r blur-2xl transition-all duration-700"
              style={{
                backgroundImage: `linear-gradient(to right, ${formGradientFrom}59, transparent, ${formGradientTo}59)`,
              }}
            />
            <div className="relative">
              {isLogin ? (
                <LoginForm
                  onSuccess={handleSuccess}
                  onSwitchToRegister={() => setIsLogin(false)}
                />
              ) : (
                <RegisterForm
                  onSuccess={handleSuccess}
                  onSwitchToLogin={() => setIsLogin(true)}
                  compact
                />
              )}
            </div>
          </div>
        </div>

        <div className="relative hidden flex-1 items-center justify-center overflow-hidden lg:flex">
      <div
        className="pointer-events-none absolute inset-0 transition-all duration-700 ease-out"
            style={{
              background: `linear-gradient(135deg, ${topBlob}33, transparent, ${bottomBlob}2e)`,
            }}
          />
          <div className="relative flex h-full w-full items-center justify-center p-8">
            <div className="relative w-full max-w-3xl">
              <div
                className="absolute inset-0 translate-y-16 scale-110 rounded-[40px] blur-3xl transition-all duration-700 ease-out"
                style={{
                  background: `linear-gradient(135deg, ${formGradientFrom}40, #0d1b3240 45%, ${formGradientTo}35)`,
                }}
              />
              <div
                className="interactive-hero-card relative overflow-hidden rounded-[36px] border border-white/10 p-8 backdrop-blur-3xl transition-all duration-700 ease-out"
                onMouseMove={handleHeroPointer}
                onMouseLeave={handleHeroLeave}
                style={heroCardStyle}
              >
                <img
                  src={heroImage}
                  alt="CodeVault premium workspace"
                  className="relative z-10 w-full rounded-[28px] object-cover transition-shadow duration-700 ease-out"
                  style={{ boxShadow: heroShadow }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




