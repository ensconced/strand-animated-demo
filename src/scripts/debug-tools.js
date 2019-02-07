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
    strokeWidth: 5,
    fill: 'none',
  });
}

function paintPoint(point, color) {
  const circle = Snap(surface).circle(point.x, point.y, 3);
  circle.attr({ fill: color, stroke: color });
}

export function paintLine(coordsA, coordsB, color) {
  const svgLine = Snap(surface).line(...coordsA, ...coordsB);
  svgLine.attr({ stroke: color, strokeWidth: 3 });
  return svgLine;
}

export function paint(item, color) {
  if (Array.isArray(item) && typeof item[0] === 'number') {
    paint({
      x: item[0],
      y: item[1],
    }, color);
    return;
  }
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

export function paintArrow(line, forwards) {
  let start;
  let finish;
  if (forwards) {
    start = line.startNode;
    finish = line.endNode;
  } else {
    finish = line.startNode;
    start = line.endNode;
  }
  const lineVector = [finish.x - start.x, finish.y - start.y];
  const headStart = [start.x + (lineVector[0]) * 0.9, start.y + (lineVector[1]) * 0.9];
  let normal = [lineVector[1] * 0.1, -lineVector[0] * 0.1];
  const normalLength = (normal[0]**2 + normal[1]**2)**0.5;
  normal = normal.map(x => 5 * x / normalLength);
  const pointA = [headStart[0] + normal[0], headStart[1] + normal[1]];
  const pointB = [headStart[0] - normal[0], headStart[1] - normal[1]];
  const a = Snap(surface).polyline(...pointA, finish.x, finish.y, ...pointB);
  a.attr({ stroke: 'black', strokeWidth: 2, fill: 'none'});
  return a;
}

export function rainbowPaint(bezCollection) {
  const rainbow = ['red', 'blue', 'green', 'orange', 'purple'];
  bezCollection.forEach((bez) => {
    paint(bez, rainbow[rainbowIdx++ % rainbow.length]);
  });
}