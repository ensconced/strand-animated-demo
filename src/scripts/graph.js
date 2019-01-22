import config from './config.js';
import Grid from './grid.js';
import Mouse from './mouse.js';
import Line from './line.js';

export default function Graph(drawing) {
  var options = {
    drawing: drawing,
    startCol: 0,
    startRow: 0,
    cols: config.graphCols,
    rows: config.graphRows,
    style: config.graphLine,
  };

  Grid.call(this, options);

  // draw all horizontal lines
  this.createHorizontalLines = function(options) {
    for (var i = options.startRow; i <= options.startRow + options.rows; i++) {
      var startX;
      var startY;
      var endX;
      var endY;
      [startX, startY] = Mouse.pixelCoords([options.startCol, i]);
      [endX, endY] = Mouse.pixelCoords([options.startCol + options.cols, i]);

      this.lines.push(
        new Line({
          startX: startX,
          startY: startY,
          endX: endX,
          endY: endY,
          style: options.style,
          drawing: options.drawing,
        })
      );
    }
  };

  // draw all vertical lines
  this.createVerticalLines = function(options) {
    for (var i = options.startCol; i <= options.startCol + options.cols; i++) {
      var startX;
      var startY;
      var endX;
      var endY;
      [startX, startY] = Mouse.pixelCoords([i, options.startRow]);
      [endX, endY] = Mouse.pixelCoords([i, options.startRow + options.rows]);

      this.lines.push(
        new Line({
          startX: startX,
          startY: startY,
          endX: endX,
          endY: endY,
          style: options.style,
          drawing: options.drawing,
        })
      );
    }
  };

  this.createVerticalLines(options);
  this.createHorizontalLines(options);
}

Graph.prototype = Grid.prototype;
