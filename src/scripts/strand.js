import StrandElement from './strand-element.js';
import { paint, paintLine, paintArrow } from './debug-tools.js';

let arrow;
let currentLine;
let frame;
let direction;
let targetNode;

function strand(basisFrame) {
  const result = [];
  frame = basisFrame;
  init.call(result);
  debugger;
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
function pointFollowing(index, strand) {
  return strand[(index + 1) % strand.length];
}
function pointPreceding(index, strand) {
  return strand[index - 1] || strand[strand.length - 1];
}

function addAllElements() {
  while (!strandCompleted()) {
    debugger;
    currentLine = nextLine();
    direction = oppositeDirection();
    targetNode = nextTargetNode();
    arrow = showArrow();
    addElement.call(this);
  }
  showLink.call(this, [this[0].x, this[0].y]);
  debugger;
}
function addElement() {
  const strandElement = new StrandElement({
    direction,
    point: currentLine.crossingPoint,
    pr: false,
  });

  showLink.call(this, strandElement.point.coords);
  this.push(strandElement);

  if (pointedReturnIsRequired()) {
    addPointedReturn.call(this);
    debugger;
  }
  logCrossing();
}

function addPointedReturn() {
  const startCoords = currentLine.crossingPoint.coords;
  const endCoords = nextLine().crossingPoint.coords;
  const prCoords = getApexCoords(startCoords, endCoords);
  showLink.call(this, prCoords);

  this.push({
    point: {},
    x: prCoords[0],
    y: prCoords[1],
    pr: oppositeDirection(),
  });
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
  if (direction === 'R') {
    currentLine.crossingPoint.crossedRight = true;
  } else {
    currentLine.crossingPoint.crossedLeft = true;
  }
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
function strandCompleted() {
  return nextLine().crossingPoint.crossed(oppositeDirection());
}
function getApexCoords(startPoint, endPoint) {
  const startToEnd = [endPoint[0] - startPoint[0], endPoint[1] - startPoint[1]];
  let normal;
  if (direction === 'R') {
    normal = [-startToEnd[1], startToEnd[0]];
  } else if (direction === 'L') {
    normal = [startToEnd[1], -startToEnd[0]];
  }
  return [startPoint[0] + startToEnd[0] / 2 + normal[0], startPoint[1] + startToEnd[1] / 2 + normal[1]];
}
function nextLine() {
  const roundabout = frame.linesOutFrom(targetNode);
  const orderedLinesOut = roundabout.slice().sort(compareAngles);
  const inIndex = orderedLinesOut.indexOf(currentLine);
  if (direction === 'R') {
    const previousLine = orderedLinesOut[inIndex - 1];
    const lastLine = orderedLinesOut[orderedLinesOut.length - 1];
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

function showArrow() {
  frame.lines.map(line => line.snapObj).forEach(snap => snap.attr({ stroke: 'red' }));
  currentLine.snapObj.attr({ stroke: 'blue' });
  arrow && arrow.remove();
  return paintArrow(currentLine, goingBackwards());
}
export { strand, pointPreceding, pointFollowing };