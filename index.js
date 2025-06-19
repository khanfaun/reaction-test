import { prepareEasyModeSequence } from './modes/easyMode.js'
import { prepareMediumModeSequence } from './modes/mediumMode.js'
import { drawChart, getTitleFromScores, ranks, thresholds, computeScore } from './chart.js'

let gameState = 'idle'
let finishTime = null
let currentColor = ''
let colorSequence = []
let colorTimeout = null
let hardModeTimeout = null

const clickarea = document.querySelector('.clickarea')
const circleContainer = document.getElementById('circleContainer')
const message = document.querySelector('.message')
const note = document.querySelector('.note')
const modeSelect = document.getElementById('mode')
const bestScoreSpan = document.getElementById('bestScore')
const chartModal = document.getElementById('chartModal')
const currentTitle = document.getElementById('currentTitle')
const highestTitle = document.getElementById('highestTitle')
const signOutBtn = document.getElementById('signOutBtn')

const colorMap = {
  blue: '#1F4591',
  pink: '#ff80bf',
  yellow: '#ffd966',
  purple: '#b266ff',
  green: '#00cc66',
  red: '#cc0033'
}

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
  clickarea.style.backgroundColor = ''
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
    if (modeSelect.value === 'hard') {
      clearTimeout(hardModeTimeout)
      updateText('Sai màu!', 'Click để tiếp tục')
      circleContainer.innerHTML = ''
      gameState = 'result'
      clickarea.classList.add('blue')
      clickarea.style.backgroundColor = ''
    } else if (currentColor === 'green') {
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
  clearTimeout(hardModeTimeout)
  bestScoreSpan.textContent = `Best: ${getBestScore()} ms`
  resetColors()
  clickarea.classList.add('blue')
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
  document.getElementById('rankList').innerHTML = renderAllRanks(getCurrentRankIndex(scores, mode))
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

function triggerHardModeCircles() {
  resetColors()
  clickarea.classList.add('red')
  updateText('Đợi màu xanh lá')
  circleContainer.innerHTML = ''

  const delay = Math.floor(Math.random() * 3000) + 3000

  hardModeTimeout = setTimeout(() => {
    const numCircles = Math.floor(Math.random() * 9) + 7
    const greenIndex = Math.floor(Math.random() * numCircles)
    const circles = []

    updateText('', '')
    clickarea.style.backgroundColor = 'black'

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
          circleContainer.innerHTML = ''
          gameState = 'result'
          clickarea.classList.add('blue')
          clickarea.style.backgroundColor = ''
        }
      } else {
        circle.onclick = () => {
          updateText('Sai màu!', 'Click để tiếp tục')
          circleContainer.innerHTML = ''
          gameState = 'result'
          clickarea.classList.add('blue')
          clickarea.style.backgroundColor = ''
        }
      }

      circleContainer.appendChild(circle)
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

function getCurrentRankIndex(scores, mode) {
  const { average, count } = computeScore(scores, mode)
  let idx = 0
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (average >= thresholds[i].avg && count >= thresholds[i].count) {
      idx = i + 1
      break
    }
  }
  return idx
}

function renderAllRanks(currentIdx) {
  return ranks.map((name, idx) => {
    const active = idx === currentIdx ? 'style="filter: drop-shadow(0 0 6px #fff); font-weight: bold;"' : ''
    return `
      <div class="rank-item" ${active}>
        <img src="img/skillgroup${idx}.png" alt="${name}">
        <span>${name}</span>
      </div>
    `
  }).join('')
}

// 🔐 Đăng nhập, kiểm tra trùng tên, lưu local

function isNameTaken(name) {
  const takenNames = JSON.parse(localStorage.getItem('takenNames') || '[]')
  return takenNames.includes(name.toLowerCase())
}

function registerName(name) {
  const taken = JSON.parse(localStorage.getItem('takenNames') || '[]')
  taken.push(name.toLowerCase())
  localStorage.setItem('takenNames', JSON.stringify(taken))
}

document.getElementById('startBtn').addEventListener('click', () => {
  const nameInput = document.getElementById('playerName')
  const playerName = nameInput.value.trim()
  const nameError = document.getElementById('nameError')

  if (!playerName) {
    nameError.textContent = 'Vui lòng nhập tên!'
    nameError.style.display = 'block'
    return
  }

  if (isNameTaken(playerName)) {
    nameError.textContent = 'Tên đã tồn tại, hãy chọn tên khác!'
    nameError.style.display = 'block'
    return
  }

  nameError.style.display = 'none'
  localStorage.setItem('playerName', playerName)
  registerName(playerName)

  const selectedMode = document.getElementById('introMode').value
  modeSelect.value = selectedMode

  document.getElementById('introScreen').style.display = 'none'
  signOutBtn.style.display = 'inline-block'
  showIdleState()
})

signOutBtn.addEventListener('click', () => {
  localStorage.removeItem('playerName')
  document.getElementById('introScreen').style.display = 'flex'
  signOutBtn.style.display = 'none'
})

// Tự đăng nhập nếu đã lưu tên
window.addEventListener('DOMContentLoaded', () => {
  const savedName = localStorage.getItem('playerName')
  if (savedName) {
    document.getElementById('introScreen').style.display = 'none'
    signOutBtn.style.display = 'inline-block'
    showIdleState()
  } else {
    document.getElementById('introScreen').style.display = 'flex'
  }
})

bestScoreSpan.textContent = `Best: ${getBestScore()} ms`


document.getElementById('showLeaderboardBtn').addEventListener('click', () => {
  document.getElementById('leaderboardModal').style.display = 'flex'
  fetchLeaderboard('easy')
})

document.getElementById('closeLeaderboardBtn').addEventListener('click', () => {
  document.getElementById('leaderboardModal').style.display = 'none'
})

document.querySelectorAll('#leaderboardModal .chart-mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.getAttribute('data-mode')
    fetchLeaderboard(mode)
  })
})

function fetchLeaderboard(mode) {
  fetch(`https://your-backend-url/leaderboard?mode=${mode}`)
    .then(res => res.json())
    .then(data => renderLeaderboard(data, mode))
    .catch(err => {
      console.error('Lỗi lấy dữ liệu leaderboard:', err)
      document.getElementById('leaderboardList').innerHTML = '<p style="color:white">Không tải được dữ liệu.</p>'
    })
}

function renderLeaderboard(data, mode) {
  const container = document.getElementById('leaderboardList')
  container.innerHTML = ''

  data.slice(0, 5).forEach((entry, index) => {
    const rankIdx = getCurrentRankIndex([{ score: entry.score }], mode)
    const rankImg = `img/skillgroup${rankIdx}.png`

    const div = document.createElement('div')
    div.className = 'leaderboard-entry'
    if (index === 0) div.classList.add('top1')

    div.innerHTML = `
      <span>#${index + 1}</span>
      <img src="${rankImg}" alt="rank" class="rank-img">
      <span>${entry.name}</span>
      <span>${entry.score} ms <small>(${entry.attempts} lần)</small></span>
    `
    container.appendChild(div)
  })
}
