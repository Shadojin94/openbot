import { useId } from "react";
import { Pressable, View } from "react-native";
import Animated from "react-native-reanimated";
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from "react-native-svg";

import { type AppLogoAnimation, useAppLogoMotion } from "@/features/auth/components/use-app-logo-motion";
import { useText } from "@/shared/lib/text";

export interface AppLogoProps {
  animation?: AppLogoAnimation;
  interactive?: boolean;
  size?: number;
}

const VIEWBOX_SIZE = 240;
/** The Zetabot mark (Lee's v4), drawn on a 512 grid and scaled to the 240 viewBox. */
const SCALE = VIEWBOX_SIZE / 512;
const LEFT_EYE_CENTER_X = 222 * SCALE;
const RIGHT_EYE_CENTER_X = 290 * SCALE;
const EYE_CENTER_Y = 120;
const EYE_RADIUS = 18 * SCALE;
const HALO_RADIUS = 196.8 * SCALE;
const BACKGROUND_COLOR = "#000000";
const EYE_COLOR = "#f5f5f7";
/** The halo as radial gradient stops: transparent inside, the eight spectral colours, transparent outside. */
const HALO_STOPS = [
  { offset: 0.86, color: "#c026d3", opacity: 0 },
  { offset: 0.8775, color: "#c026d3", opacity: 1 },
  { offset: 0.8925, color: "#8b5cf6", opacity: 1 },
  { offset: 0.9075, color: "#3d7bff", opacity: 1 },
  { offset: 0.9225, color: "#22e4ff", opacity: 1 },
  { offset: 0.9375, color: "#5cffb0", opacity: 1 },
  { offset: 0.9525, color: "#ffd84d", opacity: 1 },
  { offset: 0.9675, color: "#ff8a3d", opacity: 1 },
  { offset: 0.9825, color: "#ff4fa3", opacity: 1 },
  { offset: 1, color: "#ff4fa3", opacity: 0 },
] as const;
export function AppLogo({ animation = "none", interactive = false, size = VIEWBOX_SIZE }: AppLogoProps) {
  const { t } = useText();
  const haloId = `zetabot-halo-${useId().replaceAll(":", "")}`;
  const { handlePressIn, leftEyeAnimatedStyle, rightEyeAnimatedStyle } = useAppLogoMotion({ animation, size });
  const eyeLayerStyle = {
    height: size,
    left: 0,
    position: "absolute" as const,
    top: 0,
    width: size,
  };

  const logo = (
    <View
      style={{ height: size, width: size }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}>
        <Defs>
          <RadialGradient id={haloId} cx={120} cy={120} r={HALO_RADIUS} gradientUnits="userSpaceOnUse">
            {HALO_STOPS.map((stop) => (
              <Stop key={stop.offset} offset={stop.offset} stopColor={stop.color} stopOpacity={stop.opacity} />
            ))}
          </RadialGradient>
        </Defs>
        <Rect width={VIEWBOX_SIZE} height={VIEWBOX_SIZE} rx={50} ry={50} fill={BACKGROUND_COLOR} />
        <Circle cx={120} cy={120} r={HALO_RADIUS} fill={`url(#${haloId})`} />
      </Svg>

      <Animated.View
        pointerEvents="none"
        style={[
          eyeLayerStyle,
          { transformOrigin: [(LEFT_EYE_CENTER_X * size) / VIEWBOX_SIZE, (EYE_CENTER_Y * size) / VIEWBOX_SIZE, 0] },
          leftEyeAnimatedStyle,
        ]}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}>
          <Circle cx={LEFT_EYE_CENTER_X} cy={EYE_CENTER_Y} r={EYE_RADIUS} fill={EYE_COLOR} />
        </Svg>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          eyeLayerStyle,
          { transformOrigin: [(RIGHT_EYE_CENTER_X * size) / VIEWBOX_SIZE, (EYE_CENTER_Y * size) / VIEWBOX_SIZE, 0] },
          rightEyeAnimatedStyle,
        ]}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}>
          <Circle cx={RIGHT_EYE_CENTER_X} cy={EYE_CENTER_Y} r={EYE_RADIUS} fill={EYE_COLOR} />
        </Svg>
      </Animated.View>
    </View>
  );

  if (!interactive) return logo;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("mobile.auth.logo.animate")}
      accessibilityHint={t("mobile.auth.logo.animateHint")}
      onPressIn={handlePressIn}
      pressRetentionOffset={12}
    >
      {logo}
    </Pressable>
  );
}
