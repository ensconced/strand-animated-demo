import config from './config.js';

export default (function() {
  // for getting coords relative to graph area from absolute coords...
  // (i.e. relative to whole window)
  function relativeCoords(event) {
    var absX = event.clientX;
    var absY = event.clientY;
    var surface = document.getElementById('surface');
    var svgPosition = surface.getBoundingClientRect();
    var leftOffset = svgPosition.left;
    var topOffset = svgPosition.top;
    return [absX - leftOffset, absY - topOffset];
  }

  // for executing code on condition that mouse is positioned within graphArea
  function doIfInGraph(box, fn) {
    var inHorizontally = box[0] >= 0 && box[0] < config.graphCols;
    var inVertically = box[1] >= 0 && box[1] < config.graphRows;
    if (inHorizontally && inVertically) {
      fn();
    }
  }

  // for getting [row, col] coords from pixel coords
  function rowAndCol(event) {
    function pxToBox(num) {
      var shifted = num - 0.5 * config.maxStrokeWidth();
      return Math.floor(shifted / config.squareHeight);
    }
    return relativeCoords(event).map(pxToBox);
  }

  function closestGraphCoords(event) {
    function pxToBox(num) {
      var shifted = num - 0.5 * config.maxStrokeWidth();
      return Math.round(shifted / config.squareHeight);
    }
    return relativeCoords(event).map(pxToBox);
  }

  // for getting pixel coords from [row, col]
  function pixelCoords(coords) {
    function boxToPX(n) {
      return n * config.squareHeight + config.maxStrokeWidth() / 2;
    }
    return coords.map(boxToPX);
  }

  return {
    closestGraphCoords: closestGraphCoords,
    relativeCoords: relativeCoords,
    rowAndCol: rowAndCol,
    pixelCoords: pixelCoords,
    doIfInGraph: doIfInGraph,
  };
})();
