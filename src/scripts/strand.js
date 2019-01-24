import knotUtils from './knot-utils.js';

export default function Strand() {
  this.points = [];
  this.length = 0;

  this.add = function(point) {
    this.points.push(point);
    this.length++;
  };

  this.trimUnders = function() {
    for (var cpORpr of this.points) {
      var point = cpORpr.point;
      if (!cpORpr.pr) {
        // now trim the unders
        if (!cpORpr.point.trimmed) {
          // i.e. if not already trimmed

          var overLeft = point.overInLeft.concat(point.overOutLeft);
          var overRight = point.overInRight.concat(point.overOutRight);
          var intersectLOut =
            knotUtils.collectionIntersect(point.underOutLeft, overLeft) ||
            knotUtils.collectionIntersect(point.underOutLeft, overRight);
          var intersectROut =
            knotUtils.collectionIntersect(point.underOutRight, overLeft) ||
            knotUtils.collectionIntersect(point.underOutRight, overRight);
          var intersectLIn =
            knotUtils.collectionIntersect(point.underInLeft, overLeft) ||
            knotUtils.collectionIntersect(point.underInLeft, overRight);
          var intersectRIn =
            knotUtils.collectionIntersect(point.underInRight, overLeft) ||
            knotUtils.collectionIntersect(point.underInRight, overRight);

          knotUtils.mutate(point.underOutLeft, point.underOutLeft.slice(intersectLOut.idxA + 1));
          knotUtils.mutate(point.underOutRight, point.underOutRight.slice(intersectROut.idxA + 1));
          knotUtils.mutate(point.underInLeft, point.underInLeft.slice(0, intersectLIn.idxA + 1));
          knotUtils.mutate(point.underInRight, point.underInRight.slice(0, intersectRIn.idxA + 1));

          point.underOutLeft.unshift(intersectLOut.intersection);
          point.underOutRight.unshift(intersectROut.intersection);
          point.underInLeft.push(intersectLIn.intersection);
          point.underInRight.push(intersectRIn.intersection);
        }

        cpORpr.point.trimmed = true;
      }
    }
  };
}
