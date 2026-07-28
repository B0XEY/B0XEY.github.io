[← Back to the index](README.md)

# Scripting

How to get noise out of a graph and into your game. Everything lives in the
`Noizy.Core` namespace.

```csharp
using Noizy.Core;
using Unity.Mathematics;
```

Most projects need one method from this page. The rest is here for when you need
more.

## Which call do I want?

| I want... | Use |
|---|---|
| A grid of values | `Evaluate2D` / `Evaluate3D` |
| One value at one point | `SampleSingle2D` / `SampleSingle3D` |
| Values at a scattered list of points | `EvaluatePositions2D` / `EvaluatePositions3D` |
| ...written into native memory instead of a `float[]` | the same call, with a `NativeArray<float>` as the destination |
| ...started now and picked up later | `Schedule2D` / `Schedule3D` / `SchedulePositions2D` / `SchedulePositions3D` |
| A Unity Terrain filled in, with no code | the [`NoizyTerrain` component](terrain.md) |

Every one of them takes an optional `NoizyEvalMode`. The default (`auto`) picks
single- or multi-threaded for you and is right almost every time. See
[Performance](performance.md#eval-modes).

## Grids

The one you'll use most.

```csharp
using Noizy.Core;
using Unity.Mathematics;
using UnityEngine;

public class Heightmap : MonoBehaviour {
    [SerializeField] private NoizyAsset graph;

    // Kept around and reused. A new array every call is the usual reason
    // something like this shows up in the profiler as GC pressure.
    private float[] _values;

    private void Generate() {
        _values = graph.Evaluate2D(
            size:   new int2(256, 256),
            offset: float2.zero,
            step:   new float2(0.1f),
            seed:   1337,
            range:  out var range,
            dest:   _values);

        // Row-major: index = x + y * size.x
        float middle = _values[128 + 128 * 256];

        // Normalise to 0..1 without a second pass over the array,
        // because range already tells us what we got.
        float t = (middle - range.Min) / (range.Max - range.Min);
    }
}
```

3D is the same with one more axis:

```csharp
float[] volume = graph.Evaluate3D(
    size:   new int3(32, 32, 32),   // 32,768 samples - 3D adds up fast
    offset: float3.zero,
    step:   new float3(0.1f),
    seed:   1337,
    range:  out var range);

// index = x + y * size.x + z * size.x * size.y
```

### The arguments

| Argument | What it is |
|---|---|
| `size` | How many samples along each axis |
| `offset` | Where the grid starts in noise space |
| `step` | The distance between samples. Smaller zooms in |
| `seed` | The noise seed |
| `range` (`out`) | The lowest and highest values generated. Always required. See below |
| `dest` (optional) | A buffer to write into. A new one is made if it's `null` or too small |
| `mode` (optional) | Single- or multi-threaded. Defaults to `auto` |

`Evaluate2D` and `Evaluate3D` throw `InvalidOperationException` if the graph
hasn't been baked. Open it in the editor and press `Ctrl+S`.

### Why `range` isn't optional

The native library works out the minimum and maximum while it's generating,
whether you ask for it or not. So every grid call hands it back, and there's
deliberately no overload that skips it. Skipping it wouldn't save any work, and
it would only tempt you into a second pass over the buffer to recover something
you already had.

Use it any time you'd otherwise loop over the results just to find the range,
normalising for a texture, say. Pass `out _` when you genuinely don't need it.

### Reusing the buffer

The `dest` you pass is reused whenever it's **big enough**, not only when it's
exactly the right size. So one pooled buffer can serve calls of different sizes
without reallocating.

That means the array you get back can be **longer** than the number of values
written. Always read `size.x * size.y` (or the point count), never
`dest.Length`.

```csharp
// One buffer, big enough for the largest grid you'll ask for.
private readonly float[] _scratch = new float[512 * 512];

void SmallGrid() {
    // Reuses _scratch. Only the first 64 * 64 entries are meaningful.
    graph.Evaluate2D(new int2(64, 64), float2.zero, new float2(0.1f), 1337,
                     out _, _scratch);
}
```

Keep one scratch buffer per thread or per caller, so parallel callers aren't
writing into the same array.

## One point at a time

If you only need one value, like a placement check or a biome lookup, use
`SampleSingle2D` / `SampleSingle3D` rather than asking for a 1x1 grid. The grid
path does extra work (destination array, minimum/maximum tracking) that a single
point doesn't need.

```csharp
// Is this spot above the tree line?
float height = graph.SampleSingle2D(new float2(worldX, worldZ), seed: 1337);
if (height > 0.6f) { /* rocks, not trees */ }
```

If you find yourself calling this in a loop over hundreds of points, use the
next section instead.

## Scattered points

For many arbitrary points at once, like an object placement pass, a set of spawn
candidates, or anything that isn't a regular grid, `EvaluatePositions2D` /
`EvaluatePositions3D` samples the whole batch in one native call instead of one
call per point.

```csharp
// Two arrays of coordinates in, one array of values out.
float[] density = graph.EvaluatePositions2D(
    xPositions: xs,
    yPositions: ys,
    offset:     float2.zero,
    seed:       1337,
    dest:       _densityBuffer);   // reused, same rules as a grid

// density[i] is the value at (xs[i], ys[i]).
for (int i = 0; i < xs.Length; i++) {
    if (density[i] > threshold) PlaceProp(xs[i], ys[i]);
}
```

The x, y (and z) arrays must all be the same length, or you get an
`ArgumentException`.

Like a grid, this splits across worker threads when there are enough points to
make it worth it. So a big foliage pass uses every core instead of one.

`Demo/Scripts/NoizyScatterDemo.cs` is a complete working version of this.

## Writing into native memory

Every grid and position call has a `NativeArray<float>` overload.

The `float[]` version pins your array and writes into it directly, so it doesn't
copy. But if your destination is *already* native memory, like a mesh buffer, a
`Texture2D.SetPixelData` upload, or the input to another job, you'd still be
copying out of the `float[]` afterwards. Use the native overload and skip the
round trip.

```csharp
using var heights = new NativeArray<float>(1024 * 1024, Allocator.TempJob);

// Note the different shape: dest comes first, and it returns void.
graph.Evaluate2D(heights, new int2(1024, 1024), float2.zero,
                 new float2(0.1f), seed: 1337, out var range);
```

The native overloads don't allocate anything for you, so the array has to
already be big enough. If it isn't, you get an `ArgumentException` telling you
the size it needed.

## Not blocking: Schedule

`Evaluate2D` and `Evaluate3D` wait for the whole grid before they return, so a
large volume stalls whatever thread asked for it. `Schedule2D` / `Schedule3D`
hand the same work to the job system and return immediately.

This is what you want for chunk streaming: kick it off, carry on with the frame,
collect it later.

```csharp
// When a chunk is requested:
_dest = new NativeArray<float>(64 * 64 * 64, Allocator.Persistent);
_eval = graph.Schedule3D(_dest, new int3(64, 64, 64), offset, step, seed: 1337);

// A frame or two later, when you actually want the values:
if (_eval.IsCompleted) {
    var range = _eval.Complete();   // waits, frees its scratch, gives you the range
    BuildMesh(_dest);
}
```

Rules, and they're the same rules as a `NativeArray`:

- **Complete (or Dispose) each handle exactly once.** `Dispose()` just calls
  `Complete()`.
- **The destination array stays yours.** The handle never touches it. Don't read
  it before completing, and don't free it before then either, including when
  the thing that wanted it gets cancelled halfway through.
- **`IsCompleted` is a peek, not a wait.** You still have to call `Complete()`.
- **`eval.JobHandle` is a normal `JobHandle`**, so you can chain your own jobs
  onto it. Or pass `dependsOn` when you schedule, to run the noise after
  something else.

`Complete()` returns the same `FastNoise.OutputMinMax` the blocking calls give
you.

`Demo/Scripts/NoizyChunkStreamDemo.cs` is a full streaming example, including
what to do when a chunk is unloaded while its noise is still in flight.

## Sampling from other threads

`Evaluate2D` and friends are safe to call from any number of threads at once,
even when they all hit the same graph asset. This is the default. There's
nothing to switch on.

See [Threading and jobs](threading-and-jobs.md) for the details, the `Task.Run`
and `Parallel.For` examples, and how to use a graph inside a Burst job.

## Warming up

Two one-time costs happen the first time you use Noizy, and you can move both
off your critical path:

```csharp
// Compiles the graph now instead of inside your first Evaluate call.
// Worth doing on a loading screen if the first sample is time-sensitive.
graph.Warmup();
```

The native library's node metadata is warmed up for you automatically before the
first scene loads, so that one you don't need to think about. Full details in
[Performance](performance.md#startup-cost).

## Errors you might hit

| Message | What went wrong |
|---|---|
| `Cannot build tree: asset has no valid baked snapshot` | The graph was never saved. Open it and press `Ctrl+S` |
| `Tree is not valid` | You're evaluating a `NoizyTree` you already disposed |
| `Destination array is too small` | A `NativeArray` overload got a buffer smaller than `size.x * size.y (* size.z)` |
| `Destination array has not been allocated` | The `NativeArray` you passed was `default` / already disposed |
| `Position arrays must have the same length` | Your x / y / z arrays aren't the same size |
| `'<node>' node is missing a required '<input>' input` | A node in the graph has an unconnected Source. Fix it in the editor |
| `Cycle detected in noise graph at node '<name>'` | Something in the graph feeds back into itself |

More on all of these in [Troubleshooting](troubleshooting.md).

## Next

- [Threading and jobs](threading-and-jobs.md): background work, Burst, owning
  your own tree
- [Performance](performance.md): what costs what, and the eval modes
- [API reference](api-reference.md): every signature, in one list
