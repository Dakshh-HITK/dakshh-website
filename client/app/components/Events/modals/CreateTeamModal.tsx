"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface CreateTeamModalProps {
	onClose: () => void;
	onConfirm: (teamName: string) => void;
	registering: boolean;
}

const CreateTeamModal = ({
	onClose,
	onConfirm,
	registering,
}: CreateTeamModalProps) => {
	const [teamName, setTeamName] = useState("");

	const handleSubmit = () => {
		onConfirm(teamName.trim());
	};

	const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (e.target === e.currentTarget) onClose();
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
			onClick={handleBackdropClick}
		>
			{/* Modal Card — mimics HandDrawnCard style */}
			<div
				className="relative w-full max-w-md bg-black border-2 border-white/80 rounded-2xl p-8 shadow-[6px_6px_0px_rgba(255,255,255,0.15)]"
				style={{ filter: "url(#wobbly-border)" }}
			>
				{/* Close button */}
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
					disabled={registering}
				>
					<X size={22} />
				</button>

				{/* Header */}
				<div className="mb-6">
					<h2 className="hand-drawn-title text-3xl! text-white mb-1">
						Form Your Crew
					</h2>
					<p className="text-sm text-gray-400 font-mono">
						Give your team a name
					</p>
				</div>

				{/* Input */}
				<div className="mb-6">
					<label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">
						Team Name
					</label>
					<input
						type="text"
						value={teamName}
						onChange={(e) => setTeamName(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && !registering && handleSubmit()}
						placeholder="e.g. The Impostors"
						maxLength={40}
						disabled={registering}
						className="w-full rounded-lg border border-white/25 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/30 transition-all font-mono text-sm disabled:opacity-50"
					/>
					<p className="text-right text-xs text-gray-600 mt-1">
						{teamName.length}/40
					</p>
				</div>

				{/* Action buttons */}
				<div className="flex gap-3">
					<button
						onClick={onClose}
						disabled={registering}
						className="flex-1 border-2 border-white/30 rounded-xl py-3 text-sm font-bold uppercase tracking-wider text-white/60 hover:text-white hover:border-white/60 transition-all disabled:opacity-40"
					>
						Cancel
					</button>
					<button
						onClick={handleSubmit}
						disabled={registering}
						className="hand-drawn-button flex-1 py-3 text-sm bg-red-600 hover:bg-red-700 flex items-center justify-center gap-2"
					>
						{registering ? (
							<div className="w-5 h-5 border-4 border-red-100 border-t-transparent rounded-full animate-spin" />
						) : (
							"CREATE TEAM"
						)}
					</button>
				</div>
			</div>
		</div>
	);
};

export default CreateTeamModal;