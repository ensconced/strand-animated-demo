import { pixelCoords } from './mouse.js';
import surface from './main.js';
import config from './config.js';
import { identicalObjects, distanceBetween } from './general-utils.js';

export default function Node(options) {
  if (options.gridSystem === 'square') {
    this.gridX = options.x;
    this.gridY = options.y;
    var x;
    var y;
    [x, y] = pixelCoords([this.gridX, this.gridY]);
    this.x = x;
    this.y = y;
  } else if (options.gridSystem === 'freeform') {
    this.x = options.x;
    this.y = options.y;
  }
}
Node.prototype = {
  sameNode(otherNode) {
    return this.x === otherNode.x && this.y === otherNode.y;
  },
  draw() {
    this.snapObj = surface.circle(this.x, this.y, config.nodeStyle.radius).attr(config.nodeStyle);
  },
  remove() {
    if (this.snapObj) this.snapObj.remove();
  },
  hasOverlap(pxX, pxY) {
    const deltaX = Math.abs(pxX - this.x);
    const deltaY = Math.abs(pxY - this.y);
    return (deltaX ** 2 + deltaY ** 2) ** 0.5 <= config.nodeStyle.radius;
  },
  distanceFromPoint(coords) {
    return distanceBetween([this.x, this.y], [coords[0], coords[1]]);
  },
  isAdjacentTo(otherNode) {
    const xDiff = Math.abs(otherNode.gridX - this.gridX);
    const yDiff = Math.abs(otherNode.gridY - this.gridY);
    return identicalObjects([xDiff, yDiff].sort(), [0, 1]);
  },
};
