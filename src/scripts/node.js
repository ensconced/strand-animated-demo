import { pixelCoords } from './mouse.js';
import surface from './main.js';
import config from './config.js';

export default function Node(options) {
  this.gridX = options.x;
  this.gridY = options.y;
  var x;
  var y;
  [x, y] = pixelCoords([this.gridX, this.gridY]);
  this.x = x;
  this.y = y;
}
Node.prototype = {
  sameNode(otherNode) {
    return this.x === otherNode.x && this.y === otherNode.y;
  },
  draw() {
    this.snapObj = surface.circle(this.x, this.y, config.nodeStyle.radius).attr(config.nodeStyle);
  },
};
