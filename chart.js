let chartInstance = null

export function drawChart(mode) {
	const list = JSON.parse(sessionStorage.getItem(`scores_${mode}`)) || []

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

export function getTitleFromScores(scores) {
	if (!scores.length) return '--'
	const latest = scores[scores.length - 1]
	if (latest <= 100) return '30000 Elo'
	if (latest <= 150) return '15000 Elo'
	if (latest <= 200) return '1000 Elo'
	if (latest <= 250) return '7000 Elo'
	if (latest <= 300) return '4000 Elo'
	return '1000 Elo'
}

