import { paint, paintLine, paintArrowHead } from './debug-tools.js';

let arrow;
let currentLine;
let frame;
let direction;
let targetNode;

const ANIMATION_STEP = 500;
const PR_LIMIT_THETA = 1.6;


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

  // show currentLine as blue arrow
  arrow = showArrow();

  // add first element
  addElement.call(this);
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
  arrow = showArrow();
  addElement.call(this);
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
  const angleDelta = Math.abs(currentBearing() - nextBearing());
  const smallerAngle = Math.min(angleDelta, Math.PI * 2 - angleDelta);
  return smallerAngle > PR_LIMIT_THETA;
}

function currentBearing() {
  return currentLine.angleOutCP({
    direction: direction,
    reverse: goingBackwards(),
  });
}

function nextBearing() {
  return nextLine().angleOutCP({
    direction: oppositeDirection(),
    reverse: traverseNextBackwards(),
  });
}

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

function nextLine() {
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
  return nextExit || firstExit;
}

function rightTurn(roundabout, entryIndex) {
  const previousExit = roundabout[entryIndex - 1];
  const lastExit = roundabout[roundabout.length - 1];
  return previousExit || lastExit;
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

function showLink(coords) {
  paint({ x: coords[0], y: coords[1] }, 'green');
  if (this[this.length - 1]) {
    paintLine(coords, [this[this.length - 1].x, this[this.length - 1].y]);
  }
}

function normal(vector) {
  return [-vector[1], vector[0]];
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