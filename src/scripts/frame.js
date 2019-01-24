import Grid from './grid.js';
import config from './config.js';
import Line from './line.js';
import Node from './node.js';
import Mouse from './mouse.js';
import surface from './main.js';
import { identicalObjects, coordinateSet } from './general-utils.js';

export default function Frame(options) {
  this.options = options;
  this.nodes = [];
  this.adjacencyList = [];
  const initialBox = options.initialBox;
  const finalBox = options.finalBox;
  // if drawn as grid rather than individual nodes and lines...
  if (initialBox && finalBox) {
    this.leftmost = Math.min(initialBox[0], finalBox[0]);
    this.topmost = Math.min(initialBox[1], finalBox[1]);
    this.rightmost = Math.max(initialBox[0], finalBox[0]);
    this.bottommost = Math.max(initialBox[1], finalBox[1]);
  }

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
}

// frames inherit from grids
Frame.prototype = Object.assign(Object.create(Grid.prototype), {
  constructor: Frame,
  nodeIndex(node) {
    return this.nodes.findIndex(function (someNode) {
      return someNode.sameNode(node);
    });
  },
  lineIsBetween(line, nodeA, nodeB) {
    const isForwards = line.startNode.sameNode(nodeA) && line.endNode.sameNode(nodeB);
    const isReversed = line.startNode.sameNode(nodeB) && line.endNode.sameNode(nodeA);
    return isForwards || isReversed;
  },
  lineExistsBetween(nodeA, nodeB) {
    const allLines = this.lines;
    return !!allLines.find(line => {
      return this.lineIsBetween(line, nodeA, nodeB);
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
    if (this.options.drawing.knot) this.options.drawing.knot.remove();
    this.redraw();
    this.options.drawing.drawKnot();
  },
  makeMouseUpHandler(node) {
    return () => {
      this.stopDrawingLine();
      if (this.hoveredNode && !this.lineExistsBetween(node, this.hoveredNode)) {
        this.markAsAdjacent(node, this.hoveredNode);
      }
      this.redrawWithKnot();
      this.startLineDrawingMode();
    };
  },
  hoverIn(node) {
    return () => {
      this.hoveredNode = node;
    };
  },
  hoverOut() {
    this.hoveredNode = undefined;
  },
  onMove(node) {
    return (event) => {
      this.userLine && this.userLine.remove();
      this.userLine = surface.line(node.x, node.y, ...Mouse.relativeCoords(event));
      this.userLine.attr(config.frame);
    };
  },
  onDown(node) {
    return () => {
      this.moveListener = this.onMove(node);
      this.options.drawing.graphArea.addEventListener('mousemove', this.moveListener);
      this.upListener = this.makeMouseUpHandler(node);
      document.addEventListener('mouseup', this.upListener);
    };
  },
  startLineDrawingMode() {
    this.nodes.forEach(node => {
      this.downListener = this.onDown(node);
      node.snapObject.mousedown(this.downListener);
      node.snapObject.hover(this.hoverIn(node), this.hoverOut);
    });
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
  showNodes() {
    this.nodes.forEach(node => node.draw());
  },
  nodesAreAdjacent(nodeA, nodeB) {
    const xDiff = Math.abs(nodeB.gridX - nodeA.gridX);
    const yDiff = Math.abs(nodeB.gridY - nodeA.gridY);
    return identicalObjects([xDiff, yDiff].sort(), [0, 1]);
  },
  setLines() {
    this.nodes.forEach(firstNode => {
      this.adjacencyList.push([]);
      this.nodes.forEach((secondNode, j) => {
        if (this.nodesAreAdjacent(firstNode, secondNode)) {
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
        drawing: this.options.drawing,
      })
    );
  },
  drawLines() {
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
    return this.lines.filter(line => this.lineVisitsNode(line, node));
  },
  lineVisitsNode(line, node) {
    return line.startNode.sameNode(node) || line.endNode.sameNode(node);
  },
  draw() {
    this.drawLines();
    this.showNodes();
  },
  overlapsExistingNode(pxX, pxY) {
    return this.nodes.some(function(node) {
      const deltaX = Math.abs(pxX - node.x);
      const deltaY = Math.abs(pxY - node.y);
      return (deltaX ** 2 + deltaY ** 2) ** 0.5 <= config.nodeStyle.radius;
    });
  },
  addNode(coords) {
    this.nodes.push(
      new Node({
        x: coords[0],
        y: coords[1],
        gridSystem: 'square',
        drawing: this.options.drawing,
      })
    );
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
});
