import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronDown, SkipForward } from "lucide-react"; // Icons for UX

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

//  1. Interface for Props
interface StrangerHeroProps {
  onComplete?: () => void;
}

export default function StrangerHero({ onComplete }: StrangerHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  const strangerChars = useRef<HTMLSpanElement[]>([]);
  const thingsChars = useRef<HTMLSpanElement[]>([]);

  const textTop = "STRANGER";
  const textBottom = "TECH"; 

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "+=2000", // Thoda fast kar diya (2500 -> 2000)
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        //  2. Magic Line: Scroll khatam hote hi Main Site khul jayegi
        onLeave: () => {
          if (onComplete) onComplete();
        }
      },
    });

    // 1. Background Animation
    tl.to(bgRef.current, { scale: 1.5, opacity: 0, ease: "power1.in", duration: 1 }, 0);

    // 2. Main Wrapper Zoom
    tl.to(wrapperRef.current, { scale: 20, opacity: 0, ease: "power2.inOut", duration: 1 }, 0);

    // 3. BAR Logic
    tl.to(barRef.current, { scaleX: 5, opacity: 0, ease: "power2.in", duration: 0.8 }, 0);

    // 4. Letter Physics (STRANGER)
    tl.to(strangerChars.current, {
      y: "-150vh", 
      x: (i) => {
        const center = (textTop.length - 1) / 2;
        return (i - center) * 500; 
      },
      scale: 10, 
      rotate: (i) => (i - 3.5) * 20,
      ease: "power2.inOut",
      duration: 1
    }, 0);

    // 5. Letter Physics (TECH)
    tl.to(thingsChars.current, {
      y: "150vh", 
      x: (i) => {
        const center = (textBottom.length - 1) / 2;
        return (i - center) * 500;
      },
      scale: 10,
      rotate: (i) => (i - 1.5) * -20,
      ease: "power2.inOut",
      duration: 1
    }, 0);

  }, { scope: containerRef });

  return (
    <section 
      ref={containerRef} 
      className="relative w-full overflow-hidden bg-black flex flex-col items-center justify-center perspective-[1000px] z-50"
      style={{ height: "100vh" }}
    >
      
      {/* BACKGROUND */}
      <div ref={bgRef} className="absolute inset-0 z-0 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1518066000714-58c45f1a2c0a?q=80&w=2560&auto=format&fit=crop" 
          alt="Forest"
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_90%)]" />
      </div>

      {/*  SKIP BUTTON (Top Right) */}
      <button 
        onClick={onComplete}
        className="absolute top-8 right-8 z-50 flex items-center gap-2 px-4 py-2 border border-zinc-700 bg-black/50 hover:bg-red-900/40 text-zinc-400 hover:text-white rounded-full transition-all text-sm font-bold uppercase tracking-wider backdrop-blur-md"
      >
        Skip Intro <SkipForward className="w-4 h-4" />
      </button>

      {/* CONTENT WRAPPER */}
      <div 
        ref={wrapperRef}
        className="relative z-20 flex flex-col items-center justify-center will-change-transform"
      >
        
        {/* TOP WORD: STRANGER */}
        <h1 className="flex justify-center overflow-visible">
          {textTop.split("").map((char, i) => (
            <span
              key={i}
              ref={(el) => { if (el) strangerChars.current[i] = el; }}
              className="font-st st-glow font-black select-none leading-none inline-block origin-center will-change-transform tracking-tighter mx-[-2px] text-white"
              style={{ fontSize: "clamp(3rem, 9vw, 8rem)", textShadow: "0 0 20px rgba(255,0,0,0.5)" }}
            >
              {char}
            </span>
          ))}
        </h1>

        {/* GLOWING BAR */}
        <div 
          ref={barRef}
          className="st-bar-glow w-[100%] h-[4px] md:h-[6px] my-4 rounded-full shadow-[0_0_30px_#ff1f1f] bg-red-600"
        />

        {/* BOTTOM WORD: TECH */}
        <h1 className="flex justify-center overflow-visible">
          {textBottom.split("").map((char, i) => (
            <span
              key={i}
              ref={(el) => { if (el) thingsChars.current[i] = el; }}
              className="font-st st-glow font-black select-none leading-none inline-block origin-center will-change-transform tracking-tighter mx-[-2px] text-white"
              style={{ fontSize: "clamp(3rem, 9vw, 8rem)", textShadow: "0 0 20px rgba(255,0,0,0.5)" }}
            >
              {char}
            </span>
          ))}
        </h1>

      </div>

      {/*  SCROLL HINT (Bottom) */}
      <div className="absolute bottom-10 z-20 animate-bounce flex flex-col items-center opacity-70">
        <span className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-2">Scroll to Enter</span>
        <ChevronDown className="text-red-600 w-6 h-6" />
      </div>

    </section>
  );
}