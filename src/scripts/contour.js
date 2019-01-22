import config from './config.js';
import knotUtils from './knot-utils.js';
import numeric from 'numeric';
import Bezier from 'bezier-js';
import StraightLine from './straight-line.js';

export default function Contour(strand) {
  var theta = 1.5;
  var prBezes = [];
  this.masks = [];

  for (var i = 0; i < strand.length; i++) {
    if (strand.points[i].pr) {
      prBezes.push({
        direction: strand.points[i].pr,
        out: i - 1 >= 0 ? i - 1 : strand.length - 1,
        in: i <= strand.length - 1 ? i : 0,
      });
    }
  }

  function emptyRow() {
    var row = [];
    strand.points.forEach(function () {
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
    equals.push(2 * strand.points[i].x);
    equals.push(2 * strand.points[i].y);
  }

  function setC2continuity(i) {
    var row = condition(2 * i, [1, -2, 2, -1]);
    matrix.push(row.concat(emptyRow()));
    matrix.push(emptyRow().concat(row));
    equals.push(0);
    equals.push(0);
  }

  function setPRangle(i) {
    var angle;
    if (strand.points[i].pr === 'R') {
      angle = theta;
    } else if (strand.points[i].pr === 'L') {
      angle = 2 * Math.PI - theta;
    }
    var row1 = condition(2 * i - 1, [1, -Math.cos(angle)]);
    var row2 = condition(2 * i, [Math.sin(angle)]);
    var row3 = condition(2 * i, [-Math.sin(angle)]);
    matrix.push(row1.concat(row2));
    matrix.push(row3.concat(row1));
    equals.push((1 - Math.cos(angle)) * strand.points[i].x + Math.sin(angle) * strand.points[i].y),
    equals.push((1 - Math.cos(angle)) * strand.points[i].y - Math.sin(angle) * strand.points[i].x);
  }

  var matrix = [];
  var equals = [];

  for (var j = 0; j < strand.length; j++) {
    setC2continuity(j);
    if (strand.points[j].pr) {
      setPRangle(j);
    } else {
      setC1continuity(j);
    }
  }

  var cntrlPoints = numeric.solve(matrix, equals);
  var xCntrlPoints = cntrlPoints.slice(0, cntrlPoints.length / 2);
  var yCntrlPoints = cntrlPoints.slice(cntrlPoints.length / 2);
  var polygons = [];

  for (var index = 0; index < strand.length; index++) {
    var bezPoints = [];
    bezPoints.push([strand.points[index].x, strand.points[index].y]);
    bezPoints.push([xCntrlPoints.shift(), yCntrlPoints.shift()]);
    bezPoints.push([xCntrlPoints.shift(), yCntrlPoints.shift()]);
    bezPoints.push([
      strand.points[knotUtils.nextCyclicalIdx(strand, index)].x,
      strand.points[knotUtils.nextCyclicalIdx(strand, index)].y,
    ]);

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

    var polygon = {
      bezPoints: bezPoints,
      pr: pr,
      direction: direction,
    };

    polygons.push(polygon);

    var bez = new Bezier(...polygon.bezPoints.reduce((arr, sub) => arr.concat(sub)));

    // assign outgoing bezes for each point of strand

    if (strand.points[index].pr) {
      //strand.points[index].point.out = bez;
    } else {
      if (strand.points[index].direction === 'R') {
        strand.points[index].point.overOut = bez;
      } else if (strand.points[index].direction === 'L') {
        strand.points[index].point.underOut = bez;
      }
    }
    // check whether bez is close to linear...
    if (knotUtils.linearOrClose(bez)) {
      var start = [bez.points[0].x, bez.points[0].y];
      var end = [bez.points[3].x, bez.points[3].y];
      strand.points[index].outbound = new StraightLine(start, end);
    } else {
      strand.points[index].outbound = bez;
    }
  }

  this.assignOffsets = function() {
    for (var i = 0; i < strand.length; i++) {
      var left = strand.points[i].outbound.offset(-(config.knot.strokeWidth + config.knot.borderWidth) / 2);
      var right = strand.points[i].outbound.offset((config.knot.strokeWidth + config.knot.borderWidth) / 2);
      left = knotUtils.polyline(knotUtils.removeStubs(left));
      right = knotUtils.polyline(knotUtils.removeStubs(right));
      var next = strand.points[knotUtils.nextCyclicalIdx(strand, i)];

      if (strand.points[i].pr) {
        if (strand.points[i].pr === 'L') {
          strand.points[i].point.innerInbound = left;
          strand.points[i].point.outerInbound = right;
        } else if (strand.points[i].pr === 'R') {
          strand.points[i].point.innerInbound = right;
          strand.points[i].point.outerInbound = left;
        }
        if (strand.points[knotUtils.previousCyclicalIdx(strand, i)].direction === 'R') {
          next.point.underInLeft = left;
          next.point.underInRight = right;
        } else if (strand.points[knotUtils.previousCyclicalIdx(strand, i)].direction === 'L') {
          next.point.overInLeft = left;
          next.point.overInRight = right;
        }
      } else {
        if (strand.points[i].direction === 'R') {
          strand.points[i].point.overOutLeft = left;
          strand.points[i].point.overOutRight = right;
          if (!next.pr) {
            next.point.underInLeft = left;
            next.point.underInRight = right;
          } else {
            next.point.innerOutbound = left;
            next.point.outerOutbound = right;
          }
        } else if (strand.points[i].direction === 'L') {
          strand.points[i].point.underOutLeft = left;
          strand.points[i].point.underOutRight = right;
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
  };
}
