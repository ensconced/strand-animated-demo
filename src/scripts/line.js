import surface from './main.js';
import CrossingPoint from './crossing-point.js';

export default function Line(options) {
  this.startNode = options.startNode;
  this.endNode = options.endNode;

  if (this.startNode && this.endNode) {
    this.startX = this.startNode.x;
    this.startY = this.startNode.y;
    this.endX = this.endNode.x;
    this.endY = this.endNode.y;
  } else {
    this.startX = options.startX;
    this.startY = options.startY;
    this.endX = options.endX;
    this.endY = options.endY;
  }

  this.crossingPoint = new CrossingPoint(this.startX, this.startY, this.endX, this.endY, this);

  this.snapObj = surface.line(this.startX, this.startY, this.endX, this.endY).attr(options.style);
}

Line.prototype = {
  uncrossed() {
    return !this.crossingPoint.fullyCrossed();
  },
  vector() {
    return [this.endX - this.startX, this.endY - this.startY];
  },
  isBetween(nodeA, nodeB) {
    const isForwards = this.startNode.sameNode(nodeA) && this.endNode.sameNode(nodeB);
    const isReversed = this.startNode.sameNode(nodeB) && this.endNode.sameNode(nodeA);
    return isForwards || isReversed;
  },
  rotateAboutOrigin(vector, angle) {
    var x = vector[0];
    var y = vector[1];
    var newX = x * Math.cos(angle) - y * Math.sin(angle);
    var newY = y * Math.cos(angle) + x * Math.sin(angle);
    return [newX, newY];
  },
  angle(options) {
    let vector = this.vector();
    if (options.reverse) {
      vector = vector.map(coord => -coord);
    }
    const result = Math.atan2(vector[1], vector[0]);
    return result;
  },
  angleOutFrom(node) {
    if (this.startX === node.x && this.startY === node.y) {
      return this.angle({ reverse: false });
    } else {
      return this.angle({ reverse: true });
    }
  },
  angleOutCP(options) {
    let vect = this.vector();
    if (options.reverse) {
      vect = vect.map(coord => -coord);
    }
    const angle = options.direction === 'R' ? Math.PI / 4 : -Math.PI / 4;
    const resultant = this.rotateAboutOrigin(vect, angle);
    return Math.atan2(resultant[1], resultant[0]);
  },
  visits(node) {
    return !!(this.startNode.sameNode(node) || this.endNode.sameNode(node));
  },
  length() {
    return this.snapObj.getTotalLength();
  },
};
