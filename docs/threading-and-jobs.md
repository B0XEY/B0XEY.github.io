[← Back to the index](README.md)

# Threading and jobs

Sampling a graph from background threads, using it with the job system, and
taking ownership of a compiled graph yourself.

None of this needs turning on. Threaded sampling is the default behaviour.

## The short version

**You can call `Evaluate2D` / `Evaluate3D` from any thread, at any time, on any
number of threads at once, including the same graph asset from all of them.**

A common case: several chunk streamers all sampling one shared biome graph from
background jobs. That just works.

## Why it works

The first time you sample a graph, Noizy compiles it into a `NoizyTree` and
keeps it on the asset. Every caller shares that one tree.

A compiled tree holds only the graph's configuration. Generating from it reads
that configuration and writes nothing back, so any number of threads can sample
the same tree at the same time with nothing to coordinate. It's the same reason
the parallel path inside a single `Evaluate2D` can hand one tree to every
worker.

- The tree is built **once per asset**, not once per thread.
- Only that first build takes a lock. Two threads racing to be first just means
  one waits for the other rather than both building.
- Once the tree exists, reads of it are lock-free. Sampling threads never queue
  behind each other.
- `Warmup()` does the build up front if you'd rather not pay for it inside your
  first sample.

**The one thing to watch:** re-baking a graph (saving it in the editor) or
disabling the asset frees that tree. Make sure any background work still
sampling it has finished first.

## Example: one chunk in the background

```csharp
using System.Threading.Tasks;
using Noizy.Core;
using Unity.Mathematics;

public async Task<float[]> GenerateChunkAsync(NoizyAsset terrain, int3 corner, int size, int seed) {
    // Runs on a ThreadPool worker. Nothing special is needed here - it's the
    // same call you'd make on the main thread.
    return await Task.Run(() =>
        terrain.Evaluate3D(new int3(size), corner, new float3(1f), seed, out _));
}
```

## Example: lots of chunks at once

Several tasks sampling the same graph at the same time, like streaming chunks
around a player. They share one compiled tree, so they never block each other.

```csharp
var tasks = new List<Task<float[]>>();
foreach (var corner in pendingChunkCorners) {
    var c = corner;   // capture per iteration, or every task gets the last one
    tasks.Add(Task.Run(() =>
        terrain.Evaluate3D(new int3(32), c, new float3(1f), seed, out _)));
}
var results = await Task.WhenAll(tasks);
```

## Example: `Parallel.For`

Same idea without the `Task` bookkeeping. Good for batch-generating a lot of
tiles up front, like baking a heightmap atlas on a loading screen.

```csharp
using System.Threading.Tasks;

var tiles = new float[tileCount][];
Parallel.For(0, tileCount, i => {
    var offset = new float2(i * tileSize, 0);
    // Each iteration gets its own result array, so nothing is shared but the graph.
    tiles[i] = heightGraph.Evaluate2D(new int2(tileSize, tileSize), offset,
                                      new float2(1f), seed, out _);
});
```

## Two different kinds of "parallel"

Worth separating, because they're easy to mix up:

