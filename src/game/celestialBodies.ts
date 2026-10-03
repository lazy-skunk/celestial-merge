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
} as const;

export type CelestialLevel = (typeof CelestialLevel)[keyof typeof CelestialLevel];

export const CELESTIAL_PROGRESSION = Object.values(CelestialLevel);

// Coordinates in the original image, including transparent padding.
// Measure the spherical surface only; exclude rings and glow.
export type ImageBodyCircle = Readonly<{ cx: number; cy: number; radius: number }>;

type CelestialBodyDefinition = {
  name: string;
  image: string;
  imageBody: ImageBodyCircle;
};

export const CELESTIAL_BODIES: Record<CelestialLevel, CelestialBodyDefinition> = {
  [CelestialLevel.Moon]: {
    image: import.meta.env.BASE_URL + "space04_moon.webp",
    imageBody: { cx: 208, cy: 204, radius: 195 },
    name: "月",
  },
  [CelestialLevel.Mercury]: {
    image: import.meta.env.BASE_URL + "space02_mercury.webp",
    imageBody: { cx: 204, cy: 205, radius: 195 },
    name: "水星",
  },
  [CelestialLevel.Venus]: {
    image: import.meta.env.BASE_URL + "space03_venus.webp",
    imageBody: { cx: 206, cy: 205, radius: 195 },
    name: "金星",
  },
  [CelestialLevel.Earth]: {
    image: import.meta.env.BASE_URL + "space04_earth.webp",
    imageBody: { cx: 212, cy: 204, radius: 195 },
    name: "地球",
  },
  [CelestialLevel.Mars]: {
    image: import.meta.env.BASE_URL + "space05_mars.webp",
    imageBody: { cx: 207, cy: 202, radius: 195 },
    name: "火星",
  },
  [CelestialLevel.Jupiter]: {
    image: import.meta.env.BASE_URL + "space06_jupitor.webp",
    imageBody: { cx: 210, cy: 202, radius: 195 },
    name: "木星",
  },
  [CelestialLevel.Saturn]: {
    image: import.meta.env.BASE_URL + "space07_saturn.webp",
    imageBody: { cx: 366, cy: 233, radius: 195 },
    name: "土星",
  },
  [CelestialLevel.Uranus]: {
    image: import.meta.env.BASE_URL + "space07_uranus.webp",
    imageBody: { cx: 249, cy: 356, radius: 195 },
    name: "天王星",
  },
  [CelestialLevel.Neptune]: {
    image: import.meta.env.BASE_URL + "space08_neptune.webp",
    imageBody: { cx: 209, cy: 205, radius: 195 },
    name: "海王星",
  },
  [CelestialLevel.Pluto]: {
    image: import.meta.env.BASE_URL + "space09_pluto.webp",
    imageBody: { cx: 207, cy: 205, radius: 195 },
    name: "冥王星",
  },
  [CelestialLevel.Sun]: {
    image: import.meta.env.BASE_URL + "space01_sun.webp",
    imageBody: { cx: 289, cy: 271, radius: 245 },
    name: "太陽",
  },
};

export function celestialBodyRadius(level: CelestialLevel) {
  return FIRST_BODY_RADIUS + BODY_RADIUS_STEP * level;
}
