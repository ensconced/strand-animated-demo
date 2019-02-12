import config from './config.js';
import Line from './line.js';

export default function Frame(options) {
  const { nodes, adjacencies } = options;
  this.nodes = nodes;
  this.adjacencyList = adjacencies;
}

// frames inherit from grids
Frame.prototype = {
  constructor: Frame,
  showAllNodes() {
    this.nodes.forEach(node => node.draw());
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
  firstUncrossedLine() {
    return this.lines.find(line => line.uncrossed());
  },
};
