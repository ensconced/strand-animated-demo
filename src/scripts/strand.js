import { paint, paintLine, paintArrow } from './debug-tools.js';
import { normal } from './general-utils.js';

let arrow;
let currentLine;
let frame;
let direction;
let targetNode;

function strand(basisFrame) {
  const result = [];
  frame = basisFrame;
  init.call(result);
  addAllElements.call(result);
  return result;
}

function init() {
  currentLine = frame.firstUncrossedLine();
  direction = initialDirection();
  targetNode = initialTargetNode();
  debugger;
  arrow = showArrow();
  addElement.call(this);
}

function addAllElements() {
  while (!strandIsComplete()) {
    debugger;
    currentLine = nextLine();
    direction = oppositeDirection();
    targetNode = nextTargetNode();
    arrow = showArrow();
    addElement.call(this);
  }
  showLastLink.call(this);
  debugger;
}

function addElement() {
  addCrossingPoint.call(this);
  if (pointedReturnIsRequired()) {
    debugger;
    addPointedReturn.call(this);
  }
  logCrossing();
}

function nextLine() {
  const outboundLines = frame.linesOutFrom(targetNode);
  const roundabout = outboundLines.slice().sort(compareAngles);
  const entryIndex = roundabout.indexOf(currentLine);
  if (direction === 'R') {
    return lastExit(roundabout, entryIndex);
  } else {
    return firstExit(roundabout, entryIndex);
  }
}

function firstExit(roundabout, entryIndex) {
  const nextExit = roundabout[entryIndex + 1];
  const firstExit = roundabout[0];
  return nextExit || firstExit;
}

function lastExit(roundabout, entryIndex) {
  const previousExit = roundabout[entryIndex - 1];
  const lastExit = roundabout[roundabout.length - 1];
  return previousExit || lastExit;
}

function getApexCoords(startPoint, endPoint) {
  showApexGeometry(startPoint, endPoint);
  const startToEnd = [0, 1].map(x => endPoint[x] - startPoint[x]);
  let perp = normal(startToEnd);
  if (direction === 'L') {
    perp = normal.map(x => -x);
  }
  return startPoint.map((coord, i) => coord + startToEnd[i] / 2 + perp[i]);
}

function addPointedReturn() {
  const startCoords = currentLine.crossingPoint.coords;
  const endCoords = nextLine().crossingPoint.coords;
  const prCoords = getApexCoords(startCoords, endCoords);
  showLink.call(this, prCoords);

  this.push({
    x: prCoords[0],
    y: prCoords[1],
    pr: oppositeDirection(),
  });
}

function addCrossingPoint() {
  const strandElement = {
    direction,
    x: currentLine.crossingPoint.coords[0],
    y: currentLine.crossingPoint.coords[1],
  };
  showLink.call(this, currentLine.crossingPoint.coords);
  this.push(strandElement);
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

function logCrossing() {
  currentLine.crossingPoint[direction === 'R' ? 'crossedRight' : 'crossedLeft'] = true;
}

function traverseNextBackwards() {
  return nextLine().endNode.sameNode(targetNode);
}

function compareAngles(lineA, lineB) {
  return lineA.angleOutFrom(targetNode) - lineB.angleOutFrom(targetNode);
}

function nextTargetNode() {
  return goingBackwards() ? currentLine.endNode : currentLine.startNode;
}

function strandIsComplete() {
  return nextLine().crossingPoint.crossed(oppositeDirection());
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

function pointedReturnIsRequired() {
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

function showLink(coords) {
  paint(coords, 'green');
  if (this[this.length - 1]) {
    paintLine(coords, [this[this.length - 1].x, this[this.length - 1].y], 'black');
  }
}

function showLastLink() {
  showLink.call(this, [this[0].x, this[0].y]);
}

function showArrow() {
  frame.lines.map(line => line.snapObj).forEach(snap => snap.attr({ stroke: 'red' }));
  currentLine.snapObj.attr({ stroke: 'blue' });
  arrow && arrow.remove();
  return paintArrow(currentLine, goingBackwards());
}

function pointFollowing(index, strand) {
  return strand[(index + 1) % strand.length];
}

function pointPreceding(index, strand) {
  return strand[index - 1] || strand[strand.length - 1];
}

function showApexGeometry(startPoint, endPoint) {
  const startToEnd = [endPoint[0] - startPoint[0], endPoint[1] - startPoint[1]];
  paintLine(startPoint, endPoint, 'purple');
  let normal = [-startToEnd[1], startToEnd[0]];
  if (direction === 'L') {
    normal = normal.map(x => -x);
  }
  const halfway = startPoint.map((coord, i) => coord + startToEnd[i] / 2);
  const apex = startPoint.map((coord, i) => coord + startToEnd[i] / 2 + normal[i]);
  paintLine(halfway, apex, 'purple');
}

export { strand, pointPreceding, pointFollowing };