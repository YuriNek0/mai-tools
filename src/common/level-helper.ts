import {GameVersion} from './game-version';

export type LevelDef = {
  title: string;
  minLv: number;
  maxLv: number;
};

export const MAX_LEVEL = 15;

const MIN_LEVEL = 1;

export function getMaxMinorBeforePlus(gameVer: GameVersion): number {
  return gameVer > GameVersion.BUDDiES ? 0.5 : 0.6;
}

export function getMinMinorOfPlus(gameVer: GameVersion): number {
  return gameVer > GameVersion.BUDDiES ? 0.6 : 0.7;
}

export function getOfficialLevel(gameVer: GameVersion, level: number): string {
  const baseLevel = Math.floor(level);
  return level - baseLevel > getMaxMinorBeforePlus(gameVer)
    ? baseLevel + '+'
    : baseLevel.toString();
}

/**
 * Compute the default level based on the official level.
 * Since BUDDiES PLUS, + starts from x.6. For example,
 *   "10" contains 10.0 - 10.5, and "10+" contains 10.6 - 10.9
 * In BUDDiES or older versions, + starts from x.7.
 */
export function getMinConstant(gameVer: GameVersion, officialLevel: string): number {
  if (!officialLevel) {
    return MIN_LEVEL;
  }
  const baseLevel = parseInt(officialLevel);
  return officialLevel.endsWith('+') ? baseLevel + getMinMinorOfPlus(gameVer) : baseLevel;
}

export function getMaxConstant(gameVer: GameVersion, officialLevel: string): number {
  if (!officialLevel) {
    return MIN_LEVEL;
  }
  const baseLevel = parseInt(officialLevel);
  return officialLevel.endsWith('+') ? baseLevel + 0.9 : baseLevel + getMaxMinorBeforePlus(gameVer);
}

export function getDisplayLv(internalLv: number): string {
  const lvIsPrecise = internalLv > 0;
  if (lvIsPrecise) {
    return internalLv.toFixed(1);
  } else if (internalLv === 0) {
    return '?';
  }
  return Math.abs(internalLv).toFixed(1) + '~';
}

export function compareLevels(lv1: number, lv2: number): number {
  if (Math.abs(lv1) === Math.abs(lv2)) {
    return lv1 < 0 ? -1 : lv2 < 0 ? 1 : 0;
  }
  const absLv1 = Math.abs(lv1);
  const absLv2 = Math.abs(lv2);
  return absLv1 < absLv2 ? -1 : absLv2 < absLv1 ? 1 : 0;
}
