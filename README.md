A website that generates celtic-style knots (*icovellavna*) based on user-defined graphs.

# Demo

![knot demo](https://media.giphy.com/media/d2RPhHfiQ0LgfyQ3sz/giphy.gif)

# To Do

### add unit tests

### refactoring

- improve ensapsulation

### style

-  concanenate SVG properly into paths

### performance stuff

- investigate performance - offset calcs are most costly?
- avoid unneccessary strand-recalculations
- strand calculations are relatively faast - could start doing them before mouseup
- fuzzy memoization of offset calculations?
- web workers?

### extra features

- triangular and circular grids, and freeform (including real-time dragging)
- user configuration
