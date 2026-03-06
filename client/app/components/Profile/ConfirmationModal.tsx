import HandDrawnCard from "../HandDrawnCard";

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  name?: string;
  loading: boolean;
}

const ConfirmationModal = ({ isOpen, onConfirm, onCancel, name, loading }: ConfirmationModalProps) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
			<HandDrawnCard className="max-w-sm w-full border-red-500/50 bg-gray-900">
				<div className="text-center space-y-4">
					<div className="text-4xl">⚠️</div>
					<h3 className="text-xl font-bold text-white">Remove Member?</h3>
					<p className="text-gray-300 text-sm hand-drawn-text">
						Are you sure you want to remove <span className="text-red-400 font-bold">{name}</span>?
						This will permanently delete their event registration.
					</p>
					<div className="flex gap-3 pt-2">
						<button
							onClick={onCancel}
							disabled={loading}
							className="flex-1 px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-white/5 transition-colors cursor-pointer"
						>
							Cancel
						</button>
						<button
							onClick={onConfirm}
							disabled={loading}
							className="flex-1 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-colors font-bold cursor-pointer"
						>
							{loading ? "Removing..." : "Yes, Remove"}
						</button>
					</div>
				</div>
			</HandDrawnCard>
		</div>
	);
};

export default ConfirmationModal;