import { linearOrClose } from './knot-utils.js';
import numeric from 'numeric';
import Bezier from './bezier/bezier.js';
import StraightLine from './straight-line.js';
import { pointFollowing } from './strand.js';

const theta = 1.5;
let strand;
let matrix;
let equals;

export default function Contour(basisStrand) {
  strand = basisStrand;
  matrix = [];
  equals = [];
  const { xCntrlPoints, yCntrlPoints } = matrixSolution();
  const polygons = [];

  strand.forEach((point, index) => {
    const polygon = getBezier(index, xCntrlPoints, yCntrlPoints);
    polygons.push(polygon);
    point.outboundBezier = bezier(polygon);
    assignOutbound(index);
  });

  return strand;
}

function bezier(polygon) {
  return new Bezier(...polygon.reduce((arr, sub) => arr.concat(sub)));
}
function matrixSolution() {
  constructMatrix();
  const cntrlPoints = numeric.solve(matrix, equals);
  return {
    xCntrlPoints: cntrlPoints.slice(0, cntrlPoints.length / 2),
    yCntrlPoints: cntrlPoints.slice(cntrlPoints.length / 2),
  };
}
function getBezier(index, xCntrlPoints, yCntrlPoints) {
  var bezPoints = [];
  bezPoints.push([strand[index].x, strand[index].y]);
  bezPoints.push([xCntrlPoints.shift(), yCntrlPoints.shift()]);
  bezPoints.push([xCntrlPoints.shift(), yCntrlPoints.shift()]);
  const nextPoint = pointFollowing(index, strand);
  bezPoints.push([
    nextPoint.x,
    nextPoint.y,
  ]);
  return bezPoints;
}
function assignOutbound(index) {
  const point = strand[index];
  if (linearOrClose(point.outboundBezier)) {
    replaceOutboundWithStraightLine(index, point.outboundBezier);
  }
}
function replaceOutboundWithStraightLine(index, bez) {
  var start = [bez.points[0].x, bez.points[0].y];
  var end = [bez.points[3].x, bez.points[3].y];
  strand[index].outbound = new StraightLine(start, end);
}
function constructMatrix() {
  strand.forEach((point, index) => {
    setC2continuity(index);
    if (strand[index].pr) {
      setPRangle(index);
    } else {
      setC1continuity(index);
    }
  });
}
function emptyRow() {
  var row = [];
  strand.forEach(function () {
    row = row.concat([0, 0]);
  });
  return row;
}
function condition(startIdx, entries) {
  var row = emptyRow();
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
}
function setC1continuity(i) {
  var row = condition(2 * i - 1, [1, 1]);
  matrix.push(row.concat(emptyRow()));
  matrix.push(emptyRow().concat(row));
  equals.push(2 * strand[i].x);
  equals.push(2 * strand[i].y);
}
function setC2continuity(i) {
  var row = condition(2 * i, [1, -2, 2, -1]);
  matrix.push(row.concat(emptyRow()));
  matrix.push(emptyRow().concat(row));
  equals.push(0);
  equals.push(0);
}
function setPRangle(i) {
  const point = strand[i];
  var angle;
  if (point.pr === 'R') {
    angle = theta;
  } else if (point.pr === 'L') {
    angle = 2 * Math.PI - theta;
  }
  var row1 = condition(2 * i - 1, [1, -Math.cos(angle)]);
  var row2 = condition(2 * i, [Math.sin(angle)]);
  var row3 = condition(2 * i, [-Math.sin(angle)]);
  matrix.push(row1.concat(row2));
  matrix.push(row3.concat(row1));
  equals.push((1 - Math.cos(angle)) * point.x + Math.sin(angle) * point.y),
  equals.push((1 - Math.cos(angle)) * point.y - Math.sin(angle) * point.x);
}
