/**
 * Split the range into equal parts
 * @param start: number. Start time
 * @param end: number. End time
 * @param nb: number. Number of element or resolution
 * @return array of numbers
 */
export const splitRangeIntoEqualParts = (start, end, nb) => {
  const result = new Array(nb);
  if (nb === 1) {
    if (start === end) {
      result[0] = start;
      return result;
    }
  }

  const stepSize = Math.abs(end - start) / (nb - 1);
  for (let i = 0; i < nb; i++) {
    result[i] = Math.min(start, end) + Math.round(i * stepSize);
  }
  result[result.length - 1] = Math.max(start, end);
  return { start: result[0], end: result[1], nbTimes: nb }
}
