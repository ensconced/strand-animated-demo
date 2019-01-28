import knotUtils from './knot-utils.js';
import { Strand, pointFollowing, pointPreceding } from './strand.js';
import PointedReturn from './pointed-return.js';
import Contour from './contour.js';
import surface from './main.js';
import OffsetSketch from './offset-sketch';

export default function Knot(frame) {
  this.group = surface.g();
  this.frame = frame;

  this.remove = function() {
    this.group.remove();
  };
  this.generateOffsets();

  this.trimUnders();
  this.draw();
  this.frame.remove();
  this.frame.draw();
  // drawing.stopDrawingFrame();
}

Knot.prototype = {
  constructor: Knot,
  makeStrands() {
    const strands = [];
    while (this.frame.lines.some(line => line.uncrossed())) {
      strands.push(Strand(this.frame));
    }
    return strands;
  },
  generateOffsets() {
    this.strands = this.makeStrands();
    this.contours = this.strands.map(strand => Contour(strand));
    this.offsetSketches = this.contours.map(contour => new OffsetSketch(contour));
  },
  trimUnders() {
    this.strands.forEach(strand => {
      strand.forEach(cpORpr => {
        var point = cpORpr.point;
        if (!cpORpr.pr) {
          if (!cpORpr.point.trimmed) {
            var overLeft = point.overInLeft.concat(point.overOutLeft);
            var overRight = point.overInRight.concat(point.overOutRight);
            var intersectLOut =
              knotUtils.collectionIntersect(point.underOutLeft, overLeft) ||
              knotUtils.collectionIntersect(point.underOutLeft, overRight);
            var intersectROut =
              knotUtils.collectionIntersect(point.underOutRight, overLeft) ||
              knotUtils.collectionIntersect(point.underOutRight, overRight);
            var intersectLIn =
              knotUtils.collectionIntersect(point.underInLeft, overLeft) ||
              knotUtils.collectionIntersect(point.underInLeft, overRight);
            var intersectRIn =
              knotUtils.collectionIntersect(point.underInRight, overLeft) ||
              knotUtils.collectionIntersect(point.underInRight, overRight);

            knotUtils.mutate(point.underOutLeft, point.underOutLeft.slice(intersectLOut.idxA + 1));
            knotUtils.mutate(point.underOutRight, point.underOutRight.slice(intersectROut.idxA + 1));
            knotUtils.mutate(point.underInLeft, point.underInLeft.slice(0, intersectLIn.idxA + 1));
            knotUtils.mutate(point.underInRight, point.underInRight.slice(0, intersectRIn.idxA + 1));

            point.underOutLeft.unshift(intersectLOut.intersection);
            point.underOutRight.unshift(intersectROut.intersection);
            point.underInLeft.push(intersectLIn.intersection);
            point.underInRight.push(intersectRIn.intersection);
          }

          cpORpr.point.trimmed = true;
        }
      });
    });
  },
  draw() {
    this.strands.forEach(strand => {
      strand.forEach((strandElement, i) => {
        // now draw everything except PRs
        if (!(strandElement.pr || pointFollowing(i, strand).pr)) {
          var point = strandElement.point;
          if (strandElement.direction === 'R') {
            this.drawOutline(point.overOutLeft);
            this.drawOutline(point.overOutRight);
          } else {
            this.drawOutline(point.underOutLeft);
            this.drawOutline(point.underOutRight);
          }
        } else if (strandElement.pr) {
          // here we draw the PRs
          var pr = new PointedReturn({
            pr: strandElement,
            group: this.group,
            middleOutbound: pointPreceding(i, strand).outboundBezier,
            middleInbound: strandElement.outboundBezier,
          });
          pr.draw();
        }
      });
    });
  },
  drawOutline(outline) {
    var points = outline.reduce(knotUtils.reducer, []);
    var snp = surface.polyline(points);
    this.group.add(snp);
    knotUtils.format(snp);
  },
};
