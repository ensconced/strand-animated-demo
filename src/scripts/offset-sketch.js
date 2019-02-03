import config from './config.js';
import { polyline } from './knot-utils.js';
import { pointFollowing } from './strand.js';

export default function OffsetSketch(contour) {
  this.contour = contour;
  this.assignOffsets();
}

OffsetSketch.prototype = {
  polyLineOffset(bezier, offset) {
    const reduced = bezier.reduce();
    const polyBezier = reduced.map(segment => segment.scale(offset));
    const result = polyline(polyBezier);
    return result;
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