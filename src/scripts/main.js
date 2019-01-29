import Drawing from './drawing.js';
import Snap from 'snapsvg';
import Mouse from './mouse.js';
//import Frame from './frame.js';
import Graph from './graph.js';
export default Snap('#surface');

const noOp = () => {};
const drawing = new Drawing();

function drawSquareGrid() {
  // square is default grid type for time being
  drawing.graph = new Graph();
}
function makeDraggable(node) {
  node.snapObject.drag(makeDragHandler(node), noOp, redrawKnot);
}
function makeAllNodesDraggable() {
  drawing.frame.nodes.forEach(function (node) {
    makeDraggable(node);
  });
}
function makeDragHandler(node) {
  return function() {
    // change node position
    [node.x, node.y] = Mouse.relativeCoords(event);
    // re-draw whole frame
    drawing.frame.remove();
    drawing.frame.draw();
    // but now we have new snap objs without listeners attached
    // so add listeners again
    makeAllNodesDraggable();
    // uncomment the line below to make freeform 10x as fun
    redrawKnot();
  };
}
function redrawKnot() {
  drawing.knot.remove();
  drawing.drawKnot();
  makeAllNodesDraggable();
}
function startFreeformMode() {
  if (drawing.graph) drawing.graph.remove();
  makeAllNodesDraggable();
}
function setFrameType() {
  const frameType = 'square'; //document.querySelector('[name=frame-type]:checked').value;
  switch (frameType) {
  case 'square':
    drawing.knot && drawing.knot.remove();
    drawing.frame && drawing.frame.remove();
    drawSquareGrid();
    drawing.frame && drawing.frame.draw();
    drawing.knot && drawing.drawKnot();
    break;
  case 'freeform':
    startFreeformMode();
    break;
  }
}

// function makeDownHandler(node) {
//   return () => {
//     const moveListener = makeMoveHandler(node);
//     drawing.graphArea.addEventListener('mousemove', moveListener);
//     this.upListener = this.makeMouseUpHandler(node);
//     document.addEventListener('mouseup', this.upListener);
//   };
// }//

// function makeMouseUpHandler(node) {
//   return () => {
//     this.stopDrawingLine();
//     if (this.hoveredNode && !this.lineExistsBetween(node, this.hoveredNode)) {
//       this.markAsAdjacent(node, this.hoveredNode);
//     }
//     this.redrawWithKnot();
//     this.startLineDrawingMode();
//   };
// }//

// function makeMoveHandler(node) {
//   return (event) => {
//     this.userLine && this.userLine.remove();
//     this.userLine = Snap('#surface').line(node.x, node.y, ...Mouse.relativeCoords(event));
//     this.userLine.attr(config.frame);
//   };
// }

function changeDrawingMode(newMode) {
  return () => drawing.mode = newMode;
}

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('add-node').addEventListener('click', changeDrawingMode('node'), false);
  document.getElementById('add-line').addEventListener('click', changeDrawingMode('line'), false);
  document.getElementById('add-grid').addEventListener('click', changeDrawingMode('grid'), false);
  setFrameType();
}, false);
