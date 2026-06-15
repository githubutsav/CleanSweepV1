import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { cn } from '../lib/utils';

export function GridBackground({ className, children, showSpotlight = true }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth mouse tracking spring physics
  const springConfig = { damping: 25, stiffness: 200, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = ({ currentTarget, clientX, clientY }) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative w-full overflow-hidden bg-[#111412]",
        className
      )}
    >
      {/* 1. Underlying SVG Grid Pattern */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.55]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(65, 238, 194, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(65, 238, 194, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* 2. Secondary fine grid pattern for subtle complexity */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.25]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(65, 238, 194, 0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(65, 238, 194, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: '10px 10px',
        }}
      />

      {/* 3. Interactive Mouse Spotlight Glow */}
      {showSpotlight && isHovered && (
        <motion.div
          className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: `
              radial-gradient(
                350px circle at ${smoothX.get()}px ${smoothY.get()}px,
                rgba(65, 238, 194, 0.15),
                transparent 80%
              )
            `,
          }}
        />
      )}

      {/* 4. Radial Gradient Mask to fade out edges */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,transparent_15%,#111412_90%)]" />

      {/* 5. Content wrapper */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </motion.div>
  );
}
