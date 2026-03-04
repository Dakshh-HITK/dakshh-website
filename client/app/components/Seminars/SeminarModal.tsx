/* eslint-disable prefer-const */
import { SeminarData } from "@/types/interface";
import HandCard from "./HandCard";
import { useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";

function SeminarModal({
	userRegisteredSeminars,
	register,
	seminar,
	onClose,
	isLoggedIn,
}: {
	userRegisteredSeminars: string[];
	register: (seminarId: string) => Promise<void>;
	seminar: SeminarData;
	onClose: () => void;
	isLoggedIn: boolean;
}) {
	// Helper to parse "DD/MM/YY" and "HH:MM AM/PM - HH:MM AM/PM"
	const getSeminarDateTime = () => {
		const [day, month, year] = seminar.date.split("/").map(Number);
		const startTimeStr = seminar.time.split(" - ")[0]; // Get start time
		const [time, modifier] = startTimeStr.split(" ");
		let [hours, minutes] = time.split(":").map(Number);

		if (modifier === "PM" && hours < 12) hours += 12;
		if (modifier === "AM" && hours === 12) hours = 0;

		return new Date(2000 + year, month - 1, day, hours, minutes);
	};

	const seminarDateObj = getSeminarDateTime();
	const isPast = seminarDateObj < new Date();

	useEffect(() => {
		document.body.style.overflow = "hidden";
		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handleEsc);
		return () => {
			document.body.style.overflow = "auto";
			window.removeEventListener("keydown", handleEsc);
		};
	}, [onClose]);

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
			onClick={onClose}
		>
			<HandCard
				onClick={(e) => e.stopPropagation()}
				className="relative w-full max-w-3xl bg-slate-900 border-2 border-cyan-400 p-8 rounded-2xl animate-scaleIn shadow-[8px_8px_0px_0px_rgba(34,211,238,1)]"
			>
				{/* Improved close button */}
				<button
					onClick={(e) => {
						e.stopPropagation();
						onClose();
					}}
					className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full border-2 border-slate-600 text-slate-400 hover:border-cyan-400 hover:text-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all duration-200 cursor-pointer bg-slate-900/60 backdrop-blur-sm"
					aria-label="Close"
				>
					<X size={20} strokeWidth={2.5} />
				</button>

				<h2 className="text-2xl! md:text-4xl! font-black text-white mb-6 border-b border-slate-700 pb-4">
					{seminar.title}
				</h2>

				{/* Speaker row — image centres on mobile via mx-auto */}
				<div className="flex flex-col md:flex-row gap-6 mb-8">
					<div className="relative w-40 h-40 shrink-0 mx-auto md:mx-0">
						<Image
							src={seminar.speakerImage}
							alt={seminar.speaker}
							fill
							className="rounded-xl object-cover border-2 border-cyan-500"
						/>
					</div>

					<div>
						<h3 className="text-xl font-bold text-cyan-400 mb-2">
							{seminar.speaker}
						</h3>
						<p className="text-slate-400 leading-relaxed">
							{seminar.speakerBio}
						</p>
					</div>
				</div>

				<div className="mb-8">
					<h4 className="text-lg font-semibold text-white mb-3">
						About This Seminar
					</h4>
					<p className="text-slate-300 leading-relaxed">
						{seminar.description}
					</p>
				</div>

				<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-t border-slate-700 pt-6 mb-6 text-sm text-slate-400">
					<div className="flex items-center gap-2">
						📅 <span>{seminar.date}</span>
						<span className="text-slate-600">|</span>
						<span>{seminar.time}</span>
					</div>

					<div className="capitalize">
						📍 {seminar.mode} {seminar.venue && `• ${seminar.venue}`}
					</div>
				</div>

				{!isPast && seminar.isRegisterationNeeded && seminar.isActive && (
					<div className="text-center">
						{userRegisteredSeminars.includes(seminar._id) ? (
							<div className="text-green-400 font-bold text-lg">
								You are already onBoard!
							</div>
						) : seminar.maxRegistrations &&
						  seminar.maxRegistrations > 0 &&
						  (seminar.registrations?.length || 0) >=
								seminar.maxRegistrations ? (
							<div className="text-red-500 font-bold text-lg">
								Registration Full
							</div>
						) : (
							<button
								onClick={() => register(seminar._id)}
								className="inline-block bg-cyan-500 text-white px-6 py-3 rounded-full font-bold uppercase tracking-wider hover:bg-cyan-600 transition-colors cursor-pointer"
							>
								{isLoggedIn ? "Register Now" : "Login to Register"}
							</button>
						)}
					</div>
				)}

				{!isPast && seminar.isActive && !seminar.isRegisterationNeeded && (
					<div className="text-center text-green-400 font-bold text-lg">
						No Registration Required - Join Us Live!
					</div>
				)}

				{!isPast && !seminar.isActive && (
					<div className="text-center text-yellow-400 font-bold text-lg">
						Coming Soon
					</div>
				)}

				{isPast && (
					<div className="text-center text-red-500 font-bold text-lg">
						Event Ended
					</div>
				)}
			</HandCard>
		</div>
	);
}

export default SeminarModal;