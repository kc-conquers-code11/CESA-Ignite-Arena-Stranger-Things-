import { ReactLenis } from 'lenis/react';
import StrangerHero from '../components/StrangerHero';
import { CompetitionLayout } from '../components/competition/CompetitionLayout';

const Index = () => {
  return (
    // 'root' prop zaroori hai taaki Lenis puri window ko control kare
    <ReactLenis root>
      <main className="bg-black min-h-screen w-full overflow-x-hidden">
        
        {/* HERO SECTION */}
        {/* z-10 rakha hai taaki ye neeche rahe jab scroll khatam ho */}
        <div className="relative z-10">
          <StrangerHero />
        </div>

        {/* COMPETITION CONTENT */}
        {/* 1. relative z-20: Isse ye Hero ke upar layer ho jayega.
            2. -mt-[1px]: Thoda sa negative margin taaki koi black line gap na dikhe.
        */}
        <div className="relative z-20 bg-black w-full -mt-[1px]">
           <CompetitionLayout />
        </div>

      </main>
    </ReactLenis>
  );
};

export default Index;