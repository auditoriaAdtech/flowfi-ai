'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  LayoutDashboard,
  BrainCircuit,
  Bomb,
  ScanLine,
  Star,
  TrendingUp,
  UserPlus,
  Link2,
  Sparkles,
  ChevronDown,
  Check,
  Menu,
  X,
  ArrowRight,
  MessageSquare,
  Bot,
  Quote,
  Mail,
  Building2,
  Zap,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Hook: fade-in on scroll via IntersectionObserver                   */
/* ------------------------------------------------------------------ */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function Section({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <section
      id={id}
      ref={ref}
      className={`transition-all duration-700 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      } ${className}`}
    >
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Landing Page                                                       */
/* ------------------------------------------------------------------ */
export default function LandingPage() {
  const t = useTranslations('landing');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAnnual, setIsAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const scrollTo = useCallback((id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  /* ---------- Navbar ---------- */
  const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
      const handleScroll = () => setScrolled(window.scrollY > 20);
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/80 shadow-lg backdrop-blur-xl dark:bg-gray-950/80'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              FlowFi AI
            </span>
          </button>

          {/* Desktop links */}
          <div className="hidden items-center gap-8 md:flex">
            <button onClick={() => scrollTo('features')} className="text-sm font-medium text-gray-600 transition hover:text-violet-600 dark:text-gray-300 dark:hover:text-violet-400">
              {t('nav.features')}
            </button>
            <button onClick={() => scrollTo('pricing')} className="text-sm font-medium text-gray-600 transition hover:text-violet-600 dark:text-gray-300 dark:hover:text-violet-400">
              {t('nav.pricing')}
            </button>
            <button onClick={() => scrollTo('faq')} className="text-sm font-medium text-gray-600 transition hover:text-violet-600 dark:text-gray-300 dark:hover:text-violet-400">
              {t('nav.faq')}
            </button>
          </div>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
              {t('nav.login')}
            </Link>
            <Link href="/register" className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:shadow-xl hover:shadow-violet-500/30 hover:brightness-110">
              {t('nav.signup')}
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-200 bg-white/95 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-950/95 md:hidden">
            <div className="flex flex-col gap-1 px-4 py-4">
              <button onClick={() => scrollTo('features')} className="rounded-lg px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                {t('nav.features')}
              </button>
              <button onClick={() => scrollTo('pricing')} className="rounded-lg px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                {t('nav.pricing')}
              </button>
              <button onClick={() => scrollTo('faq')} className="rounded-lg px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                {t('nav.faq')}
              </button>
              <hr className="my-2 border-gray-200 dark:border-gray-800" />
              <Link href="/login" className="rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                {t('nav.login')}
              </Link>
              <Link href="/register" className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white">
                {t('nav.signup')}
              </Link>
            </div>
          </div>
        )}
      </nav>
    );
  };

  /* ---------- Feature cards data ---------- */
  const features = [
    { icon: LayoutDashboard, key: 'dashboard', gradient: 'from-violet-500 to-purple-600' },
    { icon: BrainCircuit, key: 'coach', gradient: 'from-blue-500 to-cyan-500' },
    { icon: Bomb, key: 'debt', gradient: 'from-red-500 to-orange-500' },
    { icon: ScanLine, key: 'documents', gradient: 'from-emerald-500 to-teal-500' },
    { icon: Star, key: 'score', gradient: 'from-amber-500 to-yellow-500' },
    { icon: TrendingUp, key: 'investments', gradient: 'from-pink-500 to-rose-500' },
  ];

  /* ---------- How it works data ---------- */
  const steps = [
    { icon: UserPlus, key: 'step1', num: '01' },
    { icon: Link2, key: 'step2', num: '02' },
    { icon: Sparkles, key: 'step3', num: '03' },
  ];

  /* ---------- Pricing tiers ---------- */
  const tiers = ['free', 'starter', 'pro', 'premium'] as const;

  /* ---------- FAQ items ---------- */
  const faqItems = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'] as const;

  /* ---------- Testimonials ---------- */
  const testimonials = ['t1', 't2', 't3'] as const;

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Navbar />

      {/* ======== HERO ======== */}
      <div className="relative overflow-hidden pt-24 pb-20 sm:pt-32 sm:pb-28">
        {/* Animated gradient background */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-violet-400/30 to-indigo-400/30 blur-3xl dark:from-violet-600/20 dark:to-indigo-600/20 animate-pulse" />
          <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-cyan-400/20 to-blue-400/20 blur-3xl dark:from-cyan-600/10 dark:to-blue-600/10 animate-pulse [animation-delay:1s]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-gradient-to-r from-pink-400/10 to-amber-400/10 blur-3xl dark:from-pink-600/5 dark:to-amber-600/5 animate-pulse [animation-delay:2s]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-sm font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
            <Sparkles className="h-4 w-4" />
            {t('hero.badge')}
          </div>

          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
              {t('hero.title')}
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-gray-400 sm:text-xl">
            {t('hero.subtitle')}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-violet-500/25 transition hover:shadow-2xl hover:shadow-violet-500/30 hover:brightness-110"
            >
              {t('hero.cta')}
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <button
              onClick={() => scrollTo('coach-preview')}
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-300 bg-white/80 px-8 py-4 text-lg font-semibold text-gray-700 backdrop-blur transition hover:border-violet-300 hover:bg-violet-50 dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-300 dark:hover:border-violet-700 dark:hover:bg-violet-950/30"
            >
              {t('hero.ctaDemo')}
            </button>
          </div>

          {/* Mock dashboard preview */}
          <div className="relative mx-auto mt-16 max-w-5xl">
            <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-2 shadow-2xl dark:border-gray-800 dark:from-gray-900 dark:to-gray-950">
              <div className="rounded-xl bg-gray-100 dark:bg-gray-900 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <LayoutDashboard className="mx-auto h-16 w-16 text-violet-500/40" />
                  <p className="mt-3 text-sm text-gray-400">Dashboard Preview</p>
                </div>
              </div>
            </div>
            {/* Decorative glow */}
            <div className="absolute inset-0 -z-10 translate-y-4 rounded-2xl bg-gradient-to-r from-violet-600/20 to-indigo-600/20 blur-2xl" />
          </div>
        </div>
      </div>

      {/* ======== SOCIAL PROOF ======== */}
      <Section className="border-y border-gray-100 bg-gray-50/50 py-12 dark:border-gray-800/50 dark:bg-gray-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-8 text-center text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {t('socialProof.title')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-40 grayscale">
            {['TechCorp', 'FinanceHub', 'DataFlow', 'CloudBase', 'SmartPay'].map((name) => (
              <div key={name} className="flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                <span className="text-lg font-bold">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ======== FEATURES ======== */}
      <Section id="features" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
              {t('features.title')}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, key, gradient }) => (
              <div
                key={key}
                className="group rounded-2xl border border-gray-200 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/5 dark:border-gray-800 dark:bg-gray-900 dark:hover:shadow-violet-500/10"
              >
                <div className={`mb-5 inline-flex rounded-xl bg-gradient-to-br ${gradient} p-3 shadow-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-xl font-bold">
                  {t(`features.${key}.title`)}
                </h3>
                <p className="leading-relaxed text-gray-600 dark:text-gray-400">
                  {t(`features.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ======== HOW IT WORKS ======== */}
      <Section className="bg-gray-50/80 py-20 dark:bg-gray-900/50 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
              {t('howItWorks.title')}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600 dark:text-gray-400">
              {t('howItWorks.subtitle')}
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {steps.map(({ icon: Icon, key, num }) => (
              <div key={key} className="relative text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25">
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <span className="absolute top-0 right-1/4 text-6xl font-black text-violet-100 dark:text-violet-900/30 select-none">
                  {num}
                </span>
                <h3 className="mb-2 text-xl font-bold">
                  {t(`howItWorks.${key}.title`)}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t(`howItWorks.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ======== PRICING ======== */}
      <Section id="pricing" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
              {t('pricing.title')}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600 dark:text-gray-400">
              {t('pricing.subtitle')}
            </p>
          </div>

          {/* Annual / Monthly toggle */}
          <div className="mt-10 flex items-center justify-center gap-3">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              {t('pricing.monthly')}
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative h-7 w-12 rounded-full transition-colors ${
                isAnnual ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-700'
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  isAnnual ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              {t('pricing.annual')}
            </span>
            {isAnnual && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                {t('pricing.annualDiscount')}
              </span>
            )}
          </div>

          {/* Pricing cards */}
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {tiers.map((tier) => {
              const isPro = tier === 'pro';
              const price = isAnnual && tier !== 'free'
                ? t(`pricing.${tier}.priceAnnual`)
                : t(`pricing.${tier}.price`);
              const featureKeys = ['0', '1', '2', '3', '4', '5'] as const;

              return (
                <div
                  key={tier}
                  className={`relative flex flex-col rounded-2xl border p-8 transition-all duration-300 hover:-translate-y-1 ${
                    isPro
                      ? 'border-violet-500 bg-gradient-to-b from-violet-50 to-white shadow-xl shadow-violet-500/10 dark:border-violet-500 dark:from-violet-950/30 dark:to-gray-900'
                      : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'
                  }`}
                >
                  {isPro && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-1 text-xs font-semibold text-white shadow-lg">
                      {t('pricing.mostPopular')}
                    </div>
                  )}

                  <h3 className="text-lg font-bold">{t(`pricing.${tier}.name`)}</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t(`pricing.${tier}.description`)}</p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold">${price}</span>
                    <span className="text-gray-500 dark:text-gray-400">{t('pricing.perMonth')}</span>
                  </div>

                  <ul className="mt-8 flex-1 space-y-3">
                    {featureKeys.map((fIdx) => {
                      try {
                        const feature = t(`pricing.${tier}.features.${fIdx}`);
                        return (
                          <li key={fIdx} className="flex items-start gap-2 text-sm">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
                            <span>{feature}</span>
                          </li>
                        );
                      } catch {
                        return null;
                      }
                    })}
                  </ul>

                  <Link
                    href="/register"
                    className={`mt-8 block rounded-xl py-3 text-center text-sm font-semibold transition ${
                      isPro
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:brightness-110'
                        : 'border border-gray-300 text-gray-700 hover:border-violet-300 hover:bg-violet-50 dark:border-gray-700 dark:text-gray-300 dark:hover:border-violet-700 dark:hover:bg-violet-950/30'
                    }`}
                  >
                    {t('pricing.getStarted')}
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Corporate plan */}
          <div className="mt-10 rounded-2xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white p-8 text-center dark:border-gray-800 dark:from-gray-900 dark:to-gray-950 sm:flex sm:items-center sm:justify-between sm:text-left">
            <div>
              <h3 className="text-xl font-bold">{t('pricing.corporate.title')}</h3>
              <p className="mt-1 text-gray-600 dark:text-gray-400">{t('pricing.corporate.description')}</p>
            </div>
            <button className="mt-4 shrink-0 rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-violet-300 hover:bg-violet-50 dark:border-gray-700 dark:text-gray-300 dark:hover:border-violet-700 dark:hover:bg-violet-950/30 sm:mt-0">
              {t('pricing.corporate.cta')}
            </button>
          </div>
        </div>
      </Section>

      {/* ======== AI COACH PREVIEW ======== */}
      <Section id="coach-preview" className="bg-gray-50/80 py-20 dark:bg-gray-900/50 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
              {t('coachPreview.title')}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600 dark:text-gray-400">
              {t('coachPreview.subtitle')}
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b border-gray-100 bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4 dark:border-gray-800">
              <Bot className="h-6 w-6 text-white" />
              <span className="font-semibold text-white">FlowFi Coach</span>
              <span className="ml-auto inline-block h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white/30" />
            </div>
            {/* Messages */}
            <div className="space-y-4 p-6">
              {/* User message */}
              <div className="flex justify-end">
                <div className="max-w-xs rounded-2xl rounded-br-md bg-violet-600 px-4 py-3 text-sm text-white">
                  <div className="flex items-center gap-2 mb-1 opacity-70">
                    <MessageSquare className="h-3 w-3" />
                    <span className="text-xs">You</span>
                  </div>
                  {t('coachPreview.userMessage')}
                </div>
              </div>
              {/* AI response */}
              <div className="flex justify-start">
                <div className="max-w-sm rounded-2xl rounded-bl-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  <div className="flex items-center gap-2 mb-1">
                    <Bot className="h-3 w-3 text-violet-600 dark:text-violet-400" />
                    <span className="text-xs font-medium text-violet-600 dark:text-violet-400">FlowFi Coach</span>
                  </div>
                  {t('coachPreview.aiResponse')}
                </div>
              </div>
            </div>
            {/* Chat input mock */}
            <div className="border-t border-gray-100 px-6 py-4 dark:border-gray-800">
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-800">
                <MessageSquare className="h-4 w-4" />
                <span>Ask anything...</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ======== TESTIMONIALS ======== */}
      <Section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
              {t('testimonials.title')}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600 dark:text-gray-400">
              {t('testimonials.subtitle')}
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((key) => (
              <div
                key={key}
                className="rounded-2xl border border-gray-200 bg-white p-8 transition hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
              >
                <Quote className="mb-4 h-8 w-8 text-violet-400/40" />
                <p className="leading-relaxed text-gray-600 dark:text-gray-400">
                  &ldquo;{t(`testimonials.${key}.quote`)}&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white">
                    {t(`testimonials.${key}.name`).charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t(`testimonials.${key}.name`)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t(`testimonials.${key}.role`)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ======== FAQ ======== */}
      <Section id="faq" className="bg-gray-50/80 py-20 dark:bg-gray-900/50 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
              {t('faq.title')}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600 dark:text-gray-400">
              {t('faq.subtitle')}
            </p>
          </div>

          <div className="mt-12 space-y-3">
            {faqItems.map((key, i) => (
              <div
                key={key}
                className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left"
                >
                  <span className="pr-4 font-semibold">{t(`faq.${key}.question`)}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFaq === i ? 'max-h-96 pb-5' : 'max-h-0'
                  }`}
                >
                  <p className="px-6 leading-relaxed text-gray-600 dark:text-gray-400">
                    {t(`faq.${key}.answer`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ======== FINAL CTA ======== */}
      <Section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 px-8 py-16 text-center text-white shadow-2xl sm:px-16 sm:py-20">
            {/* Decorative circles */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/10" />

            <h2 className="relative text-3xl font-bold sm:text-4xl lg:text-5xl">
              {t('cta.title')}
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-lg text-white/80">
              {t('cta.subtitle')}
            </p>

            <div className="relative mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <input
                type="email"
                placeholder={t('cta.placeholder')}
                className="w-full max-w-sm rounded-xl bg-white/20 px-6 py-4 text-white placeholder-white/60 backdrop-blur focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 sm:w-auto"
              />
              <Link
                href="/register"
                className="w-full rounded-xl bg-white px-8 py-4 font-semibold text-violet-700 shadow-lg transition hover:bg-gray-100 sm:w-auto"
              >
                {t('cta.button')}
              </Link>
            </div>
          </div>
        </div>
      </Section>

      {/* ======== FOOTER ======== */}
      <footer className="border-t border-gray-200 bg-white py-12 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold">FlowFi AI</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                {t('footer.description')}
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('footer.product')}
              </h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => scrollTo('features')} className="text-gray-600 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400">{t('nav.features')}</button></li>
                <li><button onClick={() => scrollTo('pricing')} className="text-gray-600 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400">{t('nav.pricing')}</button></li>
                <li><button onClick={() => scrollTo('faq')} className="text-gray-600 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400">{t('nav.faq')}</button></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('footer.company')}
              </h4>
              <ul className="space-y-2 text-sm">
                <li><span className="text-gray-600 dark:text-gray-400">{t('footer.about')}</span></li>
                <li><span className="text-gray-600 dark:text-gray-400">{t('footer.careers')}</span></li>
                <li><span className="text-gray-600 dark:text-gray-400">{t('footer.blog')}</span></li>
                <li><span className="text-gray-600 dark:text-gray-400">{t('footer.contact')}</span></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('footer.legal')}
              </h4>
              <ul className="space-y-2 text-sm">
                <li><span className="text-gray-600 dark:text-gray-400">{t('footer.privacy')}</span></li>
                <li><span className="text-gray-600 dark:text-gray-400">{t('footer.terms')}</span></li>
                <li><span className="text-gray-600 dark:text-gray-400">{t('footer.cookies')}</span></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-gray-200 pt-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
            <p>&copy; {new Date().getFullYear()} FlowFi AI. {t('footer.rights')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
