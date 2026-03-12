import React from 'react';
import HandDrawnCard from './HandDrawnCard';
import { sponsors, Sponsor, SponsorTier } from '@/constants/sponsors';

// ─── Tier Config ────────────────────────────────────────────────────────────
const tierConfig: Record<
  SponsorTier,
  {
    label: string;
    icon: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    glowColor: string;
    accentColor: string;
    shimmer: string;
    cardBorder: string;
    starCount: number;
  }
> = {
  diamond: {
    label: 'Diamond Sponsor',
    icon: '💎',
    badgeBg: 'linear-gradient(135deg, #a8edea 0%, #c8b9f5 40%, #fed6e3 100%)',
    badgeBorder: 'rgba(168,237,234,0.6)',
    badgeText: '#1a0533',
    glowColor: 'rgba(168,237,234,0.35)',
    accentColor: '#c8b9f5',
    shimmer: 'linear-gradient(90deg, transparent, rgba(168,237,234,0.3), transparent)',
    cardBorder: 'rgba(168,237,234,0.45)',
    starCount: 3,
  },
  gold: {
    label: 'Gold Sponsor',
    icon: '🥇',
    badgeBg: 'linear-gradient(135deg, #f7d060 0%, #f9a825 50%, #e65100 100%)',
    badgeBorder: 'rgba(247,208,96,0.6)',
    badgeText: '#1a0a00',
    glowColor: 'rgba(249,168,37,0.30)',
    accentColor: '#f9a825',
    shimmer: 'linear-gradient(90deg, transparent, rgba(249,168,37,0.25), transparent)',
    cardBorder: 'rgba(249,168,37,0.40)',
    starCount: 2,
  },
  silver: {
    label: 'Silver Sponsor',
    icon: '🥈',
    badgeBg: 'linear-gradient(135deg, #b0bec5 0%, #90a4ae 50%, #607d8b 100%)',
    badgeBorder: 'rgba(176,190,197,0.5)',
    badgeText: '#0a0a0a',
    glowColor: 'rgba(176,190,197,0.18)',
    accentColor: '#b0bec5',
    shimmer: 'linear-gradient(90deg, transparent, rgba(176,190,197,0.2), transparent)',
    cardBorder: 'rgba(176,190,197,0.30)',
    starCount: 1,
  },
};

