import config from './config.js';
import knotUtils from './knot-utils.js';
import { pointFollowing } from './strand.js';

export default function OffsetSketch(contour) {
  this.contour = contour;
  this.assignOffsets();
}

OffsetSketch.prototype = {
  constructor: OffsetSketch,
  polyLineOffset(bezier, offset) {
    const polyBezier = bezier.offset(offset);
    return knotUtils.polyline(knotUtils.removeStubs(polyBezier));
  },
  createOffsets(point) {
    const offset = (config.knot.strokeWidth + config.knot.borderWidth) / 2;
    point.leftOutboundOffset = this.polyLineOffset(point.outboundBezier, -offset);
    point.rightOutboundOffset = this.polyLineOffset(point.outboundBezier, offset);
  },
  labelOffsets(point, next) {
    if (point.direction === 'R' || point.pr === 'L') {
      point.point.overOutLeft = point.leftOutboundOffset;
      point.point.overOutRight = point.rightOutboundOffset;
      next.point.underInLeft = point.leftOutboundOffset;
      next.point.underInRight = point.rightOutboundOffset;
    } else {
      point.point.underOutLeft = point.leftOutboundOffset;
      point.point.underOutRight = point.rightOutboundOffset;
      next.point.overInLeft = point.leftOutboundOffset;
      next.point.overInRight = point.rightOutboundOffset;
    }
  },
  assignOffsets() {
    this.contour.forEach((point, index) => {
      const next = pointFollowing(index, this.contour);
      this.createOffsets(point);
      this.labelOffsets(point, next);
    });
  },
};