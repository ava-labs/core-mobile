// eslint-disable-next-line no-extend-native
Array.prototype.toSorted = function (compareFn) {
  return this.slice().sort(compareFn)
}
