import Knot from './knot.js';
import Frame from './frame.js';
import Mouse from './mouse.js';
import { identicalObjects } from './general-utils';
import Snap from 'snapsvg';
import config from './config.js';

function Drawing() {
  this.mode = 'grid';
  this.wrapper = document.getElementById('wrapper');
  this.boundHandleMouseDown = this.handleMouseDown.bind(this);
  this.boundHandleMouseUp = this.handleMouseUp.bind(this);
  this.boundHandleMouseMove = this.handleMouseMove.bind(this);
  this.wrapper.addEventListener('mousedown', this.boundHandleMouseDown, false);
  window.addEventListener('mouseup', this.boundHandleMouseUp, false);
  this.wrapper.addEventListener('mousemove', this.boundHandleMouseMove, false);
}

Drawing.prototype = {
  constructor: Drawing,
  drawKnot() {
    this.knot = new Knot(this.frame);
  },
  addNode() {
    if (!this.frame) {
      this.frame = new Frame({});
    }
    this.frame.handleNodePlacement(event);
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
  },
  startDrawingGrid() {
    this.initialBox = Mouse.rowAndCol(event);
    this.finalBox = this.initialBox;
    Mouse.doIfInGraph(this.initialBox, this.drawFrame.bind(this));
  },
  dragFrame() {
    const previousBox = this.finalBox;
    this.finalBox = Mouse.rowAndCol(event);
    if (!identicalObjects(previousBox, this.finalBox)) {
      Mouse.doIfInGraph(this.finalBox, function() {
        if (this.frame) this.frame.remove();
        this.frame = new Frame({
          initialBox: this.initialBox,
          finalBox: this.finalBox,
          drawing: this,
        });
        this.frame.draw();
      }.bind(this));
    }
  },
  drawUserLine(toCoords) {
    this.frame.userLine && this.frame.userLine.remove();
    this.frame.userLine = Snap('#surface').line(this.lineStart.x, this.lineStart.y, ...toCoords);
    this.frame.userLine.attr(config.frame);
  },
  finishDrawingLine(e) {
    this.frame.userLine && this.frame.userLine.remove();
    const coords = Mouse.relativeCoords(e);
    this.lineEnd = this.frame.findProximalNode(coords);
    const isValidLine = this.lineEnd && this.lineEnd !== this.lineStart;
    if (isValidLine && !this.frame.lineExistsBetween(this.lineStart, this.lineEnd)) {
      this.frame.markAsAdjacent(this.lineStart, this.lineEnd);
      this.frame.drawLines();
      this.frame.redrawWithKnot();
    }
  },
  startDrawingLine(coords) {
    this.lineStart = this.frame.findProximalNode(coords);
    if (this.lineStart) {
      this.drawUserLine(coords);
    }
  },
  handleMouseDown(e) {
    this.mouseIsDown = true;
    switch (this.mode) {
    case 'grid':
      this.startDrawingGrid();
      break;
    case 'line':
      this.startDrawingLine(Mouse.relativeCoords(e));
      break;
    case 'node':
      this.addNode();
      break;
    }
  },
  handleMouseMove(e) {
    if (this.mouseIsDown) {
      switch (this.mode) {
      case 'grid':
        this.dragFrame();
        break;
      case 'line':
        this.drawUserLine(Mouse.relativeCoords(e));
      }
    }
  },
  handleMouseUp(e) {
    if (e.target.tagName !== 'BUTTON') {
      this.mouseIsDown = false;
      switch (this.mode) {
      case 'grid':
        if (this.frame) {
          this.drawKnot();
        }
        break;
      case 'line':
        this.finishDrawingLine(e);
        break;
      }
    }
  },
};

export default Drawing;
