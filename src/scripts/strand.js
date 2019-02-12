import { paint, paintLine, paintArrowHead } from './debug-tools.js';

let arrow;
let currentLine;
let frame;
let direction;
let targetNode;

function slowly(callback, context) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      callback.call(context);
      resolve();
    }, 1000);
  });
}

// like a while loop, but for promises
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

function addAllElements() {
  slowWhile(strandIsNotComplete, function() {
    return slowly(function () {
      proceed();
      arrow = showArrow();
      addElement.call(this);
    }, this);
  }, this)

  .then(function () {
    showLastLink.call(this);
  }.bind(this));
}

function proceed() {
  currentLine = nextLine();
  direction = oppositeDirection();
  targetNode = nextTargetNode();
}

function addElement() {
  addCrossingPoint.call(this);
  logCrossing();
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