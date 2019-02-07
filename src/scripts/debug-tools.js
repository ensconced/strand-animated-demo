import surface from './main.js';
import Snap from 'snapsvg';
import { bezString } from './knot-utils.js';

let rainbowIdx = 0;

function paintBezier(bezier, color) {
  const ctrlPoints = bezier.points.map(coords => [coords.x, coords.y]);
  const path = bezString(...ctrlPoints);
  const svgBez = Snap(surface).path(path);
  svgBez.attr({
    stroke: color,
    strokeWidth: 2,
    fill: 'none',
  });
}

function paintPoint(point, color) {
  const circle = Snap(surface).circle(point.x, point.y, 5);
  circle.attr({ fill: color, stroke: color });
}

export function paint(item, color) {
  if (item.x !== undefined && item.y !== undefined) {
    paintPoint(item, color);
    return;
  }
  switch (item.constructor.name) {
  case 'Object': // should be bezier but constructor not set in library
    paintBezier(item, color);
    break;
  case 'Point2D':
    paintPoint(item, color);
    break;
  case 'Array':
    item.forEach(element => paint(element, color));
    break;
  default:
    break;
  }
}

export function rainbowPaint(bezCollection) {
  const rainbow = ['red', 'blue', 'green', 'orange', 'purple'];
  bezCollection.forEach((bez) => {
    paint(bez, rainbow[rainbowIdx++ % rainbow.length]);
  });
}