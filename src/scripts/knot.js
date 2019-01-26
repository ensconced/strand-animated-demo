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
      var c = new Contour(strand.points);
      c.assignOffsets();
    });
  },
  trimUnders() {
    this.strands.forEach(strand => strand.trimUnders());
  },
  draw() {
    this.strands.forEach(strand => {
      for (var i = 0; i < strand.length; i++) {
        var cpORpr = strand.points[i];
        // now draw everything except PRs
        if (!(cpORpr.pr || strand.points[knotUtils.nextCyclicalIdx(strand, i)].pr)) {
          var point = cpORpr.point;
          if (cpORpr.direction === 'R') {
            this.drawOutline(point.overOutLeft);
            this.drawOutline(point.overOutRight);
          } else {
            this.drawOutline(point.underOutLeft);
            this.drawOutline(point.underOutRight);
          }
        } else if (cpORpr.pr) {
          // here we draw the PRs
          var pr = new PointedReturn({
            pr: cpORpr,
            group: this.group,
            middleOutbound: strand.points[knotUtils.previousCyclicalIdx(strand, i)].outbound,
            middleInbound: cpORpr.outbound,
          });
          pr.draw();
        }
      }
    });
  },
  drawOutline(outline) {
    var points = outline.reduce(knotUtils.reducer, []);
    var snp = surface.polyline(points);
    this.group.add(snp);
    knotUtils.format(snp);
  },
};
