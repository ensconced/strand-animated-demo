import Mouse from './mouse.js';
import surface from './main.js';
import config from './config.js';

export default function Node(options) {
  if (options.gridSystem === 'square') {
    this.gridX = options.x;
    this.gridY = options.y;
    var x;
    var y;
    [x, y] = Mouse.pixelCoords([this.gridX, this.gridY]);
    this.x = x;
    this.y = y;
  } else if (options.gridSystem === 'freeform') {
    this.x = options.x;
    this.y = options.y;
  }
}
Node.prototype = {
  constructor: Node,
  sameNode(otherNode) {
    return this.x === otherNode.x && this.y === otherNode.y;
  },
  draw() {
    this.snapObject = surface.circle(this.x, this.y, config.nodeStyle.radius).attr(config.nodeStyle);
  },
  remove() {
    if (this.snapObject) this.snapObject.remove();
  },
};
