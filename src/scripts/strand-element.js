function StrandElement(options) {
  this.point = options.point;
  this.pr = options.pr;
  this.direction = options.direction;
}

StrandElement.prototype = {
  get x() {
    return this.point.coords[0];
  },
  get y() {
    return this.point.coords[1];
  },
};

export default StrandElement;
