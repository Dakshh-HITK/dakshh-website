import { DotOrbit } from '@paper-design/shaders-react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import StatsSection from './components/StatsSection';
// import EventsGrid from './components/EventsGrid';
import SponsorsSection from './components/SponsorsSection';
import Footer from './components/Footer';
// import AnnouncementsSection from './components/AnnouncementsSection';
import SpaceLoader from './components/SpaceLoader';
import Crewmates from './components/Crewmates';

export default function Home() {
  return (
    <div className="w-full h-full relative overflow-hidden" data-main-content>
      <SpaceLoader />
      <Navbar />
      <div className="fixed inset-0 w-full h-full z-0">
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
      <div className="relative z-10 h-full">
        <Crewmates />
        <div id="home" className="relative z-10 pt-10">
          <Hero />
        </div>
        {/* <div id="announcements" className="relative z-10">
          <AnnouncementsSection />
        </div> */}
        <div id="stats" className="relative z-10">
          <StatsSection />
        </div>
        {/* <div id="events" className="relative z-10">
          <EventsGrid />
        </div> */}
        <div id="sponsors" className="relative z-10">
          <SponsorsSection />
        </div>
        <div id="contact" className="relative z-10">
          <Footer />
        </div>
      </div>
    </div>
  );
}
