import { test, expect } from "@playwright/test";

// Assertion is "a 429 appeared somewhere in the sequence" rather than "the
// Nth call is 429", so this stays robust regardless of how much unrelated
// traffic other spec files send to the same endpoint from this run's IP.
//
// The rate limiter keys buckets by client IP, and requests with no
// x-forwarded-for header (both this test's `request` fixture and every
// other spec's real browser navigations) all fall back to the same
// "unknown" bucket. Tagging this test's calls with their own synthetic IP
// keeps the deliberate flood from poisoning the shared bucket that other
// specs' real exam-join calls rely on for up to a minute afterward.
test("exam join is rate-limited against rapid guessing", async ({ request }) => {
  const statuses: number[] = [];
  for (let i = 0; i < 25; i++) {
    const res = await request.post("/api/exam/join", {
      data: { code: "NOPE-NOPE-NOPE", studentName: "مختبر السرعة" },
      headers: { "x-forwarded-for": "203.0.113.42" },
    });
    statuses.push(res.status());
  }
  expect(statuses).toContain(429);
});
