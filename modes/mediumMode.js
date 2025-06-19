const mediumColors = ['yellow', 'purple', 'pink']

export function prepareMediumModeSequence() {
  const count = 3 + Math.floor(Math.random() * 3) // số bước trước green (3–5)
  return generateRandomColorSequence(mediumColors, count, 1000, 2000)
}

function generateRandomColorSequence(colors, count, minDelay, maxDelay) {
  // Vị trí xuất hiện màu green: từ vị trí 1 đến count (không bao giờ là vị trí 0)
  const greenIndex = 2 + Math.floor(Math.random() * (count - 1))

  const sequence = []

  for (let i = 0; i < greenIndex; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)]
    const delay = Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay
    sequence.push({ color, delay })
  }

  // green là cuối cùng
  sequence.push({ color: 'green', delay: 0 })

  return sequence
}
