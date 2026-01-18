import fs from "fs";
import { toHiragana } from "wanakana";

export class GradableBuilder {
  #gradables = [];

  #alignSegmentsToTokens(exercise, solution) {
    const solutionGraphemes = solution.tokens.flatMap((token, tokenIndex) =>
      Array.from(token.text || "").map(() => tokenIndex)
    );

    let offset = 0;

    return exercise.segments.map((segment) => {
      const text = segment.text ?? segment ?? "";
      const len = text.length;

      const relevantIndices = solutionGraphemes.slice(offset, offset + len);
      const uniqueTokenIndices = [...new Set(relevantIndices)];

      const matchedTokens = uniqueTokenIndices.map((i) => solution.tokens[i]);
      offset += len;

      return { segment, matchedTokens };
    });
  }

  #ingestOne(exercise, solution, analyzer) {
    const alignments = this.#alignSegmentsToTokens(exercise, solution).filter(
      // Only process gradable segments
      ({ segment }) => segment.yomi
    );

    // prettier-ignore
    return alignments.map(
      ({ segment, matchedTokens }) => (
        {
          analyzer,
          text: segment.text,
          tags: segment.tags || [],
          yomiExpected: segment.yomi,
          yomiActual: matchedTokens.map((t) => t.yomi).join(""),
        }
      )
    );
  }

  ingest(analyzer, exercises, solutions) {
    const items = exercises.flatMap((exercise, i) =>
      this.#ingestOne(exercise, solutions[i], analyzer)
    );
    this.#gradables.push(...items);
  }

  getGradables() {
    return this.#gradables;
  }
}

export class GradeRegistry {
  #results = []; // List of { tag, analyzer, isCorrect }

  grade(gradables) {
    for (let { analyzer, tags, yomiExpected, yomiActual } of gradables) {
      yomiExpected = toHiragana(yomiExpected || "");
      yomiActual = toHiragana(yomiActual || "");

      const isCorrect = yomiExpected === yomiActual;

      for (const tag of tags) {
        this.#results.push({ tag, analyzer, isCorrect });
      }
    }
  }

  toApexChartsFormat() {
    const registry = {};

    for (const { tag, analyzer, isCorrect } of this.#results) {
      registry[tag] ??= {};
      registry[tag][analyzer] ??= { pass: 0, total: 0 };
      registry[tag][analyzer].total++;
      if (isCorrect) registry[tag][analyzer].pass++;
    }

    // prettier-ignore
    return Object.entries(registry).map(
      ([tagName, analyzers]) => (
        {
          name: tagName,
          data: Object.entries(analyzers).map(
            ([name, stats]) => (
              {
                x: name,
                y: Math.round((stats.pass / stats.total) * 100),
              }
            )
          ),
        }
      )
    );
  }
}

function main() {
  const exercises = JSON.parse(fs.readFileSync('challenge-sentences.json', 'utf8'));
  const analyzers = [
    {
      name: 'fugashi',
      data: './analyzers/fugashi/output.json'
    },
    {
      name: 'spacy',
      data: './analyzers/spacy\[ja\]/output.json'
    },
    {
      name: 'sudachi',
      data: './analyzers/sudachi-wasm/output.json'
    },
    {
      name: 'yomikata',
      data: './analyzers/yomikata/output.json'
    }
  ];

  const ingester = new GradableBuilder();

  for (const { name, data } of analyzers) {
    ingester.ingest(name, exercises, JSON.parse(fs.readFileSync(data, 'utf8')));
  }

  const grader = new GradeRegistry();
  grader.grade(ingester.getGradables());
  const report = grader.toApexChartsFormat();

  fs.writeFileSync('./public/benchmark-results.json', JSON.stringify(report, null, 2));
}

main();
