export function shuffle(array: number[]) {
  let i = array.length
  let j = 0
  let temp

  while (i--) {
    j = Math.floor(Math.random() * (i + 1))
    temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }

  return array
}
