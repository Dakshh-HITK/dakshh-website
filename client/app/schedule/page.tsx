// "use client";

// import React, { useState, useEffect } from "react";
// import Navbar from "../components/Navbar";
// import { DotOrbit } from "@paper-design/shaders-react";
// import Crewmates from "../components/Crewmates";
// import { Rocket, List } from "lucide-react";
// import SabotageLoader from "../components/SabotageLoader";
// import InteractiveTimeline from "../components/InteractiveTimeline";
// import SimpleList from "../components/SimpleList";

// export default function SchedulePage() {
//   const [viewMode, setViewMode] = useState<"fun" | "simple">("fun");
//   const [displayLoading, setDisplayLoading] = useState(true);

//   useEffect(() => {
//     const timer = setTimeout(() => setDisplayLoading(false), 2000); 
//     return () => clearTimeout(timer);
//   }, []);

//   if (displayLoading) return <SabotageLoader />;

//   return (
//     <div className="w-full min-h-screen relative bg-black" data-main-content>
//       <Navbar />

//       <div className="fixed inset-0 w-full h-full z-0">
//         <DotOrbit
//           width="100%" height="100%" colors={["#ffffff", "#00FFFF", "#FFD700"]}
//           colorBack="#000000" stepsPerColor={4} size={0.2} sizeRange={0.5} spreading={1} speed={0.5} scale={0.35}
//         />
//       </div>

//       <div className="relative z-10 min-h-screen pb-24">
//         <Crewmates />

//         <div className="relative z-10 pt-28 px-4 max-w-6xl mx-auto">
          
//           <div className="flex flex-col items-center justify-center mb-16">
//             <h1 className="hand-drawn-title text-5xl! md:text-6xl! text-white mb-4">
//               Mission Schedule
//             </h1>
//             <p className="text-center text-[#00FFFF] font-mono tracking-widest mb-10 max-w-2xl text-sm md:text-base uppercase" style={{ filter: "url(#wobbly-text)" }}>
//               &gt; Complete your tasks before the impostor strikes_
//             </p>

//             <div className="flex items-center gap-4 md:gap-6 bg-black/40 p-3 rounded-3xl border-2 border-white/20 backdrop-blur-md">
//               <button
//                 onClick={() => setViewMode("fun")}
//                 className={`flex items-center gap-2 transition-all ${
//                   viewMode === "fun" 
//                   ? "hand-drawn-button py-2! px-4! md:px-6!" 
//                   : "text-white/60 hover:text-white px-4 md:px-6 py-2 uppercase font-bold tracking-widest text-sm md:text-base"
//                 }`}
//                 style={viewMode !== "fun" ? { filter: "url(#wobbly-text)" } : {}}
//               >
//                 <Rocket size={18} /> Interactive Map
//               </button>

//               <div className="w-0.5 h-8 bg-white/20 rounded-full" />

//               <button
//                 onClick={() => setViewMode("simple")}
//                 className={`flex items-center gap-2 transition-all ${
//                   viewMode === "simple" 
//                   ? "hand-drawn-button py-2! px-4! md:px-6!" 
//                   : "text-white/60 hover:text-white px-4 md:px-6 py-2 uppercase font-bold tracking-widest text-sm md:text-base"
//                 }`}
//                 style={viewMode !== "simple" ? { filter: "url(#wobbly-text)" } : {}}
//               >
//                 <List size={18} /> Simple List
//               </button>
//             </div>
//           </div>

//           <div className="relative w-full">
//             {/* Conditional render of views based on state */}
//             {viewMode === "fun" ? <InteractiveTimeline /> : <SimpleList />}
//           </div>
          
//         </div>
//       </div>
//     </div>
//   );
// }

import React from "react";
import Navbar from "../components/Navbar";
import { DotOrbit } from "@paper-design/shaders-react";
import Crewmates from "../components/Crewmates";
import ComingSoon from "../components/ComingSoon";

const page = () => {
  return (
    <div className="w-full min-h-screen relative" data-main-content>
      <Navbar />

      <div className="fixed inset-0 w-full h-full z-0">
        <DotOrbit
          width="100%"
          height="100%"
          colors={["#ffffff", "#006aff", "#fff675"]}
          colorBack="#000000"
          stepsPerColor={4}
          size={0.2}
          sizeRange={0.5}
          spreading={1}
          speed={0.5}
          scale={0.35}
        />
      </div>
      <div className="relative z-10 h-full overflow-hidden">
        <Crewmates />
        <ComingSoon />
      </div>
    </div>
  );
};

export default page;
