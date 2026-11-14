[← Back to Overview](README.md)

# Troubleshooting

Errors, warnings, and the "why is it doing that" list.

Every message Noizy prints starts with `[Noizy]`, so you can filter the console
for it.

## Nothing generates at all

### `'<asset>' has nothing to sample yet`

The graph was never saved, or it was saved with nothing wired into its Output
node. Open it in the graph editor (double-click the asset), connect something to
Output, and press `Ctrl+S`.

A graph asset is empty until you save it once. The asset's Inspector tells you
which state it's in. Look for **✓ Baked**.

### `Could not build '<asset>': <reason>`

The graph is saved, but it can't be turned into noise. The part after the colon
is the actual problem, and it's one of the save-time errors below (a cycle, a
missing input, a broken subgraph). Open the named graph, fix it, and save.

You'll usually see this from a script or a component, since the graph editor
catches most of these when you save.

### `Could not load the FastNoise2 native library. Noise generation will not work.`

Unity couldn't load the native library for your platform. Check:

1. The files under `Assets/Plugins/Noizy/Core/Platforms/` (`Windows/`, `Linux/`,
   `MacOS/`, `Android/`, `iOS/` and `WebGL/`) are still there. If your version
   control ignores binaries, they may not have come across.
2. Open **Window > Noizy > Native Libraries**. It lists every platform and
   whether its library is in the project, and warns you if your active build
   target has none. If a library is there but misbehaves, click **Apply
   Settings** to give every library the right platform and CPU settings.
3. You're on a supported platform: Windows (x64 or ARM64), macOS (Intel or Apple
   Silicon), Linux (x64 or ARM64), Android (ARM64 or x86_64), iOS devices, or
   WebGL.

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

### My noise changed after updating Noizy

The bundled FastNoise2 library was updated. It fixes bugs in Cellular Value (2D),
Minkowski distance and Pow Float, so graphs that use those nodes can generate
different noise than before. Graphs that don't are unchanged.

If a graph with one of those nodes looks different after you update, that's the
fix, not a problem with your graph. Everything else in your project keeps
generating the same values.

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
it will feel it. Mute the heavy nodes you aren't working on (select them, press
`M`), or drop the octave count for now while you tune the shape.

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

Graph edits go on Unity's normal undo history (you can see them as
**Noizy Graph Edit** in **Edit > Undo History**), so `Ctrl+Z` undoes whatever
you did most recently, in the graph or anywhere else. If your last action was
in the scene, that's what gets undone first.

Edits are grouped: a burst of changes within about a quarter of a second
becomes one undo step. Opening a different graph clears the previous graph's
undo steps, so you can't undo back into a graph you've closed.

### `Export Texture` is greyed out

The graph isn't baked. Save it first.

### There's no `Export Texture` button at all

You've got a **subgraph** selected, not a full graph. Subgraphs can't be
evaluated on their own.

### Noizy isn't in my build

Check your build target. `Noizy.Core` compiles for the Editor, Windows, macOS,
Linux, Android, iOS and WebGL. On any other target (consoles, tvOS, visionOS)
it's left out of the build rather than failing it, which is intentional, but it
does mean your code referencing `NoizyAsset` won't compile there either.

## Platform notes

### The iOS Simulator isn't supported

The iOS library is built for physical devices. A build for the Simulator will fail
to link, or fail to find the library. Test on a device.

### Android: my build can't find the library, or crashes on an old phone

Noizy ships 64-bit libraries only (ARM64 for phones and tablets, x86_64 for
emulators), and needs Android 6 (API 23) or newer. A 32-bit ARM device or build
target isn't covered. In **Player Settings > Other Settings**, make sure
**ARM64** is ticked under **Target Architectures**. The libraries are aligned
for 16 KB memory pages, which current Google Play rules require.

### WebGL: the build fails to link, or complains about SIMD

WebGL support is experimental. The library uses WebAssembly SIMD, which Unity's
default WebGL settings may not accept. Try turning on **Target WebAssembly 2023**
in **Edit > Project Settings > Player > Publishing Settings**. It also needs Unity 6.5 or newer,
because the library is built with the Emscripten version that Unity uses from
then on.

If the build still fails, please [get in touch](license-and-support.md) with your
Unity version and the full link error.

On WebGL, Unity runs jobs on the main thread unless your Unity version and build
settings provide worker threads, so `Schedule` calls and parallel mode may run on
one thread there.

## Still stuck

See [License and support](license-and-support.md) for where to ask. Including
your Unity version, your platform, and the exact `[Noizy]` message will get you
an answer a lot faster.
