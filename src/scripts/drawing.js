import Knot from './knot.js';
import Frame from './frame.js';
import Mouse from './mouse.js';

var drawing;

function Drawing() {
  var initialBox;
  var finalBox;
  this.graphArea = document.getElementById('surface');
  drawing = this;

  this.drawKnot = function() {
    this.knot = new Knot(drawing);
  };

  var drawFrame = function() {
    // remove any extant frames
    if (drawing.frame) drawing.frame.remove();
    // make 1x1 frame
    drawing.frame = new Frame({
      initialBox: initialBox,
      finalBox: finalBox,
      drawing: drawing,
    });
    drawing.frame.draw();
    // add the listener for mouse movement
    drawing.graphArea.addEventListener('mousemove', moveListener);
  };

  // define listener for mousedown
  var downListener = function() {
    // record position of mousedown
    initialBox = finalBox = Mouse.rowAndCol(event);
    // if the box containing the click was within the graph area...
    // ... then draw a box
    Mouse.doIfInGraph(initialBox, drawFrame);
  };

  // define listener for mouse movement
  var moveListener = function() {
    finalBox = Mouse.rowAndCol(event);
    // doIfInGraph wrapper here prevents drawn frames from extending...
    // ... beyond the boundaries of the graph
    Mouse.doIfInGraph(finalBox, function() {
      if (drawing.frame) drawing.frame.remove();
      drawing.frame = new Frame({
        initialBox: initialBox,
        finalBox: finalBox,
        drawing: drawing,
      });
      drawing.frame.draw();
    });
  };

  // define listener for mouseup
  var upListener = function() {
    drawing.graphArea.removeEventListener('mousemove', moveListener);
    drawing.drawKnot();
  };

  this.addUserFrame = function() {
    // listen for mousedown
    drawing.graphArea.addEventListener('mousedown', downListener);
    // listener for mouseup is attached to the whole document...
    // (not just the drawing.graphArea)
    // This prevents the "sticky mouse" bug.
    document.addEventListener('mouseup', upListener);
  };

  this.stopDrawingFrame = function() {
    drawing.graphArea.removeEventListener('mousedown', downListener);
    document.removeEventListener('mouseup', upListener);
    drawing.graphArea.removeEventListener('mousemove', moveListener);
  };
}

export { drawing, Drawing };