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

// ⚙️ Bản đồ mã màu theo class
const colorMap = {
  blue: '#1F4591',
  pink: '#ff80bf',
  yellow: '#ffd966',
  purple: '#b266ff',
  green: '#00cc66',
  red: '#cc0033'
}

// Tính độ tương phản trắng/đen
function getContrastYIQ(hexcolor) {
  const r = parseInt(hexcolor.substr(1, 2), 16)
  const g = parseInt(hexcolor.substr(3, 2), 16)
  const b = parseInt(hexcolor.substr(5, 2), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return (yiq >= 128) ? 'black' : 'white'
}

// Đổi màu icon SVG và chữ của nút biểu đồ
function applyContrastColorToChartBtn() {
  const btn = document.getElementById('showChartBtn')
  const svg = btn.querySelector('svg')

  const activeColorClass = Array.from(clickarea.classList).find(cls =>
    Object.keys(colorMap).includes(cls)
  )

  const hex = colorMap[activeColorClass] || '#1F4591'
  const contrast = getContrastYIQ(hex)

  btn.style.color = contrast
  svg.style.filter = contrast === 'white'
    ? 'brightness(0) invert(1)'
    : 'brightness(0) invert(0)'
}

function resetColors() {
  clickarea.className = 'clickarea'
}

function updateText(msg, noteMsg = '') {
  message.textContent = msg
  note.textContent = noteMsg
}

function getBestScore() {
  const mode = modeSelect.value
  return localStorage.getItem(`best_${mode}`) || '--'
}

function getScores(mode) {
  return JSON.parse(localStorage.getItem(`scores_${mode}`)) || []
}

function updateScores(newScore) {
  const mode = modeSelect.value
  let list = getScores(mode)
  list.push(newScore)
  localStorage.setItem(`scores_${mode}`, JSON.stringify(list))

  const best = Math.min(...list)
  localStorage.setItem(`best_${mode}`, best)
  bestScoreSpan.textContent = `Best: ${best} ms`

  const title = getTitleFromScores(list, mode)
  currentTitle.innerHTML = title
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
    gameState = 'color'
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
  clearTimeout(colorTimeout)
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
  currentTitle.innerHTML = getTitleFromScores(scores, mode)
  applyContrastColorToChartBtn()
}

function renderChartForMode(mode) {
  const scores = getScores(mode)
  drawChart(mode)
  highestTitle.innerHTML = `${getTitleFromScores(scores, mode)}`
}

document.querySelectorAll('.chart-mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.getAttribute('data-mode')
    renderChartForMode(mode)
  })
})
document.getElementById('resetScoresBtn').addEventListener('click', () => {
  const mode = modeSelect.value
  if (confirm(`Bạn có chắc muốn xóa toàn bộ dữ liệu của chế độ "${mode}"?`)) {
    localStorage.removeItem(`scores_${mode}`)
    localStorage.removeItem(`best_${mode}`)
    bestScoreSpan.textContent = `Best: -- ms`
    currentTitle.innerHTML = getTitleFromScores([], mode)
    renderChartForMode(mode)
  }
})


showIdleState()
bestScoreSpan.textContent = `Best: ${getBestScore()} ms`

const allRanks = [
  'Chưa có rank', 'Silver 1','Silver 2','Silver 3','Silver 4',
  'Silver Elite','Silver Elite Master','Nova 1','Nova 2','Nova 3','Nova Master',
  'Master Guardian 1','Master Guardian 2','Master Guardian Elite',
  'Distinguished Master Guardian','Legendary Eagle','Legendary Eagle Master',
  'Supreme Master First Class','Global Elite'
]

function renderRankList() {
  const container = document.getElementById('rankList')
  if (!container) return
  container.innerHTML = ''

  allRanks.forEach((name, idx) => {
    const item = document.createElement('div')
    item.className = 'rank-item'
    item.innerHTML = `<img src="img/skillgroup${idx}.png" alt="${name}"><div>${name}</div>`
    container.appendChild(item)
  })
}

renderRankList()


