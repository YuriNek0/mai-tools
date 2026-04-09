import {memo} from 'react';

import {BreakScoreMap, FullNoteType, Judgement, ScorePerType} from '../types';
import {BreakNoteJudgement} from './BreakNoteJudgement';
import {NextRankInfo} from './NextRankInfo';
import {NoteJudgement} from './NoteJudgement';

interface JudgementContainerProps {
  judgementDisplayMap: Map<FullNoteType, Record<Judgement, number>>;
  noteLoss: Map<FullNoteType, Record<Judgement, string>>;
  breakDistribution: BreakScoreMap;
  scorePerType: ScorePerType;
  nextRank?: {title: string; diff: number};
  combo?: string;
  isDxMode: boolean;
  showDetail: boolean;
}

export const JudgementContainer = memo(
  ({
    breakDistribution,
    combo,
    isDxMode,
    nextRank,
    judgementDisplayMap,
    noteLoss,
    scorePerType,
    showDetail,
  }: JudgementContainerProps) => {
    return (
      <div className="judgementContainer">
        <table className="judgement">
          <tbody>
            <tr>
              <th className="rowHead">&nbsp;</th>
              <th className="perfect">Perfect</th>
              <th className="great">Great</th>
              <th className="good">Good</th>
              <th className="miss">Miss</th>
              <th className="score">Score</th>
            </tr>
            <NoteJudgement
              noteType="total"
              judgements={judgementDisplayMap.get('total')}
              loss={noteLoss.get('total')}
              lastColumn={scorePerType.get('total')}
              isDxMode={isDxMode}
              showDetail={showDetail}
            />
            <NextRankInfo nextRank={nextRank} showTitle={showDetail} />
            {combo && (
              <tr className="maxCombo">
                <th className="noRightBorder" colSpan={4}>
                  MAX COMBO
                </th>
                <td className="noLeftBorder" colSpan={2}>
                  {combo}
                </td>
              </tr>
            )}
            <tr className="tableSeparator">
              <td colSpan={6}></td>
            </tr>
            <NoteJudgement
              noteType="tap"
              judgements={judgementDisplayMap.get('tap')}
              loss={noteLoss.get('tap')}
              lastColumn={scorePerType.get('tap')}
              isDxMode={isDxMode}
              showDetail={showDetail}
            />
            <NoteJudgement
              noteType="hold"
              judgements={judgementDisplayMap.get('hold')}
              loss={noteLoss.get('hold')}
              lastColumn={scorePerType.get('hold')}
              isDxMode={isDxMode}
              showDetail={showDetail}
            />
            <NoteJudgement
              noteType="slide"
              judgements={judgementDisplayMap.get('slide')}
              loss={noteLoss.get('slide')}
              lastColumn={scorePerType.get('slide')}
              isDxMode={isDxMode}
              showDetail={showDetail}
            />
            <NoteJudgement
              noteType="touch"
              judgements={judgementDisplayMap.get('touch')}
              loss={noteLoss.get('touch')}
              lastColumn={scorePerType.get('touch')}
              isDxMode={isDxMode}
              showDetail={showDetail}
            />
            <BreakNoteJudgement
              judgements={judgementDisplayMap.get('break')}
              loss={noteLoss.get('break')}
              distribution={breakDistribution}
              lastColumn={scorePerType.get('break')}
              isDxMode={isDxMode}
              showDetail={showDetail}
            />
          </tbody>
        </table>
      </div>
    );
  },
);
