import { prepareEasyModeSequence } from './modes/easyMode.js'
import { prepareMediumModeSequence } from './modes/mediumMode.js'
import { prepareHardModeSequence } from './modes/hardMode.js'
import { drawChart, getTitleFromScores } from './chart.js'

let gameState = 'idle'
let finishTime = null
let currentColor = ''
let colorSequence = []
let colorTimeout = null

const clickarea = document.querySelector('.clickarea')
const message = document.querySelector('.message')
const note = document.querySelector('.note')
const modeSelect = document.getElementById('mode')
const bestScoreSpan = document.getElementById('bestScore')
const chartModal = document.getElementById('chartModal')
const currentTitle = document.getElementById('currentTitle')
const highestTitle = document.getElementById('highestTitle')

const colorMap = {
  blue: '#1F4591',
  pink: '#ff80bf',
  yellow: '#ffd966',
  purple: '#b266ff',
  green: '#00cc66',
  red: '#cc0033'
}

// Các hàm tiện ích

function getContrastYIQ(hexcolor) {
  const r = parseInt(hexcolor.substr(1, 2), 16)
  const g = parseInt(hexcolor.substr(3, 2), 16)
  const b = parseInt(hexcolor.substr(5, 2), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? 'black' : 'white'
}

function applyContrastColorToChartBtn() {
  const btn = document.getElementById('showChartBtn')
  const svg = btn.querySelector('svg')
  const activeColorClass = Array.from(clickarea.classList).find(cls =>
    Object.keys(colorMap).includes(cls)
  )
  const hex = colorMap[activeColorClass] || '#1F4591'
  const contrast = getContrastYIQ(hex)
  btn.style.color = contrast
  svg.style.filter = contrast === 'white' ? 'brightness(0) invert(1)' : 'brightness(0) invert(0)'
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
  currentTitle.innerHTML = getTitleFromScores(list, mode)
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
    gameState = 'color'
    triggerHardModeCircles()
    return
  }
  gameState = 'color'
  runColorSequence(0)
}

function runColorSequence(index) {
  if (gameState !== 'color' || index >= colorSequence.length) return
  const nextColor = colorSequence[index].color
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

function handleClick(e) {
  e.preventDefault()
  if (gameState === 'idle') {
    startWaitingPhase()
  } else if (gameState === 'waiting') {
    return
  } else if (gameState === 'color') {
    if (currentColor === 'green') {
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

// Event listeners

clickarea.addEventListener('click', handleClick)
clickarea.addEventListener('touchstart', handleClick)

modeSelect.addEventListener('change', () => {
  clearTimeout(colorTimeout)
  bestScoreSpan.textContent = `Best: ${getBestScore()} ms`
  resetColors()
  clickarea.classList.add('blue')
  showIdleState()
})

document.getElementById('showChartBtn').addEventListener('click', () => {
  chartModal.style.display = 'flex'
  setTimeout(() => renderChartForMode(modeSelect.value), 100)
})

document.getElementById('closeChartBtn').addEventListener('click', () => {
  chartModal.style.display = 'none'
})

chartModal.addEventListener('click', e => {
  if (e.target === chartModal) chartModal.style.display = 'none'
})

function showIdleState() {
  gameState = 'idle'
  resetColors()
  clickarea.classList.add('blue')
  updateText('Đang chuẩn bị', 'Click để bắt đầu')
  currentTitle.innerHTML = getTitleFromScores(getScores(modeSelect.value), modeSelect.value)
  applyContrastColorToChartBtn()
}

function renderChartForMode(mode) {
  drawChart(mode)
  highestTitle.innerHTML = getTitleFromScores(getScores(mode), mode)
}

document.querySelectorAll('.chart-mode-btn').forEach(btn =>
  btn.addEventListener('click', () => renderChartForMode(btn.dataset.mode))
)

document.getElementById('resetScoresBtn').addEventListener('click', () => {
  const mode = modeSelect.value
  if (confirm(`Bạn có chắc muốn xóa dữ liệu của chế độ "${mode}"?`)) {
    localStorage.removeItem(`scores_${mode}`)
    localStorage.removeItem(`best_${mode}`)
    bestScoreSpan.textContent = 'Best: -- ms'
    currentTitle.innerHTML = getTitleFromScores([], mode)
    renderChartForMode(mode)
  }
})

// 🎯 Hard Mode: logic vòng tròn với delay trên nền đỏ

function triggerHardModeCircles() {
  resetColors()
  clickarea.classList.add('red')
  updateText('Đợi màu xanh lá')
  document.querySelectorAll('.target-circle').forEach(c => c.remove())

  const delay = Math.floor(Math.random() * 3000) + 3000

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
    const distance = Math.hypot(dx, dy)
    // Kiểm tra nếu trung tâm cách nhau < bán kính tổng => coi như chồng
    return distance < (c.size + size) / 2
  })
}

function getRandomDistractorColor() {
  const distractors = ['#ff9933', '#33ccff', '#cc66ff', '#ffff66', '#ff66b2']
  return distractors[Math.floor(Math.random() * distractors.length)]
}

// Khởi tạo trạng thái ban đầu
showIdleState()
bestScoreSpan.textContent = `Best: ${getBestScore()} ms`
