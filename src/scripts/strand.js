import { paint, paintLine, paintArrowHead } from './debug-tools.js';

const ANIMATION_STEP = 500;
const PR_LIMIT_THETA = 1.6;

let arrow;
let currentLine;
let frame;
let direction;
let targetNode;

function drawStrand(basisFrame) {
  const result = [];
  frame = basisFrame;
  slowly(init, result)
  .then(addAllElements.bind(result));
}

function init() {
  // find a line that is uncrossed either in R or L direction
  currentLine = frame.firstUncrossedLine();

  // choose the uncrossed direction
  // as we traverse the frame, direction will alternate between L and R
  direction = initialDirection();

  // targetNode tells us which way along currentLine we are headed
  targetNode = currentLine.endNode;

  // add first element
  addElement.call(this);

  // show currentLine as blue arrow
  arrow = showArrow();
}


// slowly and slowWhile are solely for demonstration purposes
function slowly(callback, context) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      callback.call(context);
      resolve();
    }, ANIMATION_STEP);
  });
}

// like a while loop for promises - only proceeds to next iteration when promise resolves
function slowWhile(condition, action, context) {
  function iterate() {
    if (condition()) {
      return action.call(context).then(iterate);
    } else {
      return Promise.resolve();
    }
  }
  return iterate();
}

function addAllElements() {
  slowWhile(strandIsNotComplete, function() {
    return slowly(takeStep, this);
  }, this)
  .then(showLastLink.bind(this));
}

function takeStep() {
  proceed();
  addElement.call(this);
  arrow = showArrow();
}

function proceed() {
  currentLine = nextLine();
  direction = oppositeDirection();
  targetNode = nextTargetNode();
}

function addElement() {
  addCrossingPoint.call(this);
  if (pointedReturnIsRequired()) {
    addPointedReturn.call(this);
  }
  logCrossing();
}

function pointedReturnIsRequired() {
  let angleDelta = currentBearing() - nextBearing();
  angleDelta += (direction === 'R' ? Math.PI / 2 : -Math.PI / 2);
  const absDelta = Math.abs(angleDelta);
  const smallerAngle = Math.min(absDelta, Math.PI * 2 - absDelta);
  return smallerAngle > PR_LIMIT_THETA;
}

function currentBearing() {
  return currentLine.angle({
    reverse: goingBackwards(),
  });
}

function nextBearing() {
  return nextLine().angle({
    reverse: traverseNextBackwards(),
  });
}

// looks ahead to the next line and returns boolean indicating whether it will be traversed backwards
function traverseNextBackwards() {
  return nextLine().endNode.sameNode(targetNode);
}

function addPointedReturn() {
  const startCoords = currentLine.crossingPoint.coords;
  const endCoords = nextLine().crossingPoint.coords;
  const prCoords = getApexCoords(startCoords, endCoords);
  showLink.call(this, prCoords);

  this.push({
    x: prCoords[0],
    y: prCoords[1],
  });
}

function getApexCoords(startPoint, endPoint) {
  const startToEnd = [0, 1].map(x => endPoint[x] - startPoint[x]);
  let perp = normal(startToEnd);
  if (direction === 'L') {
    perp = perp.map(x => -x);
  }
  return startPoint.map((coord, i) => coord + startToEnd[i] / 2 + perp[i]);
}

// decides which line we should proceed to next
function nextLine() {
  // get all lines that are connected to the targetNode, as vectors
  const outboundLines = frame.linesOutFrom(targetNode);
  const roundabout = outboundLines.sort(compareAngles);
  const entryIndex = roundabout.indexOf(currentLine);
  if (direction === 'R') {
    return rightTurn(roundabout, entryIndex);
  } else {
    return leftTurn(roundabout, entryIndex);
  }
}

function leftTurn(roundabout, entryIndex) {
  const nextExit = roundabout[entryIndex + 1];
  const firstExit = roundabout[0];
  // if there is is no nextExit, we must loop around to the start of the array
  return nextExit || firstExit;
}

function rightTurn(roundabout, entryIndex) {
  const previousExit = roundabout[entryIndex - 1];
  const lastExit = roundabout[roundabout.length - 1];
  // if there is is no lastExit, we must loop around to the end of the array
  return previousExit || lastExit;
}

function addCrossingPoint() {
  const strandElement = {
    x: currentLine.crossingPoint.coords[0],
    y: currentLine.crossingPoint.coords[1],
  };
  showLink.call(this, currentLine.crossingPoint.coords);
  this.push(strandElement);
}

function oppositeDirection() {
  return direction === 'R' ? 'L' : 'R';
}

function logCrossing() {
  currentLine.crossingPoint[direction === 'R' ? 'crossedRight' : 'crossedLeft'] = true;
}

function compareAngles(lineA, lineB) {
  return lineA.angleOutFrom(targetNode) - lineB.angleOutFrom(targetNode);
}

function nextTargetNode() {
  return goingBackwards() ? currentLine.endNode : currentLine.startNode;
}

function strandIsNotComplete() {
  return !nextLine().crossingPoint.crossed(oppositeDirection());
}

function goingBackwards() {
  return currentLine.startNode.sameNode(targetNode);
}

function initialDirection() {
  return currentLine.crossingPoint.uncrossedDirection();
}

function normal(vector) {
  return [-vector[1], vector[0]];
}

// showLink, showLastLink & showArrow and for the purposes of this demonstration only
function showLink(coords) {
  paint({ x: coords[0], y: coords[1] }, 'green');
  if (this[this.length - 1]) {
    paintLine(coords, [this[this.length - 1].x, this[this.length - 1].y]);
  }
}

function showLastLink() {
  showLink.call(this, [this[0].x, this[0].y]);
}

function showArrow() {
  frame.lines.map(line => line.snapObj).forEach(snap => snap.attr({ stroke: 'red' }));
  currentLine.snapObj.attr({ stroke: 'blue' });
  arrow && arrow.remove();
  return paintArrowHead(currentLine, goingBackwards());
}

export { drawStrand };