// Copyright 2026 The Libernet Team
// SPDX-License-Identifier: Apache-2.0

import { parse as parse_native, get_text_coordinates_from_offset } from "../bindings/starkom.js";

import { starkom } from "./proto/ast.js";
import ast = starkom.ast.v1;

export interface TextCoordinates {
  row: number;
  col: number;
}

export function getTextCoordinatesFromOffset(
  offset: number,
  lineStarts: number[],
): TextCoordinates {
  let { row, col } = get_text_coordinates_from_offset(offset, Uint32Array.from(lineStarts));
  return { row, col };
}

export function parse(path: string, input: string, withRanges: boolean): starkom.ast.v1.File {
  const buffer = parse_native(path, input, withRanges);
  return ast.File.decode(buffer);
}
