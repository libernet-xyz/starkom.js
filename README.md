# Starkom Compiler

## Overview

This package contains the JavaScript bindings for the
[Starkom compiler](https://github.com/libernet-xyz/starkom), which is written in Rust.

## Building from Source

You need [Node.js](https://nodejs.org), [Rust](https://rust-lang.org/), and the
[`wasm-bindgen-cli`](https://crates.io/crates/wasm-bindgen-cli).

> NOTE!: the version of `wasm-bindgen-cli` must be exactly the same as the version of the
> `wasm-bindgen` dependency in the `starkom` submodule. Check that out in
> [Cargo.toml](https://github.com/libernet-xyz/starkom/blob/main/Cargo.toml).
>
> You can install a specific version of the CLI using:
>
> ```sh
> $ cargo install wasm-bindgen-cli@0.2.123
> ```

The package refers to the [starkom repo](https://github.com/libernet-xyz/starkom) as a submodule, so
make sure to clone recursively:

```sh
$ git clone https://github.com/libernet-xyz/starkom.git --recursive
```

Or, if you've already cloned, initialize the submodule:

```sh
starkom.js$ git submodule update --init --recursive
```

Then install all dependencies and build:

```sh
starkom.js$ npm i && npm run build
```
