import {getDifficultyByName} from './difficulties';
import {normalizeSongName} from './song-name-helper';

export function getSongName(row: HTMLElement) {
  const playRecordSongNameElem = row.querySelector('.basic_block.break');
  if (playRecordSongNameElem) {
    // There can be 1 or 2 childNodes depending on whether "CLEAR!" image exists.
    // If "CLEAR!" image exists, it will be the first childNode.
    // Therefore, we always retrieve song name from the last childNode.
    return playRecordSongNameElem.childNodes.item(playRecordSongNameElem.childNodes.length - 1)
      .nodeValue;
  }
  return normalizeSongName(row.querySelector<HTMLElement>('.music_name_block').innerText);
}

export function getChartLevel(row: HTMLElement) {
  return row.querySelector<HTMLElement>('.music_lv_block').innerText;
}

export function getChartDifficulty(row: HTMLElement) {
  if (!row.classList.contains('pointer')) {
    const actualRow = row.querySelector<HTMLElement>('.pointer');
    row = actualRow || row;
  }
  const d = row.className.match(/music_([a-z]+)_score_back/)[1];
  return getDifficultyByName(d);
}

export function getPlayerName(n: HTMLElement) {
  if (n.className.includes('friend_vs_friend_block')) {
    return n.querySelector<HTMLElement>('.t_l')?.innerText;
  }
  return n.querySelector<HTMLElement>('.name_block')?.innerText;
}

export function getPlayerGrade(n: Document | HTMLElement) {
  const gradeImg = n.querySelector('.user_data_block_line ~ img.h_25');
  if (gradeImg instanceof HTMLImageElement) {
    const gradeIdx = gradeImg.src.lastIndexOf('grade_');
    return gradeImg.src.substring(gradeIdx + 6, gradeIdx + 8);
  }
  return null;
}

export function getAchievement(row: HTMLElement, isFriendScore = false): number {
  const elem = isFriendScore
    ? row.querySelector('tr:first-child td:last-child')
    : row.querySelectorAll('.music_score_block')[0];
  return elem instanceof HTMLElement ? parseFloat(elem.innerText) : 0;
}

export function getApFcStatus(row: HTMLElement, isFriendScore = false) {
  const img = isFriendScore
    ? row.querySelector('tr:last-child td:last-child img:nth-child(2)')
    : row.children[0].querySelector('img.f_r:nth-last-of-type(2)');
  if (!(img instanceof HTMLImageElement)) {
    return null;
  }
  const statusImgSrc = img.src.replace(/\?ver=.*$/, '');
  const lastUnderscoreIdx = statusImgSrc.lastIndexOf('_');
  const lastDotIdx = statusImgSrc.lastIndexOf('.');
  const lowercaseStatus = statusImgSrc.substring(lastUnderscoreIdx + 1, lastDotIdx);
  if (lowercaseStatus === 'back') {
    return null;
  }
  return lowercaseStatus.replace('ap', 'AP').replace('p', '+').toUpperCase();
}

export function getSyncStatus(row: HTMLElement, isFriendScore = false) {
  const img = isFriendScore
    ? row.querySelector('tr:last-child td:last-child img:first-child')
    : row.children[0].querySelector('img.f_r:nth-last-of-type(3)');
  if (!(img instanceof HTMLImageElement)) {
    return null;
  }
  const statusImgSrc = img.src.replace(/\?ver=.*$/, '');
  const lastUnderscoreIdx = statusImgSrc.lastIndexOf('_');
  const lastDotIdx = statusImgSrc.lastIndexOf('.');
  const lowercaseStatus = statusImgSrc.substring(lastUnderscoreIdx + 1, lastDotIdx);
  if (lowercaseStatus === 'back') {
    return null;
  }
  // FSD was renamed back to FDX in maimai BUDDiES.
  // To keep terminology consistent, we choose to say FSD and FSD+.
  return lowercaseStatus.toUpperCase().replace('P', '+').replace('FDX', 'FSD');
}

/**
 * Get DX Star on Friend VS page (DX score VS)
 */
export function getFriendDxStar(row: HTMLElement): number {
  const img = row.querySelector('tr:first-child td:last-child img') as HTMLImageElement;
  if (!img) {
    return 0;
  }
  const imgPath = new URL(img.src).pathname;
  const dxStar = imgPath.substring(imgPath.lastIndexOf('_') + 1, imgPath.lastIndexOf('.'));
  try {
    const dxStarInt = parseInt(dxStar);
    if (isNaN(dxStarInt) || dxStarInt < 0) {
      console.warn('invalid dx star ' + dxStar);
      return 0;
    }
    return dxStarInt;
  } catch (err) {
    console.warn('invalid dx star ' + dxStar);
  }
  return 0;
}
