import Snap from 'snapsvg';

// these functions are useful for debugging and for demonstrating the strand-building algorithm

export function paint(point, color) {
  const circle = Snap('#surface').circle(point.x, point.y, 3);
  return circle.attr({ fill: color, stroke: color });
}

export function paintLine(coordsA, coordsB) {
  const svgLine = Snap('#surface').line(...coordsA, ...coordsB);
  return svgLine.attr({ stroke: 'black', strokeWidth: 3, strokeOpacity: 0.5 });
}

export function paintArrowHead(line, backwards) {
  let start;
  let finish;
  if (backwards) {
    finish = line.startNode;
    start = line.endNode;
  } else {
    start = line.startNode;
    finish = line.endNode;
  }

  const lineVector = [finish.x - start.x, finish.y - start.y];

  // headStart is the point 90% of the way along the line
  const headStart = [start.x + (lineVector[0]) * 0.9, start.y + (lineVector[1]) * 0.9];

  const perpendicular = normal(lineVector, 5);
  const pointA = [headStart[0] + perpendicular[0], headStart[1] + perpendicular[1]];
  const pointB = [headStart[0] - perpendicular[0], headStart[1] - perpendicular[1]];
  const a = Snap('#surface').polyline(...pointA, finish.x, finish.y, ...pointB);
  return a.attr({ stroke: 'blue', strokeWidth: 2, fill: 'none'});
}


function normal(vector, magnitude) {
  const length = (vector[0]**2 + vector[1]**2)**0.5;
  return [vector[1], -vector[0]].map(component => magnitude * component / length);
}