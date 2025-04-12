import {ChartType, getChartTypeName, getChartTypeNameForDxRatingNet} from './chart-type';
import {Difficulty, getDifficultyNameForDxRatingNet} from './difficulties';
import {fetchSongDetailPage} from './util';

export const RATING_TARGET_SONG_NAME_PREFIX = '▶ ';

// This function is shared with Taiwan-independence.
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

export function getGenreFromNickname(nickname: string): string {
  if (nickname === 'Link (nico)') {
    return 'niconico';
  } else if (nickname === 'Link (org)') {
    return 'maimai';
  }
  return '';
}

export function getSheetIdForDxRatingNet(name: string, genre: string, c: ChartType, d: Difficulty) {
  const songName = name !== 'Link' ? name : genre.includes('niconico') ? 'Link (2)' : 'Link';
  const chartType = getChartTypeNameForDxRatingNet(c);
  const difficulty = getDifficultyNameForDxRatingNet(d);
  return `${songName}__dxrt__${chartType}__dxrt__${difficulty}`;
}

export function getSongNicknameWithChartType(
  name: string,
  genre: string,
  chartType: ChartType
): string {
  return getSongNickname(name, genre) + ' [' + getChartTypeName(chartType) + ']';
}

let cachedGenreByIdx: Record<string, string> = {};

export function getCachedSongGenre(idx: string): string {
  return cachedGenreByIdx[idx];
}

export async function fetchSongGenre(idx: string): Promise<string> {
  const cachedGenre = getCachedSongGenre(idx);
  if (cachedGenre) {
    return cachedGenre;
  }
  const dom = await fetchSongDetailPage(idx);
  const name = dom.body.querySelector('.m_5.f_15.break').textContent.trim();
  const genre = dom.body.querySelector('.t_r.blue').textContent.trim();
  console.log(`${idx} is ${name} from ${genre}`);
  cachedGenreByIdx[idx] = genre;
  return genre;
}

export function getSongGenreFromImg(songName: string, imgSrc: string): string {
  if (songName !== 'Link') {
    return '';
  }
  return imgSrc.includes('e90f79d9dcff84df') ? 'niconico' : 'maimai';
}
