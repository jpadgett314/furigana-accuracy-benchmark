import { TokenizeMode, tokenize } from "sudachi";
import fs from "node:fs/promises";
import path from "node:path";

async function analyzeSentences(inputPath, outputPath) {
  const inputJson = await fs.readFile(inputPath, "utf8");
  const input = JSON.parse(inputJson);
  const output = input.map(entry => {
    const sentence = entry.segments.map((s) => s.text ?? s).join("");
    const analysisJson = tokenize(sentence, TokenizeMode.C);
    const analysis = JSON.parse(analysisJson);
    return { 
      tokens: analysis.map(token => ({
        text: token.surface,
        yomi: token.dictionary_form || token.surface
      }))
    }
  });

  await fs.writeFile(outputPath, JSON.stringify(output, null, 2), "utf8");
}

const [, , inputPath, outputPath] = process.argv;

if (!inputPath || !outputPath) {
  console.error(`Usage: node ${path.basename(process.argv[1])} <input.json> <output.json>`);
  process.exit(1);
}

analyzeSentences(inputPath, outputPath).catch((err) => {
  console.error(err);
  process.exit(1);
});
