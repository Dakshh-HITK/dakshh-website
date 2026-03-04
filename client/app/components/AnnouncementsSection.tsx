'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
		x: direction > 0 ? '20%' : '-20%',
		opacity: 0,
	}),
	center: {
		x: 0,
		opacity: 1,
	},
	exit: (direction: number) => ({
		x: direction > 0 ? '-20%' : '20%',
		opacity: 0,
	}),
};

const cardColors = ['text-cyan', 'text-yellow', 'text-green', 'text-red'];

export default function AnnouncementsSection() {
	const itemsPerPage = useItemsPerPage();
	const [page, setPage] = useState(0);
	const [direction, setDirection] = useState(0);

	const totalPages = Math.ceil(announcements.length / itemsPerPage);

	useEffect(() => {
		if (page >= totalPages) {
			setPage(Math.max(0, totalPages - 1));
		}
	}, [totalPages, page]);

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
			<h2 className="text-center hand-drawn-title text-white mb-8 sm:mb-10 md:mb-12 text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
				Announcements
			</h2>

			<div className="relative max-w-7xl mx-auto">
				<div className="overflow-hidden">
					<AnimatePresence mode="wait" custom={direction}>
						<motion.div
							key={page}
							custom={direction}
							variants={slideVariants}
							initial="enter"
							animate="center"
							exit="exit"
							transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
							/* Key fix: grid-rows-[1fr] ensures all children 
								 in the row expand to the height of the tallest item.
							*/
							className={`grid grid-rows-[1fr] gap-4 sm:gap-5 md:gap-6 ${itemsPerPage === 1 ? 'grid-cols-1 max-w-md mx-auto' :
								itemsPerPage === 2 ? 'grid-cols-2' : 'grid-cols-3'
								}`}
						>
							{currentItems.map((announcement, idx) => {
								const globalIdx = page * itemsPerPage + idx;
								const colorClass = cardColors[globalIdx % cardColors.length];

								return (
									<div key={announcement.id} className="h-full">
										<HandDrawnCard className="text-left flex flex-col gap-3 p-4 sm:p-5 md:p-6 h-full">
											<div className="flex items-center gap-2">
												<Megaphone className={`w-5 h-5 sm:w-6 sm:h-6 shrink-0 ${colorClass}`} />
												<h3 className={`${colorClass} text-2xl! font-bold uppercase tracking-wide leading-tight`}>
													{announcement.event_name}
												</h3>
											</div>

											<span className="text-yellow text-lg font-semibold uppercase tracking-wider opacity-80">
												{announcement.club_name}
											</span>

											<div className="w-full h-px bg-white/20" />

											<div className="flex flex-col gap-2 flex-grow">
												{announcement.messages.map((msg, mIdx) => (
													<p key={mIdx} className="text-white/85 text-base leading-relaxed">
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

				{/* Navigation Controls */}
				{totalPages > 1 && (
					<div className="flex items-center justify-center gap-4 mt-6 sm:mt-8">
						<button onClick={goPrev} className="hand-drawn-button !px-3 !py-2 sm:!px-4 sm:!py-3" aria-label="Previous">
							<ChevronLeft className="w-5 h-5" />
						</button>

						<div className="flex items-center gap-3">
							{Array.from({ length: totalPages }).map((_, i) => (
								<motion.button
									key={i}
									layout
									onClick={() => {
										setDirection(i > page ? 1 : -1);
										setPage(i);
									}}
									className="rounded-full border-none cursor-pointer p-0"
									animate={{
										width: i === page ? 28 : 10,
										height: i === page ? 12 : 10,
										backgroundColor: i === page ? '#00FFFF' : 'rgba(255,255,255,0.35)',
										borderRadius: i === page ? 6 : 999
									}}
								/>
							))}
						</div>

						<button onClick={goNext} className="hand-drawn-button !px-3 !py-2 sm:!px-4 sm:!py-3" aria-label="Next">
							<ChevronRight className="w-5 h-5" />
						</button>
					</div>
				)}
			</div>
		</section>
	);
}