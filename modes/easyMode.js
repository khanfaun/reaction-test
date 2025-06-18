export function prepareEasyModeSequence() {
  const delay = Math.floor(Math.random() * 7000) + 3000
  return [
    { color: 'red', delay },
    { color: 'green', delay: 0 }
  ]
}
