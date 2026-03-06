import { useEffect, useState } from 'react';
import HandDrawnCard from '../HandDrawnCard'
import { Team } from '@/types/interface';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ConfirmationModal from './ConfirmationModal';

const paymentStatusConfig = {
	pending: {
		label: 'Payment Pending',
		className: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
	},
	completed: {
		label: 'Payment Complete',
		className: 'bg-green-500/20 text-green-300 border border-green-500/30',
	},
	failed: {
		label: 'Payment Failed',
		className: 'bg-red-500/20 text-red-300 border border-red-500/30',
	},
} as const;

const TeamsTab = () => {
	const [teams, setTeams] = useState<Team[]>([]);
	const [loading, setLoading] = useState(true);
	const [copiedId, setCopiedId] = useState<string | null>(null);
	const [openTeamId, setOpenTeamId] = useState<string | null>(null);
	const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
	const [newTeamName, setNewTeamName] = useState("");
	const [updating, setUpdating] = useState(false);
	const [memberToRemove, setMemberToRemove] = useState<{ teamId: string, memberId: string, name: string } | null>(null);

	useEffect(() => {
		const fetchEvents = async () => {
			try {
				const response = await fetch("/api/registration/my-teams", {
					method: "GET",
					headers: { "Content-Type": "application/json" },
				});
				const data = await response.json();

				if (response.ok) {
					setTeams(data.teams || []);
				}
			} catch (error) {
				console.error("Failed to fetch events:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchEvents();
	}, []);

	const updateTeamName = async (teamId: string) => {
		try {
			setUpdating(true);

			const response = await fetch(`/api/registration/my-teams/update/${teamId}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					teamId,
					teamName: newTeamName.trim(),
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "Failed to update");
			}

			// Update local state (optimistic UI)
			setTeams(prev =>
				prev.map(team =>
					team._id === teamId
						? { ...team, teamName: newTeamName.trim() }
						: team
				)
			);

			setEditingTeamId(null);
			setNewTeamName("");
		} catch (error) {
			console.error(error);
		} finally {
			setUpdating(false);
		}
	};

	const handleRemoveClick = (teamId: string, memberId: string, name: string) => {
		setMemberToRemove({ teamId, memberId, name });
	};

	const executeRemoveMember = async () => {
		if (!memberToRemove) return;
		const { teamId, memberId } = memberToRemove;

		try {
			setUpdating(true);
			const response = await fetch(`/api/registration/my-teams/remove-members/${teamId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ memberId }),
			});
			const data = await response.json();

			if (!response.ok) throw new Error(data.error);

			setTeams(prev => prev.map(team =>
				team._id === teamId
					? { ...team, members: team.members?.filter(m => m._id !== memberId) }
					: team
			));
			toast.success(data.message);

			setMemberToRemove(null);
		} catch (error) {
			console.log(error);
			toast.error("Error removing member");
		} finally {
			setUpdating(false);
		}
	};

	const copyTeamCode = (teamCode: string, registrationId: string) => {
		navigator.clipboard.writeText(teamCode);
		setCopiedId(registrationId);
		setTimeout(() => setCopiedId(null), 2000);
	};

	const getTeamSize = (team: Team) => team.teamSize ?? team.members?.length ?? team.team.length;

	return (
		<>
			<HandDrawnCard className="w-full space-y-6">
				<div className="text-center space-y-2">
					<h2 className="text-3xl font-bold text-white">My Teams</h2>
					<p className="text-gray-300 hand-drawn-text">List of Teams you are a part of</p>
				</div>

				{loading ? (
					<div className="flex flex-col items-center justify-center py-12 space-y-4">
						<div className="w-12 h-12 border-4 border-red-400 border-t-transparent rounded-full animate-spin" />
						<p className="text-gray-400 hand-drawn-text">Loading your journey...</p>
					</div>
				) : teams.length > 0 ? (
					<div className="space-y-3 w-full">
						{teams.map((team: Team) => {
							const isOpen = openTeamId === team._id;
							const teamSize = getTeamSize(team);
							const minMembers = team.eventId.minMembersPerTeam ?? 1;
							const isPaidEvent = team.eventId.isPaidEvent ?? false;
							const isTeamComplete = teamSize >= minMembers;
							const paymentStatus = team.paymentStatus;
							const statusConfig = paymentStatus ? paymentStatusConfig[paymentStatus] : null;

							return (
								<div
									key={team._id}
									className="rounded-xl border border-gray-700 bg-black/40 overflow-hidden"
								>
									<div
										role="button"
										onClick={() => setOpenTeamId(isOpen ? null : team._id)}
										className="w-full px-4 py-3 flex items-center gap-3 cursor-pointer group hover:bg-white/2 transition-colors select-none"
									>
										{/* Left — team info */}
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 flex-wrap">
												<div className='flex flex-col items-start'>
													<h1 className="text-base! sm:text-lg! font-semibold text-white">
														{team.teamName || ""}
													</h1>
													<h3 className="text-xs! sm:text-sm! font-semibold text-gray-300">
														{team.eventId.eventName}
													</h3>
												</div>
												<span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full text-xs">
													{team.eventId.category}
												</span>
												{/* Payment Status Badge */}
												{isPaidEvent && statusConfig && (
													<span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.className}`}>
														{statusConfig.label}
													</span>
												)}
											</div>
											<p className="text-xs text-gray-400 mt-1">
												{teamSize}/{team.eventId.maxMembersPerTeam ?? "-"} members
											</p>
										</div>

										{/* Right — copy button + chevron */}
										<div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
											<button
												type="button"
												onClick={() => copyTeamCode(team.teamCode, team._id)}
												className="px-2.5 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-xs transition-colors"
											>
												{copiedId === team._id ? "COPIED" : "COPY CODE"}
											</button>
										</div>

										{/* Animated chevron */}
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="18" height="18"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											className={`shrink-0 text-gray-400 group-hover:text-gray-200 transition-all duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
										>
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
										</svg>
									</div>

									{/* Payment CTA Banner */}
									{isPaidEvent && paymentStatus !== "completed" && (
										<>
											{isTeamComplete ? (
												<Link
													href={`/events/${team.eventId._id}`}
													className="px-4 py-2.5 flex items-center justify-between gap-2 border-t border-cyan/30 bg-cyan/10 hover:bg-cyan/20 transition-all group"
												>
													<div className="flex items-center gap-2">
														<span className="text-cyan text-sm animate-pulse">💳</span>
														<p className="text-sm text-cyan font-semibold group-hover:translate-x-1 transition-transform">
															Team Complete! Pay & Register Now
														</p>
													</div>
													<span className="text-cyan text-xs font-bold bg-cyan/20 px-2 py-0.5 rounded border border-cyan/40">
														PAY NOW →
													</span>
												</Link>
											) : (
												<div className="px-4 py-2.5 flex items-center gap-2 border-t border-yellow-500/20 bg-yellow-500/5">
													<span className="text-yellow-400 text-sm">⚠️</span>
													<p className="text-sm text-yellow-300/80">
														Finish your team to complete payment
														<span className="ml-1 text-yellow-500/60 text-xs font-medium">
															({teamSize}/{minMembers} min)
														</span>
													</p>
												</div>
											)}
										</>
									)}

									{isOpen && (
										<div className="border-t border-gray-700 px-4 py-3 space-y-3">
											<div className="rounded-lg border border-gray-700 bg-gray-900/40 p-3">
												<div className="rounded-lg border border-gray-700 bg-gray-900/40 p-3">
													<p className="text-[11px] text-gray-400 mb-1">Team Name</p>

													{editingTeamId === team._id ? (
														<div className="flex gap-2">
															<input
																type="text"
																value={newTeamName}
																onChange={(e) => setNewTeamName(e.target.value)}
																className="flex-1 px-2 py-1 bg-black border border-gray-600 rounded text-white text-sm"
															/>
															<button
																onClick={() => updateTeamName(team._id)}
																disabled={updating || !newTeamName.trim()}
																className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded text-xs"
															>
																{updating ? "Saving..." : "Save"}
															</button>
															<button
																onClick={() => {
																	setEditingTeamId(null);
																	setNewTeamName("");
																}}
																className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-xs"
															>
																Cancel
															</button>
														</div>
													) : (
														<div className="flex items-center justify-between">
															<p className="text-white font-semibold">
																{team.teamName || "Unnamed Team"}
															</p>
															<button
																onClick={() => {
																	setEditingTeamId(team._id);
																	setNewTeamName(team.teamName || "");
																}}
																className="text-xs text-cyan hover:underline"
															>
																Edit
															</button>
														</div>
													)}
												</div>

												<p className="text-[11px] text-gray-400 my-1">Team Code</p>
												<p className="text-sm font-mono text-white font-semibold break-all">
													{team.teamCode}
												</p>
											</div>

											<div className="grid grid-cols-2 gap-2 text-sm">
												<div className="rounded-lg border border-gray-700 bg-gray-900/40 p-2">
													<p className="text-[11px] text-gray-400">Team Size</p>
													<p className="text-white font-semibold">{teamSize}</p>
												</div>
												<div className="rounded-lg border border-gray-700 bg-gray-900/40 p-2">
													<p className="text-[11px] text-gray-400">Team Limit</p>
													<p className="text-white font-semibold">
														{team.eventId.maxMembersPerTeam ?? "-"}
													</p>
												</div>
												{/* Payment Status detail row */}
												{isPaidEvent && (
													<div className="col-span-2 rounded-lg border border-gray-700 bg-gray-900/40 p-2">
														<p className="text-[11px] text-gray-400 mb-1">Payment Status</p>
														{statusConfig ? (
															<span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.className}`}>
																{statusConfig.label}
															</span>
														) : (
															<span className="text-xs text-gray-500 italic">Not initiated</span>
														)}
													</div>
												)}
											</div>

											<div className="rounded-lg border border-gray-700 bg-gray-900/30 p-3">
												<p className="text-xs text-gray-400 mb-2">Teammates</p>
												{team.members && team.members.length > 0 ? (
													<div className="space-y-2">
														{team.members.map((member) => {
															const displayName = member.fullName || member.username || "Unknown";
															const isThisMemberTheLeader = member.isLeader;

															// Check if the current user viewing this tab is the leader of this team
															const viewerIsLeader = team.members?.find(m => m.isLeader)?._id === (typeof team.teamLeader === 'string' ? team.teamLeader : team.teamLeader?._id);

															return (
																<div
																	key={member._id}
																	className="flex items-center justify-between text-sm text-gray-200 bg-black/20 p-2 rounded-md"
																>
																	<div className="flex items-center gap-2">
																		<span>{displayName}</span>
																		{isThisMemberTheLeader && (
																			<span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300">
																				Leader
																			</span>
																		)}
																	</div>

																	{!isThisMemberTheLeader &&
																		viewerIsLeader &&
																		(!team.eventId.isPaidEvent || team.paymentStatus !== "completed") && (
																			<button
																				disabled={updating}
																				onClick={() => handleRemoveClick(team._id, member._id, displayName)}
																				className="text-[10px] text-red-400 hover:text-red-300 px-2 py-1 rounded cursor-pointer font-semibold"
																			>
																				{updating ? "..." : "REMOVE"}
																			</button>
																		)}
																</div>
															);
														})}
													</div>
												) : (
													<p className="text-sm text-gray-400">No teammates yet.</p>
												)}
											</div>

											{/* View Event CTA */}
											<Link
												href={`/events/${team.eventId._id}`}
												className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-cyan/10 hover:bg-cyan/20 border border-cyan/30 hover:border-cyan/50 text-cyan font-semibold text-sm transition-all duration-200"
											>
												<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
													<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
													<polyline points="15 3 21 3 21 9" />
													<line x1="10" y1="14" x2="21" y2="3" />
												</svg>
												View Event
											</Link>
										</div>
									)}
								</div>
							);
						})}
					</div>
				) : (
					<HandDrawnCard>
						<div className="flex flex-col items-center justify-center py-12 space-y-4">
							<div className="text-6xl">👥</div>
							<h3 className="text-xl font-semibold text-white">No Teams yet</h3>
							<p className="text-gray-400">
								Join or create a Team
							</p>
						</div>
					</HandDrawnCard>
				)}

			</HandDrawnCard>
			<ConfirmationModal
				isOpen={!!memberToRemove}
				name={memberToRemove?.name}
				loading={updating}
				onConfirm={executeRemoveMember}
				onCancel={() => setMemberToRemove(null)}
			/>
		</>
	)
}

export default TeamsTab;