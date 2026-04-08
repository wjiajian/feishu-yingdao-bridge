export const tests = [];

export function defineTest(name, run) {
  tests.push({ name, run });
}
