
from fugashi import Tagger
import argparse
import json

def read_input(input_file):
    with open(input_file, "r", encoding="utf-8") as f:
        return json.load(f)

def write_output(results, output_file):
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

def main(input_file, output_file):
    tagger = Tagger()

    exercises = read_input(input_file)
    
    results = []
    
    for entry in exercises:
        sentence = ""
        for segment in entry["segments"]:
            if isinstance(segment, str):
                sentence += segment
            else:
                sentence += segment["text"]
                
        tokens_with_readings = []
        for token in tagger(sentence):
            tokens_with_readings.append({
                "text": token.surface,
                "yomi": token.feature.kana or token.surface
            })
        
        results.append({
            "tokens": tokens_with_readings
        })
    
    write_output(results, output_file)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process some files.")
    parser.add_argument("input_file", help="Path to the input file")
    parser.add_argument("output_file", help="Path to the output file")
    
    args = parser.parse_args()
    
    main(args.input_file, args.output_file)
