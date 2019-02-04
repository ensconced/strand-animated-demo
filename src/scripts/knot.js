import { collectionIntersect, format, mutate, reducer } from './knot-utils.js';
import surface from './main.js';
import { Strand, pointFollowing, pointPreceding } from './strand.js';
import PointedReturn from './pointed-return.js';
import Contour from './contour.js';
import OffsetSketch from './offset-sketch';

export default function Knot(frame) {
  this.frame = frame;
  this.init();
  this.draw();
}

Knot.prototype = {
  remove() {
    this.elements.forEach(element => element.remove());
    this.frame.remove();
  },
  init() {
    this.elements = [];
    this.offsetSketches = this.makeOffsets();
    this.makeOverUnders();
  },
  merge(otherKnot, lineStart, lineEnd) {
    const mergedFrame = this.frame.merge(otherKnot.frame);
    mergedFrame.markAsAdjacent(lineStart, lineEnd);
    mergedFrame.draw();
    const mergedKnot = new Knot(mergedFrame);
    this.elements = this.elements.concat(otherKnot.elements);
    return mergedKnot;
  },
  makeStrands() {
    const strands = [];
    while (this.frame.lines.some(line => line.uncrossed())) {
      strands.push(Strand(this.frame));
    }
    return strands;
  },
  makeOffsets() {
    this.strands = this.makeStrands();
    this.contours = this.strands.map(strand => Contour(strand));
    return this.contours.map(contour => new OffsetSketch(contour));
  },
  addLineBetween(nodeA, nodeB) {
    this.frame.markAsAdjacent(nodeA, nodeB);
    this.frame.drawLines();
    this.init();
    this.draw();
  },
  getUnder(point, direction, bound) {
    if (bound === 'out') {
      return direction === 'R' ? point.underOutRight : point.underOutLeft;
    } else if (bound === 'in') {
      return direction === 'R' ? point.underInRight : point.underInLeft;
    }
  },
  trim(under, intersect, bound) {
    if (bound === 'out') {
      mutate(under, under.slice(intersect.idxA + 1));
      under.unshift(intersect.intersection);
    } else if (bound === 'in') {
      mutate(under, under.slice(0, intersect.idxA + 1));
      under.push(intersect.intersection);
    }
  },
  trimUnder(point, direction, bound) {
    const overLeft = point.overInLeft.concat(point.overOutLeft);
    const overRight = point.overInRight.concat(point.overOutRight);
    const under = this.getUnder(point, direction, bound);
    const intersect = collectionIntersect(under, overLeft) || collectionIntersect(under, overRight);
    if (intersect) {
      this.trim(under, intersect, bound);
    }
  },
  makeOverUnders() {
    this.strands.forEach(strand => {
      strand.forEach(cpORpr => {
        var point = cpORpr.point;
        if (!cpORpr.pr) {
          if (!point.trimmed) {
            this.trimUnder(point, 'R', 'out');
            this.trimUnder(point, 'R', 'in');
            this.trimUnder(point, 'L', 'out');
            this.trimUnder(point, 'L', 'in');
          }

          point.trimmed = true;
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
            elements: this.elements,
            middleOutbound: pointPreceding(i, strand).outboundBezier,
            middleInbound: strandElement.outboundBezier,
          });
          pr.draw();
        }
      });
    });
    this.frame.remove();
    this.frame.draw();
  },
  drawOutline(outline) {
    var points = outline.reduce(reducer, []);
    var snp = surface.polyline(points);
    this.elements.push(snp);
    format(snp);
  },
};
