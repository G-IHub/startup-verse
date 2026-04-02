import { motion } from "motion/react";
import { MousePointer2 } from "lucide-react";
export function CollaborativeCursor({ userName, x, y, color }) {
  return (
    <motion.div
      className="fixed pointer-events-none z-50"
      animate={{
        x,
        y,
      }}
      transition={{
        type: "spring",
        damping: 30,
        stiffness: 200,
      }}
      style={{
        left: 0,
        top: 0,
      }}
    >
      <div className="relative">
        <MousePointer2
          className="w-5 h-5 drop-shadow-lg"
          style={{
            color,
          }}
          fill={color}
        />
        <div
          className="absolute top-5 left-2 px-2 py-1 rounded text-white text-xs whitespace-nowrap shadow-lg"
          style={{
            backgroundColor: color,
          }}
        >
          {userName}
        </div>
      </div>
    </motion.div>
  );
}
