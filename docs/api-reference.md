[← Back to the index](README.md)

# API reference

Every public thing in `Noizy.Core`, in one list, for when you know what you want
and just need the signature.

If you want the explanations instead, go to [Scripting](scripting.md) and
[Threading and jobs](threading-and-jobs.md).

```csharp
using Noizy.Core;
```

---

## NoizyAsset

`ScriptableObject`. A saved noise graph you can sample. This is the type you put
on a `[SerializeField]`.

Created with **Create > Noizy > Noizy Graph**.

### Grids

```csharp
float[] Evaluate2D(int2 size, float2 offset, float2 step, int seed,
                   out FastNoise.OutputMinMax range,
                   float[] dest = null,
                   NoizyEvalMode mode = NoizyEvalMode.auto);

float[] Evaluate3D(int3 size, float3 offset, float3 step, int seed,
                   out FastNoise.OutputMinMax range,
                   float[] dest = null,
                   NoizyEvalMode mode = NoizyEvalMode.auto);

void Evaluate2D(NativeArray<float> dest, int2 size, float2 offset, float2 step,
                int seed, out FastNoise.OutputMinMax range,
                NoizyEvalMode mode = NoizyEvalMode.auto);

void Evaluate3D(NativeArray<float> dest, int3 size, float3 offset, float3 step,
                int seed, out FastNoise.OutputMinMax range,
                NoizyEvalMode mode = NoizyEvalMode.auto);
```

Returns / fills row-major: `index = x + y * size.x (+ z * size.x * size.y)`.
The `float[]` versions reuse `dest` when it's big enough, so the array you get
back can be longer than the grid.

### Grids, without blocking

```csharp
NoizyEvalHandle Schedule2D(NativeArray<float> dest, int2 size, float2 offset,
                           float2 step, int seed,
                           NoizyEvalMode mode = NoizyEvalMode.auto,
                           JobHandle dependsOn = default);

NoizyEvalHandle Schedule3D(NativeArray<float> dest, int3 size, float3 offset,
                           float3 step, int seed,
                           NoizyEvalMode mode = NoizyEvalMode.auto,
                           JobHandle dependsOn = default);
```

### Single points

```csharp
float SampleSingle2D(float2 pos, int seed);
float SampleSingle3D(float3 pos, int seed);
```

### Scattered points

```csharp
float[] EvaluatePositions2D(float[] xPositions, float[] yPositions,
                            float2 offset, int seed,
                            float[] dest = null,
                            NoizyEvalMode mode = NoizyEvalMode.auto);

float[] EvaluatePositions3D(float[] xPositions, float[] yPositions, float[] zPositions,
                            float3 offset, int seed,
                            float[] dest = null,
                            NoizyEvalMode mode = NoizyEvalMode.auto);

void EvaluatePositions2D(NativeArray<float> dest,
                         NativeArray<float> xPositions, NativeArray<float> yPositions,
                         float2 offset, int seed,
                         out FastNoise.OutputMinMax range,
                         NoizyEvalMode mode = NoizyEvalMode.auto);

void EvaluatePositions3D(NativeArray<float> dest,
                         NativeArray<float> xPositions, NativeArray<float> yPositions,
                         NativeArray<float> zPositions,
                         float3 offset, int seed,
                         out FastNoise.OutputMinMax range,
                         NoizyEvalMode mode = NoizyEvalMode.auto);

NoizyEvalHandle SchedulePositions2D(NativeArray<float> dest,
                                    NativeArray<float> xPositions, NativeArray<float> yPositions,
                                    float2 offset, int seed,
                                    NoizyEvalMode mode = NoizyEvalMode.auto,
                                    JobHandle dependsOn = default);

NoizyEvalHandle SchedulePositions3D(NativeArray<float> dest,
                                    NativeArray<float> xPositions, NativeArray<float> yPositions,
                                    NativeArray<float> zPositions,
                                    float3 offset, int seed,
                                    NoizyEvalMode mode = NoizyEvalMode.auto,
                                    JobHandle dependsOn = default);
```

