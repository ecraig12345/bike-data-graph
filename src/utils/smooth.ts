import type { ScatterDataPoint } from 'chart.js';

/**
 * Smooth the data IN PLACE taking into account points before and after.
 * Returns the max value after smoothing.
 */
export function smooth(points: ScatterDataPoint[], before = 3, after = 3): number {
  let max = 0;
  for (let i = 0; i < points.length; i++) {
    const curr = points[i];
    const nums = [curr.y];
    for (let b = 1; b <= before; b++) {
      // these were already smoothed, which will affect the result a bit differently
      // than if it was making a new array (not sure if it matters)
      nums.push(points[i - b]?.y);
    }
    for (let a = 1; a <= after; a++) {
      nums.push(points[i + a]?.y);
    }
    curr.y = average(nums);
    max = Math.max(max, curr.y);
  }
  return max;
}

function average(data: (number | undefined)[]) {
  const valid = data.filter((d) => typeof d === 'number') as number[];
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

// also interesting https://stackoverflow.com/questions/32788836/smoothing-out-values-of-an-array
