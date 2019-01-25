import config from './config.js';
import knotUtils from './knot-utils.js';
import numeric from 'numeric';
import Bezier from 'bezier-js';
import StraightLine from './straight-line.js';

export default function Contour(strand) {
  this.strand = strand;
  this.theta = 1.5;
  this.matrix = [];
  this.equals = [];
  const { xCntrlPoints, yCntrlPoints } = this.matrixSolution();

  const polygons = [];

  for (var index = 0; index < strand.length; index++) {
    const polygon = this.getBezier(index, xCntrlPoints, yCntrlPoints);
    polygons.push(polygon);
    const bez = this.bezier(polygon);

    // adding properties to points...
    this.assignOutboundBezes(strand, index, bez);
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
    bezPoints.push([this.strand.points[index].x, this.strand.points[index].y]);
    bezPoints.push([xCntrlPoints.shift(), yCntrlPoints.shift()]);
    bezPoints.push([xCntrlPoints.shift(), yCntrlPoints.shift()]);
    bezPoints.push([
      this.strand.points[knotUtils.nextCyclicalIdx(this.strand, index)].x,
      this.strand.points[knotUtils.nextCyclicalIdx(this.strand, index)].y,
    ]);
    return bezPoints;
  },
  assignOutbound(index, bez) {
    if (knotUtils.linearOrClose(bez)) {
      this.replaceOutboundWithStraightLine(index);
    } else {
      this.strand.points[index].outbound = bez;
    }
  },
  replaceOutboundWithStraightLine(index, bez) {
    var start = [bez.points[0].x, bez.points[0].y];
    var end = [bez.points[3].x, bez.points[3].y];
    this.strand.points[index].outbound = new StraightLine(start, end);
  },
  assignOutboundBezes(strand, index, bez) {
    if (strand.points[index].pr) {
      //strand.points[index].point.out = bez;
    } else {
      if (strand.points[index].direction === 'R') {
        strand.points[index].point.overOut = bez;
      } else if (strand.points[index].direction === 'L') {
        strand.points[index].point.underOut = bez;
      }
    }
  },
  constructMatrix() {
    for (var j = 0; j < this.strand.length; j++) {
      this.setC2continuity(j);
      if (this.strand.points[j].pr) {
        this.setPRangle(j);
      } else {
        this.setC1continuity(j);
      }
    }
  },
  assignOffsets() {
    for (var i = 0; i < this.strand.length; i++) {
      var left = this.strand.points[i].outbound.offset(-(config.knot.strokeWidth + config.knot.borderWidth) / 2);
      var right = this.strand.points[i].outbound.offset((config.knot.strokeWidth + config.knot.borderWidth) / 2);
      left = knotUtils.polyline(knotUtils.removeStubs(left));
      right = knotUtils.polyline(knotUtils.removeStubs(right));
      var next = this.strand.points[knotUtils.nextCyclicalIdx(this.strand, i)];

      if (this.strand.points[i].pr) {
        if (this.strand.points[i].pr === 'L') {
          this.strand.points[i].point.innerInbound = left;
          this.strand.points[i].point.outerInbound = right;
        } else if (this.strand.points[i].pr === 'R') {
          this.strand.points[i].point.innerInbound = right;
          this.strand.points[i].point.outerInbound = left;
        }
        if (this.strand.points[knotUtils.previousCyclicalIdx(this.strand, i)].direction === 'R') {
          next.point.underInLeft = left;
          next.point.underInRight = right;
        } else if (this.strand.points[knotUtils.previousCyclicalIdx(this.strand, i)].direction === 'L') {
          next.point.overInLeft = left;
          next.point.overInRight = right;
        }
      } else {
        if (this.strand.points[i].direction === 'R') {
          this.strand.points[i].point.overOutLeft = left;
          this.strand.points[i].point.overOutRight = right;
          if (!next.pr) {
            next.point.underInLeft = left;
            next.point.underInRight = right;
          } else {
            next.point.innerOutbound = left;
            next.point.outerOutbound = right;
          }
        } else if (this.strand.points[i].direction === 'L') {
          this.strand.points[i].point.underOutLeft = left;
          this.strand.points[i].point.underOutRight = right;
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
    this.strand.points.forEach(function () {
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
    this.equals.push(2 * this.strand.points[i].x);
    this.equals.push(2 * this.strand.points[i].y);
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
    if (this.strand.points[i].pr === 'R') {
      angle = this.theta;
    } else if (this.strand.points[i].pr === 'L') {
      angle = 2 * Math.PI - this.theta;
    }
    var row1 = this.condition(2 * i - 1, [1, -Math.cos(angle)]);
    var row2 = this.condition(2 * i, [Math.sin(angle)]);
    var row3 = this.condition(2 * i, [-Math.sin(angle)]);
    this.matrix.push(row1.concat(row2));
    this.matrix.push(row3.concat(row1));
    this.equals.push((1 - Math.cos(angle)) * this.strand.points[i].x + Math.sin(angle) * this.strand.points[i].y),
    this.equals.push((1 - Math.cos(angle)) * this.strand.points[i].y - Math.sin(angle) * this.strand.points[i].x);
  },
  getPRandDirection(strand, index) {
    var pr;
    var direction;
    if (strand.points[index].pr) {
      pr = 'inbound';
      direction = strand.points[index].pr;
    } else if (strand.points[knotUtils.nextCyclicalIdx(strand, index)].pr) {
      pr = 'outbound';
      direction = strand.points[knotUtils.nextCyclicalIdx(strand, index)].pr;
    } else {
      pr = false;
      direction = strand.points[index].direction;
    }
    return {pr, direction,};
  },
};