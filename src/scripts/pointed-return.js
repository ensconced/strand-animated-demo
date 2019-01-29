import { reducer, collectionIntersect, format } from './knot-utils.js';
import config from './config';
import kldIntersections from 'kld-intersections';
import surface from './main.js';

export default function PointedReturn(options) {
  this.options = options;
  this.pr = options.pr;
  this.group = options.group;
}

PointedReturn.prototype = {
  constructor: PointedReturn,
  draw() {
    this.drawInners();
    this.drawOuters();
  },
  clippedOutboundPath(intersection, polyline) {
    var points = polyline.slice(0, intersection.idxA + 1);
    points.push(intersection.intersection);
    return points;
  },
  clippedInboundPath(intersection, polyline) {
    var points = polyline.slice(intersection.idxB + 1);
    points.unshift(intersection.intersection);
    return points;
  },
  drawInners() {
    const direction = this.pr.pr;

    // get intersection of inner outbound with inner inbound
    let innerOutboundPolyline;
    if (direction === 'L') {
      innerOutboundPolyline = this.pr.point.underInLeft || this.pr.point.overInLeft;
    } else {
      innerOutboundPolyline = this.pr.point.underInRight || this.pr.point.overInRight;
    }

    let innerInboundPolyline;
    if (direction === 'L') {
      innerInboundPolyline = this.pr.point.underOutLeft || this.pr.point.overOutLeft;
    } else {
      innerInboundPolyline = this.pr.point.underOutRight || this.pr.point.overOutRight;
    }

    var intersection = collectionIntersect(innerOutboundPolyline, innerInboundPolyline);
    // split at intersection point
    // concatenate part of outbound inner from before intersection,
    // with the part of inbound inner from after the intersection...
    var outClipped = this.clippedOutboundPath(intersection, innerOutboundPolyline);
    var inClipped = this.clippedInboundPath(intersection, innerInboundPolyline);
    var points = outClipped.concat(inClipped).reduce(reducer, []);
    var snp = surface.polyline(points);
    this.group.add(snp);
    format(snp);
  },
  drawOuters() {
    function kldPoint(ext) {
      return new kld.Point2D(ext.x, ext.y);
    }

    const direction = this.pr.pr;

    let outerOutboundPolyline;
    if (direction === 'L') {
      outerOutboundPolyline = this.pr.point.underInRight || this.pr.point.overInRight;
    } else {
      outerOutboundPolyline = this.pr.point.underInLeft || this.pr.point.overInLeft;
    }

    let outerInboundPolyline;
    if (direction === 'L') {
      outerInboundPolyline = this.pr.point.underOutRight || this.pr.point.overOutRight;
    } else {
      outerInboundPolyline = this.pr.point.underOutLeft || this.pr.point.overOutLeft;
    }

    var d;
    if (this.options.pr.pr === 'L') {
      d = (config.knot.strokeWidth + config.knot.borderWidth) / 2;
    } else {
      d = -(config.knot.strokeWidth + config.knot.borderWidth) / 2;
    }

    // get pathstrs for outers

    var tOutbound = 1;
    var tInbound = 0;
    var tStep = 0.02;
    var outboundExtensions = [this.options.middleOutbound.offset(1, d)];
    var inboundExtensions = [this.options.middleInbound.offset(0, d)];
    var kld = kldIntersections;
    var intersection = new kld.Intersection('No Intersection');
    // build up polylines until they intersect
    while (intersection.points.length === 0) {
      // prepare for extension
      tOutbound += tStep;
      tInbound -= tStep;
      outboundExtensions.push(this.options.middleOutbound.offset(tOutbound, d));
      inboundExtensions.unshift(this.options.middleInbound.offset(tInbound, d));
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
    var pointList = points.reduce(reducer, []);
    var snp = surface.polyline(pointList);
    this.group.add(snp);
    format(snp);
  },
};
