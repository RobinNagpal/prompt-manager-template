import os
import subprocess
import sys

# Define source and output directories for schemas.
SCHEMAS_DIR = os.path.join(os.path.dirname(__file__), 'schemas', 'stock')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'generated-models', 'python', 'models', 'stock')

def generate_py_models():
    for root, dirs, files in os.walk(SCHEMAS_DIR):
        for file in files:
            if file.endswith('.schema.yaml'):
                input_path = os.path.join(root, file)
                relative_path = os.path.relpath(input_path, SCHEMAS_DIR)
                output_file = file.replace('.schema.yaml', '.py')
                output_dir = os.path.join(OUTPUT_DIR, os.path.dirname(relative_path))
                os.makedirs(output_dir, exist_ok=True)
                output_path = os.path.join(output_dir, output_file)

                # Build the datamodel-code-generator command.
                command = [
                    'datamodel-codegen',
                    '--input', input_path,
                    '--output', output_path,
                    '--input-file-type', 'yaml'
                ]
                print(f"Generating Python model: {output_path}")
                result = subprocess.run(command, capture_output=True, text=True)
                if result.returncode != 0:
                    print(f"Error generating model for {input_path}:\n{result.stderr}", file=sys.stderr)
                else:
                    print(f"Successfully generated: {output_path}")

if __name__ == "__main__":
    generate_py_models()
