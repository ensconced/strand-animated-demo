import config from './config.js';
import knotUtils from './knot-utils.js';
import numeric from 'numeric';
import Bezier from 'bezier-js';
import StraightLine from './straight-line.js';

export default function Contour(points) {
  this.points = points;
  this.theta = 1.5;
  this.matrix = [];
  this.equals = [];
  const { xCntrlPoints, yCntrlPoints } = this.matrixSolution();

  const polygons = [];

  for (var index = 0; index < this.points.length; index++) {
    const polygon = this.getBezier(index, xCntrlPoints, yCntrlPoints);
    polygons.push(polygon);
    const bez = this.bezier(polygon);

    // adding properties to points...
    this.assignOutboundBezes(index, bez);
    this.assignOutbound(index, bez);
  }
}

Contour.prototype = {
  constructor: Contour,
  bezier(polygon) {
    return new Bezier(...polygon.reduce((arr, sub) => arr.concat(sub)));
  },
  matrixSolution() {
    this.constructMatrix();
    const cntrlPoints = numeric.solve(this.matrix, this.equals);
    return {
      xCntrlPoints: cntrlPoints.slice(0, cntrlPoints.length / 2),
      yCntrlPoints: cntrlPoints.slice(cntrlPoints.length / 2),
    };
  },
  getBezier(index, xCntrlPoints, yCntrlPoints) {
    var bezPoints = [];
    bezPoints.push([this.points[index].x, this.points[index].y]);
    bezPoints.push([xCntrlPoints.shift(), yCntrlPoints.shift()]);
    bezPoints.push([xCntrlPoints.shift(), yCntrlPoints.shift()]);
    bezPoints.push([
      this.points[knotUtils.nextCyclicalIdx(this.points, index)].x,
      this.points[knotUtils.nextCyclicalIdx(this.points, index)].y,
    ]);
    return bezPoints;
  },
  assignOutbound(index, bez) {
    if (knotUtils.linearOrClose(bez)) {
      this.replaceOutboundWithStraightLine(index);
    } else {
      this.points[index].outbound = bez;
    }
  },
  replaceOutboundWithStraightLine(index, bez) {
    var start = [bez.points[0].x, bez.points[0].y];
    var end = [bez.points[3].x, bez.points[3].y];
    this.points[index].outbound = new StraightLine(start, end);
  },
  assignOutboundBezes(index, bez) {
    if (this.points[index].pr) {
      //strand[index].point.out = bez;
    } else {
      if (this.points[index].direction === 'R') {
        this.points[index].point.overOut = bez;
      } else if (this.points[index].direction === 'L') {
        this.points[index].point.underOut = bez;
      }
    }
  },
  constructMatrix() {
    for (var j = 0; j < this.points.length; j++) {
      this.setC2continuity(j);
      if (this.points[j].pr) {
        this.setPRangle(j);
      } else {
        this.setC1continuity(j);
      }
    }
  },
  assignOffsets() {
    for (var i = 0; i < this.points.length; i++) {
      var left = this.points[i].outbound.offset(-(config.knot.strokeWidth + config.knot.borderWidth) / 2);
      var right = this.points[i].outbound.offset((config.knot.strokeWidth + config.knot.borderWidth) / 2);
      left = knotUtils.polyline(knotUtils.removeStubs(left));
      right = knotUtils.polyline(knotUtils.removeStubs(right));
      var next = this.points[knotUtils.nextCyclicalIdx(this.points, i)];

      if (this.points[i].pr) {
        if (this.points[i].pr === 'L') {
          this.points[i].point.innerInbound = left;
          this.points[i].point.outerInbound = right;
        } else if (this.points[i].pr === 'R') {
          this.points[i].point.innerInbound = right;
          this.points[i].point.outerInbound = left;
        }
        if (this.points[knotUtils.previousCyclicalIdx(this.points, i)].direction === 'R') {
          next.point.underInLeft = left;
          next.point.underInRight = right;
        } else if (this.points[knotUtils.previousCyclicalIdx(this.points, i)].direction === 'L') {
          next.point.overInLeft = left;
          next.point.overInRight = right;
        }
      } else {
        if (this.points[i].direction === 'R') {
          this.points[i].point.overOutLeft = left;
          this.points[i].point.overOutRight = right;
          if (!next.pr) {
            next.point.underInLeft = left;
            next.point.underInRight = right;
          } else {
            next.point.innerOutbound = left;
            next.point.outerOutbound = right;
          }
        } else if (this.points[i].direction === 'L') {
          this.points[i].point.underOutLeft = left;
          this.points[i].point.underOutRight = right;
          if (!next.pr) {
            next.point.overInLeft = left;
            next.point.overInRight = right;
          } else {
            next.point.innerOutbound = right;
            next.point.outerOutbound = left;
          }
        }
      }
    }
  },
  emptyRow() {
    var row = [];
    this.points.forEach(function () {
      row = row.concat([0, 0]);
    });
    return row;
  },
  condition(startIdx, entries) {
    var row = this.emptyRow();
    for (var x of entries) {
      if (startIdx > row.length - 1) {
        row[startIdx % row.length] = x;
      } else if (startIdx >= 0) {
        row[startIdx] = x;
      } else {
        row[row.length + startIdx] = x;
      }
      startIdx++;
    }
    return row;
  },
  setC1continuity(i) {
    var row = this.condition(2 * i - 1, [1, 1]);
    this.matrix.push(row.concat(this.emptyRow()));
    this.matrix.push(this.emptyRow().concat(row));
    this.equals.push(2 * this.points[i].x);
    this.equals.push(2 * this.points[i].y);
  },
  setC2continuity(i) {
    var row = this.condition(2 * i, [1, -2, 2, -1]);
    this.matrix.push(row.concat(this.emptyRow()));
    this.matrix.push(this.emptyRow().concat(row));
    this.equals.push(0);
    this.equals.push(0);
  },
  setPRangle(i) {
    var angle;
    if (this.points[i].pr === 'R') {
      angle = this.theta;
    } else if (this.points[i].pr === 'L') {
      angle = 2 * Math.PI - this.theta;
    }
    var row1 = this.condition(2 * i - 1, [1, -Math.cos(angle)]);
    var row2 = this.condition(2 * i, [Math.sin(angle)]);
    var row3 = this.condition(2 * i, [-Math.sin(angle)]);
    this.matrix.push(row1.concat(row2));
    this.matrix.push(row3.concat(row1));
    this.equals.push((1 - Math.cos(angle)) * this.points[i].x + Math.sin(angle) * this.points[i].y),
    this.equals.push((1 - Math.cos(angle)) * this.points[i].y - Math.sin(angle) * this.points[i].x);
  },
  getPRandDirection(strand, index) {
    var pr;
    var direction;
    if (strand[index].pr) {
      pr = 'inbound';
      direction = strand[index].pr;
    } else if (strand[knotUtils.nextCyclicalIdx(strand, index)].pr) {
      pr = 'outbound';
      direction = strand[knotUtils.nextCyclicalIdx(strand, index)].pr;
    } else {
      pr = false;
      direction = strand[index].direction;
    }
    return {pr, direction,};
  },
};