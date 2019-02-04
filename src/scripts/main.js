import drawing from './drawing.js';
import Snap from 'snapsvg';
import { relativeCoords } from './mouse.js';
import Graph from './graph.js';
export default Snap('#surface');

const noOp = () => {};

function drawSquareGrid() {
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
  return function(e) {
    // change node position
    [node.x, node.y] = relativeCoords(e);
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

function changeDrawingMode(newMode) {
  return () => drawing.mode = newMode;
}

document.addEventListener('DOMContentLoaded', function () {
  drawing.init();
  ['add-node', 'add-line', 'add-grid'].forEach(function (id) {
    const button = document.getElementById(id);
    button.addEventListener('click', changeDrawingMode(id), false);
  });
  setFrameType();
}, false);