Note: the `float[]` position overloads don't hand back a range. The
`NativeArray` ones do.

### Lifetime and settings

```csharp
void Warmup();                 // compile the tree now, not on the first sample
NoizyTree CreateTree();        // a new tree you own and must dispose

bool ForceParallelEval { get; }        // does auto behave as forceParallel?
void SetForceParallelEval(bool value); // set by the Graph Benchmark window
```

Inherited from `NoizyGraphAsset`:

```csharp
NoizySnapshotBake Snapshot { get; }
IReadOnlyList<NodeLayoutEntry> NodeLayouts { get; }
IReadOnlyList<RerouteNodeSave> RerouteNodes { get; }
IReadOnlyList<RerouteEdgeSave> RerouteEdges { get; }
Gradient PreviewGradient { get; }

void SetBake(NoizySnapshotBake snap);   // also frees the cached tree
void SetNodeLayouts(List<NodeLayoutEntry> layouts);
void SetReroutes(List<RerouteNodeSave> nodes, List<RerouteEdgeSave> edges);
void SetPreviewGradient(Gradient gradient);
```

The setters are what the editor uses when it saves. You almost certainly don't
want to call them yourself.

---

## NoizySubgraph

`ScriptableObject`, derives from `NoizyGraphAsset`. Adds nothing of its own. A
subgraph has no `Evaluate` methods, because it only exists to be referenced from
another graph.

Created with **Create > Noizy > Noizy Subgraph**. See [Subgraphs](subgraphs.md).

---

## NoizyEvalMode

```csharp
enum NoizyEvalMode {
    auto,           // split across cores when the grid is big enough. The default
    forceParallel,  // always split, however small
    forceSingle     // always one thread
}
```

---

## NoizyEvalHandle

`struct`, `IDisposable`. What `Schedule*` gives you back.

```csharp
JobHandle JobHandle;                   // public field - chain your own jobs onto it
bool IsCompleted { get; }              // a peek, not a wait
FastNoise.OutputMinMax Complete();     // waits, frees scratch, returns the range
void Dispose();                        // calls Complete()
```

Complete or dispose exactly once, same as a `NativeArray`.

---

## NoizyTree

`readonly struct`, `IDisposable`. A compiled, ready-to-sample graph. Blittable,
so it's safe to pass into a Burst job by value.

Get one from `NoizyAsset.CreateTree()`. You own it, so you dispose it.

```csharp
bool IsCreated { get; }
void Dispose();

float GenSingle2D(float2 pos, int seed);
float GenSingle3D(float3 pos, int seed);
```

### NativeArray versions (Burst-safe)

```csharp
void GenUniformGrid2D(NativeArray<float> dest, float2 offset, int2 count,
                      float2 step, int seed, out FastNoise.OutputMinMax range);

void GenUniformGrid3D(NativeArray<float> dest, float3 offset, int3 count,
                      float3 step, int seed, out FastNoise.OutputMinMax range);

void GenPositionArray2D(NativeArray<float> dest,
                        NativeArray<float> xPosArray, NativeArray<float> yPosArray,
                        float2 offset, int seed, out FastNoise.OutputMinMax range);

void GenPositionArray3D(NativeArray<float> dest,
                        NativeArray<float> xPosArray, NativeArray<float> yPosArray,
                        NativeArray<float> zPosArray,
                        float3 offset, int seed, out FastNoise.OutputMinMax range);
```

### Span versions

