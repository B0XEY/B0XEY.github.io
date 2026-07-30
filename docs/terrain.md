[← Back to Overview](README.md)

# The terrain component

`NoizyTerrain` fills Unity `Terrain` heightmaps from a Noizy graph. No scripting
at all, and it works in the editor, so you can drag a slider and watch the hills
change.

## Setting it up

1. Make an empty GameObject.
2. Add the **Noizy Terrain** component to it.
3. Make your `Terrain` objects **children** of that GameObject. One child per
   tile. One is fine, nine is fine.
4. Drag a baked Noizy graph asset onto the **Asset** field.

The terrains fill in straight away. The Inspector tells you how many Terrain
children it found, and warns you if it found none or if no asset is assigned.

Position your terrain tiles in the world as normal. Noizy samples each one based
on where it sits, so neighbouring tiles line up on their own. There's
no seam to fix.

## The settings

| Field | What it does |
|---|---|
| **Asset** | The graph to sample. Has to be baked. |
| **Seed** | The noise seed. Change it for a whole new landscape. |
| **Step** | How much world one patch of noise covers. Bigger = bigger, smoother features. |
| **Offset** | Slides the whole landscape around in noise space, without moving anything in the scene. |
| **Height Scale** | How tall the hills are. See the note below. This number is smaller than you'd expect. |
| **Height Offset** | Where the flat "sea level" sits, from 0 (bottom of the terrain) to 1 (top). Default 0.5. |

### About Step

Step here is a zoom control, and it works the opposite way round to the `step`
argument in the [scripting API](scripting.md). Bigger numbers stretch the noise
out over more world, so features get **bigger and smoother**. Smaller numbers
pack more detail into the same terrain.

Under the hood, the spacing between samples is
`terrainWidth / (heightmapResolution - 1) / step`, and the world position is
divided by `step` too. That's what keeps tiles aligned no matter what you set it
to.

### About Height Scale

Terrain heights in Unity are normalised to 0..1, then multiplied by the
terrain's own **Height** setting in its Terrain Data. Noizy scales your noise
into that range with a small internal factor (`0.0025`), so:

```
normalised height = Height Offset + noiseValue * Height Scale * 0.0025
```

Most noise lands about in -1..1. So with the default **Height Offset** of
`0.5`, a **Height Scale** of about **200** uses the terrain's full height range.
The default of `0.5` is almost flat on purpose, so you don't get a wall of
spikes the moment you assign an asset.

Rule of thumb: start at `200` and go from there. Heights are clamped to 0..1, so
overshooting flattens the tops rather than breaking anything.

## Regenerating

- **Change any setting** and it regenerates right away.
- **Change a terrain's heightmap resolution** and it notices within a couple of
  seconds and re-samples that tile. Just in Edit mode.
- **The "Generate All Terrains" button** in the Inspector rebuilds every tile by
  hand. There's a matching **Generate All Terrains** entry on the component's
  context menu (the ⋮ button).

## At runtime

The automatic regeneration is an **edit-mode convenience**. In play mode and in
builds, `NoizyTerrain` doesn't re-sample on its own, which is what you want,
because writing a heightmap is not something you do every frame.

If you need to generate terrain at runtime, say a new seed each playthrough,
call it yourself:

```csharp
using Noizy.Core;
using UnityEngine;

public class RandomTerrainAtStart : MonoBehaviour {
    [SerializeField] private NoizyTerrain terrain;

    private void Start() {
        // Fills every Terrain child from the assigned graph, right now.
        // Do this on a loading screen, not mid-gameplay - SetHeights on a
        // large terrain is not cheap.
        terrain.GenerateAll();
    }
}
```

To change the seed at runtime you'd need your own component; the fields on
`NoizyTerrain` are serialised and set in the Inspector. For full control, sample
the graph yourself with [`Evaluate2D`](scripting.md) and call
`TerrainData.SetHeights`. That's all `NoizyTerrain` does anyway.

## Performance notes

Each tile costs one `Evaluate2D` at the terrain's heightmap resolution. A 513
heightmap is about 263k samples, a 1025 is about a million. Both are fine for a
one-off, and both are far too much to do every frame.

The noise buffer and the height buffer are reused between calls, so regenerating
the same set of tiles over and over doesn't churn through memory.

If the editor feels sluggish while you drag a slider, the fix is almost always
fewer fractal octaves in the graph, not a smaller terrain. See
[Performance](performance.md).

## Requirements

`NoizyTerrain` lives in `Noizy.Core` alongside the rest of the runtime API, so
Unity's Terrain module (`UnityEngine.TerrainModule`) is a core dependency of
Noizy rather than an optional extra. It's a built-in module and it's on by
default.
