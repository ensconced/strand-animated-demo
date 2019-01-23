import knotUtils from './knot-utils.js';
import config from './config';
import kldIntersections from 'kld-intersections';

export default function PointedReturn(options) {
  var drawing = options.drawing;
  var pr = options.pr;
  var group = options.group;

  function clippedOutboundPath(intersection, polyline) {
    var points = polyline.slice(0, intersection.idxA + 1);
    points.push(intersection.intersection);
    return points;
  }

  function clippedInboundPath(intersection, polyline) {
    var points = polyline.slice(intersection.idxB + 1);
    points.unshift(intersection.intersection);
    return points;
  }

  function drawInners() {
    pr = pr.point;
    // get intersection of inner outbound with inner inbound
    var innerOutboundPolyline = pr.innerOutbound;
    var innerInboundPolyline = pr.innerInbound;
    var intersection = knotUtils.collectionIntersect(innerOutboundPolyline, innerInboundPolyline);
    // split at intersection point
    // concatenate part of outbound inner from before intersection,
    // with the part of inbound inner from after the intersection...
    var outClipped = clippedOutboundPath(intersection, innerOutboundPolyline);
    var inClipped = clippedInboundPath(intersection, innerInboundPolyline);
    var points = outClipped.concat(inClipped).reduce(knotUtils.reducer, []);
    var snp = drawing.surface.polyline(points);
    group.add(snp);
    knotUtils.format(snp);
  }

  function drawOuters() {
    function kldPoint(ext) {
      return new kld.Point2D(ext.x, ext.y);
    }

    // get intersection of inner outbound with inner inbound
    var outerOutboundPolyline = pr.outerOutbound;
    var outerInboundPolyline = pr.outerInbound;

    var d;
    if (options.pr.pr === 'L') {
      d = (config.knot.strokeWidth + config.knot.borderWidth) / 2;
    } else {
      d = -(config.knot.strokeWidth + config.knot.borderWidth) / 2;
    }

    // get pathstrs for outers

    var tOutbound = 1;
    var tInbound = 0;
    var tStep = 0.02;
    var outboundExtensions = [options.middleOutbound.offset(1, d)];
    var inboundExtensions = [options.middleInbound.offset(0, d)];
    var kld = kldIntersections;
    var intersection = new kld.Intersection('No Intersection');
    // build up polylines until they intersect
    while (intersection.points.length === 0) {
      // prepare for extension
      tOutbound += tStep;
      tInbound -= tStep;
      outboundExtensions.push(options.middleOutbound.offset(tOutbound, d));
      inboundExtensions.unshift(options.middleInbound.offset(tInbound, d));
      var outboundPolyline = outboundExtensions.map(kldPoint);
      var inboundPolyline = inboundExtensions.map(kldPoint);
      // get intersection...
      for (var n = 0; n < outboundPolyline.length - 1; n++) {
        var a1 = outboundPolyline[n];
        var a2 = outboundPolyline[n + 1];
        for (var j = 0; j < inboundPolyline.length - 1; j++) {
          var b1 = inboundPolyline[j];
          var b2 = inboundPolyline[j + 1];
          intersection = kld.Intersection.intersectLineLine(a1, a2, b1, b2);
          if (intersection.points.length > 0) {
            outboundExtensions = outboundExtensions.slice(0, n + 1);
            inboundExtensions = inboundExtensions.slice(j + 1);
            break;
          }
        }
      }
    }
    // append intersection point to outbound polyline
    var points = outerOutboundPolyline;
    outboundExtensions.push(intersection.points[0]);
    // concatenate inbound polyline
    outboundExtensions = outboundExtensions.concat(inboundExtensions);
    points = points.concat(outboundExtensions.concat(outerInboundPolyline));
    var pointList = points.reduce(knotUtils.reducer, []);
    var snp = drawing.surface.polyline(pointList);
    group.add(snp);
    knotUtils.format(snp);
  }

  this.draw = function() {
    drawInners();
    drawOuters();
  };
}