// ─── Sponsor Card ─────────────────────────────────────────────────────────────
function SponsorCard({ sponsor, size }: { sponsor: Sponsor; size: 'lg' | 'md' | 'sm' }) {
  const cfg = tierConfig[sponsor.tier];
  const logoSizes =
    size === 'lg'
      ? 'w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52'
      : size === 'md'
      ? 'w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40'
      : 'w-24 h-24 sm:w-28 sm:h-28';

  const card = (
    <div
      className="relative flex flex-col items-center justify-center gap-4 px-6 py-8 group"
      style={{ minHeight: size === 'lg' ? '340px' : size === 'md' ? '300px' : '260px' }}
    >
      {/* Animated background glow */}
      <div
        className="absolute inset-0 rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 40%, ${cfg.glowColor}, transparent 70%)` }}
      />

      {/* Shimmer sweep on hover */}
      <div
        className="absolute inset-0 rounded-[24px] opacity-0 group-hover:opacity-100 pointer-events-none overflow-hidden"
        aria-hidden
      >
        <div
          className="absolute top-0 bottom-0 w-1/3 animate-shimmer-sweep"
          style={{ background: cfg.shimmer }}
        />
      </div>

      {/* Stars / tier indicator */}
      <div className="flex gap-1 mb-1">
        {Array.from({ length: cfg.starCount }).map((_, i) => (
          <span key={i} className="text-base leading-none" style={{ filter: 'drop-shadow(0 0 4px currentColor)' }}>
            ★
          </span>
        ))}
      </div>

      {/* Logo */}
      <div
        className={`${logoSizes} rounded-2xl flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105 p-4`}
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: `2px solid ${cfg.cardBorder}`,
        }}
      >
        <img
          src={sponsor.logo_url}
          alt={`${sponsor.name} logo`}
          className="object-contain w-full h-full"
          loading="lazy"
        />
      </div>

      {/* Divider */}
      <div
        className="w-12 h-px group-hover:w-24 transition-all duration-500"
        style={{ background: `linear-gradient(90deg, transparent, ${cfg.accentColor}, transparent)` }}
      />

      {/* Company name */}
      <h3
        className={`text-white text-center font-bold tracking-wide leading-tight ${
          size === 'lg'
            ? 'text-2xl sm:text-3xl md:text-4xl'
            : size === 'md'
            ? 'text-xl sm:text-2xl md:text-3xl'
            : 'text-lg sm:text-xl md:text-2xl'
        }`}
        style={{ textShadow: `0 0 18px ${cfg.accentColor}55` }}
      >
        {sponsor.name}
      </h3>

      {/* Tier badge */}
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest select-none"
        style={{
          background: cfg.badgeBg,
          border: `1px solid ${cfg.badgeBorder}`,
          color: cfg.badgeText,
          boxShadow: `0 2px 12px ${cfg.glowColor}`,
          fontSize: '0.65rem',
        }}
      >
        <span>{cfg.icon}</span>
        {cfg.label}
      </span>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-[24px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${cfg.accentColor}, transparent)` }}
      />
    </div>
  );

  const wrapperClass =
    'h-full transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1.5 group overflow-hidden';

  const cardWithBorder = (
    <HandDrawnCard
      className={wrapperClass}
      style={
        {
          '--card-border-color': cfg.cardBorder,
        } as React.CSSProperties
      }
    >
      {card}
    </HandDrawnCard>
  );

  if (sponsor.website_url) {
    return (
      <a
        href={sponsor.website_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block outline-none focus:ring-2 focus:ring-white/40 rounded-[25px]"
      >
        {cardWithBorder}
      </a>
    );
  }

  return cardWithBorder;
}

// ─── Section ─────────────────────────────────────────────────────────────────
export default function SponsorsSection() {
  const diamond = sponsors.filter((s) => s.tier === 'diamond');
  const gold = sponsors.filter((s) => s.tier === 'gold');
  const silver = sponsors.filter((s) => s.tier === 'silver');

  return (
    <>
      {/* Shimmer animation keyframes */}
      <style>{`
        @keyframes shimmer-sweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        .animate-shimmer-sweep {
          animation: shimmer-sweep 2s ease-in-out infinite;
        }
      `}</style>

      <section className="py-10 sm:py-14 md:py-20 px-4 sm:px-6 lg:px-8 relative">
        {/* Section heading */}
        <h2 className="text-center hand-drawn-title text-white mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
          Our Sponsors
        </h2>
        <p className="text-center text-white/60 text-sm sm:text-base mb-12 sm:mb-16 max-w-xl mx-auto">
          Proud to be backed by companies that fuel innovation and excellence.
        </p>

        {/* ── Diamond ─────────────────────────────────────────────────────── */}
        {diamond.length > 0 && (
          <div className="mb-12 sm:mb-16">
            <TierHeading tier="diamond" />
            <div className="flex justify-center">
              <div className="w-full max-w-xs sm:max-w-sm md:max-w-md">
                {diamond.map((s) => (
                  <SponsorCard key={s.id} sponsor={s} size="lg" />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Gold ────────────────────────────────────────────────────────── */}
        {gold.length > 0 && (
          <div className="mb-12 sm:mb-16">
            <TierHeading tier="gold" />
            <div className="flex justify-center">
              <div className="w-full max-w-xs sm:max-w-sm md:max-w-md">
                {gold.map((s) => (
                  <SponsorCard key={s.id} sponsor={s} size="md" />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Silver ──────────────────────────────────────────────────────── */}
        {silver.length > 0 && (
          <div>
            <TierHeading tier="silver" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto">
              {silver.map((s) => (
                <SponsorCard key={s.id} sponsor={s} size="sm" />
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}

// ─── Tier heading with decorative line ────────────────────────────────────────
function TierHeading({ tier }: { tier: SponsorTier }) {
  const cfg = tierConfig[tier];
  return (
    <div className="flex items-center gap-4 mb-6 sm:mb-8 max-w-5xl mx-auto px-2">
      <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${cfg.accentColor}55)` }} />
      <span
        className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] whitespace-nowrap"
        style={{ color: cfg.accentColor, textShadow: `0 0 12px ${cfg.accentColor}88` }}
      >
        {cfg.icon}&nbsp;&nbsp;{cfg.label.replace(' Sponsor', '')} Tier
      </span>
      <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${cfg.accentColor}55, transparent)` }} />
    </div>
  );
}
