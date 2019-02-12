export default function Node({x, y}) {
  this.x = x;
  this.y = y;
}

Node.prototype = {
  sameNode(otherNode) {
    return this.x === otherNode.x && this.y === otherNode.y;
  },
};