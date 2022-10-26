export default function delay(sec: number) {
  return new Promise(resolve => setTimeout(resolve, sec))
}
