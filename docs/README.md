<div class="docs-hero-head"><h1>Noizy</h1><div class="docs-hero-badges"><span class="docs-badge">Unity 6.4+</span><span class="docs-badge">Windows / macOS / Linux</span><span class="docs-badge">Powered by FastNoise2</span></div></div>

Noizy is a node-based noise generator for Unity. You build a graph in an editor
window, save it, and sample it from your scripts. The noise math comes from
[FastNoise2](https://github.com/Auburn/FastNoise2), so it's fast, and the editor
is built on the same GraphView system Unity uses for Shader Graph.

Already own Noizy? Welcome! These docs cover everything from your first
graph to the full runtime API. If something here doesn't match what you see,
check [Troubleshooting](troubleshooting.md) first. Just looking around? Feel
free to check out the docs and see if Noizy is a good fit for you before
picking it up on the Asset Store.

## The whole idea in three steps

<div class="docs-steps"><div class="docs-step"><span class="docs-step-num">1</span><div class="docs-step-body"><strong>Create a graph</strong><p>Right-click in the Project window, <code>Create &gt; Noizy &gt; Noizy Graph</code>.</p></div></div><div class="docs-step"><span class="docs-step-num">2</span><div class="docs-step-body"><strong>Wire it up</strong><p>Double-click it, wire up some nodes, press <code>Ctrl+S</code>.</p></div></div><div class="docs-step"><span class="docs-step-num">3</span><div class="docs-step-body"><strong>Sample it</strong><p>Call <code>Evaluate2D</code> on it from a script and you get an array of noise values.</p></div></div></div>

That's it. Everything else in these docs is for when you want more.

## Start here

<div class="docs-link-grid"><a class="docs-link-card" href="/noizy/docs/getting-started"><svg class="docs-link-card-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V3"/><path d="M4 4h13l-2.5 4L17 12H4"/></svg><span class="docs-link-card-title">Getting started</span><span class="docs-link-card-desc">Install, requirements, your first graph, your first script</span></a><a class="docs-link-card" href="/noizy/docs/graph-editor"><svg class="docs-link-card-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="12" r="2"/><line x1="8" y1="6" x2="16" y2="11"/><line x1="8" y1="18" x2="16" y2="13"/></svg><span class="docs-link-card-title">The graph editor</span><span class="docs-link-card-desc">The window, the toolbar, shortcuts, previews, saving</span></a><a class="docs-link-card" href="/noizy/docs/nodes"><svg class="docs-link-card-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg><span class="docs-link-card-title">Nodes</span><span class="docs-link-card-desc">Every node type, what it does, and which ones to reach for</span></a><a class="docs-link-card" href="/noizy/docs/subgraphs"><svg class="docs-link-card-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg><span class="docs-link-card-title">Subgraphs</span><span class="docs-link-card-desc">Reusing a chunk of a graph in other graphs</span></a></div>

## Using it in your game

<div class="docs-link-grid"><a class="docs-link-card" href="/noizy/docs/scripting"><svg class="docs-link-card-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 6 22 12 16 18"/><polyline points="8 18 2 12 8 6"/></svg><span class="docs-link-card-title">Scripting</span><span class="docs-link-card-desc">The full runtime API: grids, single points, scattered points, buffers</span></a><a class="docs-link-card" href="/noizy/docs/threading-and-jobs"><svg class="docs-link-card-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="2"/><line x1="6" y1="2" x2="6" y2="6"/><line x1="18" y1="2" x2="18" y2="6"/><line x1="6" y1="18" x2="6" y2="22"/><line x1="18" y1="18" x2="18" y2="22"/><line x1="2" y1="6" x2="6" y2="6"/><line x1="2" y1="18" x2="6" y2="18"/><line x1="18" y1="6" x2="22" y2="6"/><line x1="18" y1="18" x2="22" y2="18"/></svg><span class="docs-link-card-title">Threading and jobs</span><span class="docs-link-card-desc">Background threads, Schedule2D, Burst, owning your own tree</span></a><a class="docs-link-card" href="/noizy/docs/performance"><svg class="docs-link-card-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg><span class="docs-link-card-title">Performance</span><span class="docs-link-card-desc">What each node costs, eval modes, the benchmark window, the Profiler</span></a></div>

## Tools that need no code

<div class="docs-link-grid"><a class="docs-link-card" href="/noizy/docs/terrain"><svg class="docs-link-card-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20 9 8l4 6 3-4 5 10z"/></svg><span class="docs-link-card-title">Terrain component</span><span class="docs-link-card-desc">Fill Unity terrains from a graph, in the editor, with zero scripting</span></a><a class="docs-link-card" href="/noizy/docs/texture-export"><svg class="docs-link-card-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg><span class="docs-link-card-title">Texture export</span><span class="docs-link-card-desc">Bake a graph to a Texture2D, Texture3D, PNG or EXR</span></a></div>

## Reference

<div class="docs-link-grid"><a class="docs-link-card" href="/noizy/docs/api-reference"><svg class="docs-link-card-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg><span class="docs-link-card-title">API reference</span><span class="docs-link-card-desc">Every public method, in one place, for quick lookup</span></a><a class="docs-link-card" href="/noizy/docs/examples"><svg class="docs-link-card-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polygon points="10 8 16 12 10 16"/></svg><span class="docs-link-card-title">Examples and demos</span><span class="docs-link-card-desc">The demo scene, the demo scripts, the example graphs</span></a><a class="docs-link-card" href="/noizy/docs/troubleshooting"><svg class="docs-link-card-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg><span class="docs-link-card-title">Troubleshooting</span><span class="docs-link-card-desc">Errors, warnings, and the "why is it doing that" list</span></a><a class="docs-link-card" href="/noizy/docs/license-and-support"><svg class="docs-link-card-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><span class="docs-link-card-title">License and support</span><span class="docs-link-card-desc">What you can do with it, and where to get help</span></a></div>

## Quick start, if you'd rather just read code

```csharp
using Noizy.Core;
using Unity.Mathematics;
using UnityEngine;

public class Example : MonoBehaviour {
    // Drag a saved Noizy graph asset onto this field in the Inspector.
    [SerializeField] private NoizyAsset noise;

    // Kept as a field so we reuse the same array every frame instead of
    // making a new one.
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
- Any render pipeline. Just the demo scene's materials care, and there's a
  Built-in package included for that. See [Examples and demos](examples.md).
