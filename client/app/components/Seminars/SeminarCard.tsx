/* eslint-disable prefer-const */
import { SeminarData } from "@/types/interface";
import HandCard from "./HandCard";
import { Calendar, MapPin, Quote, Users, Video, ArrowRight } from "lucide-react";

function SeminarCard({
	seminar,
	onClick,
}: {
	seminar: SeminarData;
	onClick: () => void;
}) {
	const now = new Date();

	const getSeminarDateTime = () => {
		const [day, month, year] = seminar.date.split("/").map(Number);
		const startTimeStr = seminar.time.split(" - ")[0]; // "07:00 PM"
		const [time, modifier] = startTimeStr.split(" ");
		let [hours, minutes] = time.split(":").map(Number);

		if (modifier === "PM" && hours < 12) hours += 12;
		if (modifier === "AM" && hours === 12) hours = 0;

		return new Date(2000 + year, month - 1, day, hours, minutes);
	};

	const seminarDateObj = getSeminarDateTime();
	const isPast = seminarDateObj < now;

	const statusStyles = isPast
		? "border-slate-500 shadow-[4px_4px_0px_0px_rgba(100,116,139,1)] opacity-80"
		: "border-cyan-400 shadow-[6px_6px_0px_0px_rgba(34,211,238,1)] hover:-translate-y-1 hover:scale-[1.015] hover:shadow-[8px_8px_0px_0px_rgba(34,211,238,1)] transition-all duration-300";

	return (
		<HandCard
			onClick={onClick}
			className={`relative cursor-pointer flex flex-col justify-between items-center p-6 bg-slate-900 border-2 rounded-xl overflow-hidden ${statusStyles}`}
		>
			<h3 className="text-2xl font-black text-white mb-4 border-b border-slate-700 pb-3">
				{seminar.title}
			</h3>

			<div className="flex items-center gap-2 text-cyan-400 font-medium mb-4">
				<Users size={20} />
				<span className="uppercase tracking-wider text-lg">
					{seminar.speaker}
				</span>
			</div>

			<p className="text-slate-400 mb-6 leading-relaxed">
				{seminar.description}
			</p>

			{seminar.speakerNote && (
				<div className="flex gap-3 bg-cyan-950/20 p-4 mb-6 border-l-4 border-cyan-500 italic">
					<Quote size={20} className="text-cyan-500 shrink-0" />
					<p className="text-sm text-cyan-100">&quot;{seminar.speakerNote}&quot;</p>
				</div>
			)}

			{seminar.club && (
				<span className="text-sm text-slate-200 mb-2">
					Organized by{" "}
					<span className="text-red-400 font-medium uppercase tracking-wider">
						{seminar.club}
					</span>
				</span>
			)}

			<div className="pt-4 w-full flex flex-col md:flex-row justify-between items-center border-t border-slate-800 text-sm text-slate-400">
				<div className="flex items-center gap-3">
					<Calendar size={16} />
					{/* Displaying your direct strings now */}
					<span>
						{seminar.date} — {seminar.time.split(" - ")[0]}
					</span>
				</div>

				<div className="flex items-center gap-3 mt-3 md:mt-0">
					{seminar.mode === "online" ? (
						<Video size={16} />
					) : (
						<MapPin size={16} />
					)}
					<span className="capitalize">
						{seminar.mode} {seminar.venue ? `• ${seminar.venue}` : ""}
					</span>
				</div>
			</div>

			{seminar.isActive && !isPast && (
				<div className="flex items-center mt-4">
					<span className="absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75 animate-ping"></span>
					<span className="relative inline-flex h-3 w-3 rounded-full bg-green-400 shadow-[0_0_6px_rgba(34,197,94,0.6)]"></span>
					<span className="ml-2 text-green-400 font-bold">Active</span>
				</div>
			)}

			{/* Improved hover overlay */}
			{!isPast && (
				<div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center gap-3 opacity-0 hover:opacity-100 transition-opacity duration-300 bg-black/65 backdrop-blur-sm border-2 border-cyan-400/60 rounded-xl">
					<div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-cyan-400 text-cyan-400 bg-black/50">
						<ArrowRight size={22} />
					</div>
					<span className="text-white font-bold text-lg uppercase tracking-widest px-4 text-center">
						View Details
					</span>
					<span className="text-cyan-400 text-sm tracking-wider">Click to open</span>
				</div>
			)}

			{isPast && (
				<div className="absolute top-0 left-0 border bg-black/60 backdrop-blur-2xl w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white font-bold text-lg uppercase tracking-wider">
					View Details
				</div>
			)}

			{isPast && (
				<div className="absolute top-8 right-6 rotate-[-14deg] border-[3px] border-red-700 px-6 py-2 text-3xl font-black uppercase tracking-[0.25em] text-red-700 rounded-lg bg-black/60 backdrop-blur-sm shadow-[0_0_25px_rgba(185,28,28,0.45)]">
					DONE
				</div>
			)}
		</HandCard>
	);
}

export default SeminarCard;