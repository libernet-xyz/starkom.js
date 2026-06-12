import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as path from "node:path";

import * as chai from "chai";
import { expect } from "chai";

import { parse } from "../src/main.js";
import { starkom } from "../src/proto/ast.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Chai plugin: expect(actual).to.matchProto(expected)
//
// Recursively checks that `actual` contains at least the keys specified in `expected`. For each
// key:
//   - If the expected value is a plain/class object, recurse.
//   - If the expected value is an array, require same length and recurse per element.
//   - Otherwise, require strict equality.
//
// Unlike Chai's built-in deep.include, this recurses into nested objects instead of falling back to
// deep.equal for their values, which means it works correctly even when `actual` contains class
// instances (e.g. protobufjs decoded messages) rather than plain objects.
function subsetMismatch(actual: unknown, expected: unknown, path: string): string | null {
  if (typeof expected !== "object" || expected === null) {
    return actual !== expected
      ? `at ${path}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
      : null;
  }
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) {
      return `at ${path}: expected array, got ${typeof actual}`;
    }
    if (actual.length !== expected.length) {
      return `at ${path}: expected length ${expected.length}, got ${actual.length}`;
    }
    for (let i = 0; i < expected.length; i++) {
      const err = subsetMismatch(actual[i], expected[i], `${path}[${i}]`);
      if (err !== null) {
        return err;
      }
    }
    return null;
  }
  if (typeof actual !== "object" || actual === null) {
    return `at ${path}: expected object, got ${String(actual)}`;
  }
  for (const key of Object.keys(expected as object)) {
    if (!(key in (actual as object))) {
      return `at ${path}: missing key '${key}'`;
    }
    const err = subsetMismatch(
      (actual as Record<string, unknown>)[key],
      (expected as Record<string, unknown>)[key],
      `${path}.${key}`,
    );
    if (err !== null) {
      return err;
    }
  }
  return null;
}

chai.use(((c: Chai.ChaiStatic) => {
  c.Assertion.addMethod("matchProto", function (this: Chai.AssertionStatic, expected: unknown) {
    const mismatch = subsetMismatch(this._obj as unknown, expected, "value");
    this.assert(
      mismatch === null,
      mismatch ?? "expected #{this} to contain subset #{exp}",
      "expected #{this} not to contain subset #{exp}",
      expected,
    );
  });
}) satisfies Chai.ChaiPlugin);

declare global {
  namespace Chai {
    interface Assertion {
      matchProto(expected: unknown): Assertion;
    }
  }
}

describe("parse", function () {
  it("vitalik.starkom with ranges", function () {
    const source = readFileSync(path.join(__dirname, "../starkom/test/vitalik.starkom"), "utf-8");
    const file = parse("vitalik.starkom", source, true);

    expect(file.path).to.equal("vitalik.starkom");
    expect(file.lineStarts).to.deep.equal([
      0, 58, 132, 133, 155, 156, 177, 195, 196, 213, 228, 229, 249, 272, 273, 296, 298, 299, 327,
    ]);
    expect(file.includes).to.deep.equal([]);

    expect(file.version).to.matchProto({
      range: { offset: 133, length: 21 },
      major: 1,
      minor: 0,
      patch: 0,
    });

    expect(file.definitions).to.matchProto([
      {
        templateDefinition: {
          range: { offset: 156, length: 141 },
          name: "Vitalik",
          params: [],
          bodyIndex: 7,
        },
      },
    ]);

    expect(file.mainComponent).to.matchProto({
      range: { offset: 299, length: 27 },
      publicSignals: [],
      instantiation: 19,
    });

    expect(file.expressions.slice(1)).to.matchProto([
      // [1]  square
      {
        range: { offset: 231, length: 6 },
        variable: { name: "square" },
      },

      // [2]  x (lhs of x*x)
      {
        range: { offset: 242, length: 1 },
        variable: { name: "x" },
      },

      // [3]  x (rhs of x*x)
      {
        range: { offset: 246, length: 1 },
        variable: { name: "x" },
      },

      // [4]  x * x
      {
        range: { offset: 242, length: 5 },
        infixExpression: {
          type: starkom.ast.v1.InfixExpression.Type.INFIX_EXPRESSION_TYPE_MULTIPLY,
          lhs: 2,
          rhs: 3,
        },
      },

      // [5]  square <== x * x
      {
        range: { offset: 231, length: 16 },
        constrainedAssign: {
          direction: starkom.ast.v1.AssignmentDirection.ASSIGNMENT_DIRECTION_RIGHT_TO_LEFT,
          lhs: 1,
          rhs: 4,
        },
      },

      // [6]  cube
      {
        range: { offset: 251, length: 4 },
        variable: { name: "cube" },
      },

      // [7]  square (lhs of sq*x)
      {
        range: { offset: 260, length: 6 },
        variable: { name: "square" },
      },

      // [8]  x (rhs of sq*x)
      {
        range: { offset: 269, length: 1 },
        variable: { name: "x" },
      },

      // [9]  square * x
      {
        range: { offset: 260, length: 10 },
        infixExpression: {
          type: starkom.ast.v1.InfixExpression.Type.INFIX_EXPRESSION_TYPE_MULTIPLY,
          lhs: 7,
          rhs: 8,
        },
      },

      // [10] cube <== square * x
      {
        range: { offset: 251, length: 19 },
        constrainedAssign: {
          direction: starkom.ast.v1.AssignmentDirection.ASSIGNMENT_DIRECTION_RIGHT_TO_LEFT,
          lhs: 6,
          rhs: 9,
        },
      },

      // [11] cube (in cube+x+5)
      {
        range: { offset: 275, length: 4 },
        variable: { name: "cube" },
      },

      // [12] x (in cube+x)
      {
        range: { offset: 282, length: 1 },
        variable: { name: "x" },
      },

      // [13] cube + x
      {
        range: { offset: 275, length: 8 },
        infixExpression: {
          type: starkom.ast.v1.InfixExpression.Type.INFIX_EXPRESSION_TYPE_ADD,
          lhs: 11,
          rhs: 12,
        },
      },

      // [14] 5
      {
        range: { offset: 286, length: 1 },
        numericLiteral: { base: 10, value: "5" },
      },

      // [15] cube + x + 5
      {
        range: { offset: 275, length: 12 },
        infixExpression: {
          type: starkom.ast.v1.InfixExpression.Type.INFIX_EXPRESSION_TYPE_ADD,
          lhs: 13,
          rhs: 14,
        },
      },

      // [16] 35
      {
        range: { offset: 292, length: 2 },
        numericLiteral: { base: 10, value: "35" },
      },

      // [17] cube + x + 5 === 35
      {
        range: { offset: 275, length: 19 },
        constrainedEquality: { lhs: 15, rhs: 16 },
      },

      // [18] Vitalik
      {
        range: { offset: 316, length: 7 },
        variable: { name: "Vitalik" },
      },

      // [19] Vitalik()
      {
        range: { offset: 316, length: 9 },
        postfixChain: { operand: 18, postfix: [{ invocation: { arguments: [] } }] },
      },
    ]);

    expect(file.statements.slice(1)).to.matchProto([
      // [1] signal input x;
      {
        range: { offset: 179, length: 15 },
        declaration: {
          type: starkom.ast.v1.DeclarationStatement.Type.DECLARATION_TYPE_SIGNAL,
          declarations: [
            {
              modifier: starkom.ast.v1.DeclarationStatement.Modifier.MODIFIER_SIGNAL_TYPE_INPUT,
              name: "x",
              dimensions: [],
            },
          ],
        },
      },

      // [2] signal square;
      {
        range: { offset: 198, length: 14 },
        declaration: {
          type: starkom.ast.v1.DeclarationStatement.Type.DECLARATION_TYPE_SIGNAL,
          declarations: [
            {
              modifier: starkom.ast.v1.DeclarationStatement.Modifier.MODIFIER_NONE,
              name: "square",
              dimensions: [],
            },
          ],
        },
      },

      // [3] signal cube;
      {
        range: { offset: 215, length: 12 },
        declaration: {
          type: starkom.ast.v1.DeclarationStatement.Type.DECLARATION_TYPE_SIGNAL,
          declarations: [
            {
              modifier: starkom.ast.v1.DeclarationStatement.Modifier.MODIFIER_NONE,
              name: "cube",
              dimensions: [],
            },
          ],
        },
      },

      // [4] square <== x * x;
      { range: { offset: 231, length: 17 }, expression: { expression: 5 } },

      // [5] cube <== square * x;
      { range: { offset: 251, length: 20 }, expression: { expression: 10 } },

      // [6] cube + x + 5 === 35;
      { range: { offset: 275, length: 20 }, expression: { expression: 17 } },

      // [7] template body { ... }
      { range: { offset: 175, length: 122 }, block: { statements: [1, 2, 3, 4, 5, 6] } },
    ]);
  });
});
