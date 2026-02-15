'use client';

import Navbar from '../../components/Navbar';
import { DotOrbit } from '@paper-design/shaders-react';
import Crewmates from '../../components/Crewmates';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useParams } from 'next/navigation';
import EventHeader from '@/app/components/Events/EventHeader';
import EventInfo from '@/app/components/Events/EventInfo';
import EventSidebar from '@/app/components/Events/EventSidebar';

const EventPage = () => {
	const { id } = useParams<{ id: string }>();
	const [event, setEvent] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [registering, setRegistering] = useState(false);

	// const registerForSoloEvent = async () => {
	// 	if (!id) return;
	// 	setRegistering(true);
	// 	try {
	// 		const res = await fetch(`/api/registration/solo/${id}`, {
	// 			method: "POST",
	// 			headers: { "Content-Type": "application/json" },
	// 		});
	// 		const data = await res.json();

	// 		if (!res.ok) {
	// 			toast.error(data.error || 'Failed to load event');
	// 			return;
	// 		}

	// 		toast.success(data.message);
	// 	} catch (error) {
	// 		console.error(error);
	// 		toast.error((error as Error)?.message || "Failed to register to event");
	// 	} finally {
	// 		setRegistering(false);
	// 	}
	// }

	const registerForEvent = async () => {
		if (!id || !event) return;
		setRegistering(true);

		// Determine endpoint based on event type
		const endpoint = event.isTeamEvent
			? `/api/registration/team/create/${id}`
			: `/api/registration/solo/${id}`;
		console.log(endpoint)

		try {
			const res = await fetch(endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			});

			const data = await res.json();
			console.log(data);

			if (!res.ok) {
				toast.error(data.error || 'Registration failed');
				return;
			}

			if (event.isTeam && data.teamId) {
				toast.success(`Team created! Share this code: ${data.teamId}`, {
					duration: 6000,
				});
			} else {
				toast.success(data.message || "Registered successfully!");
			}
		} catch (error) {
			console.error(error);
			toast.error((error as Error)?.message || "Failed to register to event");
		} finally {
			setRegistering(false);
		}
	};

	useEffect(() => {
		if (!id) return;

		const fetchEvent = async () => {
			setLoading(true);
			try {
				const res = await fetch(`/api/events/${id}`);
				const data = await res.json();

				if (!res.ok) {
					toast.error(data.error || 'Failed to load event');
					return;
				}

				setEvent(data);
			} catch (error) {
				console.error(error);
				toast.error((error as Error)?.message || "Failed to fetch to event details");
			} finally {
				setLoading(false);
			}
		};

		fetchEvent();
	}, [id]);

	console.log(event)

	return (
		<div className="w-full min-h-screen relative">
			<Navbar />

			{/* Background */}
			<div className="fixed inset-0 z-0">
				<DotOrbit
					width="100%"
					height="100%"
					colors={['#ffffff', '#006aff', '#fff675']}
					colorBack="#000000"
					stepsPerColor={4}
					size={0.2}
					sizeRange={0.5}
					spreading={1}
					speed={0.5}
					scale={0.35}
				/>
			</div>

			<div className="relative z-10 h-full overflow-hidden py-20">
				<Crewmates />
				{loading && (
					<div className="h-[70vh] flex items-center justify-center text-white">
						Loading event...
					</div>
				)}

				{!loading && event && (
					<div className="max-w-7xl z-20 mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
						<div className="lg:col-span-2 space-y-8">
							<EventHeader event={event} />
							<EventInfo
								event={event}
								registering={registering}
								registerForEvent={registerForEvent}
							/>
						</div>

						<EventSidebar event={event} />
					</div>
				)}
			</div>
		</div>
	);
};

export default EventPage;