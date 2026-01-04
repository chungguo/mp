/**
 * 计算几折
 * @param original 原价
 * @param current 现价
 */
export const discount = (original: number, current: number): string => {
  if (typeof original !== 'number' || typeof current !== 'number' || original === 0) {
    return '';
  }

  if (!(original - current)) {
    return '';
  }

  const num = ((current / original) * 10).toFixed(1);

  if (Number(num) === 0) {
    return '';
  }

  return num;
};
