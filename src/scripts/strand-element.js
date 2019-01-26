function StrandElement(options) {
  this.point = options.point;
  this.pr = options.pr;
  this.direction = options.direction;
}

StrandElement.prototype = {
  constructor: StrandElement,
  get x() {
    return this.point.coords[0];
  },
  get y() {
    return this.point.coords[1];
  },
};

export default StrandElement;
