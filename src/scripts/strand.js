import StrandElement from './strand-element.js';
import { paint, paintLine, paintArrow } from './debug-tools.js';

let currentLine;
let frame;
let direction;
let targetNode;

function strand(frame) {
  const result = [];
  addAllElements.call(result, frame);
  return result;
}

function pointFollowing(index, strand) {
  return strand[(index + 1) % strand.length];
}
function pointPreceding(index, strand) {
  return strand[index - 1] || strand[strand.length - 1];
}

function addAllElements(framey) {
  let arrow;
  frame = framey;
  currentLine = frame.firstUncrossedLine();
  direction = initialDirection();
  targetNode = initialTargetNode();
  debugger;
  currentLine.snapObj.attr({ stroke: 'black' });
  arrow = paintArrow(currentLine, true);
  addElement.call(this, frame);

  while (true) {
    debugger;
    currentLine.snapObj.attr({ stroke: 'red' });
    currentLine = nextLine();
    currentLine.snapObj.attr({ stroke: 'black' });
    arrow && arrow.remove();
    arrow = paintArrow(currentLine, goingBackwards());
    direction = oppositeDirection();
    targetNode = nextTargetNode();
    addNextPoint.call(this);
    if (endOfStrand()) break;
  }

  paintLine([this[this.length - 1].x, this[this.length - 1].y], [this[0].x, this[0].y], 'black');
  debugger;
}
function addElement() {
  const strandElement = new StrandElement({
    direction: direction,
    point: currentLine.crossingPoint,
    pr: false,
  });

  paint(strandElement.point.coords, 'green');
  if (this[this.length - 1]) {
    paintLine([strandElement.x, strandElement.y], [this[this.length - 1].x, this[this.length - 1].y], 'black');
  }

  add.call(this, strandElement);

  if (pointedReturn(frame)) {
    var startCoords = currentLine.crossingPoint.coords;
    var endCoords = nextLine().crossingPoint.coords;
    var prCoords = getApexCoords(startCoords, endCoords);

    paint(prCoords, 'purple');
    if (this[this.length - 1]) {
      paintLine(prCoords, [this[this.length - 1].x, this[this.length - 1].y], 'black');
    }

    add.call(this, {
      point: {},
      x: prCoords[0],
      y: prCoords[1],
      pr: oppositeDirection(),
    });
    debugger;
  }
  logCrossing();
}
function currentBearing() {
  return currentLine.angleOutCP({
    direction: direction,
    reverse: goingBackwards(),
  });
}
function oppositeDirection() {
  return direction === 'R' ? 'L' : 'R';
}
function addNextPoint(frame) {
  addElement.call(this, frame);
}
function logCrossing() {
  if (direction === 'R') {
    currentLine.crossingPoint.crossedRight = true;
  } else {
    currentLine.crossingPoint.crossedLeft = true;
  }
}
function traverseNextBackwards() {
  return nextLine().endNode.sameNode(targetNode);
}
function compareByAngle(lineA, lineB) {
  if (lineA.angleOutFrom(targetNode) < lineB.angleOutFrom(targetNode)) {
    return -1;
  } else {
    return 1;
  }
}
function nextTargetNode() {
  if (goingBackwards()) {
    return currentLine.endNode;
  } else {
    return currentLine.startNode;
  }
}
function endOfStrand() {
  return nextLine().crossingPoint.crossed(oppositeDirection());
}
function getApexCoords(startPoint, endPoint) {
  var startToEnd = [endPoint[0] - startPoint[0], endPoint[1] - startPoint[1]];
  var normal;
  if (direction === 'R') {
    normal = [-startToEnd[1], startToEnd[0]];
  } else if (direction === 'L') {
    normal = [startToEnd[1], -startToEnd[0]];
  }
  return [startPoint[0] + startToEnd[0] / 2 + normal[0], startPoint[1] + startToEnd[1] / 2 + normal[1]];
}
function nextLine() {
  const roundabout = frame.linesOutFrom(targetNode);
  var orderedLinesOut = roundabout.slice().sort(compareByAngle);
  var inIndex = orderedLinesOut.indexOf(currentLine);

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
}
function nextBearing() {
  return nextLine().angleOutCP({
    direction: oppositeDirection(),
    reverse: traverseNextBackwards(),
  });
}
function goingBackwards() {
  return currentLine.startNode.sameNode(targetNode);
}
function pointedReturn() {
  const angleDelta = Math.abs(currentBearing() - nextBearing());
  const smallerAngle = Math.min(angleDelta, Math.PI * 2 - angleDelta);
  return smallerAngle > 1.6;
}
function initialDirection() {
  return currentLine.crossingPoint.uncrossedDirection();
}
function initialTargetNode() {
  return currentLine.endNode;
}
function add(point) {
  this.push(point);
}

export { strand, pointPreceding, pointFollowing };