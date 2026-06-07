function lcsTable(a: string[], b: string[]): number[][] {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
  return dp
}

type DiffLine = { type: 'same' | 'add' | 'remove'; line: string }

function diffLines(oldLines: string[], newLines: string[]): DiffLine[] {
  const dp = lcsTable(oldLines, newLines)
  const result: DiffLine[] = []
  let i = oldLines.length, j = newLines.length
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.unshift({ type: 'same', line: oldLines[i - 1] })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'add', line: newLines[j - 1] })
      j--
    } else {
      result.unshift({ type: 'remove', line: oldLines[i - 1] })
      i--
    }
  }
  return result
}

export function computeDiff(oldText: string, newText: string): string {
  if (oldText === newText) return '(no changes)'

  const oldLines = oldText.split('\n').map(l => l.trim()).filter(Boolean)
  const newLines = newText.split('\n').map(l => l.trim()).filter(Boolean)

  const hunks = diffLines(oldLines, newLines)
  const changes = hunks.filter(h => h.type !== 'same')

  if (changes.length === 0) return '(no changes)'

  return changes
    .map(h => (h.type === 'remove' ? `- ${h.line}` : `+ ${h.line}`))
    .join(' | ')
}