- **`NoizyEvalMode`** splits *one* call across cores. One `Evaluate2D`, several
  workers, all filling different rows of the same grid. Covered in
  [Performance](performance.md#eval-modes).
- **This page** is about *many independent callers* each making their own call
  at the same time.

They stack, but you usually don't want them to. If you're already saturating
every core with your own parallel code, pass `NoizyEvalMode.forceSingle` so
Noizy doesn't compete with you for workers.

## Noizy and Burst

`NoizyAsset` is a managed `ScriptableObject`, so you can't touch it inside a
Burst-compiled job. Two ways round that.

### Option 1: generate into a NativeArray, then hand that to Burst

Simplest, and right for most cases. Use the `NativeArray<float>` overload so
there's no `float[]` to copy across.

```csharp
using var densities = new NativeArray<float>(size * size * size, Allocator.TempJob);

// Main thread (or a background thread) fills the array.
terrain.Evaluate3D(densities, new int3(size), corner, new float3(1f), seed, out _);

// Your Burst job only ever sees the NativeArray.
new MyBurstMeshingJob { Densities = densities }.Schedule().Complete();
```

Better still, `Schedule3D` the noise and make your job depend on its
`JobHandle`, so the two run back to back on worker threads and the main thread
never waits in between:

```csharp
var noise = terrain.Schedule3D(densities, new int3(size), corner, new float3(1f), seed);

// Our meshing job starts as soon as the noise job finishes.
var meshing = new MyBurstMeshingJob { Densities = densities }
    .Schedule(noise.JobHandle);

meshing.Complete();
noise.Complete();   // still has to happen exactly once
```

### Option 2: sample from inside the job

`NoizyTree` is a small blittable struct. You can pass it into a Burst job by
value and call it directly, with no array to copy.

```csharp
using Noizy.Core;
using Unity.Burst;
using Unity.Collections;
using Unity.Jobs;
using Unity.Mathematics;

[BurstCompile]
private struct SampleNoiseJob : IJob {
    public NoizyTree Tree;                 // passed by value, safe
    public NativeArray<float> Dest;

    public void Execute() {
        Tree.GenUniformGrid2D(Dest, float2.zero, new int2(64, 64),
                              new float2(1f), 1337, out _);
    }
}

// Main thread: get a tree and hand it to the job.
var job = new SampleNoiseJob { Tree = terrain.CreateTree(), Dest = dest };
job.Schedule().Complete();
// Dispose that tree once the job - and anything else using it - is done.
```

## Owning your own tree: `CreateTree()`

`NoizyAsset.CreateTree()` gives you a fresh, independent `NoizyTree` built from
the baked graph. It isn't tied to the asset's shared cache, and **you own it**,
so you dispose it.

Most projects never need this. It exists for callers who want full control of
when a tree is compiled and freed, or who want one to pass into a Burst job.

```csharp
using System;
using Noizy.Core;
using Unity.Mathematics;

public sealed class ChunkStreamer : IDisposable {
    private readonly NoizyTree _tree;

    public ChunkStreamer(NoizyAsset graph) {
        // Compiled once, up front, owned solely by this object.
        _tree = graph.CreateTree();
    }

    public float[] EvaluateChunk(int3 size, float3 offset, float3 step, int seed) {
        // NoizyEvaluator has the same methods as NoizyAsset, but takes a tree.
        return NoizyEvaluator.Evaluate3D(_tree, size, offset, step, seed, out _);
    }

    public void Dispose() => _tree.Dispose();
}
```

Things to know:

- The tree stays valid until you `Dispose()` it. Don't dispose it while a
  scheduled job might still be using it.
- Dispose it exactly once. Disposing twice is a double free.
- `NoizyEvaluator` is the static, tree-taking version of everything on
  `NoizyAsset`: `Evaluate2D`, `Schedule3D`, `EvaluatePositions2D`, all of it.
- `NoizyTree` also has the raw generation methods on it directly
  (`GenSingle2D`, `GenUniformGrid2D`, `GenTileable2D`, `GenPositionArray3D`).
  Those are the thin wrappers over the native calls, with no eval-mode logic.
- Trees built with `CreateTree()` are **not** freed when the asset is re-baked
  or disabled, because they aren't the asset's. That's the point, and it's also
  your responsibility.

## A note on jobs vs. just calling it

A single `Schedule().Complete()` is always a bit slower than calling
`Evaluate2D` directly. The native work is identical, you've just added
scheduling overhead.

Jobs win when you actually go parallel, splitting the grid into slabs so all
cores work at once. Which is exactly what `Evaluate2D` / `Evaluate3D` already do for
you with `NoizyEvalMode.auto`, and what `Schedule2D` / `Schedule3D` do without
blocking.

So: write your own job when you need noise interleaved with your own Burst work.
Otherwise reach for `Evaluate2D` when you want the values now, and `Schedule2D`
when you don't.
