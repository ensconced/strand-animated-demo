function Grid(options) {
  this.lines = [];
  this.options = options;
}

Grid.prototype = {
  remove: function() {
    // remove all lines
    this.lines.forEach(line => line.snapObj.remove());
    this.lines = [];

    if (this.nodes) {
      // remove all nodes
      this.nodes.forEach(node => node.remove());
    }
  },
};

export default Grid;
