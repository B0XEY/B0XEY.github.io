[← Back to the index](README.md)

# Getting started

Everything you need to go from a fresh import to noise in your game. Should take
about five minutes.

## What you need first

- **Unity 6.4 or newer.** Noizy uses editor APIs that don't exist before that,
  so older versions won't compile it.
- **Windows x64, macOS, or Linux x64** as your build target. The noise itself
  runs in a native library, and those are the builds that ship with it.

Noizy also uses three Unity packages. Most projects already have all three, and
Unity will pull them in if you don't:

| Package | Used for |
|---|---|
| `com.unity.mathematics` | `int2` / `int3` / `float2` / `float3` in the API |
| `com.unity.collections` | `NativeArray<float>` for the job and Burst paths |
| `com.unity.burst` | The multi-threaded grid jobs |

## Installing

Import Noizy from the Package Manager like any other Asset Store purchase. It
lands in `Assets/Plugins/Noizy/`.

Two things worth doing right after:

- **On the Built-in Render Pipeline**, double-click
  `Assets/Plugins/Noizy/Built-In.unitypackage` and import it. That swaps the
  demo scene's materials for Built-in versions so the demo renders properly. If
  you're on URP you can skip this. Either way, noise generation itself doesn't
  care what pipeline you use.
- **Open `Demo/Scene/DemoScene.unity`** and press play, just to confirm the
  native library loaded on your machine. If you see noise scrolling on a plane,
  you're good.

## Making your first graph

Right-click in the Project window and pick **Create > Noizy > Noizy Graph**.
Name it something. Double-click it and the graph editor opens.

The canvas starts with one node on it: **Output**. That's the end of the graph.
Whatever you wire into it is what your graph produces. You can't delete it.

Now add a generator:

1. Press `Space` (or right-click) to open the node search.
2. Type `perlin` and hit enter.
3. Drag from the Perlin node's **Out** port to the Output node's input.

The Output node's preview fills in. You just made a noise graph.

Try adding a fractal on top, because a bare Perlin is rarely what you want:

1. `Space`, search `fbm`, add **Fractal FBm**.
2. Wire **Perlin → Fractal FBm's Source** input.
3. Wire **Fractal FBm → Output**.
4. Set **Octaves** to 4 and watch the preview get more detailed.

Press `Ctrl+S`. That saves and bakes the graph onto the asset. Until you do
that, the asset has nothing in it and scripts can't sample it.

There's a small dot in the top-right of the toolbar. Green means saved, red
means you have unsaved edits.

## Sampling it from a script

Make a new script, put it on a GameObject, and drag your graph asset onto the
`noise` field.

```csharp
using Noizy.Core;
using Unity.Mathematics;
using UnityEngine;

public class NoiseTest : MonoBehaviour {
    [SerializeField] private NoizyAsset noise;

    private void Start() {
        // Ask for a 64x64 grid of values.
        // 'out var range' hands back the lowest and highest values in one go,
        // which saves you looping over the results to find them yourself.
        float[] values = noise.Evaluate2D(
            size:   new int2(64, 64),
            offset: float2.zero,
            step:   new float2(0.05f),
            seed:   1337,
            range:  out var range);

        // Values are laid out row by row: index = x + y * width.
        Debug.Log($"Middle value: {values[32 + 32 * 64]}");
        Debug.Log($"Range: {range.Min} to {range.Max}");
    }
}
```

Press play and you should see two lines in the console.

## The four arguments that actually matter

Every call takes the same four ideas, so once you have these you have the whole
API.

| Argument | What it means | If you change it |
|---|---|---|
| `size` | How many samples along each axis | More samples = more detail and more work |
| `offset` | Where in the noise you start reading | Slide this to scroll or to place a chunk |
| `step` | The distance between samples | Smaller = zoomed in, bigger = zoomed out |
| `seed` | The noise seed | Same seed = same noise, every time, on every machine |

`step` is the one people get wrong first. It is *not* a scale on the output. It
controls how far you move through the noise between one sample and the next. A
step of `1.0` on a 256-wide grid reads a 256-unit-wide patch of noise. A step of
`0.01` reads a 2.56-unit-wide patch, so you get a much smoother, more zoomed-in
result.

## Where to go next

- Want to understand the editor properly? → [The graph editor](graph-editor.md)
- Want to know what all those nodes do? → [Nodes](nodes.md)
- Want a heightmap with no scripting? → [Terrain component](terrain.md)
- Want a texture out of it? → [Texture export](texture-export.md)
- Ready to build something real? → [Scripting](scripting.md)
