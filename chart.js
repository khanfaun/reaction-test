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

// 🎯 Tính điểm theo trọng số + giới hạn phản xạ chậm
function computeScore(scores, mode) {
  const THRESHOLD = 200

  const modeWeight = {
    easy: 0.8,
    medium: 1.0,
    hard: 1.2
  }

  const maxBadTime = {
    easy: 300,
    medium: 500,
    hard: 700
  }

  const weight = modeWeight[mode] || 1.0
  const limit = maxBadTime[mode] || 500

  let overLimitCount = 0

  return scores.reduce((sum, t) => {
    if (t > limit) {
      if (++overLimitCount > 1) return sum
    }

    if (t > THRESHOLD) return sum
    return sum + ((THRESHOLD - t) / THRESHOLD) * weight
  }, 0)
}

// 🏆 Xếp hạng dựa trên điểm tích lũy đã chuẩn hóa
export function getTitleFromScores(scores, mode) {
  if (!scores.length) return '--'

  const totalScore = computeScore(scores, mode)

  if (totalScore >= 15) return '30000 Elo'
  if (totalScore >= 10) return '15000 Elo'
  if (totalScore >= 5) return '7000 Elo'
  if (totalScore >= 2) return '4000 Elo'
  return '1000 Elo'
}
