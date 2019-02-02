import Grid from './grid.js';
import config from './config.js';
import Line from './line.js';
import Node from './node.js';
import Mouse from './mouse.js';
import { coordinateSet } from './general-utils.js';

export default function Frame(options) {
  this.options = options;
  this.nodes = [];
  this.adjacencyList = [];
  const initialBox = options.initialBox;
  const finalBox = options.finalBox;
  const nodes = options.nodes;
  const adjacencies = options.adjacencies;
  // if drawn as grid rather than individual nodes and lines...
  if (initialBox && finalBox) {
    this.leftmost = Math.min(initialBox[0], finalBox[0]);
    this.topmost = Math.min(initialBox[1], finalBox[1]);
    this.rightmost = Math.max(initialBox[0], finalBox[0]);
    this.bottommost = Math.max(initialBox[1], finalBox[1]);

    // 'super'
    Grid.call(this, {
      drawing: options.drawing,
      startCol: this.leftmost,
      startRow: this.topmost,
      cols: this.rightmost - this.leftmost + 1,
      rows: this.bottommost - this.topmost + 1,
      style: config.frame,
    });

    this.setNodes();
    this.setLines();
  } else if (nodes && adjacencies) {
    this.nodes = nodes;
    this.adjacencyList = adjacencies;
  }
}

// frames inherit from grids
Frame.prototype = Object.assign(Object.create(Grid.prototype), {
  constructor: Frame,
  nodeIndex(node) {
    return this.nodes.findIndex(function (someNode) {
      return someNode.sameNode(node);
    });
  },
  closestNodeToPoint(coords) {
    return this.nodes.reduce(function (acc, node) {
      if (node.distanceFromPoint(coords) < acc.distanceFromPoint(coords)) {
        return node;
      } else {
        return acc;
      }
    });
  },
  findProximalNode(coords) {
    const closestNode = this.closestNodeToPoint(coords);
    const proximityThreshold = config.nodeSelectionMinProximity;
    if (closestNode.distanceFromPoint(coords) < proximityThreshold) {
      return closestNode;
    } else {
      return undefined;
    }
  },
  lineExistsBetween(nodeA, nodeB) {
    const allLines = this.lines;
    return !!allLines.find(line => {
      return line.isBetween(nodeA, nodeB);
    });
  },
  stopDrawingLine() {
    const graphArea = this.options.drawing.graphArea;
    graphArea.removeEventListener('mousemove', this.moveListener);
    document.removeEventListener('mouseup', this.upListener);
    this.userLine.remove();
  },
  joinNodesAtIndex(idxA, idxB) {
    this.adjacencyList[idxA].push(idxB);
    this.adjacencyList[idxB].push(idxA);
  },
  markAsAdjacent(nodeA, nodeB) {
    this.joinNodesAtIndex(this.nodeIndex(nodeA), this.nodeIndex(nodeB));
  },
  redraw() {
    this.remove();
    this.draw();
  },
  redrawWithKnot() {
    if (this.options.drawing.currentKnot) {
      this.options.drawing.currentKnot.remove();
    }
    this.options.drawing.drawKnot();
    this.redraw();
  },
  hoverIn(node) {
    return () => {
      this.hoveredNode = node;
    };
  },
  hoverOut() {
    this.hoveredNode = undefined;
  },
  showCrossingPoints() {
    this.lines.forEach(line => line.drawCrossingPoints());
  },
  setNodes() {
    const nodeCoords = coordinateSet({
      leftmost: this.leftmost,
      rightmost: this.rightmost,
      topmost: this.topmost,
      bottommost: this.bottommost
    });
    nodeCoords.forEach((coord) => {
      this.nodes.push(
        new Node({
          x: coord[0],
          y: coord[1],
          gridSystem: 'square',
          drawing: this.options.drawing,
        })
      );
    });
  },
  showAllNodes() {
    this.nodes.forEach(node => node.draw());
  },
  setLines() {
    this.nodes.forEach(firstNode => {
      this.adjacencyList.push([]);
      this.nodes.forEach((secondNode, j) => {
        if (firstNode.isAdjacentTo(secondNode)) {
          this.adjacencyList[this.adjacencyList.length - 1].push(j);
        }
      });
    });
  },
  drawLineBetween(startNode, endNode) {
    this.lines.push(
      new Line({
        startNode,
        endNode,
        style: config.frame,
      })
    );
  },
  drawLines() {
    this.lines = [];
    this.nodes.forEach((startNode, i) => {
      this.adjacencyList[i].forEach(j => {
        // avoid drawing each line twice
        if (i < j) {
          this.drawLineBetween(startNode, this.nodes[j]);
        }
      });
    });
  },
  linesOutFrom(node) {
    return this.lines.filter(line => line.visits(node));
  },
  draw() {
    this.drawLines();
    this.showAllNodes();
  },
  overlapsExistingNode(pxX, pxY) {
    return this.nodes.some(node => node.hasOverlap(pxX, pxY));
  },
  addNode(coords) {
    this.nodes.push(
      new Node({
        x: coords[0],
        y: coords[1],
        gridSystem: 'square',
      })
    );
  },
  merge(otherFrame) {
    const originalLength = this.nodes.length;
    const nodes = this.nodes.concat(otherFrame.nodes);
    const newAdjacencies = otherFrame.adjacencyList.map(arr => arr.map(x => x + originalLength));
    const adjacencies = this.adjacencyList.concat(newAdjacencies);
    return new Frame({
      nodes,
      adjacencies,
      drawing: this.options.drawing
    });
  },
  handleNodePlacement(event) {
    const coords = Mouse.closestGraphCoords(event);
    const pixelCoords = Mouse.pixelCoords(coords);
    if (!this.overlapsExistingNode(...pixelCoords)) {
      this.addNode(coords);
      this.adjacencyList.push([]);
      this.redraw();
    }
  },
  firstUncrossedLine() {
    return this.lines.find(line => line.uncrossed());
  },
});
