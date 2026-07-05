# Trae Agent — Code Wiki

> **Repository:** [bytedance/trae-agent](https://github.com/bytedance/trae-agent)
> **Tech Report:** [arXiv:2507.23370](https://arxiv.org/abs/2507.23370)
> **Language:** Python ≥ 3.12 · **License:** MIT

---

## 1. Project Overview

**Trae Agent** is an LLM-based agent for general-purpose software engineering tasks. It exposes a powerful CLI (`trae-cli`) that translates natural-language instructions into structured tool-calling workflows. The project is research-friendly by design: it offers a transparent, modular architecture that researchers and developers can easily modify, extend, and analyze.

### Key Features
- **Lakeview** — Concise per-step summarisation (a separate "meta-LLM" provides short, tagged summaries of the agent's work).
- **Multi-LLM Support** — OpenAI, Anthropic, Azure, OpenRouter, Doubao, Ollama, and Google Gemini.
- **Rich Tool Ecosystem** — File editing, persistent bash, JSONPath-based JSON editing, structured thinking, task-done marker, MCP plugin integration, and a code knowledge-graph query tool.
- **Interactive Mode** — REPL-style conversational interface (`trae-cli interactive`).
- **Trajectory Recording** — Persists every LLM interaction, tool call, and step result as JSON for debugging and analysis.
- **Flexible Configuration** — YAML-first, with environment variable and CLI override layers.
- **Docker Mode** — Optional sandboxed execution where a container hosts the runtime, and the agent communicates via a pexpect-based shell.

### Application Domain
Software engineering automation: bug fixing, patch generation, test reproduction, code refactoring, repository exploration, and JSON-based config edits.

---

## 2. Repository Layout

```
trae-agent/
├── trae_agent/                  # Main Python package (the core library)
│   ├── agent/                   # Agent abstractions and concrete agent
│   ├── tools/                   # Built-in tools and registry
│   ├── utils/                   # Config, LLM clients, CLI, MCP, trajectory
│   ├── prompt/                  # System prompts
│   ├── dist/                    # PyInstaller-built tool CLIs (for Docker)
│   └── cli.py                   # `trae-cli` Click entry point
├── evaluation/                  # SWE-bench-style evaluation harness + patch selector
├── tests/                       # Unit tests
├── docs/                        # Auxiliary documentation
├── trae_config.yaml.example     # Example config (recommended)
├── trae_config.json.example     # Legacy JSON config example
├── pyproject.toml               # Build / dep manifest (uv, hatchling)
├── Makefile                     # Local dev shortcuts
├── CONTRIBUTING.md
└── README.md
```

---

## 3. High-Level Architecture

The system is composed of **five cooperating layers** that together form a single request → response loop:

```
                     ┌────────────────────────────────────┐
                     │  CLI (Click) — trae_agent/cli.py   │
                     │  run / interactive / show-config   │
                     └────────────────┬───────────────────┘
                                      │ Config + AgentConfig
                                      ▼
   ┌────────────────────────────────────────────────────────────────┐
   │  Agent (factory)            — agent/agent.py                   │
   │  TraeAgent (concrete)       — agent/trae_agent.py              │
   │  BaseAgent (abstract)       — agent/base_agent.py              │
   │  └─ ReAct-style loop: LLM step → tool call → reflect           │
   └───────┬───────────────────┬────────────────────┬───────────────┘
           │                   │                    │
           ▼                   ▼                    ▼
   ┌───────────────┐   ┌────────────────┐   ┌────────────────────┐
   │  LLMClient    │   │ ToolExecutor   │   │ TrajectoryRecorder │
   │  (multi-      │   │ (or Docker     │   │ (JSON persistence) │
   │   provider)   │   │  executor)     │   │                    │
   └───────┬───────┘   └────────┬───────┘   └────────────────────┘
           │                    │
           ▼                    ▼
   Provider adapters      Tool registry
   (OpenAI, Anthropic,    (bash, edit, json_edit,
    Azure, OpenRouter,     sequentialthinking,
    Doubao, Ollama,        task_done, ckg, mcp)
    Google Gemini)
```

### Execution Flow (one task)
1. The CLI loads/parses a `Config` (YAML or legacy JSON), resolves provider/model/api_key with the priority **CLI > ENV > Config > Default**, and constructs an `Agent` factory.
2. `Agent.run(task, extra_args)` calls `TraeAgent.new_task(...)`, which builds the `system` and `user` messages and starts the `TrajectoryRecorder`.
3. `execute_task()` runs an asynchronous `max_steps` loop:
   - **THINKING** — `BaseAgent._run_llm_step` queries the `LLMClient`, which dispatches to the matching provider.
   - The LLM response is checked for completion (`task_done` tool call) or tool invocations.
   - **CALLING_TOOL** — `ToolExecutor` (or `DockerToolExecutor` in container mode) executes the calls sequentially or in parallel.
   - **REFLECTING** — If any tool failed, `reflect_on_result()` appends guidance for the next LLM round.
   - **COMPLETED / ERROR** — The step is recorded and a new step begins.
4. On completion, the trajectory is finalised; if `--must-patch` was set, the agent extracts a `git diff` (with test files filtered) and writes it to `patch_path`.

---

## 4. Module-by-Module Reference

### 4.1 `trae_agent/agent/` — Agent Core

| File | Purpose |
|------|---------|
| `agent_basics.py` | Dataclasses/enums for the agent lifecycle: `AgentStepState`, `AgentState`, `AgentStep`, `AgentExecution`, and `AgentError`. |
| `base_agent.py` | `BaseAgent` — abstract ReAct-style loop, owns the LLM client, tool list, trajectory recorder, optional Docker manager, and CLI console. |
| `trae_agent.py` | `TraeAgent` — concrete software-engineering agent. Specialises completion detection (`task_done`), produces `git diff` patches, and supports MCP servers. |
| `agent.py` | `Agent` — top-level factory with `AgentType` enum. Wires `TraeAgent` to a `TrajectoryRecorder` and a `CLIConsole`. |
| `docker_manager.py` | `DockerManager` — lifecycle of the Docker container, persistent `pexpect` shell, build/load of image files and Dockerfiles, and command execution with sentinel-based exit-code capture. |

#### `BaseAgent` — key methods
- `new_task(task, extra_args, tool_names)` *(abstract)* — initialise the conversation.
- `execute_task() -> AgentExecution` — runs the main `max_steps` loop, calling `_run_llm_step`, `_tool_call_handler`, `_finalize_step`, and recording via the trajectory recorder.
- `_run_llm_step` — single LLM round-trip; routes to `_tool_call_handler` or finalises on completion.
- `_tool_call_handler` — invokes the `ToolExecutor` (`parallel_tool_call` or `sequential_tool_call`), appends `LLMMessage(role="user", tool_result=...)` for each result, and asks `reflect_on_result()` for failure guidance.
- `cleanup_mcp_clients()` *(abstract)* — close all MCP sessions.

#### `TraeAgent` — overrides of significance
- `llm_indicates_task_completed` — true only when the LLM emits a `task_done` tool call (not a fuzzy string match).
- `_is_task_completed` — when `--must-patch` is set, requires a non-empty diff (with test files stripped via `remove_patches_to_tests`) to consider the task complete.
- `task_incomplete_message` — emits `"ERROR! Your Patch is empty. Please provide a patch that fixes the problem."`
- `get_git_diff()` — runs `git --no-pager diff [base_commit] HEAD` in `project_path`.
- `discover_mcp_tools()` / `initialise_mcp()` — connect to whitelisted MCP servers, list their tools, and wrap each in an `MCPTool`.
- `cleanup_mcp_clients()` — async `contextlib.suppress`-guarded teardown of every MCP session.

#### `Agent` factory
Holds a `trajectory_recorder` (auto-creating a path like `trajectories/trajectory_YYYYMMDD_HHMMSS.json` when none is supplied), instantiates `TraeAgent`, optionally launches the console UI concurrently with `agent.execute_task()`, and ensures MCP cleanup in a `finally` block.

---

### 4.2 `trae_agent/tools/` — Tool Ecosystem

#### `base.py` — `Tool`, `ToolExecutor`, data classes
- `ToolCall` / `ToolResult` / `ToolExecResult` / `ToolParameter` — provider-neutral data types.
- `Tool` — abstract base; subclasses must implement `get_name`, `get_description`, `get_parameters`, and async `execute`. Built-in `get_input_schema()` adapts the parameter list to the provider (e.g., OpenAI strict-mode requires every parameter in `required` and sets `additionalProperties: false`).
- `ToolExecutor` — owns a name-normalised tool map (`name.lower().replace("_", "")`). `parallel_tool_call` uses `asyncio.gather`; `sequential_tool_call` awaits in order. `close_tools` releases any resources via each tool's optional `close()`.

#### `bash_tool.py` — `BashTool` + `_BashSession`
A persistent `bash`/`cmd.exe` shell started with `asyncio.create_subprocess_shell`. Commands are wrapped in a sub-shell `(\n<command>\n); echo ,,,,bash-command-exit-$?-,,,,` so exit codes can be parsed from the sentinel; output is separated from stderr. Windows is supported via `cmd.exe /v:on` and `!errorlevel!`. The session can be restarted via the `restart: true` argument.

#### `edit_tool.py` — `TextEditorTool` (registered as `str_replace_based_edit_tool`)
Persistent, stateful file editor supporting four sub-commands:
- `view` — `cat -n` style dump (or `find -maxdepth 2` for directories); respects an optional `[start, end]` `view_range` (use `-1` to mean EOF).
- `create` — writes a new file; refuses to overwrite existing files.
- `str_replace` — replaces an exact `old_str` (must be unique; tabs are expanded); returns a snippet around the change.
- `insert` — inserts `new_str` after a given line.
The Docker-mode counterpart is the PyInstaller-built CLI `dist_tools/edit_tool`, invoked by `DockerToolExecutor._execute_in_docker`.

#### `json_edit_tool.py` — `JSONEditTool`
JSONPath-driven JSON editor using `jsonpath-ng`:
- `view` — dump full file or paths matching a JSONPath.
- `set` — overwrite existing values (uses `jsonpath_expr.update`).
- `add` — add a new key (`Fields`) to a dict or an element at an array `Index`.
- `remove` — pop dict keys or array indices; reversed iteration to keep indices stable.
- `pretty_print` controls indentation of the saved file.

#### `sequential_thinking_tool.py` — `SequentialThinkingTool`
A Chain-of-Thought scaffolding tool. The agent repeatedly calls it with `thought`, `thought_number`, `total_thoughts`, `next_thought_needed`, optional `is_revision` / `revises_thought` (backtrack a previous thought) or `branch_from_thought` / `branch_id` (explore alternatives). The tool keeps a `thought_history` list and a `branches` dict and returns a status summary.

#### `task_done_tool.py` — `TaskDoneTool`
A no-op marker tool. Its only purpose is to signal completion so `TraeAgent.llm_indicates_task_completed` returns `True`. It takes no parameters.

#### `ckg_tool.py` — `CKGTool` and `tools/ckg/ckg_database.py`
A **Code Knowledge Graph** tool. The first call for a codebase path lazily builds a SQLite-backed CKG via `CKGDatabase(codebase_path)` and caches it in `_ckg_databases`. Three commands are exposed: `search_function`, `search_class`, and `search_class_method`. Each returns `file_path:start_line-end_line` plus (optionally) the body, truncated by `MAX_RESPONSE_LEN` (16 000). On agent startup, `clear_older_ckg()` is invoked to prune stale databases.

#### `mcp_tool.py` — `MCPTool`
A thin adapter that wraps a `mcp.types.Tool` and forwards `execute()` to `client.call_tool(name, arguments)`. Used by `TraeAgent.discover_mcp_tools` to expose MCP-server tools in the same `Tool` interface.

#### `run.py` — utility
- `maybe_truncate(content, truncate_after=16 000)` — appends `<response clipped><NOTE>…` when output is too long.
- `run(cmd, timeout=120)` — async subprocess wrapper used by the editor for `view` of directories.

#### `docker_tool_executor.py` — `DockerToolExecutor`
Routes tool calls to either a local `ToolExecutor` or a `DockerManager` shell. The set `{"bash", "str_replace_based_edit_tool", "json_edit_tool"}` is delegated to the container; others run locally. Host paths inside the mounted workspace are translated to container paths via `_translate_path`. The `edit` and `json_edit` Docker tools are themselves built by `cli.py::build_with_pyinstaller` (PyInstaller bundles of `edit_tool_cli.py` and `json_edit_tool_cli.py`) and copied into `trae_agent/dist/`.

#### `__init__.py` — registry
`tools_registry: dict[str, type[Tool]]` is the canonical lookup. Adding a new tool means: (1) implement the `Tool` subclass, (2) register it here, (3) optionally add the name to `TraeAgentToolNames` in `agent/trae_agent.py`.

---

### 4.3 `trae_agent/utils/llm_clients/` — Provider Adapters

#### Common
- `llm_basics.py` — `LLMMessage` (role + content + optional tool_call / tool_result), `LLMUsage` (input/output/cache/reasoning tokens with `__add__`), `LLMResponse` (content, usage, model, finish_reason, tool_calls).
- `retry_utils.py` — `retry_with(func, provider_name, max_retries)` decorator. On failure it sleeps a random 3–30 s, prints the traceback, and retries up to `max_retries` times.
- `llm_client.py` — `LLMClient` factory keyed on `LLMProvider` enum (`openai`, `anthropic`, `azure`, `ollama`, `openrouter`, `doubao`, `google`). Forwards `set_trajectory_recorder`, `set_chat_history`, and `chat` to the concrete client.
- `base_client.py` — `BaseLLMClient` ABC; persists `trajectory_recorder`; declares `set_chat_history`, `chat`, and a default `supports_tool_calling`.

#### Provider-specific clients
- `openai_client.py` — uses `client.responses.create` (the **Responses API**, not chat completions); translates `LLMMessage` to `ResponseInputParam`, function calls to `ResponseFunctionToolCallParam`, results to `FunctionCallOutput`. Tools are emitted as `FunctionToolParam` with `strict=True`. Skips the `temperature` argument for `o3`, `o4-mini`, and `gpt-5` models.
- `anthropic_client.py` — uses `client.messages.create`; recognises `str_replace_based_edit_tool` and `bash` and maps them to native Anthropic tools (`TextEditor20250429`, `ToolBash20250124`) for better quality on Claude. System messages are stored in `self.system_message` separately.
- `openai_compatible_base.py` — abstract `ProviderConfig` and concrete `OpenAICompatibleClient` that share logic for Azure, OpenRouter, Doubao, Ollama, and Google Gemini. Selects `max_completion_tokens` vs `max_tokens` based on `ModelConfig.should_use_max_completion_tokens()`.
- `azure_client.py`, `openrouter_client.py`, `doubao_client.py`, `ollama_client.py`, `google_client.py` — each subclasses `OpenAICompatibleClient` and supplies a small `ProviderConfig` (client builder, headers, tool-support predicate, service/provider names).

---

### 4.4 `trae_agent/utils/` — Supporting Subsystems

#### `config.py` — configuration model
- `ModelProvider` — `api_key`, `provider`, optional `base_url` / `api_version` (Azure).
- `ModelConfig` — `model`, `model_provider`, sampling params, `max_tokens` vs `max_completion_tokens` (Azure), `candidate_count` (Gemini), `stop_sequences`, `parallel_tool_calls`, `max_retries`, `supports_tool_calling`. `resolve_config_values` applies the priority `CLI > ENV > Config > Default` (mapping provider name → `PROVIDER_API_KEY` / `PROVIDER_BASE_URL`).
- `MCPServerConfig` — supports stdio (`command` + `args`), SSE (`url`), streamable HTTP (`http_url` + `headers`), and websocket (`tcp`).
- `AgentConfig` / `TraeAgentConfig` — base and concrete agent configuration (default tool list, `enable_lakeview`, `max_steps`).
- `LakeviewConfig` — secondary model for Lakeview summarisation.
- `Config` — top-level YAML loader:
  - `Config.create(config_file=...)` parses YAML (or falls back to `create_from_legacy_config` for `.json`).
  - `Config.resolve_config_values(...)` walks the tree and applies overrides.
  - `resolve_config_value(...)` — the CLI > ENV > Config > Default helper.

#### `mcp_client.py`
`MCPClient` (one per server) wraps `mcp.ClientSession` over an `AsyncExitStack`. The current implementation supports **stdio** transport only (`stdio_client(StdioServerParameters(...))`); HTTP/SSE/websocket raise `NotImplementedError`. After `connect_and_discover`, the client returns its tools which the agent wraps in `MCPTool`s. `cleanup` closes the exit stack.

#### `trajectory_recorder.py`
`TrajectoryRecorder` persists a single JSON file describing the run:
- `start_recording` initialises the meta block.
- `record_llm_interaction` appends an LLM round (messages, response, usage, available tools).
- `record_agent_step` appends a step (state, messages, response, tool calls, results, reflection, error).
- `update_lakeview` decorates a step with the Lakeview summary.
- `finalize_recording` records `end_time`, `success`, `final_result`, `execution_time`.
- `save_trajectory` writes the entire dict to disk after every call (crash-safe).

#### `lake_view.py` — Lakeview summariser
`LakeView` is a "meta-LLM" that summarises each step:
- `EXTRACTOR_PROMPT` — produces a `<task>…</task><details>…</details>` pair (≤10 + ≤30 words).
- `TAGGER_PROMPT` — assigns one or more labels from `KNOWN_TAGS` (WRITE_TEST, VERIFY_TEST, EXAMINE_CODE, WRITE_FIX, VERIFY_FIX, REPORT, THINK, OUTLIER), each rendered as an emoji.
- `create_lakeview_step(agent_step)` runs the extractor + tagger and returns a `LakeViewStep`.

#### `cli/` — Console UI
- `cli_console.py` — `CLIConsole` ABC and shared table helpers (`generate_agent_step_table`). Defines `ConsoleMode` (RUN / INTERACTIVE) and `ConsoleType` (SIMPLE / RICH).
- `simple_console.py` — line-by-line Rich output suitable for terminals and CI logs.
- `rich_console.py` — full Textual TUI that displays a live-updating step table plus Lakeview panels.
- `console_factory.py` — picks a console implementation based on user flags and mode.

#### `legacy_config.py`
Adapter for the old `trae_config.json` schema. Exposed only via `Config.create_from_legacy_config`.

#### `constants.py`, `llm_clients/readme.md`
Internal constants and the providers README.

---

### 4.5 `trae_agent/prompt/agent_prompt.py`

`TRAE_AGENT_SYSTEM_PROMPT` — the system prompt used by `TraeAgent.get_system_prompt()`. It instructs the LLM to act as a senior software engineer, requires absolute file paths, and outlines a seven-step workflow ending in a `task_done` call.

---

### 4.6 `trae_agent/cli.py` — `trae-cli` Entry Point

The Click-based CLI exposes four sub-commands:

| Sub-command | Purpose |
|-------------|---------|
| `run` | Execute a single task. Accepts the task as a positional argument or via `--file`; supports all provider/model overrides, Docker mode, and rich/simple consoles. |
| `interactive` | REPL loop for iterative development. Two backends: simple console (command line) and rich console (Textual TUI). |
| `show-config` | Prints the resolved configuration (general + per-provider) using Rich tables. |
| `tools` | Lists every registered tool and its description. |

`run` performs these high-level steps:
1. Validate mutually-exclusive Docker options; if any is set, call `check_docker()` and ensure the PyInstaller tool CLIs exist (`build_with_pyinstaller` if missing).
2. Resolve task from positional argument or `--file`; verify it exists.
3. `Config.create(...).resolve_config_values(...)` — apply CLI/ENV overrides.
4. Build a `CLIConsole` via the factory.
5. Construct the `Agent` factory and run `agent.run(task, task_args)`.
6. Print the final trajectory path; gracefully handle `KeyboardInterrupt` and `DockerException`.

---

### 4.7 `evaluation/`

#### `run_evaluation.py` / `utils.py`
Top-level harness for running the agent on a dataset (typically SWE-bench). Handles dockerised task execution, scoring, and result aggregation.

#### `patch_selection/`
A selector agent that picks the most likely-to-be-correct patch from multiple candidate patches. It reuses the BashTool / EditTool pattern (`trae_selector/tools/...`) and provides `selector.py`, `selector_agent.py`, `sandbox.py`, and `analysis.py`.

---

## 5. Dependency Graph

```
cli.py ─┬─► agent/agent.py
        │       │
        │       ▼
        │   agent/base_agent.py ─┬─► utils/llm_clients/llm_client.py
        │       │                │         │
        │       │                │         ▼
        │       │                │   llm_clients/{openai,anthropic,
        │       │                │     openai_compatible_base,...}.py
        │       │                │
        │       │                └─► tools/{base,bash_tool,edit_tool,
        │       │                       json_edit_tool,sequential_thinking_tool,
        │       │                       task_done_tool,ckg_tool,mcp_tool}.py
        │       │
        │       └─► agent/trae_agent.py ─► utils/mcp_client.py ─► tools/mcp_tool.py
        │
        └─► utils/config.py ─► utils/legacy_config.py
        └─► utils/cli/* ─► utils/lake_view.py
        └─► agent/docker_manager.py ─► tools/docker_tool_executor.py
                                          │
                                          └─► agent/base_agent.py (via
                                              DockerManager.execute)
```

External runtime deps: `click`, `pydantic`, `rich`, `textual`, `pyyaml`, `python-dotenv`, `mcp`, `anthropic`, `openai`, `google-genai`, `ollama`, `tree-sitter`, `tree-sitter-languages`, `jsonpath-ng`, `docker`, `pexpect`, `pyinstaller`.

---

## 6. Configuration & Operational Notes

### YAML Config (recommended)
```yaml
agents:
  trae_agent:
    enable_lakeview: true
    model: trae_agent_model
    max_steps: 200
    tools: [bash, str_replace_based_edit_tool, sequentialthinking, task_done]

model_providers:
  anthropic: {api_key: sk-..., provider: anthropic}
  openai:    {api_key: sk-..., provider: openai}

models:
  trae_agent_model:
    model_provider: anthropic
    model: claude-sonnet-4-20250514
    max_tokens: 4096
    temperature: 0.5

mcp_servers:
  playwright:
    command: npx
    args: ["@playwright/mcp@0.0.27"]
```

**Resolution priority:** `CLI args > config file > env vars > defaults`.

Environment-variable shortcuts: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `OPENROUTER_API_KEY`, `DOUBAO_API_KEY`, plus the matching `*_BASE_URL` variables.

### Legacy JSON Config
`docs/legacy_config.md` documents the old `trae_config.json` schema, still loadable via `Config.create_from_legacy_config`. New users should prefer YAML.

---

## 7. Running the Project

### Requirements
- Python 3.12+
- [`uv`](https://docs.astral.sh/uv/) package manager
- A valid API key for the chosen provider
- (Optional) Docker daemon, for `--docker-image` / `--docker-container-id` / `--dockerfile-path` / `--docker-image-file` modes

### Install
```bash
git clone https://github.com/bytedance/trae-agent.git
cd trae-agent
uv sync --all-extras
source .venv/bin/activate
cp trae_config.yaml.example trae_config.yaml    # then fill in API keys
```

### Common Commands
```bash
# Show resolved configuration
trae-cli show-config

# Single task
trae-cli run "Create a hello world Python script"

# With explicit provider/model
trae-cli run "Fix the bug in main.py" --provider openai --model gpt-4o
trae-cli run "Add unit tests"          --provider anthropic --model claude-sonnet-4-20250514
trae-cli run "Optimize this algorithm" --provider google --model gemini-2.5-flash
trae-cli run "Refactor the database"   --provider doubao  --model doubao-seed-1.6
trae-cli run "Comment this code"       --provider ollama  --model qwen3

# Save trajectory
trae-cli run "Debug authentication" --trajectory-file debug_session.json

# Force a non-empty patch
trae-cli run "Update API endpoints" --must-patch --patch-path fix.patch

# Interactive mode (simple or rich TUI)
trae-cli interactive
trae-cli interactive --provider openai --model gpt-4o --max-steps 30 --console-type rich
```

### Docker Mode
```bash
# Spin up a new container from an image
trae-cli run "Add tests for utils module" --docker-image python:3.11 --working-dir ./repo

# Build from a Dockerfile
trae-cli run "Debug authentication" --dockerfile-path /abs/path/Dockerfile

# Load a local image tarball
trae-cli run "Fix the bug" --docker-image-file /abs/path/trae_agent_custom.tar

# Attach to an existing container
trae-cli run "Update API endpoints" --docker-container-id 91998a56056c

# Remove the container after the task
trae-cli run "..." --docker-image python:3.11 --docker-keep false
```
On first Docker use, the agent invokes `build_with_pyinstaller()` to bundle `edit_tool` and `json_edit_tool` into `trae_agent/dist/`.

### Tests
```bash
uv run pytest                              # full suite
uv run pytest tests/agent                 # agent loop tests
uv run pytest tests/tools                 # tool tests
uv run pytest tests/utils                 # LLM client + MCP + config tests
```

### Development
- Lint / format: `ruff` (configured in `pyproject.toml`, line length 100, rules B/SIM/C4/E/F/I).
- Pre-commit: `.pre-commit-config.yaml`.
- Build artifact: `Makefile` and `pyproject.toml` (Hatchling backend, target `trae_agent` package, `trae-cli` script entry point).

---

## 8. Extending Trae Agent

Common extension points:
1. **Add a new tool** — subclass `Tool`, implement `get_name/get_description/get_parameters/execute`, register in `trae_agent/tools/__init__.py::tools_registry`, and add the name to `TraeAgentToolNames` in `agent/trae_agent.py` if it should be on by default.
2. **Add a new provider** — subclass `OpenAICompatibleClient` and a `ProviderConfig`, then add a branch in `llm_clients/llm_client.py::LLMClient.__init__`.
3. **Add a new agent flavour** — subclass `BaseAgent` and add the new type to the `AgentType` enum in `agent/agent.py`.
4. **Custom console** — implement the `CLIConsole` ABC and register it in `ConsoleFactory`.
5. **Custom completion heuristics** — override `llm_indicates_task_completed` and `_is_task_completed` in your agent (see `TraeAgent` for an example).

---

## 9. Citation

```bibtex
@article{traeresearchteam2025traeagent,
  title  = {Trae Agent: An LLM-based Agent for Software Engineering with Test-time Scaling},
  author = {Trae Research Team and Pengfei Gao and Zhao Tian and Xiangxin Meng and
            Xinchen Wang and Ruida Hu and Yuanan Xiao and Yizhou Liu and Zhao Zhang and
            Junjie Chen and Cuiyun Gao and Yun Lin and Yingfei Xiong and Chao Peng and Xia Liu},
  year   = {2025},
  eprint  = {2507.23370},
  archivePrefix = {arXiv},
  primaryClass  = {cs.SE},
  url = {https://arxiv.org/abs/2507.23370}
}
```

## 10. License

MIT — see [LICENSE](https://github.com/bytedance/trae-agent/blob/main/LICENSE).
