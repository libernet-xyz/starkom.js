// Copyright 2026 The Libernet Team
// SPDX-License-Identifier: Apache-2.0

import { parse as parseNative } from "../bindings/starkom.js";
import { starkom } from "./proto/ast.js";
import ast = starkom.ast.v1;

export function parse(path: string, input: string, withRanges: boolean): starkom.ast.v1.File {
  const buffer = parseNative(path, input, withRanges);
  return ast.File.decode(buffer);
}
