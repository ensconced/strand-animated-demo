import config from './config.js';
import knotUtils from './knot-utils.js';
import numeric from 'numeric';
import Bezier from 'bezier-js';
import StraightLine from './straight-line.js';
import { pointFollowing } from './strand.js';

export default function Contour(strand) {
  this.strand = strand;
  this.theta = 1.5;
  this.matrix = [];
  this.equals = [];
  const { xCntrlPoints, yCntrlPoints } = this.matrixSolution();

  const polygons = [];

  this.strand.forEach((point, index) => {
    const polygon = this.getBezier(index, xCntrlPoints, yCntrlPoints);
    polygons.push(polygon);
    point.outboundBezier = this.bezier(polygon);

    this.assignOutboundBezes(index);
    this.assignOutbound(index);
  });
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
    bezPoints.push([this.strand[index].x, this.strand[index].y]);
    bezPoints.push([xCntrlPoints.shift(), yCntrlPoints.shift()]);
    bezPoints.push([xCntrlPoints.shift(), yCntrlPoints.shift()]);
    const nextPoint = pointFollowing(index, this.strand);
    bezPoints.push([
      nextPoint.x,
      nextPoint.y,
    ]);
    return bezPoints;
  },
  assignOutbound(index) {
    const point = this.strand[index];
    if (knotUtils.linearOrClose(point.outboundBezier)) {
      this.replaceOutboundWithStraightLine(index);
    }
  },
  replaceOutboundWithStraightLine(index, bez) {
    var start = [bez.points[0].x, bez.points[0].y];
    var end = [bez.points[3].x, bez.points[3].y];
    this.points[index].outbound = new StraightLine(start, end);
  },
  assignOutboundBezes(index, bez) {
    const point = this.strand[index];
    if (!point.pr) {
      if (point.direction === 'R') {
        point.point.overOut = bez;
      } else if (point.direction === 'L') {
        point.point.underOut = bez;
      }
    }
  },
  constructMatrix() {
    this.strand.forEach((point, index) => {
      this.setC2continuity(index);
      if (this.strand[index].pr) {
        this.setPRangle(index);
      } else {
        this.setC1continuity(index);
      }
    });
  },
  polyLineOffset(bezier, offset) {
    const polyBezier = bezier.offset(offset);
    return knotUtils.polyline(knotUtils.removeStubs(polyBezier));
  },
  createOffsets(point) {
    const offset = (config.knot.strokeWidth + config.knot.borderWidth) / 2;
    point.leftOutboundOffset = this.polyLineOffset(point.outboundBezier, -offset);
    point.rightOutboundOffset = this.polyLineOffset(point.outboundBezier, offset);
  },
  labelInboundOffsetsLeftPR(point) {
    point.point.innerInbound = point.leftOutboundOffset;
    point.point.outerInbound = point.rightOutboundOffset;
  },
  labelInboundOffetsRightPR(point) {
    point.point.innerInbound = point.rightOutboundOffset;
    point.point.outerInbound = point.leftOutboundOffset;
  },
  labelInboundOffsetsPR(point) {
    if (point.pr === 'L') {
      this.labelInboundOffsetsLeftPR(point);
    } else if (point.pr === 'R') {
      this.labelInboundOffetsRightPR(point);
    }
  },
  labelInboundsOfPointAfterPR(point, next) {
    if (point.pr === 'L') {
      next.point.underInLeft = point.leftOutboundOffset;
      next.point.underInRight = point.rightOutboundOffset;
    } else if (point.pr === 'R') {
      next.point.overInLeft = point.leftOutboundOffset;
      next.point.overInRight = point.rightOutboundOffset;
    }
  },
  labelPointedReturnOffsets(point, next) {
    this.labelInboundOffsetsPR(point);
    this.labelInboundsOfPointAfterPR(point, next);
  },
  labelOffsets(point, next) {
    if (point.direction === 'R') {
      point.point.overOutLeft = point.leftOutboundOffset;
      point.point.overOutRight = point.rightOutboundOffset;
      next.point.underInLeft = point.leftOutboundOffset;
      next.point.underInRight = point.rightOutboundOffset;
    } else if (point.direction === 'L') {
      point.point.underOutLeft = point.leftOutboundOffset;
      point.point.underOutRight = point.rightOutboundOffset;
      next.point.overInLeft = point.leftOutboundOffset;
      next.point.overInRight = point.rightOutboundOffset;
    }
  },
  assignOffsets() {
    this.strand.forEach((point, index) => {
      this.createOffsets(point);
      const next = pointFollowing(index, this.strand);
      this.labelOffsets(point, next);
    });
  },
  emptyRow() {
    var row = [];
    this.strand.forEach(function () {
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
    this.equals.push(2 * this.strand[i].x);
    this.equals.push(2 * this.strand[i].y);
  },
  setC2continuity(i) {
    var row = this.condition(2 * i, [1, -2, 2, -1]);
    this.matrix.push(row.concat(this.emptyRow()));
    this.matrix.push(this.emptyRow().concat(row));
    this.equals.push(0);
    this.equals.push(0);
  },
  setPRangle(i) {
    const point = this.strand[i];
    var angle;
    if (point.pr === 'R') {
      angle = this.theta;
    } else if (point.pr === 'L') {
      angle = 2 * Math.PI - this.theta;
    }
    var row1 = this.condition(2 * i - 1, [1, -Math.cos(angle)]);
    var row2 = this.condition(2 * i, [Math.sin(angle)]);
    var row3 = this.condition(2 * i, [-Math.sin(angle)]);
    this.matrix.push(row1.concat(row2));
    this.matrix.push(row3.concat(row1));
    this.equals.push((1 - Math.cos(angle)) * point.x + Math.sin(angle) * point.y),
    this.equals.push((1 - Math.cos(angle)) * point.y - Math.sin(angle) * point.x);
  },
};