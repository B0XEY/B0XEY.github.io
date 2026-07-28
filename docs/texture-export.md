[← Back to the index](README.md)

# Texture export

Turn any graph into a texture from the editor. No code, no play mode.

Select a Noizy graph asset in the Project window and click **Export Texture** in
its Inspector. The button is greyed out until the graph has been baked, and it
isn't there at all for [subgraphs](subgraphs.md), which can't be evaluated on
their own.

The window shows a live preview that updates as you change things.

## Settings

| Setting | What it does |
|---|---|
| **Dimensions** | `2D` gives you a flat texture, `3D` gives you a volume |
| **Resolution** | 16 up to 4096. For 3D this is the X and Y size |
| **Depth** | 3D only. How many Z slices, 1 to 4096 |
| **Step** | Distance between samples. Same meaning as in the [scripting API](scripting.md). Smaller zooms in, bigger zooms out |
| **Seed** | The noise seed, with a **Random** button next to it |
| **Seamless (Tileable)** | 2D only. Makes the texture wrap perfectly in both axes |
| **Gradient** | Colours the result. Defaults to black-to-white, **Reset** puts it back |
| **Format** | 2D only. Texture asset, PNG, or EXR |

### Seamless

Ticked, Noizy uses FastNoise2's tileable generator, so the texture wraps
perfectly on both axes. That's what you want for a repeating material.

FastNoise2 has no tileable 3D generator, so the toggle is disabled for 3D
exports.

### Gradient

Values are normalised against the graph's own minimum and maximum, then run
through the gradient. So a graph that only ever outputs -0.2 to 0.3 still uses
the full gradient, so you don't have to guess the range.

This gradient is separate from the preview gradient in the
[graph editor](graph-editor.md). Changing one doesn't change the other.

### Formats

| Format | What you get | When to use it |
|---|---|---|
| **Texture Asset** (default) | A `Texture2D` `.asset` in your project, 8-bit RGBA | Almost always. Drag it straight into a material |
| **PNG** | An 8-bit PNG anywhere on disk | Sharing it, or taking it into an image editor |
| **EXR** | A 32-bit float EXR anywhere on disk | Heightmaps and displacement, where 8-bit banding shows |

If your export is going to drive geometry rather than colour, use EXR. 256 steps
of grey is fine for a texture and very obvious on a hillside.

3D always exports as a `Texture3D` asset in the project, because PNG and EXR are
2D formats. Use the **Slice** slider to look through the volume before you commit.

## Big exports

- Anything at 512 or above shows a progress bar.
- 3D generation is cancellable while it runs, once it's big enough to show that
  bar (512 or more on the resolution or the depth).
- For 3D, the window shows a live voxel count and a rough memory estimate as you
  change settings.
- Above roughly 64 million voxels (about 400x400x400) it asks you to confirm
  first, because that's where running out of memory becomes a real risk.

## Two things worth knowing

**Re-exporting over an existing texture asset keeps its GUID.** So materials
that already reference a previous export keep working, so you don't have to go
round reassigning things every time you tweak the graph. Point the save dialog
at the same file and it updates in place.

**The preview can look slightly different from a 3D export.** The preview
normalises each slice against its own minimum and maximum, while the real export
normalises across the whole volume. On very uneven noise that shows up as a
brightness difference. The exported data is the correct one.

## Doing it from code instead

The exporter is editor-only. If you want textures at runtime, sample the graph
and write the values into a `Texture2D` yourself. It's about ten lines. See
`Demo/Scripts/NoizyDemoTextureUtil.cs` for a working version, and
[Scripting](scripting.md) for the call itself.
