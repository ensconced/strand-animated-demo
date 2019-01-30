import Knot from './knot.js';
import Frame from './frame.js';
import Mouse from './mouse.js';
import { identicalObjects } from './general-utils';
import Snap from 'snapsvg';
import config from './config.js';

function Drawing() {
  this.knots = [];
  this.frames = [];
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
    this.currentKnot = new Knot(this.currentFrame);
    this.knots.push(this.currentKnot);
  },
  addNode() {
    if (!this.currentFrame) {
      this.currentFrame = new Frame({});
    }
    this.currentFrame.handleNodePlacement(event);
  },
  drawFrame() {
    // remove any extant frames
    //if (this.currentFrame) this.currentFrame.remove();
    // make 1x1 frame
    this.currentFrame = new Frame({
      initialBox: this.initialBox,
      finalBox: this.finalBox,
      drawing: this,
    });
    this.currentFrame.draw();
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
        if (this.currentFrame) this.currentFrame.remove();
        this.currentFrame = new Frame({
          initialBox: this.initialBox,
          finalBox: this.finalBox,
          drawing: this,
        });
        this.currentFrame.draw();
      }.bind(this));
    }
  },
  drawUserLine(toCoords) {
    this.currentFrame.userLine && this.currentFrame.userLine.remove();
    this.currentFrame.userLine = Snap('#surface').line(this.lineStart.x, this.lineStart.y, ...toCoords);
    this.currentFrame.userLine.attr(config.frame);
  },
  finishDrawingLine(e) {
    this.currentFrame.userLine && this.currentFrame.userLine.remove();
    const coords = Mouse.relativeCoords(e);
    this.lineEnd = this.nodeAt(coords);
    const isValidLine = this.lineEnd && this.lineEnd !== this.lineStart;
    if (isValidLine && !this.currentFrame.lineExistsBetween(this.lineStart, this.lineEnd)) {
      this.currentKnot && this.currentKnot.remove();
      const knotA = this.findKnotWith(this.lineStart);
      const knotB = this.findKnotWith(this.lineEnd);
      if (knotA !== knotB) {
        // need to merge two frames...
        this.remove(knotA);
        this.remove(knotB);
        this.currentKnot = knotA.merge(knotB, this.lineStart, this.lineEnd);
        this.currentFrame = this.currentKnot.frame;
        this.knots.push(this.currentKnot);
        this.currentFrame.drawLines();
      } else {
        this.currentFrame.markAsAdjacent(this.lineStart, this.lineEnd);
        this.currentFrame.drawLines();
        this.currentFrame.redrawWithKnot();
      }
    }
  },
  remove(knot) {
    knot.frame.remove();
    knot.remove();
    this.knots.splice(this.knots.indexOf(knot), 1);
  },
  nodeAt(coords) {
    var result;
    this.knots.some(knot => {
      result = knot.frame.findProximalNode(coords);
      if (result) {
        return true;
      }
    });
    return result;
  },
  findKnotWith(node) {
    return this.knots.find(knot => {
      return knot.frame.nodes.includes(node);
    });
  },
  startDrawingLine(coords) {
    this.lineStart = this.nodeAt(coords);
    this.currentKnot = this.findKnotWith(this.lineStart);
    this.currentFrame = this.currentKnot.frame;
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
        if (this.currentFrame) {
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
