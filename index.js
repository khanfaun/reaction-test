// [... các import và khai báo như cũ ...]

function prepareColorSequence() {
  const mode = modeSelect.value
  if (mode === 'easy') {
    colorSequence = prepareEasyModeSequence()
  } else if (mode === 'medium') {
    colorSequence = prepareMediumModeSequence()
  } else if (mode === 'hard') {
    gameState = 'color'
    triggerHardModeCircles()
    return
  }

  gameState = 'color'
  runColorSequence(0)
}

// ✅ Hard Mode: Vòng tròn gây nhiễu sau delay nền đỏ
function triggerHardModeCircles() {
  resetColors()
  clickarea.classList.add('red')
  updateText('Đợi màu xanh lá')

  document.querySelectorAll('.target-circle').forEach(c => c.remove())

  const delay = Math.floor(Math.random() * 3000) + 3000 // 3–6s

  setTimeout(() => {
    const numCircles = 6
    const greenIndex = Math.floor(Math.random() * numCircles)
    const circles = []

    for (let i = 0; i < numCircles; i++) {
      const circle = document.createElement('div')
      circle.classList.add('target-circle')
      const size = Math.floor(Math.random() * 60) + 40
      const color = i === greenIndex ? 'green' : getRandomDistractorColor()

      circle.style.width = `${size}px`
      circle.style.height = `${size}px`
      circle.style.backgroundColor = color
      circle.style.position = 'absolute'

      let x, y, attempts = 0
      do {
        x = Math.random() * (window.innerWidth - size)
        y = Math.random() * (window.innerHeight - size)
        attempts++
      } while (overlapsExisting(x, y, size, circles) && attempts < 30)

      circle.style.left = `${x}px`
      circle.style.top = `${y}px`

      if (i === greenIndex) {
        finishTime = new Date()
        circle.onclick = () => {
          const reactionTime = new Date() - finishTime
          updateText(`${reactionTime}ms`, 'Click để tiếp tục')
          updateScores(reactionTime)
          document.querySelectorAll('.target-circle').forEach(c => c.remove())
          gameState = 'result'
          clickarea.classList.add('blue')
        }
      } else {
        circle.onclick = () => {
          updateText('Sai màu!', 'Click để tiếp tục')
          document.querySelectorAll('.target-circle').forEach(c => c.remove())
          gameState = 'result'
          clickarea.classList.add('blue')
        }
      }

      document.body.appendChild(circle)
      circles.push({ x, y, size })
    }
  }, delay)
}

function overlapsExisting(x, y, size, existing) {
  return existing.some(c => {
    const dx = c.x - x
    const dy = c.y - y
    const distance = Math.sqrt(dx * dx + dy * dy)
    return distance < (c.size + size) / 2
  })
}

function getRandomDistractorColor() {
  const distractors = ['#ff9933', '#33ccff', '#cc66ff', '#ffff66', '#ff66b2']
  return distractors[Math.floor(Math.random() * distractors.length)]
}

// [... phần còn lại giữ nguyên như cũ: updateScores, startWaitingPhase, renderChart, sự kiện click, showIdleState ...]
