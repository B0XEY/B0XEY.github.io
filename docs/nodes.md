[← Back to Overview](README.md)

# Nodes

Every node Noizy can build, what it does, and when you'd reach for it.

All of these come from FastNoise2. Noizy reads the list straight out of the
native library at startup, which means **Window > Noizy > Node List** is always
the live, authoritative version with the library's own descriptions. This page
is the friendlier version of that, grouped by what things are *for*.

The Add Node menu groups nodes using FastNoise2's own category names. Those are
close to the headings below but not always word for word. Just use the search
box and you won't need to care.

## How a graph fits together

Nodes come in two shapes, and knowing which is which explains most of the
editor:

- **Generators** make noise out of nothing. They have no noise input. Perlin,
  Value, Cellular, White, Checkerboard.
- **Everything else takes noise in and gives noise out.** Fractals, warps,
  modifiers, blends. They all have a **Source** input (or two).

So a normal graph reads left to right: a generator, then some things done to it,
then the Output node.

```
Perlin  ->  Fractal FBm  ->  Terrace  ->  Output
```

## Generators

The ones that make noise from nothing. Every graph needs at least one.

| Node | What it does |
|---|---|
| **Perlin** | The classic. Smooth gradient noise on a grid. Ken Perlin, 1983. Your default choice. |
| **Simplex** | Smooth gradient noise on a simplex grid. Ken Perlin again, 2001. A bit different in character to Perlin, and a bit slower. |
| **Super Simplex** | An extra-smooth simplex variant. The nicest looking of the three and the slowest. |
| **Value** | Value noise. Blockier than Perlin and the cheapest of the smooth generators. |
| **Gradient** | Plain gradient noise on an N-dimensional grid. |
| **White** | Pure random per point. No smoothness at all. Good as a source of jitter, terrible on its own. |
| **Checkerboard** | A checkerboard pattern. Each cell is "Feature Scale" across. Useful for testing and for masks. |
| **Sine Wave** | A sine wave. Handy for stripes, waves, and as an input to something else. |
| **Constant** | Always outputs the same number. Sounds useless, and then one day you need it as the B side of a blend. |
| **Distance To Point** | How far the sample position is from a point you set. Great for islands and radial falloffs. |

### Cellular

Also generators, but worth their own section because they're the expensive ones
and they don't behave like the rest.

| Node | What it does |
|---|---|
| **Cellular Value** | Each cell gets a random value. Gives you flat patches with hard edges: stone, crackle, biome regions. |
| **Cellular Distance** | Distance to the nearest cell centre. This is the one that looks like Worley/Voronoi cells. |
| **Cellular Lookup** | Each cell samples another node at the cell's centre. Use it to scatter a pattern one-value-per-cell. |

All three share two knobs worth knowing:

- **Distance Function**: Euclidean, Euclidean Squared, Manhattan, Hybrid, Max
  Axis, or Minkowski. Changes the *shape* of the cells more than anything else.
- **Grid Jitter**: how far cells wander off a perfect grid. `0` gives you a
  plain grid. Above `1` you start seeing grid artifacts.

Cellular Distance also has a **Return Type** that combines the nearest and
second-nearest distances (`Index0`, `Index0Sub1`, and friends). `Index0Sub1` is
the one that gives you clean cell borders.

Cellular is about **4-5x the cost of a Perlin**. Worth it when you need it,
worth checking twice when you don't. See [Performance](performance.md).

## Fractal

Fractals are what turn one noise layer into something that looks natural. They
sample their Source several times at increasing detail and add the results
together. This is where almost all of a graph's cost lives.

| Node | What it does |
|---|---|
| **Fractal FBm** | Fractional Brownian Motion. Layers of detail added on top of each other. The workhorse: terrain, clouds, anything organic. |
| **Fractal Ridged** | Same idea, but each layer is inverted first, so you get sharp ridges and valleys instead of rolling hills. Mountains. |

The controls are shared:

| Setting | What it does |
|---|---|
| **Octaves** | How many layers. More detail, more cost, in a straight line. Floored at 1. |
| **Lacunarity** | How much finer each layer is than the last. `2.0` means each layer is twice as detailed. |
| **Gain** | How much each layer contributes. Lower is smoother and more uniform, higher keeps more of the fine detail. |
| **Weighted Strength** | Scales later octaves by how strong earlier ones were. Smooths the flat areas while keeping detail in the busy ones. |

**Octaves is the single biggest cost in most graphs.** Each one costs about as
much as a whole extra Perlin. If a graph is too slow, drop an octave before you
do anything else.

## Domain warp

Domain warp doesn't change the *value* a node produces. It changes the
*position* the node gets asked about. Which sounds abstract until you use one,
at which point everything stops looking like a grid and starts looking like it
was carved by water.

| Node | What it does |
|---|---|
| **Domain Warp Gradient** | Warps positions using gradient noise. The cheap, standard one. |
| **Domain Warp Simplex** | Higher quality warp using a simplex grid. Costs more. |
| **Domain Warp Super Simplex** | Smoother still. Costs more again. |

