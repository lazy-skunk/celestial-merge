import { describe, expect, test } from "vite-plus/test";
import { CELESTIAL_PROGRESSION, CelestialLevel } from "../celestialBodies";
import { pitchSlotToFrequency } from "./soundEffect";

describe("sound effect", () => {
  const pitchSlotCount = CELESTIAL_PROGRESSION.length;

  test("raises pitch as merge level increases", () => {
    // Arrange
    const lowLevel = CelestialLevel.Moon;
    const middleLevel = CelestialLevel.Jupiter;
    const highLevel = CelestialLevel.Sun;

    // Act
    const lowFrequency = pitchSlotToFrequency(lowLevel, pitchSlotCount);
    const middleFrequency = pitchSlotToFrequency(middleLevel, pitchSlotCount);
    const highFrequency = pitchSlotToFrequency(highLevel, pitchSlotCount);

    // Assert
    expect(middleFrequency).toBeGreaterThan(lowFrequency);
    expect(highFrequency).toBeGreaterThan(middleFrequency);
  });

  test("divides the one octave pitch range by celestial levels", () => {
    // Arrange
    const baseFrequency = 440;
    const oneOctaveAboveBaseFrequency = 880;
    const middleMergeLevel = CelestialLevel.Jupiter;
    const pitchStep =
      (oneOctaveAboveBaseFrequency - baseFrequency) / (CELESTIAL_PROGRESSION.length - 1);

    // Act
    const minimumFrequency = pitchSlotToFrequency(CelestialLevel.Moon, pitchSlotCount);
    const middleFrequency = pitchSlotToFrequency(middleMergeLevel, pitchSlotCount);
    const maximumFrequency = pitchSlotToFrequency(CelestialLevel.Sun, pitchSlotCount);

    // Assert
    expect(minimumFrequency).toBe(baseFrequency);
    expect(middleFrequency).toBe(baseFrequency + pitchStep * middleMergeLevel);
    expect(maximumFrequency).toBe(oneOctaveAboveBaseFrequency);
  });

  test("uses the base pitch when there is only one level", () => {
    // Arrange
    const singlePitchSlotCount = 1;

    // Act
    const frequency = pitchSlotToFrequency(CelestialLevel.Sun, singlePitchSlotCount);

    // Assert
    expect(frequency).toBe(440);
  });
});
