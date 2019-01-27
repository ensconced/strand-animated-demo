import kldIntersections from 'kld-intersections';
import config from './config.js';
import Bezier from 'bezier-js';

export default (function () {
  function collectionIntersect(polylineA, polylineB) {
    //debugger;
    var lineA;
    var lineB;
    var intersection;
    for (var idxA = 0; idxA < polylineA.length - 1; idxA++) {
      lineA = polylineA.slice(idxA, idxA + 2);
      for (var idxB = 0; idxB < polylineB.length - 1; idxB++) {
        lineB = polylineB.slice(idxB, idxB + 2);
        intersection = kldIntersections.Intersection.intersectLineLine(...lineA, ...lineB);
        if (intersection.points.length > 0) {
          return {
            idxA: idxA,
            idxB: idxB,
            intersection: intersection.points[0],
          };
        }
      }
    }
  }

  function polyline(collection) {
    function reducer(acc, curve, idx) {
      if (curve.constructor.name === 'StraightLine') {
        if (idx === 0) {
          return acc.concat([{ x: curve.start[0], y: curve.start[1] }, { x: curve.end[0], y: curve.end[1] }]);
        } else {
          return acc.concat([{ x: curve.end[0], y: curve.end[1] }]);
        }
      } else {
        return acc.concat(curve.getLUT(config.resolution));
      }
    }
    return collection.reduce(reducer, []).map(point => new kldIntersections.Point2D(point.x, point.y));
  }

  function bezString(p0, p1, p2, p3) {
    return `M${p0[0]} ${p0[1]} C ${p1[0]} ${p1[1]}, ${p2[0]} ${p2[1]}, ${p3[0]} ${p3[1]}`;
  }

  function format(snapObj) {
    snapObj.attr({
      stroke: 'black',
      strokeWidth: config.knot.borderWidth,
      fill: 'none',
    });
  }

  function rotateAboutOrigin(point, angle) {
    var x = point[0];
    var y = point[1];
    var newX = x * Math.cos(angle) - y * Math.sin(angle);
    var newY = y * Math.cos(angle) + x * Math.sin(angle);
    return [newX, newY];
  }

  function rotate(point, center, angle) {
    // first shift to origin
    var shiftedPoint = [point[0] - center[0], point[1] - center[1]];
    var rotated = rotateAboutOrigin(shiftedPoint, angle);
    return [rotated[0] + center[0], rotated[1] + center[1]];
  }

  function alignBez(p0, p1, p2, p3) {
    // translate to get p0 on x axis
    var translated = [p0, p1, p2, p3].map(coords => [coords[0], coords[1] + -p0[1]]);
    // now rotate so p3 is also on x axis
    var deltaX = translated[0][0];
    var angle = -Math.atan(translated[3][1] / (translated[3][0] - deltaX));
    return translated.map(coord => rotate(coord, translated[0], angle));
  }

  function linearOrClose(bez) {
    // simple heuristic for assessing linearity
    var p0 = [bez.points[0].x, bez.points[0].y];
    var p1 = [bez.points[1].x, bez.points[1].y];
    var p2 = [bez.points[2].x, bez.points[2].y];
    var p3 = [bez.points[3].x, bez.points[3].y];

    var alignedCntrls = alignBez(p0, p1, p2, p3);
    var alignedBez = new Bezier(...alignedCntrls[0], ...alignedCntrls[1], ...alignedCntrls[2], ...alignedCntrls[3]);
    var length = Math.abs(alignedBez.points[0].x - alignedBez.points[3].x);
    var width = Math.max(...alignedBez.points.map(point => Math.abs(point.y)));
    return length / width > 100;
  }

  function removeStubs(collection) {
    // first curve gets free pass into new collection
    var newCollection = [collection[0]];
    for (var curve of collection.slice(1)) {
      // the rest of the curves are only allowed into newCollection if they are not stubs
      if (!stub(curve)) {
        newCollection.push(curve);
      }
    }
    return fillGaps(newCollection);
  }

  function fillGaps(collection) {
    for (var i = 1; i < collection.length; i++) {
      var curve = collection[i];
      var prev = collection[i - 1];
      var prevEnd;
      if (prev.constructor.name === 'StraightLine') {
        prevEnd = prev.end;
      } else {
        prevEnd = [prev.points[3].x, prev.points[3].y];
      }

      if (curve.constructor.name === 'StraightLine') {
        curve.start = prevEnd;
      } else {
        curve.points[0].x = prevEnd[0];
        curve.points[0].y = prevEnd[1];
      }
    }
    return collection;
  }

  // a stub curve goes nowhere - it's too short to bother with
  function stub(curve) {
    var startPoint;
    if (curve.constructor.name === 'StraightLine') {
      return !(Math.abs(curve.end[0] - curve.start[0]) > 1 || Math.abs(curve.end[1] - curve.start[1]) > 1);
    } else {
      // curve is bezier
      startPoint = curve.points[0];
      return !curve.points.slice(1).some(function(point) {
        return Math.abs(point.x - startPoint.x) > 1 || Math.abs(point.y - startPoint.y) > 1;
      });
    }
  }

  function mutate(arr, newArr) {
    // sets arr to newArr in mutating fashion
    while (arr.length > 0) {
      arr.pop();
    }
    for (var x of newArr) {
      arr.push(x);
    }
    return arr;
  }

  function reducer(acc, point) {
    return acc.concat([point.x, point.y]);
  }

  return {
    reducer: reducer,
    polyline: polyline,
    mutate: mutate,
    removeStubs: removeStubs,
    linearOrClose: linearOrClose,
    format: format,
    collectionIntersect: collectionIntersect,
    bezString: bezString,
  };
}());
