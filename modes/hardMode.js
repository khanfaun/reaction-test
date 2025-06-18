const hardColors = ['yellow', 'orange', 'purple', 'pink', 'cyan']

export function prepareHardModeSequence() {
  const count = 5 + Math.floor(Math.random() * 3)
  return generateRandomColorSequence(hardColors, count, 800, 1800)
}

function generateRandomColorSequence(colors, count, minDelay, maxDelay) {
  let sequence = Array.from({ length: count }, () => {
    const color = colors[Math.floor(Math.random() * colors.length)]
    const delay = Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay
    return { color, delay }
  })
  sequence.push({ color: 'green', delay: 0 })
  sequence = sequence.sort(() => Math.random() - 0.5)
  if (sequence[0].color === 'green') {
    [sequence[0], sequence[1]] = [sequence[1], sequence[0]]
  }
  return sequence
}
