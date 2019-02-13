export default function CrossingPoint(startX, startY, endX, endY) {
  this.crossedLeft = false;
  this.crossedRight = false;
  this.coords = [(startX + endX) / 2, (startY + endY) / 2];
}

// crossing points are the points at the middle of lines
// an array of crossing points (plus pointed returns) defines the points through which a knot strand will pass

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
