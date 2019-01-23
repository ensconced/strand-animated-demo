import Knot from './knot.js';
import Frame from './frame.js';
import Mouse from './mouse.js';

function Drawing() {
  this.graphArea = document.getElementById('surface');
}

Drawing.prototype = {
  constructor: Drawing,
  drawKnot() {
    this.knot = new Knot(this);
  },
  drawFrame() {
    // remove any extant frames
    if (this.frame) this.frame.remove();
    // make 1x1 frame
    this.frame = new Frame({
      initialBox: this.initialBox,
      finalBox: this.finalBox,
      drawing: this,
    });
    this.frame.draw();
    // add the listener for mouse movement
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    this.graphArea.addEventListener('mousemove', this.boundHandleMouseMove);
  },
  handleMouseDown() {
    // record position of mousedown
    this.initialBox = Mouse.rowAndCol(event);
    this.finalBox = this.initialBox;
    // if the box containing the click was within the graph area...
    // ... then draw a box
    Mouse.doIfInGraph(this.initialBox, this.drawFrame.bind(this));
  },
  handleMouseMove() {
    this.finalBox = Mouse.rowAndCol(event);
    // doIfInGraph wrapper here prevents drawn frames from extending...
    // ... beyond the boundaries of the graph
    Mouse.doIfInGraph(this.finalBox, function() {
      if (this.frame) this.frame.remove();
      this.frame = new Frame({
        initialBox: this.initialBox,
        finalBox: this.finalBox,
        drawing: this,
      });
      this.frame.draw();
    }.bind(this));
  },
  handleMouseUp() {
    this.graphArea.removeEventListener('mousemove', this.boundHandleMouseMove);
    this.drawKnot();
  },
  addUserFrame() {
    this.boundHandleMouseDown = this.handleMouseDown.bind(this);
    this.graphArea.addEventListener('mousedown', this.boundHandleMouseDown);
    this.boundHandleMouseUp = this.handleMouseUp.bind(this);
    document.addEventListener('mouseup', this.boundHandleMouseUp);
  },
  stopDrawingFrame() {
    this.graphArea.removeEventListener('mousedown', this.boundHandleMouseDown);
    document.removeEventListener('mouseup', this.boundHandleMouseUp);
    this.graphArea.removeEventListener('mousemove', this.boundHandleMouseMove);
  },
};

export { Drawing };
