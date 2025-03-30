setup:
	uv venv --python=python3.11 .venv && uv pip install -r requirements.txt

install:
	uv pip install -r requirements.txt

generate-py-models:
	source .venv/bin/activate && python -m src.generate_py_models
