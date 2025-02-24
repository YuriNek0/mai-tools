import {Difficulty} from './difficulties';
import {Language} from './lang';

const MessagesByLang = {
  [Language.zh_TW]: {
    done: '✔',
    bscStart: '讀取綠譜成績中…',
    advStart: '讀取黃譜成績中…',
    expStart: '讀取紅譜成績中…',
    masStart: '讀取紫譜成績中…',
    remStart: '讀取白譜成績中…',
    recentStart: '讀取最近遊玩紀錄中…',
  },
  [Language.en_US]: {
    done: '✔',
    bscStart: 'Loading Basic scores…',
    advStart: 'Loading Advanced scores…',
    expStart: 'Loading Expert scores…',
    masStart: 'Loading Master scores…',
    remStart: 'Loading Re:Master scores…',
    recentStart: 'Loading recent plays…',
  },
  [Language.ko_KR]: {
    done: '✔',
    bscStart: 'Basic 정확도 불러오는 중…',
    advStart: 'Advanced 정확도 불러오는 중…',
    expStart: 'Expert 정확도 불러오는 중…',
    masStart: 'Master 정확도 불러오는 중…',
    remStart: 'Re:Master 정확도 불러오는 중…',
    recentStart: '최근 플레이 불러오는 중…',
  },
};

export function statusText(lang: Language, difficulty: Difficulty, end?: boolean): string {
  const UIString = MessagesByLang[lang];
  if (end) {
    return UIString.done + '\n';
  }
  switch (difficulty) {
    case Difficulty.ReMASTER:
      return UIString.remStart;
    case Difficulty.MASTER:
      return UIString.masStart;
    case Difficulty.EXPERT:
      return UIString.expStart;
    case Difficulty.ADVANCED:
      return UIString.advStart;
    case Difficulty.BASIC:
      return UIString.bscStart;
  }
  return UIString.recentStart;
}
