import { prepareEasyModeSequence } from './modes/easyMode.js'
import { prepareMediumModeSequence } from './modes/mediumMode.js'
import { prepareHardModeSequence } from './modes/hardMode.js'
import { drawChart, getTitleFromScores } from './chart.js'

let gameState = 'idle'
let finishTime = null
let currentColor = ''
let colorSequence = []
let colorTimeout = null
let currentColorBeforeGreen = 'blue'

const clickarea = document.querySelector('.clickarea')
const message = document.querySelector('.message')
const note = document.querySelector('.note')
const modeSelect = document.getElementById('mode')
const bestScoreSpan = document.getElementById('bestScore')
const chartModal = document.getElementById('chartModal')
const currentTitle = document.getElementById('currentTitle')
const highestTitle = document.getElementById('highestTitle')

const greenCircle = document.createElement('div')
greenCircle.className = 'green-circle'
greenCircle.style.display = 'none'
document.body.appendChild(greenCircle)

function resetColors() {
  clickarea.className = 'clickarea'
}

function updateText(msg, noteMsg = '') {
  message.textContent = msg
  note.textContent = noteMsg
}

function getBestScore() {
  const mode = modeSelect.value
  return sessionStorage.getItem(`best_${mode}`) || '--'
}

function getScores(mode) {
  return JSON.parse(sessionStorage.getItem(`scores_${mode}`)) || []
}

function updateScores(newScore) {
  const mode = modeSelect.value
  let list = getScores(mode)
  list.push(newScore)
  sessionStorage.setItem(`scores_${mode}`, JSON.stringify(list))

  const best = Math.min(...list)
  sessionStorage.setItem(`best_${mode}`, best)
  bestScoreSpan.textContent = `Best: ${best} ms`

  const title = getTitleFromScores(list)
  currentTitle.textContent = `Danh hiệu: ${title}`
}

function startWaitingPhase() {
  gameState = 'waiting'
  resetColors()
  clickarea.classList.add('blue')
  updateText('Đợi màu xanh lá')
  prepareColorSequence()
}

function prepareColorSequence() {
  const mode = modeSelect.value

  if (mode === 'easy') {
    colorSequence = prepareEasyModeSequence()
  } else if (mode === 'medium') {
    colorSequence = prepareMediumModeSequence()
  } else if (mode === 'hard') {
    colorSequence = prepareHardModeSequence()
  }

  gameState = 'color'
  runColorSequence(0)
}

function runColorSequence(index) {
  if (gameState !== 'color' || index >= colorSequence.length) return

  const nextColor = colorSequence[index].color

  if (nextColor === 'green' && modeSelect.value === 'hard') {
    currentColor = nextColor
    showGreenCircle()
    gameState = 'color' // vẫn trong trạng thái chờ click
    return
  }

  if (nextColor === 'green') {
    finishTime = new Date()
    updateText('Click')
  } else {
    updateText('Đợi màu xanh lá')
  }

  resetColors()
  currentColor = nextColor
  clickarea.classList.add(currentColor)

  colorTimeout = setTimeout(() => runColorSequence(index + 1), colorSequence[index].delay)
}

function showGreenCircle() {
  const size = Math.floor(Math.random() * 100) + 80
  const x = Math.floor(Math.random() * (window.innerWidth - size))
  const y = Math.floor(Math.random() * (window.innerHeight - size))

  greenCircle.style.width = `${size}px`
  greenCircle.style.height = `${size}px`
  greenCircle.style.left = `${x}px`
  greenCircle.style.top = `${y}px`
  greenCircle.style.display = 'block'
  greenCircle.style.position = 'absolute'

  resetColors()
  clickarea.classList.add(currentColorBeforeGreen)
  updateText('')
  finishTime = new Date()

  greenCircle.onclick = () => {
    greenCircle.style.display = 'none'
    gameState = 'result'
    resetColors()
    clickarea.classList.add('blue')
    const reactionTime = new Date() - finishTime
    updateText(`${reactionTime}ms`, 'Click để tiếp tục')
    updateScores(reactionTime)
  }
}

function handleClick(e) {
  e.preventDefault()

  if (gameState === 'idle') {
    startWaitingPhase()
  } else if (gameState === 'waiting') {
    return
  } else if (gameState === 'color') {
    if (currentColor === 'green') {
      if (modeSelect.value === 'hard') {
        gameState = 'result'
        resetColors()
        clickarea.classList.add('blue')
        updateText('Sai màu!', 'Click để tiếp tục')
        greenCircle.style.display = 'none'
        return
      }
      gameState = 'result'
      resetColors()
      clickarea.classList.add('blue')
      const reactionTime = new Date() - finishTime
      updateText(`${reactionTime}ms`, 'Click để tiếp tục')
      updateScores(reactionTime)
    } else {
      gameState = 'result'
      clearTimeout(colorTimeout)
      resetColors()
      clickarea.classList.add('blue')
      updateText('Sai màu!', 'Click để tiếp tục')
    }
  } else if (gameState === 'result') {
    startWaitingPhase()
  }
}

clickarea.addEventListener('click', handleClick)
clickarea.addEventListener('touchstart', handleClick)

modeSelect.addEventListener('change', () => {
  clearTimeout(colorTimeout) // dừng chuỗi màu đang chạy
  bestScoreSpan.textContent = `Best: ${getBestScore()} ms`
  greenCircle.style.display = 'none'
  showIdleState()
})

document.getElementById('showChartBtn').addEventListener('click', () => {
  chartModal.style.display = 'flex'
  setTimeout(() => {
    const mode = modeSelect.value
    renderChartForMode(mode)
  }, 100)
})

document.getElementById('closeChartBtn').addEventListener('click', () => {
  chartModal.style.display = 'none'
})

chartModal.addEventListener('click', (e) => {
  if (e.target === chartModal) chartModal.style.display = 'none'
})

function showIdleState() {
  gameState = 'idle'
  resetColors()
  clickarea.classList.add('blue')
  updateText('Đang chuẩn bị', 'Click để bắt đầu')

  const mode = modeSelect.value
  const scores = getScores(mode)
  currentTitle.textContent = `Danh hiệu: ${getTitleFromScores(scores)}`
}

function renderChartForMode(mode) {
  const scores = getScores(mode)
  drawChart(mode)
  highestTitle.textContent = `Danh hiệu đạt được: ${getTitleFromScores(scores)}`
}

document.querySelectorAll('.chart-mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.getAttribute('data-mode')
    renderChartForMode(mode)
  })
})

showIdleState()
bestScoreSpan.textContent = `Best: ${getBestScore()} ms`



