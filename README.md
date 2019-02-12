## Strand Construction Demo

For the purposes of this demonstration, we will focus on this knot:

![knot demo](https://i.imgur.com/v702syg.png)

This is constructed on the basis of this frame:

![knot demo](https://i.imgur.com/cZDRlsZ.png)

As we traverse our way around the frame, we alternate between taking "left turns", and "right turns". An analogy would be that you're driving a car (the blue arrow), and your keep reaching roundabouts (the purple nodes). You alternate between taking the "first exit" or "left turn" and the "last exit" or "right turn". (These are UK roundabouts).

At each step, the "crossing point" (i.e. the point at the centre of the blue line) is added to an array representing the growing strand.

![knot demo](https://imgur.com/a/IsUMbcm)

This is a simple example where the knot consists of one strand only.

The demonstration in this repository limits itself to one stage of the knot-drawing algorithm, namely the stage which produces an array of points through which the constructed strand will pass. This array of points is constructed on the basis of a 'frame', which is just a collection of nodes with some of the nodes connected via Lines.

**Not** covered in this repo:

- user interaction
- smoothing of curves between the strand points
- construction of "pointed returns" - i.e. the fancy pointy corners
