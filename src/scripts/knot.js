import knotUtils from './knot-utils.js';
import Strand from './strand.js';
import PointedReturn from './pointed-return.js';
import Contour from './contour.js';
import surface from './main.js';

export default function Knot(frame) {
  this.group = surface.g();
  this.strands = [];

  this.frame = frame;

  this.remove = function() {
    this.group.remove();
  };
  this.generateAllStrands();
  this.generateOffsets();
  this.trimUnders();
  this.draw();
  this.frame.remove();
  this.frame.draw();
  // drawing.stopDrawingFrame();
}

Knot.prototype = {
  constructor: Knot,
  firstUncrossedLine() {
    return this.frame.lines.find(this.uncrossed);
  },
  selectDirection() {
    this.direction = this.currentLine.crossingPoint.uncrossedDirection();
    this.targetNode = this.currentLine.endNode;
  },
  addPoint(strand) {
    strand.add({
      point: this.currentLine.crossingPoint,
      x: this.currentLine.crossingPoint.coords[0],
      y: this.currentLine.crossingPoint.coords[1],
      pr: false,
      direction: this.direction,
    });
    if (this.pointedReturn()) {
      var startCoords = this.currentLine.crossingPoint.coords;
      var endCoords = this.getNextLine(this.direction).crossingPoint.coords;
      var prCoords = this.getApexCoords(startCoords, endCoords, this.direction);
      strand.add({
        point: {},
        x: prCoords[0],
        y: prCoords[1],
        pr: this.oppositeDirection(),
      });
    }
    this.logCrossing(this.direction);
  },
  selectNextPoint() {
    this.currentLine = this.getNextLine(this.direction);
    this.direction = this.oppositeDirection();
  },
  setNewTargetNode() {
    // set new targetNode
    if (this.goingBackwards()) {
      this.targetNode = this.currentLine.endNode;
    } else {
      this.targetNode = this.currentLine.startNode;
    }
  },
  endOfStrand() {
    return this.getNextLine(this.direction).crossingPoint.crossed(this.oppositeDirection());
  },
  generateStrand() {
    var strand = new Strand();
    this.currentLine = this.firstUncrossedLine();
    this.selectDirection();
    this.addPoint(strand);

    // in the below while loop we add all the
    // crossingpoints through which our strand passes
    while (true) {
      this.addNextPoint(strand);
      if (this.endOfStrand()) break;
    }
    this.strands.push(strand);
  },
  addNextPoint(strand) {
    this.selectNextPoint();
    this.setNewTargetNode();
    this.addPoint(strand);
  },
  generateAllStrands() {
    while (this.frame.lines.some(this.uncrossed)) {
      this.generateStrand();
    }
  },
  generateOffsets() {
    this.strands.forEach(function (strand) {
      var c = new Contour(strand.points);
      c.assignOffsets();
    });
  },
  trimUnders() {
    this.strands.forEach(strand => strand.trimUnders());
  },
  draw() {
    this.strands.forEach(strand => {
      for (var i = 0; i < strand.length; i++) {
        var cpORpr = strand.points[i];
        // now draw everything except PRs
        if (!(cpORpr.pr || strand.points[knotUtils.nextCyclicalIdx(strand, i)].pr)) {
          var point = cpORpr.point;
          if (cpORpr.direction === 'R') {
            this.drawOutline(point.overOutLeft);
            this.drawOutline(point.overOutRight);
          } else {
            this.drawOutline(point.underOutLeft);
            this.drawOutline(point.underOutRight);
          }
        } else if (cpORpr.pr) {
          // here we draw the PRs
          var pr = new PointedReturn({
            pr: cpORpr,
            group: this.group,
            middleOutbound: strand.points[knotUtils.previousCyclicalIdx(strand, i)].outbound,
            middleInbound: cpORpr.outbound,
          });
          pr.draw();
        }
      }
    });
  },
  drawOutline(outline) {
    var points = outline.reduce(knotUtils.reducer, []);
    var snp = surface.polyline(points);
    this.group.add(snp);
    knotUtils.format(snp);
  },
  logCrossing(direction) {
    if (direction === 'R') {
      this.currentLine.crossingPoint.crossedRight = true;
    } else {
      this.currentLine.crossingPoint.crossedLeft = true;
    }
  },
  compareByAngle(lineA, lineB) {
    if (lineA.angleOutFrom(this.targetNode) < lineB.angleOutFrom(this.targetNode)) {
      return -1;
    } else {
      return 1;
    }
  },
  getApexCoords(startPoint, endPoint, direction) {
    var startToEnd = [endPoint[0] - startPoint[0], endPoint[1] - startPoint[1]];
    var normal;
    if (direction === 'R') {
      normal = [-startToEnd[1], startToEnd[0]];
    } else if (direction === 'L') {
      normal = [startToEnd[1], -startToEnd[0]];
    }
    return [startPoint[0] + startToEnd[0] / 2 + normal[0], startPoint[1] + startToEnd[1] / 2 + normal[1]];
  },
  getNextLine(direction) {
    this.roundabout = this.frame.linesOutFrom(this.targetNode);
    var orderedLinesOut = this.roundabout.slice().sort(this.compareByAngle.bind(this));
    var inIndex = orderedLinesOut.indexOf(this.currentLine);

    if (direction === 'R') {
      // pad out list with first element...
      // to allow going all way thru to start again
      var previousLine = orderedLinesOut[inIndex - 1];
      var lastLine = orderedLinesOut[orderedLinesOut.length - 1];
      return previousLine || lastLine;
    } else {
      orderedLinesOut.push(orderedLinesOut[0]);
      return orderedLinesOut[inIndex + 1];
    }
  },
  uncrossed(line) {
    return !line.crossingPoint.fullyCrossed();
  },
  goingBackwards() {
    return this.currentLine.startNode.sameNode(this.targetNode);
  },
  traverseNextBackwards() {
    return this.getNextLine(this.direction).endNode.sameNode(this.targetNode);
  },
  currentBearing() {
    return this.currentLine.angleOutCP({
      direction: this.direction,
      reverse: this.goingBackwards(),
    });
  },
  nextBearing() {
    return this.getNextLine(this.direction).angleOutCP({
      direction: this.oppositeDirection(),
      reverse: this.traverseNextBackwards(),
    });
  },
  pointedReturn() {
    var angleDelta = Math.abs(this.currentBearing() - this.nextBearing());
    var smallerAngle = Math.min(angleDelta, Math.PI * 2 - angleDelta);
    return smallerAngle > 1.6;
  },
  oppositeDirection() {
    return this.direction === 'R' ? 'L' : 'R';
  },
};
