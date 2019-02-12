import Snap from 'snapsvg';
import CrossingPoint from './crossing-point.js';

export default function Line({ startNode, endNode }) {
  this.startNode = startNode;
  this.endNode = endNode;
  this.crossingPoint = new CrossingPoint(this.startNode.x, this.startNode.y, this.endNode.x, this.endNode.y);

  // draw the line
  this.snapObj = Snap('#surface').line(this.startNode.x, this.startNode.y, this.endNode.x, this.endNode.y);
  // style the line
  this.snapObj.attr({
    fill: 'none',
    stroke: 'red',
    strokeWidth: 2,
    strokeOpacity: 0.8,
  });
}

Line.prototype = {
  uncrossed() {
    return !this.crossingPoint.fullyCrossed();
  },
  vector() {
    return [this.endNode.x - this.startNode.x, this.endNode.y - this.startNode.y];
  },
  isBetween(nodeA, nodeB) {
    const isForwards = this.startNode.sameNode(nodeA) && this.endNode.sameNode(nodeB);
    const isReversed = this.startNode.sameNode(nodeB) && this.endNode.sameNode(nodeA);
    return isForwards || isReversed;
  },
  angle({ reverse }) {
    let vector = this.vector();
    if (reverse) {
      vector = vector.map(coord => -coord);
    }
    const result = Math.atan2(vector[1], vector[0]);
    return result;
  },
  angleOutFrom(node) {
    if (this.startNode.x === node.x && this.startNode.y === node.y) {
      return this.angle({ reverse: false });
    } else {
      return this.angle({ reverse: true });
    }
  },
  angleOutCP({ reverse, direction }) {
    let vect = this.vector();
    if (reverse) {
      vect = vect.map(coord => -coord);
    }
    const angle = direction === 'R' ? Math.PI / 4 : -Math.PI / 4;
    const resultant = this.rotateAboutOrigin(vect, angle);
    return Math.atan2(resultant[1], resultant[0]);
  },
  visits(node) {
    return !!(this.startNode.sameNode(node) || this.endNode.sameNode(node));
  },
  rotateAboutOrigin(vector, angle) {
    var x = vector[0];
    var y = vector[1];
    var newX = x * Math.cos(angle) - y * Math.sin(angle);
    var newY = y * Math.cos(angle) + x * Math.sin(angle);
    return [newX, newY];
  },
};
