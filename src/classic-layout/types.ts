export type NoteType = 'tap' | 'hold' | 'slide' | 'touch' | 'break';
export type FullNoteType = 'total' | NoteType;
export type BreakScore = 2600 | 2550 | 2500 | 2000 | 1500 | 1250 | 1000 | 0;
export type BreakScoreMap = Map<BreakScore, number>;
export type ScorePerType = Map<FullNoteType, {score: number | string; isMax: boolean}>;

export type Judgement = 'perfect' | 'great' | 'good' | 'miss';
export type StrictJudgement = 'cp' | Judgement;

export interface ScoreInfo {
  finaleAchievement: number;
  maxFinaleScore: number;
  breakDistribution: BreakScoreMap;
  finaleBorder: Map<string, number>;
  pctPerNoteType: Map<string, number>;
  playerScorePerType: ScorePerType;
  dxAchvPerType: ScorePerType;
  achvLossDetail: {
    dx: Map<FullNoteType, Record<Judgement | 'total', number>>;
    finale: Map<FullNoteType, Record<Judgement | 'total', number>>;
  };
}
