import { strand } from './strand.js';
import Contour from './contour.js';
import { paint } from './debug-tools.js';

export default function Knot(frame) {
  this.frame = frame;
  this.init();
}

Knot.prototype = {
  init() {
    this.elements = [];
    this.offsetSketches = this.makeOffsets();
  },
  makeStrands() {
    const strands = [];
    strands.push(strand(this.frame));
    return strands;
  },
  makeOffsets() {
    this.strands = this.makeStrands();
    this.contours = this.strands.map(strand => Contour(strand));
    debugger;
    paint(this.contours[0].map(c => c.outboundBezier), 'green');
    debugger;
  },
};
