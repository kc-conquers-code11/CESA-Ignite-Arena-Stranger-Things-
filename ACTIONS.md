# Judge Runner Hardening – Action Plan

This document describes **non-code operational steps** to harden competitive programming judge runners against cheating, crashes, undefined behavior, and output corruption.

---

## 1. Enforce a Judge Output Protocol

Define a strict output contract for runners:

* All judge-generated output must use a unique prefix (e.g. `__JUDGE__`).
* User program output must be ignored entirely.
* Only lines with the judge prefix are parsed.
* Any missing prefix lines mark the submission as failed.

Outcome: Prevents users from polluting stdout and breaking parsers.

---

## 2. Isolate User Output

Ensure user prints never interfere with the judge:

* Redirect user stdout where possible.
* Only the runner prints final results.
* Disallow extra output in result comparison.

Outcome: Stops cheating via fake prints or format breaking.

---

## 3. Standardize Result Formats

Define one canonical result format per problem:

* For arrays: `[i,j]` only.
* For empty / no-solution: `-1` only.
* No spaces, no newlines, no alternate forms.

Ensure all languages conform to the same format.

Outcome: Removes ambiguity in comparison across languages.

---

## 4. Add Runtime Randomized Tests

Never rely only on static test cases:

* Inject random hidden tests per submission.
* Shuffle inputs.
* Generate sizes dynamically.
* Use multiple distributions (small, large, duplicates, negatives).

Outcome: Prevents hardcoded solutions.

---

## 5. Include Stress & Benchmark Cases

Add performance enforcement:

* Large inputs to force O(n) or O(log n).
* Memory-heavy cases.
* Boundary conditions.

Outcome: Stops brute-force and inefficient submissions from passing.

---

## 6. Enforce Memory Safety

Before judging:

* Ensure all allocations are freed (especially in C).
* Guard against null returns.
* Validate array sizes before sorting or indexing.

Outcome: Prevents crashes, leaks, and undefined behavior.

---

## 7. Protect Against Dangerous APIs

Block unsafe operations:

* Process spawning.
* File system writes.
* Network access.
* Runtime execution calls.

Outcome: Reduces sandbox escape risk and abuse.

---

## 8. Normalize Comparison

Before comparing results:

* Trim whitespace.
* Normalize casing.
* Normalize brackets and commas.
* Sort outputs where order is irrelevant.

Outcome: Prevents false negatives due to formatting differences.

---

## 9. Fail Fast on Protocol Violations

If runner output is invalid:

* Missing test cases.
* Extra cases.
* Corrupted format.
* Timeout.

Immediately mark submission as failed.

Outcome: Keeps judge predictable and secure.

---

## 10. Add Submission Integrity Checks

Before execution:

* Scan for forbidden keywords.
* Enforce size limits.
* Enforce recursion depth or loop caps.

Outcome: Stops malicious and runaway submissions early.

---

## 11. Separate Compilation & Execution Phases

Treat compilation and runtime differently:

* Capture compiler errors cleanly.
* Only run if compile succeeds.
* Apply strict runtime limits.

Outcome: Prevents unstable execution flow.

---

## 12. Add Observability

Track:

* Time per test.
* Memory usage.
* Output size.
* Crash types.

Outcome: Makes debugging and scaling easier.

---

## 13. Version Your Judge Protocol

Maintain versions for:

* Output protocol.
* Test generation logic.
* Comparison logic.

Outcome: Allows upgrades without breaking old problems.

---

## 14. Use Deterministic Seeding

For random tests:

* Use seeded randomness per submission.
* Log seeds.

Outcome: Makes failures reproducible.

---

## 15. Enforce Language Parity

Ensure all languages:

* Use identical test logic.
* Produce identical output contracts.
* Handle errors consistently.

Outcome: Keeps fairness across Java, C, C++, etc.

---

## Final Goal

A hardened judge should be:

* Predictable
* Secure
* Non-cheatable
* Deterministic
* Language-neutral
* Performance-enforcing

This action plan converts a simple runner into a **production-grade online judge system**.
