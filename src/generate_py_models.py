import os
import subprocess
import sys
import yaml

BASE_DIR = os.path.join(os.path.dirname(__file__), '..')
SCHEMAS_DIR = os.path.join(BASE_DIR, 'schemas', 'stock')
PY_OUTPUT_DIR = os.path.join(BASE_DIR, 'generated-models', 'python', 'models', 'stock')
ENTITIES_DIR = os.path.join(SCHEMAS_DIR, 'entities')
MERGED_ENTITIES_FILE = os.path.join(BASE_DIR, 'temp', 'merged_entities.yaml')

def merge_entity_schemas():
    """
    Merge all YAML files in the entities folder into a single JSON Schema document with a $defs section.
    """
    os.makedirs(os.path.dirname(MERGED_ENTITIES_FILE), exist_ok=True)
    entity_files = []
    for root, dirs, files in os.walk(ENTITIES_DIR):
        for file in files:
            if file.endswith('.schema.yaml'):
                entity_files.append(os.path.join(root, file))
    merged_defs = {}
    for file in entity_files:
        with open(file, 'r') as f:
            schema = yaml.safe_load(f)
            # Use the filename (without extension) as the definition key.
            key = os.path.splitext(os.path.basename(file))[0]
            merged_defs[key] = schema
    # Build a single JSON Schema document with $defs.
    merged_schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "$defs": merged_defs
    }
    with open(MERGED_ENTITIES_FILE, 'w') as f:
        yaml.dump(merged_schema, f)
    print(f"Merged entities into: {MERGED_ENTITIES_FILE}")

def generate_entities_models():
    """
    Generate common Python models from the merged entities.
    """
    merge_entity_schemas()
    output_file = os.path.join(PY_OUTPUT_DIR, 'entities.py')
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    command = [
        'datamodel-codegen',
        '--input', MERGED_ENTITIES_FILE,
        '--output', output_file,
        '--input-file-type', 'yaml',
        '--reuse-model'
    ]
    print(f"Generating common Python models from merged entities into: {output_file}")
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error generating entities models:\n{result.stderr}", file=sys.stderr)
    else:
        print(f"Successfully generated entities models: {output_file}")

def generate_other_models():
    """
    Generate Python models for schemas outside the entities folder.
    """
    for root, dirs, files in os.walk(SCHEMAS_DIR):
        # Skip the entities folder.
        if os.path.basename(root) == 'entities':
            continue
        for file in files:
            if file.endswith('.schema.yaml'):
                input_path = os.path.join(root, file)
                relative_path = os.path.relpath(input_path, SCHEMAS_DIR)
                output_file = file.replace('.schema.yaml', '.py')
                output_dir = os.path.join(PY_OUTPUT_DIR, os.path.dirname(relative_path))
                os.makedirs(output_dir, exist_ok=True)
                output_path = os.path.join(output_dir, output_file)

                # Generate model normally with reuse-model.
                command = [
                    'datamodel-codegen',
                    '--input', input_path,
                    '--output', output_path,
                    '--input-file-type', 'yaml',
                    '--reuse-model'
                ]
                print(f"Generating Python model: {output_path}")
                result = subprocess.run(command, capture_output=True, text=True)
                if result.returncode != 0:
                    print(f"Error generating model for {input_path}:\n{result.stderr}", file=sys.stderr)
                else:
                    print(f"Successfully generated: {output_path}")

if __name__ == "__main__":
    print("Generating Python models from schemas...")
    generate_entities_models()
    generate_other_models()
