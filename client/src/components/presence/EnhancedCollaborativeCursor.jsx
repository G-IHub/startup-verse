import { motion, AnimatePresence } from "motion/react";
import {
  MousePointer2,
  MessageCircle,
  Zap,
  Crown,
  Code,
  Palette,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState, useEffect } from "react";

// Trail effect component
function CursorTrail({ x, y, color }) {
  const [trails, setTrails] = useState([]);
  useEffect(() => {
    const newTrail = {
      id: Date.now(),
      x,
      y,
    };
    setTrails((prev) => [...prev.slice(-5), newTrail]); // Keep last 5 positions
  }, [x, y]);
  return (
    <>
      {trails.map((trail, index) => (
        <motion.div
          key={trail.id}
          className="absolute pointer-events-none z-40"
          style={{
            left: trail.x,
            top: trail.y,
          }}
          initial={{
            opacity: 0.6,
            scale: 1,
          }}
          animate={{
            opacity: 0,
            scale: 0.5,
          }}
          transition={{
            duration: 0.6,
          }}
        >
          <div
            className="w-3 h-3 rounded-full blur-sm"
            style={{
              backgroundColor: color,
              opacity: ((index + 1) / trails.length) * 0.4,
            }}
          />
        </motion.div>
      ))}
    </>
  );
}

// Role-based cursor styling
function getRoleIcon(role) {
  if (!role) return null;
  const roleLower = role.toLowerCase();
  if (roleLower.includes("founder") || roleLower.includes("ceo")) {
    return <Crown className="w-3 h-3" />;
  }
  if (roleLower.includes("dev") || roleLower.includes("engineer")) {
    return <Code className="w-3 h-3" />;
  }
  if (roleLower.includes("design")) {
    return <Palette className="w-3 h-3" />;
  }
  if (roleLower.includes("market") || roleLower.includes("sales")) {
    return <TrendingUp className="w-3 h-3" />;
  }
  if (roleLower.includes("product") || roleLower.includes("manager")) {
    return <Users className="w-3 h-3" />;
  }
  return null;
}
function getRoleCursorStyle(role) {
  if (!role) return {};
  const roleLower = role.toLowerCase();

  // Founders get a crown-shaped cursor with gold accent
  if (roleLower.includes("founder") || roleLower.includes("ceo")) {
    return {
      filter: "drop-shadow(0 0 8px rgba(255, 215, 0, 0.6))",
    };
  }

  // Developers get a sharper, more angular cursor
  if (roleLower.includes("dev") || roleLower.includes("engineer")) {
    return {
      filter: "drop-shadow(0 0 6px rgba(59, 130, 246, 0.5))",
    };
  }

  // Designers get a colorful, creative cursor
  if (roleLower.includes("design")) {
    return {
      filter: "drop-shadow(0 0 8px rgba(236, 72, 153, 0.6)) hue-rotate(10deg)",
    };
  }
  return {};
}
function getRoleGradient(role, color) {
  if (!role) return color || "#95A5A6";
  const roleLower = role.toLowerCase();
  if (roleLower.includes("founder") || roleLower.includes("ceo")) {
    return `linear-gradient(135deg, ${color} 0%, #FFD700 100%)`;
  }
  if (roleLower.includes("dev") || roleLower.includes("engineer")) {
    return `linear-gradient(135deg, ${color} 0%, #3B82F6 100%)`;
  }
  if (roleLower.includes("design")) {
    return `linear-gradient(135deg, ${color} 0%, #EC4899 100%)`;
  }
  return color || "#95A5A6";
}
export function EnhancedCollaborativeCursor({
  userName,
  userRole,
  x,
  y,
  color,
  activity,
  isTyping = false,
  onClick,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const roleIcon = getRoleIcon(userRole);
  const roleCursorStyle = getRoleCursorStyle(userRole);
  const roleGradient = getRoleGradient(userRole, color);
  const isFounder =
    userRole?.toLowerCase().includes("founder") ||
    userRole?.toLowerCase().includes("ceo");
  return (
    <>
      <CursorTrail x={x} y={y} color={color} />
      <motion.div
        className="absolute pointer-events-auto z-50 cursor-pointer"
        animate={{
          x,
          y,
        }}
        transition={{
          type: "spring",
          damping: 20,
          stiffness: 200,
          mass: 0.4,
        }}
        style={{
          left: 0,
          top: 0,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
        whileHover={{
          scale: 1.15,
        }}
      >
        <div className="relative">
          <motion.div
            animate={{
              rotate: isHovered ? -5 : 0,
              scale: isFounder ? [1, 1.1, 1] : 1,
            }}
            transition={{
              duration: 0.2,
              scale: {
                repeat: isFounder ? Infinity : 0,
                duration: 2,
              },
            }}
            style={roleCursorStyle}
          >
            {isFounder ? (
              <Crown
                className="w-6 h-6 drop-shadow-lg"
                style={{
                  color: "#FFD700",
                }}
                fill="#FFD700"
              />
            ) : (
              <MousePointer2
                className="w-6 h-6 drop-shadow-lg"
                style={{
                  color,
                }}
                fill={color}
              />
            )}
          </motion.div>
          {activity === "working" && (
            <motion.div
              className="absolute -inset-2 rounded-full pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.6, 0.2, 0.6],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
              }}
            />
          )}
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.8,
            }}
            animate={{
              opacity: 1,
              scale: isHovered ? 1.05 : 1,
            }}
            className="absolute top-6 left-3 px-2.5 py-1.5 rounded-lg text-white text-xs whitespace-nowrap shadow-xl flex items-center gap-1.5"
            style={{
              background: roleGradient,
              boxShadow: `0 4px 12px ${color}40, 0 2px 4px rgba(0,0,0,0.2)`,
              border: isFounder ? "1px solid rgba(255, 215, 0, 0.3)" : "none",
            }}
          >
            {roleIcon && <span className="opacity-90">{roleIcon}</span>}
            <span className="font-medium">{userName}</span>
            {activity === "in-call" && (
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                }}
                className="w-1.5 h-1.5 bg-white rounded-full"
              />
            )}
            {activity === "messaging" && <MessageCircle className="w-3 h-3" />}
            {activity === "working" && <Zap className="w-3 h-3" />}
          </motion.div>
          {userRole && (
            <motion.div
              initial={{
                opacity: 0,
                y: -5,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="absolute top-14 left-3 bg-popover text-popover-foreground border border-border px-2 py-0.5 rounded text-[10px] shadow-md"
            >
              {userRole}
            </motion.div>
          )}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -5,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: -5,
                }}
                className="absolute top-20 left-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 py-1 rounded text-[10px] flex items-center gap-1 shadow-lg"
              >
                <span className="font-medium">typing</span>
                <motion.span
                  animate={{
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                  }}
                >
                  ...
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {isHovered && onClick && (
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.9,
                  y: 5,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.9,
                  y: 5,
                }}
                className="absolute top-[88px] left-3 bg-blue-600 text-white px-2.5 py-1.5 rounded-lg text-[10px] shadow-lg whitespace-nowrap flex items-center gap-1"
              >
                <MessageCircle className="w-3 h-3" />
                <span className="font-medium">Click to chat</span>
              </motion.div>
            )}
          </AnimatePresence>
          {isFounder && (
            <motion.div
              className="absolute -inset-3 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(255, 215, 0, 0.2) 0%, transparent 70%)",
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                repeat: Infinity,
                duration: 3,
              }}
            />
          )}
        </div>
      </motion.div>
    </>
  );
}
