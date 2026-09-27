import colors from "tailwindcss/colors";
import { BOARD_WIDTH } from "./board";

const FIRST_BODY_RADIUS = BOARD_WIDTH / 30;
const BODY_RADIUS_STEP = FIRST_BODY_RADIUS / 2;

export const CelestialLevel = {
  Moon: 0,
  Mercury: 1,
  Venus: 2,
  Earth: 3,
  Mars: 4,
  Jupiter: 5,
  Saturn: 6,
  Uranus: 7,
  Neptune: 8,
  Pluto: 9,
  Sun: 10,
  Galaxy: 11,
} as const;

export type CelestialLevel = (typeof CelestialLevel)[keyof typeof CelestialLevel];

export const CELESTIAL_PROGRESSION = Object.values(CelestialLevel);

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
