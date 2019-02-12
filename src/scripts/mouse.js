import config from './config.js';

// for getting pixel coords from [row, col]
export function pixelCoords(coords) {
  function boxToPX(n) {
    return n * config.squareHeight + config.maxStrokeWidth() / 2;
  }
  return coords.map(boxToPX);
}