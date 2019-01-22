import Grid from './grid.js';
import config from './config.js';
import Line from './line.js';
import Mouse from './mouse.js';

export default function Frame(options) {
  this.nodes = [];
  this.adjacencyList = [];
  this.lines = [];
  var initialBox = options.initialBox;
  var finalBox = options.finalBox;
  // if drawn as grid rather than individual nodes and lines...
  if (initialBox && finalBox) {
    var leftmost = Math.min(initialBox[0], finalBox[0]);
    var topmost = Math.min(initialBox[1], finalBox[1]);
    var rightmost = Math.max(initialBox[0], finalBox[0]);
    var bottommost = Math.max(initialBox[1], finalBox[1]);
  }

  Grid.call(this, {
    drawing: options.drawing,
    startCol: leftmost,
    startRow: topmost,
    cols: rightmost - leftmost + 1,
    rows: bottommost - topmost + 1,
    style: config.frame,
  });

  this.showCrossingPoints = function() {
    for (var line of this.lines) {
      line.drawCrossingPoints();
    }
  };

  this.setNodes = function() {
    for (var x = leftmost; x <= rightmost + 1; x++) {
      for (var y = topmost; y <= bottommost + 1; y++) {
        this.nodes.push(
          new Node({
            x: x,
            y: y,
            gridSystem: 'square',
            drawing: options.drawing,
          })
        );
      }
    }
  };

  this.setNodes();

  this.showNodes = function() {
    for (var node of this.nodes) {
      node.draw();
    }
  };

  this.setLines = function() {
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
  };

  this.drawLines = function() {
    for (var i = 0; i < this.nodes.length; i++) {
      for (var j of this.adjacencyList[i]) {
        if (i < j) {
          // avoid drawing each line twice
          this.lines.push(
            new Line({
              startNode: this.nodes[i],
              endNode: this.nodes[j],
              style: config.frame,
              drawing: options.drawing,
            })
          );
        }
      }
    }
  };

  this.linesOutFrom = function(node) {
    return this.lines.filter(function(line) {
      return line.startNode.sameNode(node) || line.endNode.sameNode(node);
    });
  };

  this.setLines();

  this.draw = function() {
    this.drawLines();
    this.showNodes();
  };

  this.addNode = function(event) {
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
          drawing: options.drawing,
        })
      );
      this.adjacencyList.push([]);
      this.remove();
      this.draw();
    }
  };

  this.userLine = function () {
    function nodeIndex(node) {
      for (var i = 0; i < options.drawing.frame.nodes.length; i++) {
        if (options.drawing.frame.nodes[i].sameNode(node)) {
          return i;
        }
      }
    }

    var userLine;
    var hoveredNode;
    var downListener;
    var moveListener;
    var upListener;

    // this function constructs listeners for nodes
    function onUp(node) {
      return function() {
        options.drawing.graphArea.removeEventListener('mousemove', moveListener);
        userLine.remove();
        if (hoveredNode) {
          var lineAlreadyExists = options.drawing.frame.lines.find(function(line) {
            var existsForward = line.startNode.sameNode(node) && line.endNode.sameNode(hoveredNode);
            var existsReverse = line.endNode.sameNode(node) && line.startNode.sameNode(hoveredNode);
            return existsForward || existsReverse;
          });
          if (!lineAlreadyExists) {
            var startNodeIdx = nodeIndex(node);
            var endNodeIdx = nodeIndex(hoveredNode);
            options.drawing.frame.adjacencyList[startNodeIdx].push(endNodeIdx);
            options.drawing.frame.adjacencyList[endNodeIdx].push(startNodeIdx);
          }
        }
        if (options.drawing.knot) options.drawing.knot.remove();
        options.drawing.frame.remove();
        options.drawing.frame.draw();
        options.drawing.drawKnot();
        document.removeEventListener('mouseup', upListener);
        options.drawing.frame.userLine();
      };
    }

    function hoverIn(node) {
      return function() {
        hoveredNode = node;
      };
    }

    function hoverOut() {
      return function() {
        hoveredNode = undefined;
      };
    }

    function onDown(node) {
      function onMove(node) {
        return function(event) {
          userLine && userLine.remove();
          userLine = options.drawing.surface.line(node.x, node.y, ...Mouse.relativeCoords(event));
          userLine.attr(config.frame);
        };
      }

      return function() {
        moveListener = onMove(node);
        options.drawing.graphArea.addEventListener('mousemove', moveListener);
        upListener = onUp(node);
        document.addEventListener('mouseup', upListener);
      };
    }

    // add listeners to all nodes for clicks
    for (let node of this.nodes) {
      downListener = onDown(node);
      node.snapObject.mousedown(downListener);
      node.snapObject.hover(hoverIn(node), hoverOut(node));
    }
    // for each node...
    // on click, set move listener
    // on move, delete any extant useerLine, make new line and draw from start node to current point, and draw the line
    // on mouseup, if on another node, then create the line to centerpoint of that node
    // if not on another node, then delete the userLine
  };
}

Frame.prototype = Grid.prototype;

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

  this.sameNode = function(otherNode) {
    return this.x === otherNode.x && this.y === otherNode.y;
  };

  this.draw = function() {
    this.snapObject = options.drawing.surface.circle(this.x, this.y, config.nodeStyle.radius).attr(config.nodeStyle);
    //this.HTMLobj = this.findHTMLobj();
  };

  this.remove = function() {
    if (this.snapObject) this.snapObject.remove();
  };
}
