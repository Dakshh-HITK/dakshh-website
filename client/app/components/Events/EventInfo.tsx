'use client';

import { useState } from 'react';
import RulesModal from './RulesModal';
import PocModal from './PocModal';
import ReadMoreModal from './ReadMoreModal';

const EventInfo = ({ event, registering, registerForEvent }: any) => {
    const [showRules, setShowRules] = useState(false);
    const [showPoc, setShowPoc] = useState(false);
    const [showDesc, setShowDesc] = useState(false);

    const shortDesc =
        event.description.length > 200
            ? event.description.slice(0, 200) + '...'
            : event.description;

    return (
        <>
            <div className="bg-black/60 backdrop-blur-md rounded-2xl p-6 border border-white/10 space-y-4">
                <h2 className="text-xl font-semibold text-white">Description</h2>

                <p className="text-gray-300">
                    {shortDesc}
                    {event.description.length > 200 && (
                        <button
                            onClick={() => setShowDesc(true)}
                            className="ml-2 text-blue-400 hover:underline"
                        >
                            Read more
                        </button>
                    )}
                </p>

                <div className="flex flex-wrap gap-4 pt-4">
                    <button
                        onClick={() => setShowRules(true)}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Rules
                    </button>

                    <button
                        onClick={() => setShowPoc(true)}
                        className="px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-black"
                    >
                        POCs
                    </button>

                    <button
                        className="ml-auto px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold cursor-pointer"
                        disabled={registering}
                        onClick={registerForEvent}
                    >
                        Register Now
                    </button>
                </div>
            </div>

            {showRules && <RulesModal rules={event.rules} onClose={() => setShowRules(false)} />}
            {showPoc && <PocModal pocs={event.pocs} onClose={() => setShowPoc(false)} />}
            {showDesc && <ReadMoreModal text={event.description} onClose={() => setShowDesc(false)} />}
        </>
    );
};

export default EventInfo;