```csharp
FastNoise.OutputMinMax GenUniformGrid2D(Span<float> noiseOut,
    float xOffset, float yOffset, int xCount, int yCount,
    float xStepSize, float yStepSize, int seed);

FastNoise.OutputMinMax GenUniformGrid3D(Span<float> noiseOut,
    float xOffset, float yOffset, float zOffset,
    int xCount, int yCount, int zCount,
    float xStepSize, float yStepSize, float zStepSize, int seed);

FastNoise.OutputMinMax GenTileable2D(Span<float> noiseOut,
    int xSize, int ySize, float xStepSize, float yStepSize, int seed);

FastNoise.OutputMinMax GenPositionArray2D(Span<float> noiseOut,
    ReadOnlySpan<float> xPosArray, ReadOnlySpan<float> yPosArray,
    float xOffset, float yOffset, int seed);

FastNoise.OutputMinMax GenPositionArray3D(Span<float> noiseOut,
    ReadOnlySpan<float> xPosArray, ReadOnlySpan<float> yPosArray, ReadOnlySpan<float> zPosArray,
    float xOffset, float yOffset, float zOffset, int seed);
```

`GenTileable2D` is the seamless generator the [texture exporter](texture-export.md)
uses. There's no 3D equivalent, because FastNoise2 doesn't have one.

---

## NoizyEvaluator

`static class`. The same methods as `NoizyAsset`, but taking a `NoizyTree`
instead of building one for you. Use it with `CreateTree()`.

```csharp
static bool LogEvaluations;   // toggled by Window > Noizy > Debug > Log Evaluations

static NoizyTree BuildTree(NoizySnapshotBake snapshot, string rootNodeId);

static float[] Evaluate2D(NoizyTree tree, int2 size, float2 offset, float2 step,
                          int seed, out FastNoise.OutputMinMax range,
                          float[] dest = null,
                          NoizyEvalMode mode = NoizyEvalMode.auto);
// ...and Evaluate3D, the NativeArray overloads, Schedule2D/3D,
//    SampleSingle2D/3D, EvaluatePositions2D/3D, SchedulePositions2D/3D,
//    all with a NoizyTree as the first argument.
```

The profiler markers live here, so they cover both these calls and the
`NoizyAsset` ones.

---

## NoizyTerrain

`MonoBehaviour`, `[ExecuteAlways]`. Fills Unity `Terrain` heightmaps from a
graph. See [Terrain component](terrain.md).

```csharp
[ContextMenu("Generate All Terrains")]
void GenerateAll();     // re-sample every Terrain child, right now
```

Everything else is `[SerializeField]` and set in the Inspector: **Asset**,
**Seed**, **Step**, **Offset**, **Height Scale**, **Height Offset**.

---

## FastNoise.OutputMinMax

`struct`. The range every grid call hands back.

```csharp
float Min;
float Max;
void Merge(OutputMinMax other);
```

---

## Supporting types

You'll rarely touch these directly, but they're public.

| Type | What it is |
|---|---|
| `NoizyGraphAsset` | Abstract base of `NoizyAsset` and `NoizySubgraph`. Holds the saved graph data |
| `NoizySnapshotBake` | The saved form of a graph: an output node id plus a list of nodes. `IsValid` tells you whether it's been baked |
| `NoizyNodeEntry` | One node in a baked graph: its id, its type name, and its parameter values |
| `NoizyGraphValidator` | `ValidateNoCycles(NoizySnapshotBake)`. Throws with the offending node's name |
| `NoizyPrecompiler` | `TryPrecompile(NoizySnapshotBake, out string error)`. Expands subgraphs ahead of time |
| `NoizyGradientDefaults` | `BlackToWhite()`. The default preview and export gradient |
| `NoizyReloadGuard` | Editor only. Register a cleanup callback to run before Unity reloads scripts |
| `NodeLayoutEntry`, `RerouteNodeSave`, `RerouteEdgeSave`, `StringFloatPair` and friends | Small serialisable structs the editor uses to save graph state |

---

## Exceptions

| Exception | Thrown when |
|---|---|
| `InvalidOperationException` | The graph hasn't been baked, the graph has a cycle, a node is missing a required input, or a subgraph is unassigned / contains itself |
| `ArgumentException` | A tree isn't valid, a destination buffer is too small or unallocated, or position arrays are different lengths |

All Noizy messages are prefixed `[Noizy]`, so they're easy to filter for in the
console.
