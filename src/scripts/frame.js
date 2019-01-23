import Grid from './grid.js';
import config from './config.js';
import Line from './line.js';
import Mouse from './mouse.js';
import surface from './main.js';

export default function Frame(options) {
  this.options = options;
  this.nodes = [];
  this.adjacencyList = [];
  var initialBox = options.initialBox;
  var finalBox = options.finalBox;
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
    for (var i = 0; i < this.options.drawing.frame.nodes.length; i++) {
      if (this.options.drawing.frame.nodes[i].sameNode(node)) {
        return i;
      }
    }
  },
  lineIsBetween(line, nodeA, nodeB) {
    const isForwards = line.startNode.sameNode(nodeA) && line.endNode.sameNode(nodeB);
    const isReversed = line.startNode.sameNode(nodeB) && line.endNode.sameNode(nodeA);
    return isForwards || isReversed;
  },
  lineExistsBetween(nodeA, nodeB) {
    const allLines = this.options.drawing.frame.lines;
    return !!allLines.find(line => {
      return this.lineIsBetween(line, nodeA, nodeB);
    });
  },
  makeMouseUpHandler(node) {
    return function() {
      this.options.drawing.graphArea.removeEventListener('mousemove', this.moveListener);
      this.userLine.remove();
      if (this.hoveredNode) {
        if (!this.lineExistsBetween(node, this.hoveredNode)) {
          var startNodeIdx = this.nodeIndex.call(this, node);
          var endNodeIdx = this.nodeIndex.call(this, this.hoveredNode);
          this.options.drawing.frame.adjacencyList[startNodeIdx].push(endNodeIdx);
          this.options.drawing.frame.adjacencyList[endNodeIdx].push(startNodeIdx);
        }
      }
      if (this.options.drawing.knot) this.options.drawing.knot.remove();
      this.options.drawing.frame.remove();
      this.options.drawing.frame.draw();
      this.options.drawing.drawKnot();
      document.removeEventListener('mouseup', this.upListener);
      this.options.drawing.frame.startLineDrawingMode();
    };
  },
  startLineDrawingMode() {
    // this function constructs listeners for nodes
    function hoverIn(node) {
      return function() {
        this.hoveredNode = node;
      };
    }

    function hoverOut() {
      return function() {
        this.hoveredNode = undefined;
      };
    }

    function onDown(node) {
      function onMove(node) {
        return function(event) {
          this.userLine && this.userLine.remove();
          this.userLine = surface.line(node.x, node.y, ...Mouse.relativeCoords(event));
          this.userLine.attr(config.frame);
        };
      }

      return function() {
        this.moveListener = onMove(node).bind(this);
        this.options.drawing.graphArea.addEventListener('mousemove', this.moveListener);
        this.upListener = this.makeMouseUpHandler(node).bind(this);
        document.addEventListener('mouseup', this.upListener);
      };
    }

    // add listeners to all nodes for clicks
    this.nodes.forEach(node => {
      this.downListener = onDown(node).bind(this);
      node.snapObject.mousedown(this.downListener);
      node.snapObject.hover(hoverIn(node).bind(this), hoverOut(node).bind(this));
    });
    // for each node...
    // on click, set move listener
    // on move, delete any extant useerLine, make new line and draw from start node to current point, and draw the line
    // on mouseup, if on another node, then create the line to centerpoint of that node
    // if not on another node, then delete the userLine
  },
  showCrossingPoints() {
    for (var line of this.lines) {
      line.drawCrossingPoints();
    }
  },
  setNodes() {
    for (var x = this.leftmost; x <= this.rightmost + 1; x++) {
      for (var y = this.topmost; y <= this.bottommost + 1; y++) {
        this.nodes.push(
          new Node({
            x: x,
            y: y,
            gridSystem: 'square',
            drawing: this.options.drawing,
          })
        );
      }
    }
  },
  showNodes() {
    for (var node of this.nodes) {
      node.draw();
    }
  },
  setLines() {
    for (var firstNode of this.nodes) {
      this.adjacencyList.push([]);
      // push indices of adjacent this.nodes to this new subarray
      for (var j = 0; j < this.nodes.length; j++) {
        var secondNode = this.nodes[j];
        var xDiff = Math.abs(secondNode.gridX - firstNode.gridX);
        var yDiff = Math.abs(secondNode.gridY - firstNode.gridY);
        var diffs = [xDiff, yDiff];
        // if the two this.nodes are adjacent, then difference in grid values is 1 in one dimension,
        // and zero in the other
        if (diffs.includes(1) && diffs.includes(0)) {
          this.adjacencyList[this.adjacencyList.length - 1].push(j);
        }
      }
    }
  },
  drawLines() {
    for (var i = 0; i < this.nodes.length; i++) {
      for (var j of this.adjacencyList[i]) {
        if (i < j) {
          // avoid drawing each line twice
          this.lines.push(
            new Line({
              startNode: this.nodes[i],
              endNode: this.nodes[j],
              style: config.frame,
              drawing: this.options.drawing,
            })
          );
        }
      }
    }
  },
  linesOutFrom(node) {
    return this.lines.filter(function(line) {
      return line.startNode.sameNode(node) || line.endNode.sameNode(node);
    });
  },
  draw() {
    this.drawLines();
    this.showNodes();
  },
  addNode(event) {
    var x;
    var y;
    [x, y] = Mouse.closestGraphCoords(event);
    var pxX;
    var pxY;
    [pxX, pxY] = Mouse.pixelCoords([x, y]);

    var overlapsExistingNode = this.nodes.find(function(node) {
      var deltaX = Math.abs(pxX - node.x);
      var deltaY = Math.abs(pxY - node.y);
      return (deltaX ** 2 + deltaY ** 2) ** 0.5 <= config.nodeStyle.radius;
    });
    if (!overlapsExistingNode) {
      this.nodes.push(
        new Node({
          x: x,
          y: y,
          gridSystem: 'square',
          drawing: this.options.drawing,
        })
      );
      this.adjacencyList.push([]);
      this.remove();
      this.draw();
    }
  },
});

function Node(options) {
  if (options.gridSystem === 'square') {
    this.gridX = options.x;
    this.gridY = options.y;
    var x;
    var y;
    [x, y] = Mouse.pixelCoords([this.gridX, this.gridY]);
    this.x = x;
    this.y = y;
  } else if (options.gridSystem === 'freeform') {
    this.x = options.x;
    this.y = options.y;
  }
}
Node.prototype = {
  constructor: Node,
  sameNode(otherNode) {
    return this.x === otherNode.x && this.y === otherNode.y;
  },
  draw() {
    this.snapObject = surface.circle(this.x, this.y, config.nodeStyle.radius).attr(config.nodeStyle);
    //this.HTMLobj = this.findHTMLobj();
  },
  remove() {
    if (this.snapObject) this.snapObject.remove();
  },
};
