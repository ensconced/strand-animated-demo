## Strand Construction Demo

This demo limits itself to one stage of the knot-drawing algorithm, namely the stage which produces an array of points through which the constructed strand will pass. This array of points is constructed on the basis of a 'frame', which is just a collection of points and a set of lines connecting those points.

For the purposes of this demonstration, we will focus on this knot:

![knot demo](https://i.imgur.com/v702syg.png)

This is a simple example where the knot consists of one strand only.

This is constructed on the basis of this frame:

![knot demo](https://i.imgur.com/cZDRlsZ.png)

As we traverse our way around the frame, we alternate between taking "left turns", and "right turns". An analogy would be that you're driving a car (the blue arrow), and your keep reaching roundabouts (the purple nodes). You alternate between taking the "first exit" or "left turn" and the "last exit" or "right turn". (These are UK roundabouts).

> N.B. In some cases, there will only be two possible exits from a "roundabout", including the line from which you are entering the roundabout. In such cases, a right turn and left turn are equivalent.

At each step, the "crossing point" (i.e. the point at the centre of the blue line) is added to an array representing the growing strand.

![knot demo](https://i.imgur.com/dUGQczy.gif)

**Not** covered in this repo:

- user interaction
- smoothing of curves between the strand points
- offsetting of strands into two parallel lines
- line-trimming to produce over/under pattern
- construction of "pointed returns" - i.e. the fancy pointy corners
