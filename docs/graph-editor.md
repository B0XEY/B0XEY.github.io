[← Back to Overview](README.md)

# The graph editor

The window where you build noise. Open it by double-clicking any Noizy graph
asset, or from **Window > Noizy > Open Editor**.

If you open it with nothing selected you get a "No Graph Open" overlay. Pick a
graph asset and it loads.

## The canvas

Standard Unity graph controls, in case you haven't used one before:

- **Middle-drag** or **Alt+drag** to pan.
- **Scroll** to zoom.
- **Left-drag on empty space** to box-select.
- **Drag a node** to move it. Drag a port to a port to connect them.

Every node has one **Out** port on the right. Inputs are on the left. Green
means a noise connection.

## Adding nodes

Press `Space` or right-click to open the node search. Type part of a node's name
and hit enter. The node lands where your mouse was.

Two shortcuts worth knowing:

- **Drag a wire out of a port and drop it on empty space.** The search opens,
  and whatever node you pick gets connected on its own.
- **Drag a Noizy Subgraph asset from the Project window onto the canvas.** It
  becomes a node, already pointed at that subgraph. See
  [Subgraphs](subgraphs.md).

## The Output node

Every graph has just one **Output** node and you can't delete it. Whatever
you wire into it is what the graph produces.

It shows a live preview of the final result, so there's no separate preview node
to add. Every other node shows its own preview too, which is the fastest way to
work out what a node is doing to your noise.

## Node fields

Nodes come up on FastNoise2's own defaults, and the fields take the same values
the library takes. A few notes:

- **Octaves** on the fractal and fractal domain-warp nodes is floored at 1. A
  fractal with zero octaves has nothing to add up. That floor is applied both to
  the field you see and to the graph when it's compiled, so a node always
  generates what it's showing you.
- **Seed Offset** starts at 0 and is free to go negative.
- **Cellular Distance's Distance Index 0** and **Cellular Value's Value Index**
  both start at 0.
- Hover a field or a port name to get FastNoise2's own description of it in a
  tooltip. Names are shortened to fit the node, so the tooltip has the full one.

### Fields that are also ports

Some inputs on the blend and operator nodes (Add, Multiply, Min, and so on) can
take either a number or another node. Those show a port *and* a small
`↳ const` field underneath.

Leave the port empty and it uses the number. Plug something in and the number
field hides itself, because it's no longer being used. Unplug it and the field
comes back with your old value still in it.

## Reroute nodes

Wires get messy. **Double-click any wire** to drop a reroute node into it, a
small pass-through you can drag around to keep the layout tidy. Reroutes don't
change the noise at all and don't cost anything at runtime.

Delete a reroute and the connection heals itself: whatever was feeding it gets
wired straight to whatever it was feeding. Delete a whole chain of them and it
still works out the right endpoints.

## Saving

`Ctrl+S` (or `Cmd+S`) saves. So does the **Save** button in the toolbar.

Saving does three things:

1. Checks the graph for cycles, and refuses to save with a clear error naming
   the node if it finds one.
