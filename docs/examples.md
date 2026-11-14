[← Back to Overview](README.md)

# Examples and demos

Everything that ships with Noizy that you can open, run, or steal from.

## The demo scenes

`Demo/Scenes/` has four scenes, one for each of the main demo scripts:

| Scene | Script | Shows |
|---|---|---|
| `2D Demo.unity` | `Noizy2DDemo.cs` | Noise turned into a scrolling terrain mesh |
| `3D Demo.unity` | `NoizyCaveDemo.cs` | Noise carved into a cave system |
| `Streaming Demo.unity` | `NoizyChunkStreamDemo.cs` | Streaming chunks with no stutter |
| `Terrain Demo.unity` | `NoizyScatterDemo.cs` and `NoizyTerrain` | Prop scattering on a filled `Terrain` |

Open any of them and press play.

It's the quickest way to confirm the native library loaded on your machine, and
the quickest way to see what changing a setting does, because most of
the demo components regenerate live while you drag things in the Inspector.

## The demo scripts

All in `Demo/Scripts/`. Each one is built around a **single** Noizy
call on purpose, with the rest being ordinary Unity code, so it's obvious which line is the
interesting one.

### NoizyDemoScript.cs: noise into a texture

`Evaluate2D`. Samples a 2D grid every frame, writes it into a grayscale texture,
and puts that on a renderer. The sample offset slides over time, so the noise
looks like it's scrolling.

Has a `NoizyEvalMode` field on it, so you can flip between `auto`,
`forceParallel` and `forceSingle` in the Inspector and see the difference
without writing anything.

This one isn't wired into any of the four demo scenes. To try it, see
"Wiring the extra demo up" below.

### Noizy2DDemo.cs: noise into a mesh

`Evaluate2D` again, but each value becomes the height of one vertex instead of
the brightness of one pixel. A rolling terrain mesh that scrolls past.

Worth reading for the buffer reuse: the vertex, UV and triangle arrays are built
once and reused every frame. Allocating those every frame is the usual reason
something like this stutters.

### NoizyCaveDemo.cs: 3D noise

`Evaluate3D`. Fills a cubic volume with 3D noise, treats everything above a
threshold as rock, and meshes just the faces where rock meets open space. That
carves a cave system out of a solid block, and it means faces buried inside the
rock are never built at all.

This one does **not** rebuild every frame. A 3D grid is `size` cubed samples
(32 is 33k, 64 is 262k), so it rebuilds when you change a setting, or from the
component's **Regenerate** context menu entry.

Settings worth playing with: **Rock Threshold** (higher = bigger caves) and
**Draw Outer Walls** (off by default, so you can see into the tunnels).

### NoizyChunkStreamDemo.cs: streaming without stutter

`Schedule2D` and `NoizyHandle`. An endless landscape that loads in around the
camera a chunk at a time. Each chunk is scheduled onto worker threads and meshed
a frame or two later, when its handle reports it's done.

Neighbouring chunks share their edge points, so the seams line up just right.

The **Use Async** tick box switches the same scene over to the blocking
`Evaluate2D` path. Turn it off and you get a stutter every time you cross a
chunk border, which is the whole argument for `Schedule2D` in one toggle.

It's also the reference for the lifetime rule on scheduled work: each chunk's
`NativeArray` stays alive and untouched until its handle is completed, including
when a chunk gets unloaded while its noise is still in flight.

### NoizyScatterDemo.cs: placing objects

`EvaluatePositions2D`. Lays out jittered candidate points across an area, gets a
density value for **all of them in one call** (plus their lowest and highest
value, via `out var range`, to measure the threshold against), and places a
prop at every point above the threshold.

That's why the props clump and leave clearings instead of spreading out the same everywhere,
which is what makes scattered objects look placed rather than random.

Optional raycast snapping drops each prop onto whatever collider is underneath,
like the demo terrain. Assign a prefab for a proper result; leave the field empty
and it falls back to primitive cubes, which use the built-in default material and
so render magenta under URP.

### NoizyDemoTextureUtil.cs

Small shared helpers: writing a noise buffer into a texture as grayscale, and
destroying objects the right way in both edit mode and Play mode (every demo
uses that one). A decent starting point if you want textures at runtime.

## Wiring the extra demo up

`NoizyDemoScript` is the only demo script that isn't already wired into one of
the four demo scenes. To try it:

1. Make an empty GameObject.
2. Add the component, plus a `Renderer` (a plane or quad works well).
3. Assign a Noizy graph asset. The graphs in `Examples/` all work, and there are
   purpose-built ones in `Demo/` (`Caves.asset`, `Terrain.asset`,
   `Texture.asset`).
4. Give the renderer any material with a `_BaseMap` or `_MainTex` property.
   The package doesn't ship one for this script anymore, so bring your own.

## Example graphs

`Examples/` has ready-made graphs to open, tweak, or start from:

| Asset | What it is |
|---|---|
| `Island.asset` | A landmass with a radial falloff. The Distance To Point pattern |
| `Marble.asset` | Marble veining |
| `Wood.asset` | Wood grain |
| `Marble_128_NoTile.asset` | A 128x128 `Texture2D` exported from Marble (non-tileable) |
| `Wood_128_NoTile.asset` | The same, for Wood |

Double-click any of the graphs to open them in the editor and see how the effect
is built. The two texture assets are there so you can see the result without
opening anything.

The `Demo/` folder has more graphs used by the demo scenes themselves:
`Caves.asset`, `Terrain.asset`, `Texture.asset`, `UnityTerrain.asset` and
`Scenes/DemoTerrain.asset`.

## Render pipelines

**The Noizy runtime and editor work with any render pipeline.** The demo
scenes' materials are a different matter, and the package only ships URP ones.

`Demo/Materials/` contains:

- `Surface.shadergraph` / `Surface.mat`: a terrain material built with Shader
  Graph. Colours by height and slope: ground, steep, sand.

That needs the URP package (`com.unity.render-pipelines.universal`) and the
Shader Graph package. Both come installed in any project made from the URP
template.

On HDRP or a custom pipeline, noise generation and sampling work just the
same. The shipped material won't render right though, so make your own for
the demo objects, or just read the demo scripts. The noise part of them has
nothing to do with rendering.
