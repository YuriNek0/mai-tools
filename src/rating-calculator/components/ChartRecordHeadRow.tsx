import {memo, useCallback} from 'react';

import {Language} from '../../common/lang';
import {useLanguage} from '../../common/lang-react';
import {CommonMessages} from '../common-messages';
import {ColumnType} from '../types';
import {ChartRecordRow} from './ChartRecordRow';

const MessagesByLang = {
  [Language.en_US]: {
    num: '#',
    song: 'Song',
    target: 'Target',
  },
  [Language.zh_TW]: {
    num: '#',
    song: '歌曲',
    target: '目標',
  },
  [Language.ko_KR]: {
    num: '#',
    song: '노래',
    target: '목표',
  },
};

function getColumnTitle(lang: Language, col: ColumnType): string {
  const messages = MessagesByLang[lang];
  return {
    [ColumnType.NO]: messages.num,
    [ColumnType.SONG_TITLE]: messages.song,
    [ColumnType.VERSION]: CommonMessages[lang].version,
    [ColumnType.CHART_TYPE]: CommonMessages[lang].chartType,
    [ColumnType.LEVEL]: CommonMessages[lang].level,
    [ColumnType.ACHIEVEMENT]: CommonMessages[lang].achievementAbbr,
    [ColumnType.RANK]: CommonMessages[lang].rank,
    [ColumnType.RATING]: CommonMessages[lang].rating,
    [ColumnType.TARGET]: messages.target,
  }[col];
}

interface Props {
  columns?: ReadonlyArray<ColumnType>;
  sortBy?: (col: ColumnType) => void;
}

export const ChartRecordHeadRow = memo(({columns, sortBy}: Props) => {
  const lang = useLanguage();
  const handleClick = sortBy && ((col: ColumnType) => sortBy(col));
  const renderCell = useCallback((col: ColumnType) => getColumnTitle(lang, col), [lang]);

  return (
    <ChartRecordRow columns={columns} onClickCell={handleClick} isHeading renderCell={renderCell} />
  );
});
