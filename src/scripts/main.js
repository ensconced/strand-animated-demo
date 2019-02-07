import drawing from './drawing.js';
import Snap from 'snapsvg';
import { relativeCoords } from './mouse.js';
import Graph from './graph.js';
import Frame from './frame.js';
import Knot from './knot.js';
import Node from './node.js';
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

  const adjacencyList = [[1, 3], [0, 2, 4, 5, 3], [1, 5], [0, 4, 6, 1, 7], [1, 3, 5, 7], [2, 4, 8, 1, 7], [3, 7], [4, 6, 8, 3, 5], [5, 7]];
  const arr = [{ x: 2, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 3, y: 2 }, { x: 3, y: 3 }, { x: 3, y: 4 }, { x: 4, y: 2 }, { x: 4, y: 3 }, { x: 4, y: 4 }];
  const nodes = arr.map(coords => {
    return new Node({
      ...coords,
      gridSystem: 'square',
    });
  });
  const frame = new Frame({ lines: [], nodes, adjacencies: adjacencyList, });
  frame.drawLines();
  new Knot(frame);


  drawing.init();
  ['add-node', 'add-line', 'add-grid'].forEach(function (id) {
    const button = document.getElementById(id);
    button.addEventListener('click', changeDrawingMode(id), false);
  });
  setFrameType();
}, false);
