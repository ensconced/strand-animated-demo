import numeric from 'numeric';

export default function StraightLine(start, end) {
  this.start = start;
  this.end = end;

  this.offset = function(d) {
    var dx = this.end[0] - this.start[0];
    var dy = this.end[1] - this.start[1];
    var length = numeric.norm2([dx, dy]);
    var perp;
    if (d < 0) {
      perp = [dy, -dx];
    } else {
      perp = [-dy, dx];
    }
    var shift = perp.map(coord => (Math.abs(d) * coord) / length);
    var newStart = [this.start[0] + shift[0], this.start[1] + shift[1]];
    var newEnd = [this.end[0] + shift[0], this.end[1] + shift[1]];
    return [new StraightLine(newStart, newEnd)];
  };
}