The important setting is **Warp Amplitude**: the furthest a position can get
pushed from where it started. Small values ripple. Large values dissolve.

### Warping over several octaves

Two nodes turn a single warp into a fractal warp:

| Node | What it does |
|---|---|
| **Domain Warp Fractal Progressive** | Each octave warps the position it got from the previous octave. Warps compound. Swirlier. |
| **Domain Warp Fractal Independent** | Every octave warps the *original* position, and the offsets are added up. More controlled. |

Both take a domain warp node as their **Domain Warp Source**, not a plain
generator.

## Domain modifiers

These also change the position going in rather than the value coming out. They
are cheap, and they're how you scale and place noise without touching `step` in
your code.

| Node | What it does |
|---|---|
| **Domain Scale** | Scales input coordinates the same amount on every axis. Zoom in or out. |
| **Domain Axis Scale** | Same, but per axis. Squash the noise flat, stretch it into streaks. |
| **Domain Offset** | Shifts input coordinates. Move the noise without moving the world. |
| **Domain Rotate** | Rotates coordinates around the origin using Yaw / Pitch / Roll. Good for breaking up axis-aligned artifacts. |
| **Domain Rotate Plane** | A preset rotation for one 3D plane (XY or XZ). Faster than Domain Rotate, less flexible. |
| **Add Dimension** | Adds an extra dimension at a fixed position. Lets you feed a 2D lookup a fixed third coordinate. |
| **Remove Dimension** | Drops a dimension before passing coordinates on. |

A Domain Scale of just `1` still costs a full node. If it isn't doing
anything, delete it.

## Modifiers

Things done to the value that comes out.

| Node | What it does |
|---|---|
| **Remap** | Maps a value range onto another range. `From Min`/`From Max` in, `To Min`/`To Max` out, with an optional clamp. The one you want when noise is in the wrong range. |
| **Terrace** | Cuts values into steps for a terraced look. **Step Count** for how many, **Smoothness** for how soft the edges are. |
| **Seed Offset** | Adds a number to the seed before passing it down. Lets two identical branches of a graph produce different noise. |
| **Abs** | Absolute value. Folds negatives up into positives, the quick way to get creases. |
| **Ping Pong** | Multiplies values by a strength and bounces them back when they'd go past -1 or 1, instead of clipping. Flowing, contour-line patterns. |
| **Signed Square Root** | Square root of the absolute value, with the original sign put back. Compresses big values, keeps small ones. |
| **Generator Cache** | Remembers its Source's last result for a given position and seed. It pays off once the same expensive branch gets sampled more than once. |
| **Convert RGBA8** | Packs the value into an RGBA8 colour stored in a float. For feeding texture pipelines that expect that format. |

## Blends and operators

Two inputs in, one out. Every one of these takes either a wired-in node or a
plain number on each side, so `Multiply` by `0.5` needs one node, not two.

| Node | What it does |
|---|---|
| **Add** | A + B |
| **Subtract** | A - B |
| **Multiply** | A * B |
| **Divide** | A / B |
| **Min** | The lower of the two |
| **Max** | The higher of the two |
| **Min Smooth** | Like Min, but the join between them is rounded off instead of creased |
| **Max Smooth** | Like Max, with the same rounding |
| **Modulus** | Remainder. Wraps values into a band, which makes stripes and rings |
| **Pow Float** | A to the power of B. It's a contrast control. |
| **Pow Int** | Same, just integer powers, and quite a bit faster |
| **Fade** | Crossfades between two inputs. **Fade Min** is 100% A, **Fade Max** is 100% B, with Linear / Hermite / Quintic easing |

## Subgraph nodes

Any [subgraph](subgraphs.md) asset in your project also shows up in the node
search, under **Subgraph**, and drops in as a node already wired to that asset.

## Picking nodes: some starting points

Recipes that work, to save you the blank-canvas problem.

**Rolling hills**
```
Perlin -> Fractal FBm (4-6 octaves) -> Output
```

**Mountains**
```
Perlin -> Fractal Ridged (5 octaves) -> Output
```

**Something that doesn't look like a grid**
```
Perlin -> Fractal FBm -> Domain Warp Gradient -> Output
```

**An island**
```
Distance To Point  ->  Remap (invert it)  \
                                           Multiply -> Output
Perlin -> Fractal FBm                     /
```

**Caves (3D)**
```
Perlin -> Fractal FBm -> Abs -> Output
```
Then treat everything above a threshold as rock. That's what
`NoizyCaveDemo` does. See [Examples and demos](examples.md).

**Stone / cracked ground**
```
Cellular Distance (Index0Sub1) -> Output
```

Open `Examples/Island.asset`, `Examples/Marble.asset` and `Examples/Wood.asset`
to see complete versions of this kind of thing.

## What things cost

Short version: fractal octaves and Cellular are expensive, everything else is
cheap, and nothing gets optimised away for you. Long version, with numbers, in
[Performance](performance.md).
