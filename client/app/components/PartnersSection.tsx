import React from 'react';
import HandDrawnCard from './HandDrawnCard';

interface Partner {
  id: string;
  partner_name: string;
  logo_url: string;
  website_url?: string;
}

const partners: Partner[] = [
  {
    id: '1',
    partner_name: 'Aztex',
    logo_url: '/1.png', 
    website_url: 'https://example.com',
  },
  {
    id: '2',
    partner_name: 'Rooster Block',
    logo_url: '/2.png',
  },
  {
    id: '3',
    partner_name: 'Stone Gold',
    logo_url: '/3.png',
    website_url: 'https://example.com',
  },
  {
    id: '4',
    partner_name: 'Mustang',
    logo_url: '/4.png',
  },
  {
    id: '5',
    partner_name: 'Labs and Bros.',
    logo_url: '/5.png',
    website_url: 'https://example.com',
  },
];

export default function PartnersSection() {
  return (
    <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8 relative z-20">
      <h2 className="text-center hand-drawn-title text-white mb-8 sm:mb-10 md:mb-12 text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
        Our Partners
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-8 max-w-7xl mx-auto">
        {partners.map((partner) => (
          <PartnerCard key={partner.id} partner={partner} />
        ))}
      </div>
    </section>
  );
}

function PartnerCard({ partner }: { partner: Partner }) {
  const Content = () => (
    <div className="flex flex-col items-center justify-center h-full p-2">
      <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 mb-4 relative flex items-center justify-center p-2 bg-white/5 rounded-full backdrop-blur-sm border border-white/10 group-hover:bg-white/10 transition-colors duration-300">
        <img
          src={partner.logo_url}
          alt={`${partner.partner_name} logo`}
          className="object-contain max-w-full max-h-full drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
          loading="lazy"
        />
      </div>
      <h3 className="text-white text-center font-bold text-lg sm:text-xl tracking-wide group-hover:text-yellow-400 transition-colors duration-300 w-full wrap-break-words hyphens-auto px-1">
        {partner.partner_name}
      </h3>
    </div>
  );

  const cardClasses = "h-full min-h-[220px] flex items-center justify-center transition-all duration-300 hover:scale-105 hover:-translate-y-1 group";

  if (partner.website_url) {
    return (
      <a
        href={partner.website_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full outline-none focus:ring-2 focus:ring-yellow-400 rounded-[25px]"
      >
        <HandDrawnCard className={`${cardClasses} hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] cursor-pointer`}>
          <Content />
        </HandDrawnCard>
      </a>
    );
  }

  return (
    <HandDrawnCard className={cardClasses}>
      <Content />
    </HandDrawnCard>
  );
}
