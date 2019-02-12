import drawing from './drawing.js';
import Snap from 'snapsvg';
import Graph from './graph.js';
import Frame from './frame.js';
import Knot from './knot.js';
import Node from './node.js';
export default Snap('#surface');


function drawSquareGrid() {
  drawing.graph = new Graph();
}
function setFrameType() {
  drawing.knot && drawing.knot.remove();
  drawing.frame && drawing.frame.remove();
  drawSquareGrid();
  drawing.frame && drawing.frame.draw();
  drawing.knot && drawing.drawKnot();
}

document.addEventListener('DOMContentLoaded', function () {
  drawing.init();
  setFrameType();
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
  frame.showAllNodes();
  new Knot(frame);
}, false);
