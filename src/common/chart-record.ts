import {ChartType} from './chart-type';
import {Difficulty} from './difficulties';

export interface ChartRecord {
  songName: string;
  genre: string;
  difficulty: Difficulty;
  level: number;
  chartType: ChartType;
  achievement: number;
  // Since CiRCLE, AP will add 1 rating point, so we need to get the full combo / all perfect status.
  fcap: string; // FC, AP, etc.
}

export interface FullChartRecord extends ChartRecord {
  version: number; // GameVersion. -1 if unknown
  sync: string; // FS, FSD, etc.
  dxscore: {max: number; player: number; ratio: number; star: number};
}
