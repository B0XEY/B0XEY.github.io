[← Back to Overview](README.md)

# Troubleshooting

Errors, warnings, and the "why is it doing that" list.

Every message Noizy prints starts with `[Noizy]`, so you can filter the console
for it.

## Nothing generates at all

### `Cannot build tree: asset has no valid baked snapshot`

The graph was never saved. Open it in the graph editor and press `Ctrl+S`.

A graph asset is empty until you save it once. The asset's Inspector tells you
which state it's in. Look for **✓ Baked**.

### `Could not load the FastNoise2 native library. Noise generation will not work.`

Unity couldn't load the native binary for your platform. Check:

1. The files under `Assets/Plugins/Noizy/Windows/`, `MacOS/` and `Linux/` are
   still there. If your version control ignores binaries, they may not have come
   across.
2. Select the binary for your platform in the Project window and check its
   importer settings. It needs to be enabled for the Editor and your platform.
3. You're on a supported platform: Windows x64, macOS (Intel or Apple Silicon),
   or Linux x64.

On macOS you may also need to allow the library through Gatekeeper the first
time.

### The node search is empty

Same cause as above. The node list is read out of the native library, so if the
library didn't load there's nothing to list. Fix the library and restart Unity.

## Errors when saving a graph

### `Cycle detected in noise graph at node '<name>'`

Something in the graph feeds back into itself somewhere down the chain. The message names the
node it noticed the loop at, which is the fastest place to start looking.

Reroute nodes count too. A chain of them going in a circle is still a circle.

### `'<node>' node (id <id>) is missing a required '<input>' input`

A node has a Source input with nothing plugged into it. Most non-generator nodes
need one. Find the node with the empty green port on its left and wire something
into it.

### `Subgraph node has no graph assigned`

You have a subgraph node on the canvas titled "Subgraph (none)". Drag a
`NoizySubgraph` asset onto it, or delete the node.

### `Subgraph '<name>' has no valid baked graph`

The subgraph you're referencing was never saved. Open it and press `Ctrl+S`.

### `Subgraph '<name>' contains itself`

A subgraph references itself, on its own or through a chain of other subgraphs.
See [Subgraphs](subgraphs.md).

## Errors at runtime

### `Tree is not valid`

You're sampling a `NoizyTree` that's already been disposed, or one that was
never created.

If you're using `CreateTree()`, check the disposal order. A tree disposed while
a scheduled job is still using it will do this.

If you're not using `CreateTree()`, this is because the asset was re-baked or
disabled while background work was still sampling it. Finish that work first.

### `Destination array is too small. Required: X, Provided: Y`

A `NativeArray` overload got a buffer smaller than the grid needs. Native
overloads don't allocate for you.

You need at least `size.x * size.y` floats for 2D, `size.x * size.y * size.z` for
3D, or one per point for a scattered call.

### `Destination array has not been allocated`

The `NativeArray` you passed was `default`, or you already disposed it.

### `Position arrays must have the same length`

Your x, y (and z) arrays are different lengths.

## It works, but it's wrong

### The result is all one value / dead flat

Most of the time it's `step`. If `step` is very small relative to your grid, every sample lands
in almost the same place in the noise and you get a flat field. Try increasing
it by 10x and see if anything appears.

Also worth checking: an Output node wired to a **Constant**, or a Multiply whose
other side is 0.

### The noise looks blocky or pixelated

`step` is too large. You're sampling further apart than the noise has features,
so you're seeing individual grid cells. Make it smaller.

### Terrain is dead flat

`NoizyTerrain`'s **Height Scale** is smaller than people expect. With the default
**Height Offset** of 0.5, you want about **200** to use the terrain's full
height range. The default of 0.5 is almost flat on purpose. See
[Terrain component](terrain.md#about-height-scale).

### Tiles don't line up / there's a seam

For `NoizyTerrain`, they should line up on their own, based on each terrain's
world position. If they don't, check the terrain tiles are adjacent in
world space and are the same size.

For your own chunked meshes: neighbouring chunks need to **share** their edge row
of samples, not sit next to each other. `NoizyChunkStreamDemo` does this: a
chunk overlaps the next one by one row of points.

### `forceSingle` and `forceParallel` don't give quite the same numbers

The gap is real, about 1e-7. That's expected and unavoidable. The two paths
build up the sample position in a different order, so the rounding doesn't come out the same. It's far
below the precision a heightmap or texture stores. Don't build a checksum or an
equality test on it. Details in
[Performance](performance.md#last-bit-note).

### The preview looks different from the exported texture

For 3D exports, the preview normalises each slice against its own range while the
export normalises across the whole volume. On very uneven noise that shows as a
brightness difference. The exported data is the correct one.

### My change to a subgraph didn't take effect

It should. Saving a subgraph rebakes everything that uses it. If a graph seems
stale, run **Window > Noizy > Rebuild Compiled Graphs**.

This can happen after a version control revert or a package reimport, where a
subgraph changes without the parent knowing. Noizy has a fingerprint check that
catches it and falls back to compiling at runtime. Output stays correct, you
just pay a bit more on the first sample until it's rebuilt.

## It works, but it's slow

Start with the [Performance checklist](performance.md#a-checklist-for-when-its-too-slow).

The short version: count your fractal octaves, then look for Cellular nodes, then
check you're reusing your `dest` buffer.

Turn on **Window > Noizy > Debug > Log Evaluations** to see every call as it
happens. It's very common to find you're generating far more often than you
thought.

### The editor is sluggish while I drag a slider

Node previews regenerate as you type. A graph with several 6-octave fractals in
it will feel it. Collapse nodes you aren't working on, or drop the
octave count for now while you tune the shape.

### The first sample after entering play mode stalls

That's the graph being compiled into a tree. Call `graph.Warmup()` during
loading. See [Performance](performance.md#startup-cost).

## Editor oddities

### I closed the window and lost my work

Check again. Reopen the graph and Noizy should offer to recover your unsaved
edits from its autosave. It writes them to `Library/NoizyAutosaves/` while you
work.

If you clicked **Discard** on that dialog, they're gone.

### Undo isn't undoing my graph changes

Make sure the graph window has focus. Noizy has its own undo stack, separate
from Unity's, and it just responds while the graph editor is the active window.
That separation is on purpose. It means undoing in the graph never undoes
something in your scene by mistake.

### `Export Texture` is greyed out

The graph isn't baked. Save it first.

### There's no `Export Texture` button at all

You've got a **subgraph** selected, not a full graph. Subgraphs can't be
evaluated on their own.

### Noizy isn't in my build

Check your build target. `Noizy.Core` just compiles for the Editor and for
Windows x64, macOS and Linux x64 standalone. On any other target it's left out
of the build rather than failing it, which is intentional, but it does mean
your code referencing `NoizyAsset` won't compile there either.

## Still stuck

See [License and support](license-and-support.md) for where to ask. Including
your Unity version, your platform, and the exact `[Noizy]` message will get you
an answer a lot faster.
