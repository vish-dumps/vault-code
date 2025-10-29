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

  const theme = isLogin
    ? {
        heroImage: '/codevault%20login%20image.png',
        radialTop: 'rgba(10,147,150,0.22)',
        radialBottom: 'rgba(148,210,189,0.24)',
        topBlob: '#005f73',
        bottomBlob: '#94d2bd',
        badgeBg: '#003945',
        badgeText: '#e9d8a6',
        formGradient: ['#0a9396', '#94d2bd'] as const,
        heroCardSurface: 'rgba(0, 26, 33, 0.88)',
        heroShadow: '0 30px 120px rgba(148,210,189,0.32)',
        heroHoverShadow: '0 80px 160px rgba(148,210,189,0.35)',
        cardShadow: '0 50px 140px rgba(0,18,25,0.45)',
        glowPrimary: 'rgba(148,210,189,0.35)',
        glowSecondary: 'rgba(10,147,150,0.28)',
        overlayBg: 'rgba(0, 41, 49, 0.88)',
        overlayBorder: 'rgba(148,210,189,0.35)',
        overlayShadow: '0 24px 60px rgba(148,210,189,0.25)',
        overlayAccent: '#94d2bd',
      }
    : {
        heroImage: '/codevault%20signup%20image.png',
        radialTop: 'rgba(238,155,0,0.26)',
        radialBottom: 'rgba(155,34,38,0.30)',
        topBlob: '#ee9b00',
        bottomBlob: '#bb3e03',
        badgeBg: '#3b1411',
        badgeText: '#e9d8a6',
        formGradient: ['#ee9b00', '#ca6702'] as const,
        heroCardSurface: 'rgba(58, 12, 8, 0.92)',
        heroShadow: '0 30px 120px rgba(238,155,0,0.35)',
        heroHoverShadow: '0 80px 160px rgba(238,155,0,0.32)',
        cardShadow: '0 50px 140px rgba(155,34,38,0.45)',
        glowPrimary: 'rgba(238,155,0,0.35)',
        glowSecondary: 'rgba(171,32,18,0.30)',
        overlayBg: 'rgba(59, 12, 8, 0.9)',
        overlayBorder: 'rgba(238,155,0,0.35)',
        overlayShadow: '0 24px 60px rgba(238,155,0,0.28)',
        overlayAccent: '#ee9b00',
      };
  const heroCardStyle: CSSProperties = {
    ...heroGlowStyle,
    backgroundColor: theme.heroCardSurface,
    boxShadow: theme.cardShadow,
  };
  const heroCardVariables: Record<string, string> = {
    '--hero-primary': theme.formGradient[0],
    '--hero-secondary': theme.formGradient[1],
    '--hero-glow-primary': theme.glowPrimary,
    '--hero-glow-secondary': theme.glowSecondary,
    '--hero-hover-shadow': theme.heroHoverShadow,
  };

  return (
    <div className="relative h-dvh overflow-hidden bg-[#070f1f] text-slate-100">
      <div
        className="pointer-events-none absolute inset-0 transition-all duration-700 ease-out"
        style={{
          background: `radial-gradient(circle at top, ${theme.radialTop}, transparent 45%), radial-gradient(circle at bottom, ${theme.radialBottom}, transparent 42%)`,
        }}
      />
      <div
        className="pointer-events-none absolute -top-[25%] right-[-6%] h-[60vh] w-[60vh] rounded-full blur-3xl transition-all duration-700 ease-out"
        style={{ backgroundColor: theme.topBlob, opacity: 0.25 }}
      />
      <div
        className="pointer-events-none absolute -bottom-[25%] left-[-12%] h-[70vh] w-[70vh] rounded-full blur-3xl transition-all duration-700 ease-out"
        style={{ backgroundColor: theme.bottomBlob, opacity: 0.22 }}
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
                style={{ backgroundColor: `${theme.badgeBg}cc`, color: theme.badgeText, borderColor: `${theme.badgeText}33` }}
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
                backgroundImage: `linear-gradient(to right, ${`${theme.formGradient[0]}59`}, transparent, ${`${theme.formGradient[1]}59`})`,
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
              background: `linear-gradient(135deg, ${theme.topBlob}2e, transparent, ${theme.bottomBlob}2b)`,
            }}
          />
          <div className="relative flex h-full w-full items-center justify-center p-8">
            <div className="relative w-full max-w-3xl">
              <div
                className="absolute inset-0 translate-y-16 scale-110 rounded-[40px] blur-3xl transition-all duration-700 ease-out"
                style={{
                  background: `linear-gradient(135deg, ${theme.formGradient[0]}3a, rgba(0,18,25,0.55) 45%, ${theme.formGradient[1]}33)`,
                }}
              />
              <div
                className="interactive-hero-card relative overflow-hidden rounded-[36px] border border-white/10 p-8 backdrop-blur-3xl transition-all duration-700 ease-out"
                onMouseMove={handleHeroPointer}
                onMouseLeave={handleHeroLeave}
                style={{ ...heroCardStyle, ...heroCardVariables } as CSSProperties}
              >
                <img
                  src={theme.heroImage}
                  alt="CodeVault premium workspace"
                  className="relative z-10 w-full rounded-[28px] object-cover transition-shadow duration-700 ease-out"
                  style={{ boxShadow: theme.heroShadow }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




