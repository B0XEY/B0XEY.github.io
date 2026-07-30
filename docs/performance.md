[← Back to Overview](README.md)

# Performance

What a graph costs, how to make it cheaper, and the tools for finding out where
the time is going.

Before anything else: keep your graphs small and split them up by job. See
[Many small graphs beat one big one](#many-small-graphs-beat-one-big-one).

## The one rule

Noizy compiles your graph just as you built it. Its cost is the cost of the
nodes in it. Nothing is optimised away for you, and nothing is folded or
removed behind your back.

So if a graph is too slow, the one way down is **fewer nodes or cheaper nodes**.

## Many small graphs beat one big one

A graph runs every node in it, for every sample. So one big graph that handles
mountains and swamp and desert runs the mountain nodes in the swamp, and the
swamp nodes in the desert. It has no idea which biome the point belongs to.

Give each biome its own graph instead. Keep each one as simple as that biome
needs, and pick which graph to sample in your own code, before you call
`Evaluate2D`. Every point then just pays for the nodes it uses. Where
two biomes meet, sampling both small graphs and blending the results is still
cheaper than running one graph that does everything everywhere.

Same goes for caves, ore, moisture, tree density. Separate graphs, sampled where
you need them.

Small graphs are easier to work on, too. You can retune one biome without
touching the others, and if a few of them need the same thing, put that part in
a [subgraph](subgraphs.md).

## What each node costs

Measured at **1024x1024, which is 1,048,576 samples per call**, on a single
thread, against a bare Perlin at 1.29 ms.

**Per sample** is that time divided by the 1,048,576 samples, in nanoseconds.
It's the number to multiply by when your grid is a different size: a 256x256
grid is 65,536 samples, so a Perlin over it costs about
`65,536 x 1.23 ns = 0.08 ms`.

| Node | Time | Per sample | Added over a Perlin |
|---|---|---|---|
| Perlin (baseline) | 1.29 ms | 1.23 ns | n/a |
| Value | 0.95 ms | 0.91 ns | cheaper than Perlin |
| Simplex | 1.53 ms | 1.46 ns | +0.23 ms |
| Super Simplex | 1.90 ms | 1.81 ns | +0.61 ms |
| Domain Scale | 1.44 ms | 1.37 ns | +0.14 ms |
| Terrace | 1.78 ms | 1.70 ns | +0.48 ms |
| Remap | 1.93 ms | 1.84 ns | +0.64 ms |
| Domain Warp Gradient | 2.84 ms | 2.71 ns | +1.54 ms |
| Pow Float | 3.49 ms | 3.33 ns | +2.20 ms |
| **Fractal FBm / Ridged, per octave** | n/a | **~1.34 ns each** | **~1.4 ms each** |
| Cellular Value / Distance | 6.10 ms | 5.82 ns | +4.80 ms |
| Cellular Lookup | 6.97 ms | 6.65 ns | +5.67 ms |

Per-sample cost holds steady across grid sizes, so it scales, but just down to a
point: below about 32k samples the per-call overhead starts to matter more than
the nodes do. See [Eval modes](#eval-modes).

Your numbers will differ. This is one machine, one SIMD level, one resolution.
The *ratios* are the useful part.

## Reading that list, in the order you should try things

1. **Drop an octave.** Fractals are linear in octave count at about 1.4 ms
   each, so they dominate almost every graph that has one. 8 octaves is
   11.25 ms where 3 is 4.38 ms. Most of the time, this is the whole answer.
2. **Reconsider Cellular.** It's the most expensive generator by a wide margin,
   about 4.7x a Perlin. Sometimes it's just what you need. Often a Value
   noise with a Terrace on it gets you close for a fifth of the cost.
3. **Swap the base generator.** Value is cheaper than Perlin, which is cheaper
   than Simplex, which is cheaper than Super Simplex.
4. **Delete what isn't earning its place.** An input left at a no-op value,
   like Add 0, Multiply by 1, or a Domain Scale of 1, still costs a full node on
   every single sample. Nothing removes it for you.

## What Noizy itself costs

Very little, and there isn't much left to squeeze.

- One P/Invoke per evaluation.
- **No allocation at all** when you reuse the destination buffer.
- The multi-threaded path pins your `float[]` and has the workers write
  straight into it. It doesn't stage a copy.
- Chunking a single-threaded evaluation into smaller native calls was measured
  and makes no difference. The generator is compute-bound, not memory-bound, so
  there's no win hiding on the C# side.

Which is the point of the section above: the cost is the graph.

## Eval modes

Every grid and scattered-point call takes a `NoizyEvalMode`, which controls
whether generation runs on one thread or gets split into slabs across the job
system's workers.

| Mode | What it does |
|---|---|
| **`auto`** (default) | Cuts the grid into one slab per worker thread, keeping each slab at 16k samples or more. Grids under about 32k samples (128x128) just run on one thread |
| **`forceParallel`** | Splits across threads regardless of how little work each slab ends up with. Used for benchmarking |
| **`forceSingle`** | Always one thread. Worth passing when you're already saturating the cores from your own parallel code and don't want Noizy competing for workers |

```csharp
float[] heights = graph.Evaluate2D(
    new int2(1024, 1024), float2.zero, new float2(0.1f), seed: 1337,
    out var range, mode: NoizyEvalMode.forceParallel);
```

`auto` is right almost every time. The thresholds exist because dispatching a
job costs more than splitting a small grid saves.

### Why slabs are big, not small

Slabs are sized by *work*, not by thread count, and `auto` aims for one slab per
worker.

Cutting a grid into more slabs than that, so the job system has spares to
load-balance with, was tried and measured slower. The native calls themselves
cost nothing extra, but the per-slab dispatch does, and it outweighs whatever
uneven slab timings it was meant to smooth out. Fewer, bigger slabs win.

The same finding sets two floors: a slab never gets less than about 16k samples,
and a grid smaller than about 32k samples doesn't go parallel at all. Both are
constants at the top of the scheduling section of `Core/NoizyEvaluator.cs` if
you want to retune them for your hardware. `forceParallel` ignores both.

### How grids get split

Slabs follow whichever axis has room:

- **2D:** rows, falling back to bands of columns within a row when a grid is
  wide and short.
- **3D:** z-planes, falling back to bands of rows within a plane.

Both fallbacks keep each slab a single contiguous run, so they cost no extra
copying. Without them, a 65536x2 grid would split just two ways, and a
256x256x1 volume wouldn't parallelize at all.

### Last-bit note

A slab generates with its own offset, so it computes `start * step + i * step`
where one big call accumulates `(start + i) * step`. Those come out different.

Which means the same graph at the same seed can differ between `forceSingle` and
`forceParallel` by around 1e-7, up to about 1e-6 on very wide grids, where the
offsets are largest. This has always been true of the parallel path. It's far
below the precision a heightmap or a texture stores, but the two modes are not
bit-identical, so don't build a checksum on it.

### Forcing one graph to always run parallel

If you've measured that a particular graph is much faster in parallel even at
the sizes you use, you can set that on the asset itself rather than passing the
mode at every call site.

Open **Window > Noizy > Graph Benchmark**, run it, and if parallel is at least
2x faster the **"Force this graph to always run in parallel"** tick box becomes
available. Turning it on makes every `auto` call on that graph behave as
`forceParallel`.

Explicit `forceSingle` calls still win. The setting just changes what `auto`
resolves to.

## The benchmark window

**Window > Noizy > Graph Benchmark**, or open it against a specific asset.

Pick a graph, a dimension (2D or 3D), a resolution, and an iteration count, then
**Run Benchmark**. It times `forceSingle` against `forceParallel` on your actual
machine and reports:

- ms per run for each
- mega-samples per second for each
- the measured speedup

It also tells you when parallel *isn't* paying off at that size, which is worth
seeing at least once. It's the reason `auto` keeps small grids on one thread.

3D always benchmarks a cube, so depth matches resolution. It asks you to confirm
before running very large 3D benchmarks, because those can run you out
of memory.

## Finding it in the Profiler

Noizy wraps its work in `ProfilerMarker`s, so noise shows up by name in the
Profiler timeline instead of as an anonymous native block. Nothing to turn on.

| Marker | What it covers |
|---|---|
| `Noizy.Evaluate2D` / `Noizy.Evaluate3D` | A blocking grid call, start to finish |
| `Noizy.EvaluatePositions2D` / `Noizy.EvaluatePositions3D` | A blocking scattered-point call |
| `Noizy.Schedule2D` / `Noizy.Schedule3D` | Handing a grid to the job system, not the generation itself |
| `Noizy.SchedulePositions2D` / `Noizy.SchedulePositions3D` | The same, for scattered points |
| `Noizy.EvalHandle.Complete` | Waiting on a scheduled handle |
| `Noizy.BuildTree` | Compiling a graph into a tree. See Startup cost below |

The markers sit on `NoizyEvaluator`, so they cover both the `NoizyAsset` calls
and your own `CreateTree()` sampling.

Work that runs on worker threads shows up under its job name
(`Grid2DSlabJob` and friends) on those threads' rows. That's why a
`Noizy.Schedule2D` marker is short even when the grid is huge. It just measures
the dispatch.

`SampleSingle2D` and `SampleSingle3D` are left unmarked on purpose. One point costs
about as little as a marker does, and a per-object placement loop would flood the
timeline with millions of them. Profile your own loop around it, or batch the
points into `EvaluatePositions2D`.

## Logging what ran

**Window > Noizy > Debug > Log Evaluations** toggles a console log for every grid
and scattered-point call: the size, the sample count, the mode you asked for, and
what it did.

```
[Noizy] Evaluate2D 1024x1024 = 1,048,576 samples | auto -> parallel across 8 slabs
[Noizy] Evaluate2D 64x64 = 4,096 samples | auto -> single-threaded
```

Useful for confirming that `auto` is making the choice you expected, and for
spotting a call you didn't know was happening. The setting is remembered between
sessions, so turn it back off when you're done.

## Startup cost

Two things happen once, and both can be moved off your critical path.

**Loading the native library's node metadata.** Done for you before the first scene loads
(`RuntimeInitializeOnLoadMethod(BeforeSceneLoad)`). You don't need to do
anything.

**Compiling a graph into a tree.** Happens on the first sample.
`graph.Warmup()` does it up front if the first thing you sample is
time-sensitive.

Most of that compile is already done before your game even runs. Saving a graph
in the editor expands its subgraphs and stores the flattened result on the
asset, so all the runtime has left is building the native nodes.

Graphs baked by an older version of Noizy have nothing stored and fall back to
doing the whole job on the first sample. Open and save them, or run
**Window > Noizy > Rebuild Compiled Graphs**, to get the faster path.

### The staleness check

The stored graph records a fingerprint of every subgraph that went into it. If
one of those changes without the parent being rebuilt, say a version control
revert, a reimported package, or an edit made while the parent wasn't loaded,
the fingerprints stop matching and the graph falls back to compiling itself
without telling you.

Output stays correct either way. You just pay the old cost until it's rebuilt.

## A checklist for when it's too slow

1. Turn on **Log Evaluations** and confirm you're calling it as often as you
   think you are. It's very often more.
2. Count the fractal octaves. Halve them and see if you can live with it.
3. Look for Cellular nodes.
4. Look for nodes doing nothing, like Multiply by 1 or Add 0.
5. Check you're reusing your `dest` buffer.
6. Check the grid size. 3D is `size` cubed; going from 32 to 64 is 8x the work,
   not 2x.
7. If it's on the main thread and it doesn't have to be, move it to
   [`Schedule2D`](threading-and-jobs.md).
8. Think about eval modes last.
