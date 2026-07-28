[← Back to the index](README.md)

# Subgraphs

A subgraph is a chunk of a graph you can drop into other graphs. Build your
"good warped fractal" once, then use it in ten places without rebuilding it ten
times.

## Making one

**Create > Noizy > Noizy Subgraph** in the Project window.

It opens in the same editor as a normal graph and works exactly the same way:
add nodes, wire them into the Output node, `Ctrl+S`. The window title says
"Noizy (Subgraph)" so you know which one you're in.

## Using one

Two ways, both fine:

- **From the node search.** Every subgraph in your project shows up by name
  under the **Subgraph** group. Pick it and the node lands already pointed at
  that asset. Nothing else to assign.
- **Drag the asset onto the canvas** from the Project window.

The node's title is the subgraph's name and its preview shows what it produces.
Its Out port wires into anything, same as any other node: another node's input,
or straight into the Output node.

To point an existing subgraph node at a different subgraph, **drag the new
asset straight onto the node**. That swaps it in place instead of adding a
second node.

To edit the subgraph itself, double-click its asset in the Project window like
any other graph.

## What a subgraph is not

A subgraph is a **fixed, pre-baked chunk**. It has no exposed or overridable
parameters. Every graph that references it gets exactly the same values.

If you want a variant with different numbers, make a second subgraph asset.
Select the original in the Project window and press `Ctrl+D` to duplicate it,
then edit the copy.

That's a deliberate trade. It keeps the compiled result of a subgraph identical
everywhere it's used, which is what makes it cheap to reuse.

## Saving a subgraph updates everything using it

When you save a subgraph, Noizy finds every graph in the project that depends on
it, directly or through another subgraph, and rebakes them. It also drops the
compiled tree of any loaded graph that uses it.

So the next `Evaluate2D` call, or the next time you open a graph that uses it,
already reflects your edit. You don't have to go and re-save anything by hand.

## Rules and limits

- **A subgraph can't contain itself**, directly or through a chain of other
  subgraphs. Noizy detects this and throws a clear error rather than hanging.
- **A subgraph can't be evaluated on its own.** There's no `Evaluate2D` on it,
  and the Inspector's **Export Texture** button is only on full graphs. A
  subgraph only exists to be referenced.
- **You can nest them.** A subgraph can use other subgraphs. It's checked for
  loops the same way.
- **The same subgraph can be used any number of times**, in any number of
  graphs. When a graph is compiled, the subgraph's nodes are built fresh once
  per tree and shared if the same subgraph appears more than once in it.

## When it's worth it

Good candidates:

- A base terrain shape you use across several biome graphs.
- A warp setup you like and don't want to re-tune every time.
- Anything that's more than about five nodes and appears in more than one graph.

Not worth it:

- A single node. Just add the node.
- Something you'll want slightly different every time. Without exposed
  parameters you'll end up with six near-identical subgraph assets, which is
  worse than six copies of five nodes.

## Where it shows up in the docs

- [The graph editor](graph-editor.md): the window, shortcuts, saving
- [Performance](performance.md#startup-cost): how subgraph expansion is
  pre-compiled at save time, and the fingerprint check that catches a stale one
