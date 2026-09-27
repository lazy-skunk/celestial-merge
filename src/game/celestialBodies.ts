import colors from "tailwindcss/colors";
import { BOARD_WIDTH } from "./board";

const FIRST_BODY_RADIUS = BOARD_WIDTH / 30;
const BODY_RADIUS_STEP = FIRST_BODY_RADIUS / 2;

// Zero-based consecutive values define merge order, radius, score, and drop candidates.
export enum CelestialLevel {
  Moon,
  Mercury,
  Venus,
  Earth,
  Mars,
  Jupiter,
  Saturn,
  Uranus,
  Neptune,
  Pluto,
  Sun,
  Galaxy,
}

// Numeric enums contain names and numbers; keep only numbers to list levels in merge order.
export const CELESTIAL_PROGRESSION = Object.values(CelestialLevel).filter(
  (level): level is CelestialLevel => typeof level === "number",
);

type CelestialBodyDefinition = { name: string; color: string };

export const CELESTIAL_BODIES: Record<CelestialLevel, CelestialBodyDefinition> = {
  [CelestialLevel.Moon]: {
    name: "月",
    color: colors.slate[500],
  },
  [CelestialLevel.Mercury]: {
    name: "水星",
    color: colors.zinc[600],
  },
  [CelestialLevel.Venus]: {
    name: "金星",
    color: colors.amber[700],
  },
  [CelestialLevel.Earth]: {
    name: "地球",
    color: colors.blue[700],
  },
  [CelestialLevel.Mars]: {
    name: "火星",
    color: colors.red[700],
  },
  [CelestialLevel.Jupiter]: {
    name: "木星",
    color: colors.orange[700],
  },
  [CelestialLevel.Saturn]: {
    name: "土星",
    color: colors.yellow[700],
  },
  [CelestialLevel.Uranus]: {
    name: "天王星",
    color: colors.cyan[700],
  },
  [CelestialLevel.Neptune]: {
    name: "海王星",
    color: colors.blue[900],
  },
  [CelestialLevel.Pluto]: {
    name: "冥王星",
    color: colors.stone[700],
  },
  [CelestialLevel.Sun]: {
    name: "太陽",
    color: colors.amber[600],
  },
  [CelestialLevel.Galaxy]: {
    name: "銀河",
    color: colors.violet[700],
  },
};

export function celestialBodyRadius(level: CelestialLevel) {
  return FIRST_BODY_RADIUS + BODY_RADIUS_STEP * level;
}
