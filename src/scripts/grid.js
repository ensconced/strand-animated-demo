function Grid(options) {
  this.lines = [];
  this.options = options;
}

Grid.prototype = {
  remove: function() {
    this.lines.forEach(line => line.snapObj.remove());
    this.lines = [];

    if (this.nodes) {
      this.nodes.forEach(node => node.remove());
    }
  },
};

export default Grid;
