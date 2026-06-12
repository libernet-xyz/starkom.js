import * as chai from "chai";

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
