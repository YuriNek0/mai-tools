import {ChartType, getChartTypeName} from './chart-type';
import {fetchSongDetailPage} from './util';

export const RATING_TARGET_SONG_NAME_PREFIX = '▶ ';

export function normalizeSongName(name: string) {
  if (name === 'D✪N’T  ST✪P  R✪CKIN’') {
    return 'D✪N’T ST✪P R✪CKIN’';
  }
  return name.replace(/" \+ '/g, '').replace(/' \+ "/g, '');
}

export function getSongIdx(row: HTMLElement): string {
  const form = row.getElementsByTagName('form');
  if (!form.length) {
    return null;
  }
  return (form[0].elements.namedItem('idx') as HTMLInputElement).value;
}

export function getSongNickname(name: string, genre: string) {
  if (name === 'Link') {
    return genre.includes('niconico') ? 'Link (nico)' : 'Link (org)';
  }
  return name;
}

export function getSongNicknameForDxRatingNet(name: string, genre: string) {
  if (name === 'Link') {
    return genre.includes('niconico') ? 'Link (2)' : 'Link';
  }
  return name;
}

export function getSongNicknameWithChartType(
  name: string,
  genre: string,
  chartType: ChartType
): string {
  return getSongNickname(name, genre) + ' [' + getChartTypeName(chartType) + ']';
}

let cachedLinkIdx: {nico?: string; original?: string} = {};

export async function getLinkGenre(idx: string): Promise<string> {
  if (cachedLinkIdx.nico === idx) {
    return 'niconico';
  }
  if (cachedLinkIdx.original === idx) {
    return 'maimai';
  }
  const dom = await fetchSongDetailPage(idx);
  const isNico = (dom.body.querySelector('.m_10.m_t_5.t_r.f_12') as HTMLElement).innerText.includes(
    'niconico'
  );
  console.log('Link (idx: ' + idx + ') ' + (isNico ? 'is niconico' : 'is original'));
  if (isNico) {
    cachedLinkIdx.nico = idx;
  } else {
    cachedLinkIdx.original = idx;
  }
  return isNico ? 'nicknico' : 'maimai';
}

export function getSongGenreFromImg(songName: string, imgSrc: string): string {
  if (songName != 'Link') {
    return '';
  }
  return imgSrc.includes('e90f79d9dcff84df') ? 'niconico' : 'maimai';
}
