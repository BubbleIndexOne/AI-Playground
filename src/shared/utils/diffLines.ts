export interface DiffLine {
  readonly type: 'same' | 'added' | 'removed';
  readonly text: string;
  readonly oldLineNumber?: number;
  readonly newLineNumber?: number;
}

export function computeLineDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  const m = oldLines.length;
  const n = newLines.length;

  // LCS matrix for line-level diff
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0)
  );

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (oldLines[i] === newLines[j]) {
        dp[i][j] = 1 + dp[i + 1][j + 1];
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;

  while (i < m && j < n) {
    if (oldLines[i] === newLines[j]) {
      result.push({
        type: 'same',
        text: oldLines[i],
        oldLineNumber: i + 1,
        newLineNumber: j + 1,
      });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({
        type: 'removed',
        text: oldLines[i],
        oldLineNumber: i + 1,
      });
      i++;
    } else {
      result.push({
        type: 'added',
        text: newLines[j],
        newLineNumber: j + 1,
      });
      j++;
    }
  }

  while (i < m) {
    result.push({
      type: 'removed',
      text: oldLines[i],
      oldLineNumber: i + 1,
    });
    i++;
  }

  while (j < n) {
    result.push({
      type: 'added',
      text: newLines[j],
      newLineNumber: j + 1,
    });
    j++;
  }

  return result;
}
