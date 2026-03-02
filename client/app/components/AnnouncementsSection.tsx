'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Megaphone } from 'lucide-react';
import HandDrawnCard from './HandDrawnCard';
import { announcements } from '@/constants/announcements';

function useItemsPerPage() {
    const [itemsPerPage, setItemsPerPage] = useState(3);

    useEffect(() => {
        function update() {
            if (window.matchMedia('(max-width: 640px)').matches) {
                setItemsPerPage(1);
            } else if (window.matchMedia('(max-width: 1024px)').matches) {
                setItemsPerPage(2);
            } else {
                setItemsPerPage(3);
            }
        }

        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    return itemsPerPage;
}

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 120 : -120,
        opacity: 0,
    }),
    center: {
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        x: direction > 0 ? -120 : 120,
        opacity: 0,
    }),
};

const cardColors = [
    'text-cyan',
    'text-yellow',
    'text-green',
    'text-red',
];

export default function AnnouncementsSection() {
    const itemsPerPage = useItemsPerPage();
    const [page, setPage] = useState(0);
    const [direction, setDirection] = useState(0);
    const [maxCardHeight, setMaxCardHeight] = useState<number>(0);
    const measureRef = useRef<HTMLDivElement>(null);

    const totalPages = Math.ceil(announcements.length / itemsPerPage);

    useEffect(() => {
        if (page >= totalPages) {
            setPage(Math.max(0, totalPages - 1));
        }
    }, [totalPages, page]);

    // Measure the tallest card across ALL announcements
    useEffect(() => {
        const container = measureRef.current;
        if (!container) return;

        function measure() {
            const cards = container!.querySelectorAll('[data-measure-card]');
            let tallest = 0;
            cards.forEach((card) => {
                tallest = Math.max(tallest, (card as HTMLElement).offsetHeight);
            });
            if (tallest > 0) setMaxCardHeight(tallest);
        }

        // Measure after fonts/layout settle
        const raf = requestAnimationFrame(measure);
        window.addEventListener('resize', measure);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', measure);
        };
    }, []);

    const currentItems = announcements.slice(
        page * itemsPerPage,
        page * itemsPerPage + itemsPerPage,
    );

    const goNext = useCallback(() => {
        setDirection(1);
        setPage((p) => (p + 1) % totalPages);
    }, [totalPages]);

    const goPrev = useCallback(() => {
        setDirection(-1);
        setPage((p) => (p - 1 + totalPages) % totalPages);
    }, [totalPages]);

    if (announcements.length === 0) return null;

    return (
        <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8">
            {/* Hidden container to measure ALL cards for uniform height */}
            <div
                ref={measureRef}
                aria-hidden="true"
                style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none', width: '100%', maxWidth: '1280px', left: '-9999px' }}
            >
                <div className="grid grid-cols-3 gap-6">
                    {announcements.map((announcement, idx) => {
                        const colorClass = cardColors[idx % cardColors.length];
                        return (
                            <div key={announcement.id} data-measure-card>
                                <HandDrawnCard className="text-left flex flex-col gap-3 p-4 sm:p-5 md:p-6">
                                    <div className="flex items-center gap-2">
                                        <Megaphone className={`w-5 h-5 sm:w-6 sm:h-6 shrink-0 ${colorClass}`} />
                                        <h3 className={`${colorClass} text-base sm:text-lg md:text-xl font-bold uppercase tracking-wide leading-tight`}>
                                            {announcement.event_name}
                                        </h3>
                                    </div>
                                    <span className="text-yellow text-xs sm:text-sm font-semibold uppercase tracking-wider opacity-80">
                                        {announcement.club_name}
                                    </span>
                                    <div className="w-full h-px bg-white/20" />
                                    <div className="flex flex-col gap-2">
                                        {announcement.messages.map((msg, mIdx) => (
                                            <p key={mIdx} className="text-white/85 text-xs sm:text-sm md:text-base leading-relaxed">{msg}</p>
                                        ))}
                                    </div>
                                </HandDrawnCard>
                            </div>
                        );
                    })}
                </div>
            </div>

            <h2 className="text-center hand-drawn-title text-white mb-8 sm:mb-10 md:mb-12 text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
                Announcements
            </h2>

            {/* Carousel viewport */}
            <div className="relative max-w-7xl mx-auto">
                {/* Cards */}
                <div className="overflow-hidden">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={page}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.35, ease: 'easeInOut' }}
                            className={`grid auto-rows-[1fr] gap-4 sm:gap-5 md:gap-6 ${itemsPerPage === 1
                                ? 'grid-cols-1 max-w-md mx-auto'
                                : itemsPerPage === 2
                                    ? 'grid-cols-2'
                                    : 'grid-cols-3'
                                }`}
                        >
                            {currentItems.map((announcement, idx) => {
                                const colorClass = cardColors[(page * itemsPerPage + idx) % cardColors.length];
                                return (
                                    <div key={announcement.id} style={maxCardHeight ? { minHeight: maxCardHeight } : undefined}>
                                        <HandDrawnCard className="text-left flex flex-col gap-3 p-4 sm:p-5 md:p-6 h-full">
                                            {/* Icon + Event Name */}
                                            <div className="flex items-center gap-2">
                                                <Megaphone className={`w-5 h-5 sm:w-6 sm:h-6 shrink-0 ${colorClass}`} />
                                                <h3
                                                    className={`${colorClass} text-base sm:text-lg md:text-xl font-bold uppercase tracking-wide leading-tight`}
                                                >
                                                    {announcement.event_name}
                                                </h3>
                                            </div>

                                            {/* Club Name */}
                                            <span className="text-yellow text-xs sm:text-sm font-semibold uppercase tracking-wider opacity-80">
                                                {announcement.club_name}
                                            </span>

                                            {/* Divider */}
                                            <div className="w-full h-px bg-white/20" />

                                            {/* Messages */}
                                            <div className="flex flex-col gap-2">
                                                {announcement.messages.map((msg, mIdx) => (
                                                    <p
                                                        key={mIdx}
                                                        className="text-white/85 text-xs sm:text-sm md:text-base leading-relaxed"
                                                    >
                                                        {msg}
                                                    </p>
                                                ))}
                                            </div>
                                        </HandDrawnCard>
                                    </div>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Navigation */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-6 sm:mt-8">
                        <button
                            onClick={goPrev}
                            className="hand-drawn-button !px-3 !py-2 sm:!px-4 sm:!py-3"
                            aria-label="Previous announcements"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        {/* Page dots — Among Us visor style */}
                        <div className="flex items-center gap-3">
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <motion.button
                                    key={i}
                                    layout
                                    onClick={() => {
                                        setDirection(i > page ? 1 : -1);
                                        setPage(i);
                                    }}
                                    animate={
                                        i === page
                                            ? {
                                                width: 28,
                                                height: 12,
                                                backgroundColor: '#00FFFF',
                                                boxShadow: '0 0 10px rgba(0,255,255,0.6), 0 0 20px rgba(0,255,255,0.3)',
                                                scale: 1,
                                            }
                                            : {
                                                width: 10,
                                                height: 10,
                                                backgroundColor: 'rgba(255,255,255,0.35)',
                                                boxShadow: '0 0 0px rgba(0,255,255,0)',
                                                scale: 1,
                                            }
                                    }
                                    whileHover={
                                        i !== page
                                            ? { scale: 1.4, backgroundColor: 'rgba(255,255,255,0.6)' }
                                            : {}
                                    }
                                    whileTap={{ scale: 0.85 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                    className="rounded-full border-none cursor-pointer p-0"
                                    style={{ borderRadius: i === page ? 6 : 999 }}
                                    aria-label={`Go to page ${i + 1}`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={goNext}
                            className="hand-drawn-button !px-3 !py-2 sm:!px-4 sm:!py-3"
                            aria-label="Next announcements"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
