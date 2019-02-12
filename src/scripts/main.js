import Frame from './frame.js';
import Node from './node.js';
import { drawStrand } from './strand.js';

const points = [
  {x: 71, y: 141},
  {x: 71, y: 211},
  {x: 141, y: 141},
  {x: 141, y: 211},
  {x: 211, y: 141},

  {x: 211, y: 211},
  {x: 281, y: 141},
  {x: 281, y: 211},
  {x: 351, y: 141},
  {x: 351, y: 211},
];

const nodes = points.map(point => new Node(point));

const adjacencies = [
  [1, 2],
  [0, 3],
  [0, 3, 4],
  [1, 2, 5],
  [2, 5, 6],
  [3, 4, 7],
  [4, 7, 8],
  [5, 6, 9],
  [6, 9],
  [7, 8]
];

document.addEventListener('DOMContentLoaded', function () {
  const frame = new Frame({ nodes, adjacencies });
  frame.drawLines();
  frame.drawNodes();
  drawStrand(frame);
}, false);
