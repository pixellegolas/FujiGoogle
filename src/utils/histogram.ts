import { HistogramData } from '../types';

export function computeHistogram(imageData: ImageData, binCount = 64): HistogramData {
  const data = imageData.data;
  const len = data.length;
  const rBins = new Array(binCount).fill(0);
  const gBins = new Array(binCount).fill(0);
  const bBins = new Array(binCount).fill(0);
  const lumBins = new Array(binCount).fill(0);

  const binScale = binCount / 256;
  // Step by 4 pixels (16 bytes) for fast 60fps performance
  const step = 16;

  for (let i = 0; i < len; i += step) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

    const rIdx = Math.min(binCount - 1, Math.floor(r * binScale));
    const gIdx = Math.min(binCount - 1, Math.floor(g * binScale));
    const bIdx = Math.min(binCount - 1, Math.floor(b * binScale));
    const lumIdx = Math.min(binCount - 1, Math.floor(lum * binScale));

    rBins[rIdx]++;
    gBins[gIdx]++;
    bBins[bIdx]++;
    lumBins[lumIdx]++;
  }

  let max = 1;
  for (let i = 0; i < binCount; i++) {
    if (lumBins[i] > max) max = lumBins[i];
    if (rBins[i] > max) max = rBins[i];
    if (gBins[i] > max) max = gBins[i];
    if (bBins[i] > max) max = bBins[i];
  }

  return {
    r: rBins,
    g: gBins,
    b: bBins,
    lum: lumBins,
    max,
  };
}