2. Bakes the graph onto the asset. This is what your scripts read.
3. Pre-compiles it. This expands any subgraphs and stores the flattened result,
   so the runtime has less to do on the first sample. See
   [Performance](performance.md#startup-cost).

If you just saved a **subgraph**, Noizy also rebakes every graph in the project
that uses it, so nothing is left stale.

**Until you save, the asset is empty.** Scripts calling `Evaluate2D` on an
unsaved graph throw an `InvalidOperationException` that names the asset and
tells you to open and save it. The graph asset's Inspector tells you which state
it's in:

| Status line | What it means |
|---|---|
| ✓ Baked | Ready to use |
| ⚠ Unsaved changes | The window has edits you haven't committed |
| ⚠ Not yet baked | Nothing has ever been saved onto this asset |

## Autosave and recovery

While you have unsaved edits, Noizy writes them to
`Library/NoizyAutosaves/<asset guid>.json` in the background.

If Unity recompiles, crashes, or you close the window without saving, the next
time you open that graph you get a dialog offering to recover those edits. Pick
**Discard** and the autosave is thrown away.

This is a safety net, not a save. It doesn't touch the asset, so you still have
to press `Ctrl+S`.

## Revert

The **Revert** button in the toolbar throws away everything unsaved and reloads
the graph from disk. It asks first.

## Undo and redo

Graph edits go on Unity's own undo history, so they show up as
**Noizy Graph Edit** in **Edit > Undo History** and interleave with everything
else you do in the editor.

- `Ctrl+Z` undo
- `Ctrl+Y` or `Ctrl+Shift+Z` redo

A quick burst of changes (dragging a value, say) is grouped into one step.
Opening a different graph clears the undo steps for the one you left, so you
can't undo back into a graph you've closed.

## The preview gradient

The colour swatch in the toolbar controls how previews are coloured. Previews
are grayscale by default; change the gradient and every preview in the window
recolours right away.

This is per-asset and saved with it, so a graph you've set up as a lava map
stays looking like a lava map next time you open it. It's a display setting. It
does not change the numbers your graph produces. The
[texture exporter](texture-export.md) has its own separate gradient.

## The status dot

On the right of the toolbar is the graph's name and a small dot: green when
everything is saved, red while you have unsaved edits. Hover the dot for a
status panel:

- When it was last saved.
- Whether it's **Precompiled** or will compile at runtime (see
  [Performance](performance.md#startup-cost)).
- The SIMD level (`SIMD: AVX2` or similar), the instruction set FastNoise2
  picked for your CPU. It's informational. Wider is faster, and there's nothing
  to configure.
- How many nodes the graph has, and how many have warnings.
- A rough cost estimate at 1024², single-threaded.

## Muting nodes

Select one or more nodes and press `M` (or right-click > **Mute**) to switch
them off without deleting anything. A muted node is drawn faded and is skipped
when the graph is compiled: it passes its first input straight through, so you
can compare the result with and without it. Press `M` again to unmute.

A muted node with no inputs has nothing to pass through, so it still generates
as normal. Subgraph nodes can't be muted.

## Turning a selection into a subgraph

Right-click a selection and choose **Convert Selection to Subgraph**. Noizy asks
where to save the new [subgraph](subgraphs.md) asset, moves the selected nodes
into it, and puts a single subgraph node where they were, wired the same way.

The selection has to be self-contained:

- Every node it depends on must be selected too. A subgraph can't take inputs
  from outside itself.
- Exactly one selected node may feed something outside the selection. That
  becomes the subgraph's output.

If either rule isn't met, Noizy tells you which one and nothing changes.

## Shortcuts

| Shortcut | What it does |
|---|---|
| `Ctrl+S` | Save and bake |
| `Space` / right-click | Open the node search |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Ctrl+C` / `Ctrl+V` | Copy / paste selected nodes |
| `Ctrl+D` | Duplicate selected nodes |
| `Delete` | Delete selection (reroutes heal their wires) |
| `M` | Mute / unmute the selected nodes |
| `F` | Frame the selection, or everything if nothing's selected |
| `A` | Frame everything |
| `H` / `Home` | Jump back to the origin |
| Double-click a wire | Insert a reroute node |
| Drag a wire onto empty canvas | Open the node search, then connect what you pick |

Copy and paste work between graphs, and the clipboard checks that what you're
pasting came from Noizy before it tries.

## Every menu item

| Menu | What it opens |
|---|---|
| `Create > Noizy > Noizy Graph` | A new graph asset |
| `Create > Noizy > Noizy Subgraph` | A new [subgraph](subgraphs.md) asset |
| `Window > Noizy > Open Editor` | This window |
| `Window > Noizy > Node List` | A searchable reference of every node type |
| `Window > Noizy > Graph Benchmark` | [Single vs. multi-threaded timings](performance.md#the-benchmark-window) |
| `Window > Noizy > Rebuild Compiled Graphs` | Re-bakes the pre-compiled data on every graph in the project |
| `Window > Noizy > Native Libraries` | Which platforms have a FastNoise2 library in the project, with a button to apply the right import settings |
| `Window > Noizy > Debug > Log Evaluations` | Logs every grid call and whether it ran parallel |

The graph asset's Inspector also has **Open Graph Editor**, **Node List**, and,
just for full graphs, **Export Texture**.
