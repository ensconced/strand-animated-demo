function integerRange(first, last) {
  return Array(last - first + 1).fill().map((_, i) => first + i);
}
function cartesianProduct(arr1, arr2) {
  return arr1.reduce((acc, x) => {
    return acc.concat(arr2.map(y => [x, y]));
  }, []);
}

export function identicalObjects(arr1, arr2) {
  return JSON.stringify(arr1) === JSON.stringify(arr2);
}
export function coordinateSet({ leftmost, rightmost, topmost, bottommost }) {
  const xCoords = integerRange(leftmost, rightmost + 1);
  const yCoords = integerRange(topmost, bottommost + 1);
  return cartesianProduct(xCoords, yCoords);
}
export function distanceBetween(coordsA, coordsB) {
  return ((coordsA[0] - coordsB[0])**2 + (coordsA[1] - coordsB[1])**2)**0.5;
}

export function normal(vector) {
  return [-vector[1], vector[0]];
}
