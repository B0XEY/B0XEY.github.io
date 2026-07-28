# Noizy

Noizy is a node-based noise generator for Unity. You build a graph in an editor
window, save it, and sample it from your scripts. The noise math comes from
[FastNoise2](https://github.com/Auburn/FastNoise2), so it's fast, and the editor
is built on the same GraphView system Unity uses for Shader Graph.

Noizy is a paid asset on the Unity Asset Store. These docs are for people who
already own it. If something here doesn't match what you see, check
[Troubleshooting](troubleshooting.md) first.

## The whole idea in three steps

1. Right-click in the Project window, **Create > Noizy > Noizy Graph**.
2. Double-click it, wire up some nodes, press `Ctrl+S`.
3. Call `Evaluate2D` on it from a script and you get an array of noise values.

That's it. Everything else in these docs is for when you want more.

## Start here

| Page | What's in it |
|---|---|
| [Getting started](getting-started.md) | Install, requirements, your first graph, your first script |
| [The graph editor](graph-editor.md) | The window, the toolbar, shortcuts, previews, saving |
| [Nodes](nodes.md) | Every node type, what it does, and which ones to reach for |
| [Subgraphs](subgraphs.md) | Reusing a chunk of a graph in other graphs |

## Using it in your game

| Page | What's in it |
|---|---|
| [Scripting](scripting.md) | The full runtime API: grids, single points, scattered points, buffers |
| [Threading and jobs](threading-and-jobs.md) | Background threads, `Schedule2D`, Burst, owning your own tree |
| [Performance](performance.md) | What each node costs, eval modes, the benchmark window, the Profiler |

## Tools that need no code

| Page | What's in it |
|---|---|
| [Terrain component](terrain.md) | Fill Unity terrains from a graph, in the editor, with zero scripting |
| [Texture export](texture-export.md) | Bake a graph to a Texture2D, Texture3D, PNG or EXR |

## Reference

| Page | What's in it |
|---|---|
| [API reference](api-reference.md) | Every public method, in one place, for quick lookup |
| [Examples and demos](examples.md) | The demo scene, the demo scripts, the example graphs |
| [Troubleshooting](troubleshooting.md) | Errors, warnings, and the "why is it doing that" list |
| [License and support](license-and-support.md) | What you can do with it, and where to get help |

## Quick start, if you'd rather just read code

```csharp
using Noizy.Core;
using Unity.Mathematics;
using UnityEngine;

public class Example : MonoBehaviour {
    // Drag a saved Noizy graph asset onto this field in the Inspector.
    [SerializeField] private NoizyAsset noise;

    // Kept as a field so we reuse the same array every frame instead of
    // making a new one. This is the difference between smooth and stuttery.
    private float[] _buffer;

    private void Update() {
        _buffer = noise.Evaluate2D(
            size:   new int2(256, 256),   // one value per cell of a 256x256 grid
            offset: float2.zero,          // where in the noise we start reading
            step:   new float2(0.05f),    // how far apart the samples are
            seed:   1337,
            range:  out var range,        // the lowest and highest values we got
            dest:   _buffer);             // reused, so this doesn't allocate

        // _buffer[x + y * 256] is the value at that cell.
        // range.Min / range.Max save you a second pass to find the range yourself.
    }
}
```

## What you need

- **Unity 6.4 or newer.** Older editors are not supported.
- **Windows x64, macOS (Intel and Apple Silicon), or Linux x64.** Noise runs
  through native FastNoise2 binaries, so those are the platforms it covers.
  Building for anything else leaves Noizy out of the build instead of failing it.
- Any render pipeline. Only the demo scene's materials care, and there's a
  Built-in package included for that. See [Examples and demos](examples.md).
