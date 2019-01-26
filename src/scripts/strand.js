import knotUtils from './knot-utils.js';

export default function Strand(frame) {
  this.frame = frame;
  this.points = [];
  this.length = 0;

  this.currentLine = this.firstUncrossedLine();
  this.selectDirection();
  this.addPoint();

  // in the below while loop we add all the
  // crossingpoints through which our strand passes
  while (true) {
    this.addNextPoint();
    if (this.endOfStrand()) break;
  }
}

Strand.prototype = {
  constructor: Strand,
  addPoint() {
    this.add({
      point: this.currentLine.crossingPoint,
      x: this.currentLine.crossingPoint.coords[0],
      y: this.currentLine.crossingPoint.coords[1],
      pr: false,
      direction: this.direction,
    });
    if (this.pointedReturn()) {
      var startCoords = this.currentLine.crossingPoint.coords;
      var endCoords = this.getNextLine(this.direction).crossingPoint.coords;
      var prCoords = this.getApexCoords(startCoords, endCoords, this.direction);
      this.add({
        point: {},
        x: prCoords[0],
        y: prCoords[1],
        pr: this.oppositeDirection(),
      });
    }
    this.logCrossing(this.direction);
  },
  currentBearing() {
    return this.currentLine.angleOutCP({
      direction: this.direction,
      reverse: this.goingBackwards(),
    });
  },
  oppositeDirection() {
    return this.direction === 'R' ? 'L' : 'R';
  },
  addNextPoint(strand) {
    this.selectNextPoint();
    this.setNewTargetNode();
    this.addPoint(strand);
  },
  selectNextPoint() {
    this.currentLine = this.getNextLine(this.direction);
    this.direction = this.oppositeDirection();
  },
  logCrossing(direction) {
    if (direction === 'R') {
      this.currentLine.crossingPoint.crossedRight = true;
    } else {
      this.currentLine.crossingPoint.crossedLeft = true;
    }
  },
  traverseNextBackwards() {
    return this.getNextLine(this.direction).endNode.sameNode(this.targetNode);
  },
  compareByAngle(lineA, lineB) {
    if (lineA.angleOutFrom(this.targetNode) < lineB.angleOutFrom(this.targetNode)) {
      return -1;
    } else {
      return 1;
    }
  },
  setNewTargetNode() {
    // set new targetNode
    if (this.goingBackwards()) {
      this.targetNode = this.currentLine.endNode;
    } else {
      this.targetNode = this.currentLine.startNode;
    }
  },
  endOfStrand() {
    return this.getNextLine(this.direction).crossingPoint.crossed(this.oppositeDirection());
  },
  getApexCoords(startPoint, endPoint, direction) {
    var startToEnd = [endPoint[0] - startPoint[0], endPoint[1] - startPoint[1]];
    var normal;
    if (direction === 'R') {
      normal = [-startToEnd[1], startToEnd[0]];
    } else if (direction === 'L') {
      normal = [startToEnd[1], -startToEnd[0]];
    }
    return [startPoint[0] + startToEnd[0] / 2 + normal[0], startPoint[1] + startToEnd[1] / 2 + normal[1]];
  },
  getNextLine(direction) {
    this.roundabout = this.frame.linesOutFrom(this.targetNode);
    var orderedLinesOut = this.roundabout.slice().sort(this.compareByAngle.bind(this));
    var inIndex = orderedLinesOut.indexOf(this.currentLine);

    if (direction === 'R') {
      // pad out list with first element...
      // to allow going all way thru to start again
      var previousLine = orderedLinesOut[inIndex - 1];
      var lastLine = orderedLinesOut[orderedLinesOut.length - 1];
      return previousLine || lastLine;
    } else {
      orderedLinesOut.push(orderedLinesOut[0]);
      return orderedLinesOut[inIndex + 1];
    }
  },
  nextBearing() {
    return this.getNextLine(this.direction).angleOutCP({
      direction: this.oppositeDirection(),
      reverse: this.traverseNextBackwards(),
    });
  },
  goingBackwards() {
    return this.currentLine.startNode.sameNode(this.targetNode);
  },
  pointedReturn() {
    var angleDelta = Math.abs(this.currentBearing() - this.nextBearing());
    var smallerAngle = Math.min(angleDelta, Math.PI * 2 - angleDelta);
    return smallerAngle > 1.6;
  },
  firstUncrossedLine() {
    return this.frame.lines.find(line => line.uncrossed());
  },
  selectDirection() {
    this.direction = this.currentLine.crossingPoint.uncrossedDirection();
    this.targetNode = this.currentLine.endNode;
  },
  add(point) {
    this.points.push(point);
    this.length++;
  },
  trimUnders() {
    for (var cpORpr of this.points) {
      var point = cpORpr.point;
      if (!cpORpr.pr) {
        // now trim the unders
        if (!cpORpr.point.trimmed) {
          // i.e. if not already trimmed

          var overLeft = point.overInLeft.concat(point.overOutLeft);
          var overRight = point.overInRight.concat(point.overOutRight);
          var intersectLOut =
            knotUtils.collectionIntersect(point.underOutLeft, overLeft) ||
            knotUtils.collectionIntersect(point.underOutLeft, overRight);
          var intersectROut =
            knotUtils.collectionIntersect(point.underOutRight, overLeft) ||
            knotUtils.collectionIntersect(point.underOutRight, overRight);
          var intersectLIn =
            knotUtils.collectionIntersect(point.underInLeft, overLeft) ||
            knotUtils.collectionIntersect(point.underInLeft, overRight);
          var intersectRIn =
            knotUtils.collectionIntersect(point.underInRight, overLeft) ||
            knotUtils.collectionIntersect(point.underInRight, overRight);

          knotUtils.mutate(point.underOutLeft, point.underOutLeft.slice(intersectLOut.idxA + 1));
          knotUtils.mutate(point.underOutRight, point.underOutRight.slice(intersectROut.idxA + 1));
          knotUtils.mutate(point.underInLeft, point.underInLeft.slice(0, intersectLIn.idxA + 1));
          knotUtils.mutate(point.underInRight, point.underInRight.slice(0, intersectRIn.idxA + 1));

          point.underOutLeft.unshift(intersectLOut.intersection);
          point.underOutRight.unshift(intersectROut.intersection);
          point.underInLeft.push(intersectLIn.intersection);
          point.underInRight.push(intersectRIn.intersection);
        }

        cpORpr.point.trimmed = true;
      }
    }
  },
};