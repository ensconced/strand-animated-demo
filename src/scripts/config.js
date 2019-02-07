export default {
  resolution: 10,
  nodeSelectionMinProximity: 20,
  knot: {
    stroke: 'black',
    strokeWidth: 5,
    fill: 'none',
    borderWidth: 5,
  },
  mask: {
    stroke: 'white',
    strokeWidth: 5,
    fill: 'none',
  },
  graphRows: 10,
  graphCols: 10,
  squareHeight: 70,
  graphLine: {
    stroke: 'gray',
    strokeWidth: 1,
    strokeOpacity: 1,
  },
  frame: {
    fill: 'none',
    stroke: 'red',
    strokeWidth: 2,
    strokeOpacity: 0.8,
  },

  maxStrokeWidth: function() {
    return Math.max(this.graphLine.strokeWidth, this.frame.strokeWidth);
  },

  minStrokeWidth: function() {
    return Math.min(this.graphLine.strokeWidth, this.frame.strokeWidth);
  },

  nodeStyle: {
    fill: 'blue',
    stroke: 'white',
    strokeWidth: 1,
    fillOpacity: 0.5,
    radius: 3,
  },

  // necessary to ensure that frame and graph are properly...
  // aligned even when either one has greater strokeWidth
  shiftFactor: function(style) {
    if (style.strokeWidth === this.maxStrokeWidth()) {
      return 0;
    } else {
      return 0.5 * (this.maxStrokeWidth() - this.minStrokeWidth());
    }
  },
};
