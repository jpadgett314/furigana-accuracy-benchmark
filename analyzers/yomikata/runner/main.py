import argparse
import json
import re
from dataclasses import dataclass
from yomikata.dbert import dBert
from yomikata.dictionary import Dictionary

# SINGLETONS
bert_reader = dBert()
dict_reader = Dictionary()

FURIGANA_REGEX = re.compile(r"\{([^/]+)/([^}]+)\}")

@dataclass
class Token:
    surface: str
    reading: str | None = None

def parse_furigana(text: str) -> list[Token]:
    tokens = []
    i = 0

    for m in FURIGANA_REGEX.finditer(text):
        if m.start() > i:
            surface, reading = text[i:m.start()], text[i:m.start()]
            tokens.append(Token(surface, reading))

        surface, reading = m.group(1), m.group(2)
        tokens.append(Token(surface, reading))
        i = m.end()

    if i < len(text):
        surface, reading = text[i:], text[i:]
        tokens.append(Token(surface, reading))

    return tokens

def extract_overrides(text: str) -> dict[str, str]:
    overrides = {}

    for t in parse_furigana(text):
        if t.reading is not None:
            overrides[t.surface] = t.reading

    return overrides

def merge_readings(dict_text: str, bert_text: str) -> list[Token]:
    dict_tokens = parse_furigana(dict_text)
    bert_overrides = extract_overrides(bert_text)

    merged = []
    for t in dict_tokens:
        if t.reading and t.surface in bert_overrides:
            merged.append(Token(t.surface, bert_overrides[t.surface]))
        else:
            merged.append(t)

    return merged

def katakana_to_hiragana(text: str) -> str:
    result = []

    for ch in text:
        code = ord(ch)
        # Katakana block (including small kana)
        if 0x30A1 <= code <= 0x30F6:
            result.append(chr(code - 0x60))
        else:
            result.append(ch)

    return "".join(result)

def analyze(text: str) -> list[Token]:
    text = katakana_to_hiragana(text)

    try: 
        dict_furi = dict_reader.furigana(text)
        bert_furi = bert_reader.furigana(text)

        return merge_readings(dict_furi, bert_furi)
    except AssertionError:
        # Various special characters are not handled gracefully, including
        # katakana.
        return []

def read_input(input_file):
    with open(input_file, "r", encoding="utf-8") as f:
        return json.load(f)

def write_output(results, output_file):
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

def main(input_file, output_file):
    results = []

    exercises = read_input(input_file)

    for entry in exercises:
        sentence = ""
        for segment in entry["segments"]:
            if isinstance(segment, str):
                sentence += segment
            else:
                sentence += segment["text"]
                
        tokens_with_readings = []
        for token in analyze(sentence):
            tokens_with_readings.append({
                "text": token.surface,
                "yomi": token.reading or token.surface
            })
        
        results.append({
            "tokens": tokens_with_readings
        })
    
    write_output(results, output_file)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("input_file", help="Path to the input file")
    parser.add_argument("output_file", help="Path to the output file")
    
    args = parser.parse_args()
    
    main(args.input_file, args.output_file)
