import { partners } from '@/constants/partners';
import HandDrawnCard from './HandDrawnCard';
import { Partner } from '@/types/interface';

export default function PartnersSection() {
  return (
    <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8 relative z-20">
      <h2 className="text-center hand-drawn-title text-white mb-8 sm:mb-10 md:mb-12 text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
        Our Partners
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
        {partners.map((partner) => (
          <PartnerCard key={partner.id} partner={partner} />
        ))}
      </div>
    </section>
  );
}

function PartnerCard({ partner }: { partner: Partner }) {
  const Content = () => (
    <div className="flex flex-col items-center justify-center h-full gap-3 px-4 py-5 relative">
      {/* Logo — no circular background, just the image with a soft glow on hover */}
      <div className="w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center rounded-full overflow-hidden">
        <img
          src={partner.logo_url}
          alt={`${partner.partner_name} logo`}
          className="object-contain w-full h-full"
          loading="lazy"
        />
      </div>

      {/* Divider line */}
      <div className="w-10 h-px bg-white/20 group-hover:w-16 group-hover:bg-yellow-400/60 transition-all duration-300" />

      {/* Name */}
      <h3 className="text-white text-center font-semibold text-sm sm:text-base leading-snug tracking-wide group-hover:text-yellow-400 transition-colors duration-300 w-full break-words hyphens-auto">
        {partner.partner_name}
      </h3>

      {/* Badge */}
      <span className="text-[10px] sm:text-xs font-medium uppercase tracking-widest text-gray-400 bg-white/5 border border-white/10 rounded px-3 py-0.5">
        {partner.partner_type}
      </span>

      {/* Bottom gradient accent */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-[25px] bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );

  const cardClasses = "h-full min-h-[200px] flex items-center justify-center transition-all duration-300 hover:scale-[1.04] hover:-translate-y-1 group overflow-hidden";

  if (partner.website_url) {
    return (
      <a
        href={partner.website_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full outline-none focus:ring-2 focus:ring-yellow-400 rounded-[25px]"
      >
        <HandDrawnCard className={`${cardClasses} cursor-pointer`}>
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
