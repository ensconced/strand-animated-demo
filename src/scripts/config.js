export default {
  resolution: 10,
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
};
