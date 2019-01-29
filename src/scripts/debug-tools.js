import surface from './main.js';
import Snap from 'snapsvg';
import { bezString } from './knot-utils.js';

let rainbowIdx = 0;

export function paint(bezier, color) {
  const ctrlPoints = bezier.points.map(coords => [coords.x, coords.y]);
  const path = bezString(...ctrlPoints);
  const svgBez = Snap(surface).path(path);
  svgBez.attr({
    stroke: color,
    strokeWidth: 2,
    fill: 'none',
  });
}

export function rainbowPaint(bezCollection) {
  const rainbow = ['red', 'blue', 'green', 'orange', 'purple'];
  bezCollection.forEach((bez) => {
    paint(bez, rainbow[rainbowIdx++ % rainbow.length]);
  });
}