import Knot from './knot.js';
import Frame from './frame.js';
import Node from './node.js';
import { rowAndCol, doIfInGraph, relativeCoords } from './mouse.js';
import { identicalObjects } from './general-utils';
import Snap from 'snapsvg';
import config from './config.js';
import { closestGraphCoords, pixelCoords } from './mouse.js';

// for keeping track of where we started a drag on the grid
let dragStart;
let dragEnd;

// for keeping track of which knot / frame is currently being manipulated
let currentKnot;
let currentFrame;

// for keeping track of the line currently being drawn (in 'add-line' mode)
let userLine = {};

function handleMouseDown(e) {
  this.mouseIsDown = true;
  switch (this.mode) {
  case 'add-grid':
    this.startDrawingGrid(e);
    break;
  case 'add-line':
    this.startDrawingLine(relativeCoords(e));
    break;
  case 'add-node':
    this.placeNode(e);
    break;
  }
}

function handleMouseMove(e) {
  if (this.mouseIsDown) {
    switch (this.mode) {
    case 'add-grid':
      this.dragFrame(e);
      break;
    case 'add-line':
      this.drawUserLine(userLine.startNode, relativeCoords(e));
      break;
    }
  }
}

function handleMouseUp(e) {
  if (e.target.tagName !== 'BUTTON') {
    this.mouseIsDown = false;
    switch (this.mode) {
    case 'add-grid':
      currentFrame && this.drawKnot();
      break;
    case 'add-line':
      this.finishDrawingLine(e);
      break;
    }
  }
}

const drawing = {
  init() {
    this.knots = [];
    this.mode = 'add-grid';
    this.addMouseListeners();
  },
  addMouseListeners() {
    this.handleMouseDown = handleMouseDown.bind(this);
    this.handleMouseUp = handleMouseUp.bind(this);
    this.handleMouseMove = handleMouseMove.bind(this);
    const wrapper = document.getElementById('wrapper');
    wrapper.addEventListener('mousedown', this.handleMouseDown, false);
    wrapper.addEventListener('mousemove', this.handleMouseMove, false);
    window.addEventListener('mouseup', this.handleMouseUp, false);
  },
  drawKnot() {
    currentKnot = new Knot(currentFrame);
    this.knots.push(currentKnot);
  },
  addNode(coords) {
    const frame = this.singleNodeFrame(coords);
    frame.drawLines();
    this.knots.push(new Knot(frame));
  },
  singleNodeFrame(coords) {
    const nodes = [new Node({
      x: coords[0],
      y: coords[1],
      gridSystem: 'square',
    })];
    const adjacencies = [[]];
    return new Frame({ nodes, adjacencies, });
  },
  placeNode(e) {
    const coords = closestGraphCoords(e);
    const pxCoords = pixelCoords(coords);
    if (!this.isNodeOverlapping(pxCoords)) {
      this.addNode(coords);
    }
  },
  isNodeOverlapping(coords) {
    return this.knots.some(knot => {
      return knot.frame.overlapsExistingNode(...coords);
    });
  },
  drawFrame() {
    currentFrame = new Frame({
      initialBox: dragStart,
      finalBox: dragEnd,
    });
    currentFrame.draw();
  },
  startDrawingGrid(e) {
    dragStart = rowAndCol(e);
    dragEnd = dragStart;
    doIfInGraph(dragStart, this.drawFrame.bind(this));
  },
  dragFrame(e) {
    const previousBox = dragEnd;
    dragEnd = rowAndCol(e);
    if (!identicalObjects(previousBox, dragEnd)) {
      doIfInGraph(dragEnd, function() {
        if (currentFrame) currentFrame.remove();
        currentFrame = new Frame({
          initialBox: dragStart,
          finalBox: dragEnd,
        });
        currentFrame.draw();
      }.bind(this));
    }
  },
  drawUserLine(lineStart, toCoords) {
    userLine.element && userLine.element.remove();
    userLine.startNode = lineStart;
    userLine.element = Snap('#surface').line(lineStart.x, lineStart.y, ...toCoords);
    userLine.element.attr(config.frame);
  },
  removeUserLine() {
    userLine && userLine.element.remove();
    userLine = {};
  },
  newLineIsValid(lineStart, lineEnd) {
    return lineEnd && lineEnd !== lineStart && !currentFrame.lineExistsBetween(lineStart, lineEnd);
  },
  finishDrawingLine(e) {
    const lineStart = userLine.startNode;
    this.removeUserLine();
    const coords = relativeCoords(e);
    const lineEnd = this.nodeAt(coords);
    if (this.newLineIsValid(lineStart, lineEnd)) {
      this.makeNewLine(lineStart, lineEnd);
    }
  },
  makeNewLine(lineStart, lineEnd) {
    currentKnot && currentKnot.remove();
    const knotA = this.findKnotWith(lineStart);
    const knotB = this.findKnotWith(lineEnd);
    if (knotA !== knotB) {
      this.mergeKnots(knotA, knotB, lineStart, lineEnd);
    } else {
      currentKnot.addLineBetween(lineStart, lineEnd);
    }
  },
  mergeKnots(knotA, knotB, startNode, endNode) {
    // need to merge two frames...
    this.remove(knotA);
    this.remove(knotB);
    currentKnot = knotA.merge(knotB, startNode, endNode);
    currentFrame = currentKnot.frame;
    this.knots.push(currentKnot);
  },
  remove(knot) {
    knot.remove();
    this.knots.splice(this.knots.indexOf(knot), 1);
  },
  nodeAt(coords) {
    let result;
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
    const lineStart = this.nodeAt(coords);
    currentKnot = this.findKnotWith(lineStart);
    currentFrame = currentKnot.frame;
    if (lineStart) {
      this.drawUserLine(lineStart, coords);
    }
  },
};

export default drawing;
