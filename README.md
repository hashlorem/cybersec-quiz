# MODULE 1-10 CYBERSECURITY ESSENTIAL QUIZ

A single-page study quiz for the Cybersecurity Essentials Module 1-10 checkpoint
exams, published as a static site on GitHub Pages. No build step, no
dependencies, no framework: open `index.html` and it runs.

Live: https://hashlorem.github.io/cybersec-quiz/

## What it does

- **Three ways to study.** Network Security (modules 1-6), OS and Endpoint
  Security (modules 7-10), or a full shuffle of both.
- **Four question types, interleaved.** Multiple choice, multi-select ("choose
  three"), true or false, and matching items (drag an answer onto a term, or tap
  a term then tap an answer).
- **Shuffled every run.** Questions, multiple-choice options, and matching
  columns are all shuffled. The shuffle is seeded, so `?seed=` reproduces a run
  exactly and `?deck=` jumps straight into a deck.
- **Instant feedback.** Each answer is marked immediately with the correct
  answer and the explanation from the source material.
- **Results and review.** Score ring, accuracy, elapsed time, per-topic
  breakdown sorted weakest first, attempt history, and a review screen with a
  "missed only" filter. Scores and history live in `localStorage` only.

## Question bank

| Deck | Key | Modules | Items | Multiple choice | Multi-select | True/false | Matching |
|---|---|---|---|---|---|---|---|
| Network Security Checkpoint | `network` | 1-6 | 40 | 24 | 4 | 10 | 2 |
| OS and Endpoint Security Checkpoint | `endpoint` | 7-10 | 34 | 12 | 7 | 10 | 5 |
| Full Shuffle | `both` | 1-10 | 74 | 36 | 11 | 20 | 7 |

The 54 multiple-choice, multi-select, and matching items are transcribed from the
checkpoint exam material, with the answer keys and explanations as given. The 20
true/false items were written from the same explanations.

## Run it locally

```bash
./serve.sh                 # http://127.0.0.1:8000
```

Double-clicking `index.html` also works: the scripts are classic (not ES
modules) precisely so `file://` is usable.

## Add or edit questions

Each deck is its own file so they can be edited independently:

- `assets/js/deck-network.js` - modules 1-6 items
- `assets/js/deck-endpoint.js` - modules 7-10 items
- `assets/js/deck-tf.js` - true/false items, tagged with `deck: "network"` or `"endpoint"`
- `assets/js/data.js` - merges the decks, builds the Full Shuffle deck, and runs the self-test

Item shapes:

```js
{ id: "n12", topic: "Attacks", type: "mc",
  prompt: "…", options: ["…", "…", "…", "…"], correct: [2],
  explanation: "…" }

{ id: "e01", topic: "File Systems", type: "multi", choose: 2,
  prompt: "…", options: ["…", "…", "…", "…", "…", "…"],
  correct: [1, 2], explanation: "…" }

{ id: "t01", deck: "network", topic: "Attacks", type: "tf",
  statement: "…", answer: true, explanation: "…" }

{ id: "e17", topic: "Linux Tools", type: "match",
  prompt: "…", pairs: [{ left: "…", right: "…" }],
  distractors: ["…"], explanation: "…" }
```

`choose` must equal `correct.length` for multi-select. Matching items may carry
`distractors` for "not all options are used" boards.

## Verify

Open `?selftest=1` in the browser (or the "Bank self-test" link on the home
screen). It checks unique ids, in-range answer keys, multi-select counts that
match their keys, boolean true/false answers, a balanced true/false split,
unambiguous matching pairs, and that every deck mixes all four question types.
Every check must pass before publishing a change.

`window.QZ.state` exposes read-only `screen()`, `session()`, `draft()`, and
`result()` for debugging and for driving the browser tests.

## Deploy

GitHub Pages serves the repository root of `main`. Push and it redeploys:

```bash
git push
```

## Notes

- The repo has to be public for free GitHub Pages, so the answer keys are
  public. The source material they came from is public too.
- Motion respects `prefers-reduced-motion`: springs and staggers collapse to
  instant transitions.
