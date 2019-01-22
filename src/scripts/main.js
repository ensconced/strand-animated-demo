import { Drawing } from './drawing.js';
import Snap from 'snapsvg';
import Mouse from './mouse.js';
import Frame from './frame.js';
import Graph from './graph.js';


(function() {
  var drawing = new Drawing();
  drawing.surface = Snap('#surface');

  function squareGrid() {
    // draw graph
    drawing.graph = new Graph(drawing);
  }

  function freeform() {
    if (drawing.graph) drawing.graph.remove();

    function allNodesDraggable() {
      for (let node of drawing.frame.nodes) {
        // add drag listener
        node.snapObject.drag(onMove(node), onStart, onEnd);
      }
    }

    // this function constructs listeners for nodes
    function onMove(node) {
      return function() {
        // change node position
        [node.x, node.y] = Mouse.relativeCoords(event);
        // re-draw whole frame
        drawing.frame.remove();
        drawing.frame.draw();
        // but now we have new snap objs without listeners attached
        // so add listeners again
        allNodesDraggable();
      };
    }

    function onStart() {}

    function onEnd() {
      drawing.knot.remove();
      drawing.drawKnot();
      allNodesDraggable();
    }
    allNodesDraggable();
  }

  var addNodeListener = function() {
    if (!drawing.frame)
      drawing.frame = new Frame({
        drawing: drawing,
      });
    drawing.frame.addNode(event);
  };

  // set up button to add node
  document.getElementById('add-node').addEventListener('click', function() {
    drawing.graphArea.addEventListener('click', addNodeListener);
  });

  // set up button to add line
  document.getElementById('add-line').addEventListener('click', function() {
    drawing.graphArea.removeEventListener('click', addNodeListener);
    drawing.frame.userLine();
  });

  // set up button to add grid
  document.getElementById('add-grid').addEventListener('click', function() {
    // let user draw a frame
    drawing.addUserFrame();
  });

  function setFrameType() {
    var frameType = document.querySelector('[name=frame-type]:checked').value;
    if (frameType === 'square') {
      if (drawing.knot) drawing.knot.remove();
      if (drawing.frame) drawing.frame.remove();
      squareGrid();
      if (drawing.frame) drawing.frame.draw();
      if (drawing.knot) drawing.drawKnot();
    } else if (frameType === 'freeform') {
      // remove grid...then
      freeform();
    }
  }

  setFrameType();
  // add radio listener
  document.getElementById('frame-type').addEventListener('click', setFrameType);
})();
