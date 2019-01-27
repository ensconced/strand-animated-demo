import knotUtils from './knot-utils.js';
import Strand from './strand.js';
import PointedReturn from './pointed-return.js';
import Contour from './contour.js';
import surface from './main.js';

export default function Knot(frame) {
  this.group = surface.g();
  this.strands = [];

  this.frame = frame;

  this.remove = function() {
    this.group.remove();
  };
  this.generateAllStrands();
  this.generateOffsets();
  this.trimUnders();
  this.draw();
  this.frame.remove();
  this.frame.draw();
  // drawing.stopDrawingFrame();
}

Knot.prototype = {
  constructor: Knot,
  generateStrand() {
    var strand = new Strand(this.frame);
    this.strands.push(strand);
  },
  generateAllStrands() {
    while (this.frame.lines.some(line => line.uncrossed())) {
      this.generateStrand();
    }
  },
  generateOffsets() {
    this.strands.forEach(function (strand) {
      var c = new Contour(strand);
      c.assignOffsets();
    });
  },
  trimUnders() {
    this.strands.forEach(strand => strand.trimUnders());
  },
  draw() {
    this.strands.forEach(strand => {
      strand.eachElement((strandElement, i) => {
        // now draw everything except PRs
        if (!(strandElement.pr || strand.pointFollowing(i).pr)) {
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
            middleOutbound: strand.pointPreceding(i).outbound,
            middleInbound: strandElement.outbound,
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
