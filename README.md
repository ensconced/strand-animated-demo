## Strand Construction Demo:

For the purposes of this demonstration, we will focus on this knot:

![knot demo](https://i.imgur.com/v702syg.png)

This is constructed on the basis of this frame:

![knot demo](https://i.imgur.com/cZDRlsZ.png)

As we traverse our way around the frame, we alternate between taking "left turns", and "right turns". An analogy would be that you're driving a car (the blue arrow), and your keep reaching roundabouts (the purple nodes). You alternate between taking the "first exit" or "left turn" and the "last exit" or "right turn". (These are UK roundabouts).

At each step, the "crossing point" (i.e. the point at the centre of the blue line) is added to an array representing the growing strand.

![knot demo](https://imgur.com/a/IsUMbcm)

This is a simple example where the knot consists of one strand only.

The demonstration in this repository limits itself to one section of the knot-drawing algorithm, namely the part that produces an array of points through which this strand should pass, based on the frame/graph that is automatically drawn on the screen.

**Not** covered in this repo:

- user interaction
- smoothing of curves between the strand points
- construction of "pointed returns" - i.e. the fancy pointy corners