[← Back to Overview](README.md)

# License and support

## Noizy is a paid asset

Noizy is a commercial product sold through the Unity Asset Store. It is
**licensed, not sold**, and your use of it is governed by the
[Unity Asset Store End User License Agreement](https://unity.com/legal/as-terms).

Copyright (c) 2026 Boxey Dev. All rights reserved.

The full license text ships with the asset as `LICENSE.md`. The EULA is the
authoritative document. This page is a plain-English summary, not a
replacement for it.

### What you can do

- Use Noizy in **any number of your own projects**, commercial or not.
- Ship it **embedded in your builds**. Games you make with it are yours.
- Modify it for your own use inside your own projects.

### What you can't do

- **Redistribute, resell, sublicense or share** the asset's source files,
  binaries or documentation on their own, whether inside another asset, tool or
  template, in a public repository, or anywhere else. The one way Noizy leaves
  your machine is as an embedded, integral part of a product you built with it.
- Put it in a public repo. If your game's repo is public, exclude
  `Assets/Plugins/Noizy/` from it.

Per-seat licensing follows the Asset Store EULA terms for whichever license tier
you bought.

### No warranty

Noizy is provided "as is", without warranty of any kind. See `LICENSE.md` for
the full text.

## Third-party software

Noizy bundles [FastNoise2](https://github.com/Auburn/FastNoise2), which does all
the actual noise generation. It's MIT licensed:

> Copyright (c) 2020 Jordan Peck, Copyright (c) 2020 Contributors

It's included as native binaries (`Windows/FastNoise.dll`,
`Linux/libFastNoise.so`, `MacOS/libFastNoise.dylib`) and C# bindings
(`Core/FastNoise2.cs`).

The required notice ships with the asset in `Third-Party Notices.txt`. Nothing in
Noizy's own license restricts the rights FastNoise2's MIT license grants you.

If you ship a game with Noizy in it, include the FastNoise2 MIT notice in your
credits or third-party notices, the same as you would for any other MIT library.

## Getting help

Before you write in, two things that answer most questions faster than a reply
will:

1. Check [Troubleshooting](troubleshooting.md). Almost every error message Noizy
   can produce is listed there with its cause.
2. Check the [demo scripts](examples.md). If you're trying to do something and
   aren't sure how, there's a decent chance one of them already does it.

When you do get in touch, include:

- Your **Unity version**
- Your **platform** and **build target**
- The **exact `[Noizy]` message** from the console, if there is one
- What you were doing when it happened

That turns a three-message back-and-forth into one reply.

### Where to ask

- **Asset Store page:** [Noizy on the Unity Asset Store](https://u3d.as/43vW)
- **Support email:** [boxeydev@gmail.com](mailto:boxeydev@gmail.com)
- **Community:** [Boxey Dev on Discord](https://discord.com/invite/gya2UxAexc)

## Reporting bugs

A bug report is most useful with:

- A description of what you expected and what you got instead.
- The graph it happens with, if it's graph-specific. A small graph that
  reproduces it beats a big one that also does.
- Whether it happens in the demo scene too.
- Whether it happens with `NoizyEvalMode.forceSingle`. If a problem goes away on
  one thread, that's a very useful thing to know up front.

## Version and requirements

| | |
|---|---|
| **Unity** | 6.4 or newer |
| **Platforms** | Windows x64, macOS (Intel + Apple Silicon), Linux x64 |
| **Render pipelines** | Any. Just the demo materials are pipeline-specific |
| **Packages** | `com.unity.mathematics`, `com.unity.collections`, `com.unity.burst` |
| **Noise engine** | FastNoise2 (bundled, MIT) |

## Thanks for reading

That's the end of the docs. Thanks for reading them, and thanks for buying
Noizy. Writing it was a lot of fun, and knowing people are building
things with it is the best part.

If you make something with it, I'd love to see it. Drop it in the
[Discord](https://discord.com/invite/gya2UxAexc). And if a page here didn't
explain something well, tell me that too. I'd rather fix the docs than answer
the same question twice.

Now go make some noize.
