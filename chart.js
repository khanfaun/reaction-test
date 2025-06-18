let chartInstance = null

export function drawChart(mode) {
  const list = JSON.parse(localStorage.getItem(`scores_${mode}`)) || []
  if (list.length === 0) return

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
          title: {
            display: true,
            text: 'Tốc độ phản xạ (ms)',
            color: '#ffffff'
          },
          ticks: {
            color: '#ffffff',
            callback: value => labels[value],
            font: { family: 'Montserrat', size: 12 }
          },
          grid: {
            color: 'rgba(255,255,255,0.1)'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Số lần đạt được',
            color: '#ffffff'
          },
          ticks: {
            color: '#ffffff',
            stepSize: 1,
            font: { family: 'Montserrat', size: 12 }
          },
          grid: {
            color: 'rgba(255,255,255,0.1)'
          }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  }

  if (chartInstance) chartInstance.destroy()
  chartInstance = new Chart(ctx, config)
}

// 🎯 Tính điểm trung bình phản xạ tốt (≤ 300ms) với trọng số chế độ
function computeScore(scores, mode) {
  const modeWeight = {
    easy: 0.7,
    medium: 1.0,
    hard: 1.3
  }

  const weight = modeWeight[mode] || 1.0

  const valid = scores.filter(t => t <= 300)
  const validScores = valid.map(t => {
    const point = (300 - t) / 150
    return Math.max(0, Math.min(1, point)) * weight
  })

  const total = validScores.reduce((sum, val) => sum + val, 0)
  const average = validScores.length ? total / validScores.length : 0

  return {
    total,
    average,
    count: validScores.length
  }
}

const ranks = [
  'Chưa có rank',
  'Silver 1',
  'Silver 2',
  'Silver 3',
  'Silver 4',
  'Silver Elite',
  'Silver Elite Master',
  'Nova 1',
  'Nova 2',
  'Nova 3',
  'Nova Master',
  'Master Guardian 1',
  'Master Guardian 2',
  'Master Guardian Elite',
  'Distinguished Master Guardian',
  'Legendary Eagle',
  'Legendary Eagle Master',
  'Supreme Master First Class',
  'Global Elite'
]

// 🏆 Trả về rank dựa trên averageScore + validCount
export function getTitleFromScores(scores, mode) {
  if (!scores.length) return generateRankHTML(0) // skillgroup0.png

  const { average, count } = computeScore(scores, mode)

  const thresholds = [
    { minAvg: 0.00, minCount: 1 },
    { minAvg: 0.05, minCount: 2 },
    { minAvg: 0.08, minCount: 3 },
    { minAvg: 0.10, minCount: 4 },
    { minAvg: 0.12, minCount: 5 },
    { minAvg: 0.15, minCount: 6 },
    { minAvg: 0.18, minCount: 7 },
    { minAvg: 0.21, minCount: 8 },
    { minAvg: 0.24, minCount: 9 },
    { minAvg: 0.27, minCount: 10 },
    { minAvg: 0.30, minCount: 11 },
    { minAvg: 0.35, minCount: 12 },
    { minAvg: 0.40, minCount: 13 },
    { minAvg: 0.45, minCount: 14 },
    { minAvg: 0.50, minCount: 15 },
    { minAvg: 0.55, minCount: 16 },
    { minAvg: 0.65, minCount: 17 },
    { minAvg: 0.75, minCount: 18 }
  ]

  let rankIndex = 0
  for (let i = thresholds.length - 1; i >= 0; i--) {
    const { minAvg, minCount } = thresholds[i]
    if (average >= minAvg && count >= minCount) {
      rankIndex = i + 1
      break
    }
  }

  return generateRankHTML(rankIndex)
}

// 📦 Tạo HTML chứa ảnh và tên rank
function generateRankHTML(index) {
  const name = ranks[index]
  const img = `<img src="img/skillgroup${index}.png" alt="${name}">`
  const label = index === 0 ? 'Chưa có rank' : name
  return `<div class="rank-display">${img}${label}</div>`
}
