import { reducer, collectionIntersect, format } from './knot-utils.js';
import surface from './main.js';

export default function PointedReturn(options) {
  this.options = options;
  this.pr = options.pr;
  this.elements = options.elements;
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
    this.outClipped = this.clippedOutboundPath(intersection, innerOutboundPolyline);
    this.inClipped = this.clippedInboundPath(intersection, innerInboundPolyline);
    var points = this.outClipped.concat(this.inClipped).reduce(reducer, []);
    var snp = surface.polyline(points);
    this.elements.push(snp);
    format(snp);
  },
  drawOuters() {
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

    const innerTip = this.inClipped[0];
    const midTip = this.options.middleInbound.points[0];
    const outerTip = {
      x: 2 * midTip.x - innerTip.x,
      y: 2 * midTip.y - innerTip.y,
    };

    //surface.circle(outerTip.x, outerTip.y, 1).attr({ fill: 'red' });
    const points = outerOutboundPolyline.concat([outerTip].concat(outerInboundPolyline));
    var pointList = points.reduce(reducer, []);
    var snp = surface.polyline(pointList);
    this.elements.push(snp);
    format(snp);
  },
};
