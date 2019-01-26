import knotUtils from './knot-utils.js';
import StrandElement from './strand-element.js';

const strandState = {};

function addAllElements(frame) {
  strandState.frame = frame;
  strandState.currentLine = frame.firstUncrossedLine();
  strandState.direction = initialDirection();
  strandState.targetNode = initialTargetNode();
  addElement.call(this, frame);

  while (true) {
    strandState.currentLine = nextLine();
    strandState.direction = oppositeDirection();
    strandState.targetNode = nextTargetNode();
    addNextPoint.call(this);
    if (endOfStrand()) break;
  }
}
function addElement() {
  add.call(this, new StrandElement({
    direction: strandState.direction,
    point: strandState.currentLine.crossingPoint,
    pr: false,
  }));

  if (pointedReturn(strandState.frame)) {
    var startCoords = strandState.currentLine.crossingPoint.coords;
    var endCoords = nextLine(strandState.frame).crossingPoint.coords;
    var prCoords = getApexCoords(startCoords, endCoords);
    add.call(this, {
      point: {},
      x: prCoords[0],
      y: prCoords[1],
      pr: oppositeDirection(),
    });
  }
  logCrossing();
}
function currentBearing() {
  return strandState.currentLine.angleOutCP({
    direction: strandState.direction,
    reverse: goingBackwards(),
  });
}
function oppositeDirection() {
  return strandState.direction === 'R' ? 'L' : 'R';
}
function addNextPoint(frame) {
  addElement.call(this, frame);
}
function logCrossing() {
  if (strandState.direction === 'R') {
    strandState.currentLine.crossingPoint.crossedRight = true;
  } else {
    strandState.currentLine.crossingPoint.crossedLeft = true;
  }
}
function traverseNextBackwards(frame) {
  return nextLine(frame).endNode.sameNode(strandState.targetNode);
}
function compareByAngle(lineA, lineB) {
  if (lineA.angleOutFrom(strandState.targetNode) < lineB.angleOutFrom(strandState.targetNode)) {
    return -1;
  } else {
    return 1;
  }
}
function nextTargetNode() {
  if (goingBackwards()) {
    return strandState.currentLine.endNode;
  } else {
    return strandState.currentLine.startNode;
  }
}
function endOfStrand() {
  return nextLine(strandState.frame).crossingPoint.crossed(oppositeDirection());
}
function getApexCoords(startPoint, endPoint) {
  var startToEnd = [endPoint[0] - startPoint[0], endPoint[1] - startPoint[1]];
  var normal;
  if (strandState.direction === 'R') {
    normal = [-startToEnd[1], startToEnd[0]];
  } else if (strandState.direction === 'L') {
    normal = [startToEnd[1], -startToEnd[0]];
  }
  return [startPoint[0] + startToEnd[0] / 2 + normal[0], startPoint[1] + startToEnd[1] / 2 + normal[1]];
}
function nextLine() {
  const roundabout = strandState.frame.linesOutFrom(strandState.targetNode);
  var orderedLinesOut = roundabout.slice().sort(compareByAngle);
  var inIndex = orderedLinesOut.indexOf(strandState.currentLine);

  if (strandState.direction === 'R') {
    // pad out list with first element...
    // to allow going all way thru to start again
    var previousLine = orderedLinesOut[inIndex - 1];
    var lastLine = orderedLinesOut[orderedLinesOut.length - 1];
    return previousLine || lastLine;
  } else {
    orderedLinesOut.push(orderedLinesOut[0]);
    return orderedLinesOut[inIndex + 1];
  }
}
function nextBearing() {
  return nextLine(strandState.frame).angleOutCP({
    direction: oppositeDirection(),
    reverse: traverseNextBackwards(strandState.frame),
  });
}
function goingBackwards() {
  return strandState.currentLine.startNode.sameNode(strandState.targetNode);
}
function pointedReturn() {
  var angleDelta = Math.abs(currentBearing() - nextBearing(strandState.frame));
  var smallerAngle = Math.min(angleDelta, Math.PI * 2 - angleDelta);
  return smallerAngle > 1.6;
}
function initialDirection() {
  return strandState.currentLine.crossingPoint.uncrossedDirection();
}
function initialTargetNode() {
  return strandState.currentLine.endNode;
}
function add(point) {
  this.points.push(point);
}

export default function Strand(frame) {
  this.points = [];
  addAllElements.call(this, frame);
}

Strand.prototype =  {
  constructor: Strand,
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
