function Grid(options) {
  this.lines = [];
  this.options = options;
}

Grid.prototype = {
  constructor: Object,

  // remove frame (by removing all of its lines)
  remove: function() {
    for (var line of this.lines) {
      line.snapObj.remove();
    }

    this.lines = [];

    if (this.nodes) {
      for (var node of this.nodes) {
        node.remove();
      }
    }
  },

  // create line svg and add to lines array
  // arr contents : [startX, startY, endX, endY]
  drawLine: function(options, ...arr) {
    this.lines.push(options.drawing.surface.line(...arr).attr(options.style));
  },
};

export default Grid;
