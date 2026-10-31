import { type PropsWithChildren, useEffect, useId } from "react";
import { useColorScheme, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { useMotionPreference } from "@/shared/lib/motion";
import { useScreenFocusedWhile } from "@/shared/lib/use-screen-focused-while";

/** The Zetamind spectral thread (design system Rev. 6), dark and light, as on the desktop. */
const SPECTRE_DARK = ["#22e4ff", "#3d7bff", "#8b5cf6", "#c026d3", "#ff4fa3", "#ff8a3d", "#ffd84d", "#5cffb0"];
const SPECTRE_LIGHT = ["#0099ae", "#3d7bff", "#8b5cf6", "#c026d3", "#ff3395", "#ec5e00", "#ac8600", "#00a053"];
/** One turn of the thread, in milliseconds: the same pace as the desktop ring. */
const TURN_MS = 2400;
/** The ring sits this many points outside the avatar box, and is this thick. */
const RING_GAP = 3;
const RING_WIDTH = 2;

function pointOnCircle(center: number, radius: number, angle: number): { x: number; y: number } {
  return { x: center + radius * Math.cos(angle), y: center + radius * Math.sin(angle) };
}

/**
 * The thread as eight arcs, each fading into the next colour, so the ring reads as one continuous
 * spectrum. react-native-svg has no conic gradient, which the desktop uses.
 */
function SpectralRing({ box }: { box: number }) {
  const id = `fil-${useId().replaceAll(":", "")}`;
  const colors = useColorScheme() === "light" ? SPECTRE_LIGHT : SPECTRE_DARK;
  const center = box / 2;
  const radius = center - RING_WIDTH / 2;
  const step = (2 * Math.PI) / colors.length;
  return (
    <Svg accessibilityElementsHidden accessible={false} height={box} pointerEvents="none" width={box}>
      <Defs>
        {colors.map((color, index) => {
          const from = pointOnCircle(center, radius, index * step);
          const to = pointOnCircle(center, radius, (index + 1) * step);
          return (
            <LinearGradient
              key={color}
              id={`${id}-${index}`}
              gradientUnits="userSpaceOnUse"
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
            >
              <Stop offset={0} stopColor={color} />
              <Stop offset={1} stopColor={colors[(index + 1) % colors.length] ?? color} />
            </LinearGradient>
          );
        })}
      </Defs>
      {colors.map((color, index) => {
        const from = pointOnCircle(center, radius, index * step);
        const to = pointOnCircle(center, radius, (index + 1) * step);
        return (
          <Path
            key={color}
            d={`M ${from.x} ${from.y} A ${radius} ${radius} 0 0 1 ${to.x} ${to.y}`}
            fill="none"
            stroke={`url(#${id}-${index})`}
            strokeWidth={RING_WIDTH}
          />
        );
      })}
    </Svg>
  );
}

/**
 * The Zetamind spectral thread that turns around a working agent, in place of the old orbit rings.
 * With reduced motion, or with the Settings switch for faces off, the thread holds still, as on the
 * desktop. It stops while the screen is not focused.
 */
export function AgentOrbitRings({ active, size, children }: PropsWithChildren<{ active: boolean; size: number }>) {
  const turn = useSharedValue(0);
  const animate = useMotionPreference("agentFaces");
  const focused = useScreenFocusedWhile(active && animate);
  useEffect(() => {
    turn.set(0);
    if (!active || !animate || !focused) return;
    turn.set(
      withRepeat(
        withTiming(360, { duration: TURN_MS, easing: Easing.linear, reduceMotion: ReduceMotion.Never }),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(turn);
  }, [active, animate, turn, focused]);
  const turning = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.get()}deg` }] }));
  const box = size + RING_GAP * 2;
  return (
    <View style={{ width: size, height: size }}>
      {children}
      {active ? (
        <Animated.View
          pointerEvents="none"
          style={[{ position: "absolute", left: -RING_GAP, top: -RING_GAP, width: box, height: box }, turning]}
        >
          <SpectralRing box={box} />
        </Animated.View>
      ) : null}
    </View>
  );
}
