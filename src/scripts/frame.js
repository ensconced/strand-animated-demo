import Grid from './grid.js';
import config from './config.js';
import Line from './line.js';
import Node from './node.js';
import { closestGraphCoords, pixelCoords } from './mouse.js';
import { coordinateSet } from './general-utils.js';

export default function Frame(options) {
  const { initialBox, finalBox, nodes, adjacencies } = options;
  if (initialBox && finalBox) {
    // i.e. if drawn as grid rather than individual nodes and lines...
    this.initFromBoxExtrema(initialBox, finalBox);
  } else if (nodes && adjacencies) {
    this.nodes = nodes;
    this.adjacencyList = adjacencies;
  }
}

// frames inherit from grids
Frame.prototype = Object.assign(Object.create(Grid.prototype), {
  constructor: Frame,
  initFromBoxExtrema(initialBox, finalBox) {
    this.nodes = [];
    this.adjacencyList = [];

    const leftmost = Math.min(initialBox[0], finalBox[0]);
    const topmost = Math.min(initialBox[1], finalBox[1]);
    const rightmost = Math.max(initialBox[0], finalBox[0]);
    const bottommost = Math.max(initialBox[1], finalBox[1]);

    this.makeFullFrameBetween(leftmost, topmost, rightmost, bottommost);
  },
  makeFullFrameBetween(leftmost, topmost, rightmost, bottommost) {
    const nodeCoords = coordinateSet({ leftmost, rightmost, topmost, bottommost });
    nodeCoords.forEach((coord) => {
      this.nodes.push(
        new Node({
          x: coord[0],
          y: coord[1],
          gridSystem: 'square',
        })
      );
    });
    this.adjacencyList = this.allNeighboursAdjacent();
  },
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
  joinNodesAtIndex(idxA, idxB) {
    this.adjacencyList[idxA].push(idxB);
    this.adjacencyList[idxB].push(idxA);
  },
  markAsAdjacent(nodeA, nodeB) {
    this.joinNodesAtIndex(this.nodeIndex(nodeA), this.nodeIndex(nodeB));
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
  showAllNodes() {
    this.nodes.forEach(node => node.draw());
  },
  allNeighboursAdjacent() {
    const adjacencies = [];
    this.nodes.forEach(firstNode => {
      adjacencies.push([]);
      this.nodes.forEach((secondNode, j) => {
        if (firstNode.isAdjacentTo(secondNode)) {
          adjacencies[adjacencies.length - 1].push(j);
        }
      });
    });
    return adjacencies;
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
    this.nodes = nodes;
    this.adjacencyList = adjacencies;
    return this;
  },
  handleNodePlacement(event) {
    const coords = closestGraphCoords(event);
    const pxCoords = pixelCoords(coords);
    if (!this.overlapsExistingNode(...pxCoords)) {
      this.remove();
      this.addNode(coords);
      this.adjacencyList.push([]);
      this.draw();
    }
  },
  firstUncrossedLine() {
    return this.lines.find(line => line.uncrossed());
  },
});
