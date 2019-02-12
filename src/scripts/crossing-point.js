export default function CrossingPoint(startX, startY, endX, endY) {
  this.crossedLeft = false;
  this.crossedRight = false;
  this.coords = [(startX + endX) / 2, (startY + endY) / 2];
}

CrossingPoint.prototype = {
  crossed(direction) {
    if (direction === 'L') {
      return this.crossedLeft;
    } else {
      return this.crossedRight;
    }
  },
  fullyCrossed() {
    return this.crossed('R') && this.crossed('L');
  },
  uncrossedDirection() {
    if (this.fullyCrossed()) {
      return null;
    } else if (this.crossed('L')) {
      return 'R';
    } else {
      return 'L';
    }
  },
};
