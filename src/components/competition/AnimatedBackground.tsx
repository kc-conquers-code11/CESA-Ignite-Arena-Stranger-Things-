import { motion } from 'framer-motion';

export const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Deep dark base with red undertones - Static layers do not need optimization */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-black" />

      {/* Stranger Things red fog/mist at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/10 via-primary/5 to-transparent" />

      {/* Upside Down blue tint at top */}
      <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-accent/5 to-transparent" />

      {/* Animated red grid - 80s style */}
      <div className="absolute inset-0 grid-bg opacity-60" />

      {/* Particle effect overlay */}
      <div className="absolute inset-0 particles opacity-40" />

      {/* Floating red orbs - like Demogorgon eyes */}
      {/* OPTIMIZATION: Added will-change and transform: translateZ(0) to force GPU layer promotion */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          top: '5%',
          left: '5%',
          background: 'radial-gradient(circle, hsla(0, 85%, 50%, 0.1) 0%, hsla(0, 85%, 50%, 0.05) 30%, transparent 70%)',
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear", // Switched to linear for smoother, less calc-heavy ease if acceptable, else strict easeInOut
          times: [0, 0.5, 1] // Explicit timing to help interpolation
        }}
      />

      {/* Pink/magenta orb */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          top: '40%',
          right: '5%',
          background: 'radial-gradient(circle, hsla(330, 80%, 55%, 0.08) 0%, hsla(330, 80%, 55%, 0.04) 30%, transparent 70%)',
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
        animate={{
          x: [0, -40, 0],
          y: [0, 50, 0],
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Upside Down blue portal effect */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          bottom: '-10%',
          left: '30%',
          background: 'radial-gradient(circle, hsla(200, 80%, 50%, 0.06) 0%, hsla(200, 80%, 30%, 0.03) 40%, transparent 70%)',
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
          rotate: [0, 10, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Flickering light bulbs effect - scattered */}
      {/* Flickering light bulbs effect - OPTIMIZED */}
      {/* Removed box-shadow animation. Used simple opacity on static glow. */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-primary"
          style={{
            top: `${15 + (i * 15)}%`,
            left: `${10 + (i * 14)}%`,
            // Static shadow, we animate opacity of the whole element or a wrapper
            boxShadow: '0 0 10px 2px hsla(0, 85%, 50%, 0.5)',
            willChange: 'opacity',
          }}
          animate={{
            opacity: [0.2, 0.8, 0.2, 0.9, 0.4, 0.8, 0.2], // Animate opacity instead of complex shadow
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: "linear",
            delay: i * 0.3,
          }}
        />
      ))}

      {/* Vine-like tendrils from Upside Down - OPTIMIZED */}
      {/* Removed pathLength animation which forces layout re-calculation. Using simple opacity pulse. */}
      <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <motion.path
          d="M0,100 Q20,80 10,60 T20,20 T0,0"
          stroke="hsl(200 80% 50%)"
          strokeWidth="0.3"
          fill="none"
          initial={{ opacity: 0.1 }}
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d="M100,100 Q80,70 90,50 T80,30 T100,0"
          stroke="hsl(0 85% 50%)"
          strokeWidth="0.3"
          fill="none"
          initial={{ opacity: 0.1 }}
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </svg>

      {/* CRT Scanlines overlay - Static */}
      <div className="absolute inset-0 scanlines opacity-20" />

      {/* Subtle noise texture - Static */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette - dark edges */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/70" />

      {/* Extra darkness at corners for mystery */}
      <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-gradient-to-br from-black/40 to-transparent" />
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-black/40 to-transparent" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-black/40 to-transparent" />
      <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tl from-black/40 to-transparent" />
    </div>
  );
};
