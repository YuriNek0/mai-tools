import {EMPTY_JUDGEMENT_OBJ} from './constants';
import {FullNoteType, Judgement, NoteType, StrictJudgement} from './types';

export function calculateJudgementDisplayMap(
  noteJudgements: Map<NoteType, Record<StrictJudgement, number>>,
): Map<FullNoteType, Record<Judgement, number>> {
  const res: Map<FullNoteType, Record<Judgement, number>> = new Map();
  const totalCount = {...EMPTY_JUDGEMENT_OBJ};
  noteJudgements.forEach((noteJ, noteType) => {
    res.set(noteType, {
      perfect: noteJ.cp + noteJ.perfect,
      great: noteJ.great,
      good: noteJ.good,
      miss: noteJ.miss,
    });
    // Update total judgement count
    Object.keys(noteJ).forEach((rawJ) => {
      const j = rawJ as StrictJudgement;
      totalCount[j === 'cp' ? 'perfect' : j] += noteJ[j];
    });
  });
  res.set('total', totalCount);
  return res;
}

export function convertJudgementsToArray(jarr: Record<StrictJudgement, number>): number[] {
  if (typeof jarr.cp === 'number' && jarr.cp !== 0) {
    return [jarr.cp, jarr.perfect, jarr.great, jarr.good, jarr.miss];
  }
  return [jarr.perfect, jarr.great, jarr.good, jarr.miss];
}
