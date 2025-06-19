let chartInstance = null

export function drawChart(mode) {
  const list = JSON.parse(localStorage.getItem(`scores_${mode}`)) || []
  if (list.length === 0) return

  window.__lastScoreBonus = '' // 🧼 Reset bonus khi xem thống kê

  const ctx = document.getElementById('chartCanvas')?.getContext('2d')
  if (!ctx) return

  const buckets = Array(20).fill(0)
  list.forEach(score => {
    let index = Math.floor(score / 25)
    if (index >= buckets.length) index = buckets.length - 1
    buckets[index]++
  })

  const labels = buckets.map((_, i) => `${i * 25}`)
  const data = {
    labels,
    datasets: [{
      label: 'Số lần',
      data: buckets,
      fill: true,
      borderColor: '#4FC3F7',
      backgroundColor: 'rgba(79, 195, 247, 0.2)',
      pointBackgroundColor: '#4FC3F7',
      tension: 0.3
    }]
  }

  const config = {
    type: 'line',
    data,
    options: {
      scales: {
        x: {
          title: { display: true, text: 'Tốc độ phản xạ (ms)', color: '#fff' },
          ticks: { color: '#fff', callback: v => labels[v], font: { family: 'Montserrat', size: 12 } },
          grid: { color: 'rgba(255,255,255,0.1)' }
        },
        y: {
          title: { display: true, text: 'Số lần đạt được', color: '#fff' },
          ticks: { color: '#fff', stepSize: 1, font: { family: 'Montserrat', size: 12 } },
          grid: { color: 'rgba(255,255,255,0.1)' }
        }
      },
      plugins: { legend: { display: false } }
    }
  }

  if (chartInstance) chartInstance.destroy()
  chartInstance = new Chart(ctx, config)
}

function computeScore(scores, mode) {
  const weight = { easy: 0.7, medium: 1.0, hard: 1.3 }[mode] || 1.0
  const maxTime = { easy: 300, medium: 300, hard: 350 }[mode] || 300
  const bonus = 0.02

  const valid = scores.filter(t => t <= maxTime)
  const validScores = []

  for (let i = 0; i < valid.length; i++) {
    const t = valid[i]
    const speed = (300 - t) / 150
    const curved = Math.max(Math.pow(speed, 2), 0)
    let score = curved * weight

    let bonusText = ''
    if (
      i > 0 &&
      t <= maxTime &&
      valid[i - 1] <= maxTime
    ) {
      const prevT = valid[i - 1]
      if (t < prevT) {
        score += bonus
        bonusText = `+${(bonus * 100).toFixed(2)}%`
      } else if (t > prevT) {
        score -= bonus
        bonusText = `-${(bonus * 100).toFixed(2)}%`
      }
      window.__lastScoreBonus = bonusText
    } else {
      window.__lastScoreBonus = ''
    }

    validScores.push(+score.toFixed(3))
  }

  const total = validScores.reduce((s, v) => s + v, 0)
  const average = validScores.length ? total / validScores.length : 0
  return { average, count: validScores.length }
}

const ranks = [
  'Chưa có rank',
  'Silver 1','Silver 2','Silver 3','Silver 4',
  'Silver Elite','Silver Elite Master','Nova 1',
  'Nova 2','Nova 3','Nova Master',
  'Master Guardian 1','Master Guardian 2','Master Guardian Elite',
  'Distinguished Master Guardian','Legendary Eagle',
  'Legendary Eagle Master','Supreme Master First Class','Global Elite'
]

const thresholds = [
  { avg: 0.00, count: 1 },
  { avg: 0.05, count: 2 },
  { avg: 0.08, count: 3 },
  { avg: 0.10, count: 4 },
  { avg: 0.12, count: 5 },
  { avg: 0.15, count: 6 },
  { avg: 0.18, count: 7 },
  { avg: 0.21, count: 8 },
  { avg: 0.24, count: 9 },
  { avg: 0.27, count: 10 },
  { avg: 0.30, count: 11 },
  { avg: 0.35, count: 12 },
  { avg: 0.40, count: 13 },
  { avg: 0.45, count: 14 },
  { avg: 0.50, count: 15 },
  { avg: 0.55, count: 16 },
  { avg: 0.65, count: 17 },
  { avg: 0.75, count: 18 }
]

function generateRankHTML(idx, progressPercent = 0) {
  const name = ranks[idx] || 'Chưa có rank'
  const img = `<img src="img/skillgroup${idx}.png" alt="${name}">`
  const bar = idx === 0 ? '' :
    `<div class="xp-bar"><div class="xp-fill" style="width:${progressPercent}%"></div></div>
     <div class="xp-text">${progressPercent.toFixed(1)}% đến ${ranks[idx+1]}</div>`

  const bonusTag = window.__lastScoreBonus
    ? `<div class="rank-bonus">${window.__lastScoreBonus}</div>` : ''

  return `<div class="rank-display">${img}${name}</div>${bar}${bonusTag}`
}

export function getTitleFromScores(scores, mode) {
  if (!scores.length) return generateRankHTML(0)

  const { average, count } = computeScore(scores, mode)

  let idx = 0
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (average >= thresholds[i].avg && count >= thresholds[i].count) {
      idx = i + 1
      break
    }
  }

  let progress = 0
  if (idx < thresholds.length) {
    const cur = thresholds[idx - 1] || { avg: 0, count: 1 }
    const next = thresholds[idx]
    const avgPart = Math.min((average - cur.avg) / (next.avg - cur.avg), 1)
    const countPart = Math.min((count - cur.count) / (next.count - cur.count), 1)
    progress = (avgPart + countPart) / 2 * 100
  } else {
    progress = 100
  }

  return generateRankHTML(idx, progress)
}
