// Renders "score / max" with an explicit LTR direction. Without this, a
// plain "{score} / {max}" string inside our RTL pages gets visually
// reordered by the browser's bidi algorithm (e.g. "2 / 4" displays as
// "4 / 2") even though the underlying text and DOM order are correct.
export default function ScoreFraction({
  score,
  max,
}: {
  score: number | null | undefined;
  max: number | null | undefined;
}) {
  if (score == null || max == null) return <>—</>;
  return <span dir="ltr">{`${score} / ${max}`}</span>;
}
