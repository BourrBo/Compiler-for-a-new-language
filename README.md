# Custom Compiler for a New Language

A comprehensive, modular compiler built from scratch in C/C++ for a custom user-friendly programming language. This project systematically breaks down the compilation process across all core classical phases—from raw source text down to an optimized, executable, or intermediate front-end target.

## 🚀 Features & Architecture

The compiler is cleanly decoupled into standard pipeline phases, routing files sequentially into a cohesive front-end engine:

1. **Lexical Analyzer (Scanner):** Tokenizes raw source code stream into meaningful lexemes while filtering out whitespace and comments.
2. **Syntax Analyzer (Parser):** Parses tokens against a deterministic context-free grammar to generate an Abstract Syntax Tree (AST).
3. **Semantic Analyzer & Symbol Table:** Handles scope-aware variable/function resolutions, type-checking, and enforces language semantics.
4. **Intermediate Code Generator (ICG):** Translates the AST into a linear Intermediate Representation (IR), decoupling the target machine from the source architecture.
5. **Code Optimizer (Optional/Planned):** Performs basic block transformations and dead-code elimination to streamline execution.

## 🛠 Prerequisites

Ensure you have a modern C/C++ toolchain installed on your system.

* **Compiler:** `gcc` or `g++` (supporting C++17 or later)
* **Build Automation:** `make`
* **Parser/Scanner Generators (If applicable):** `flex` / `bison` (or equivalent tools if not using manually written recursive-descent structures)

## 📁 Project Structure

```text
├── src/
│   ├── main.c            # Compiler driver / Front-end coordinator
│   ├── lexer.c           # Lexical analysis logic (.h/.c)
│   ├── parser.c          # AST generation and grammar rules (.h/.c)
│   ├── symbol_table.c    # Scope management and type mappings (.h/.c)
│   ├── semantics.c       # Semantic analysis routines (.h/.c)
│   └── codegen.c         # Intermediate / Target code generation (.h/.c)
├── include/              # Shared compiler headers
├── tests/                # Test source files (.lang / .txt)
└── Makefile              # Automated build configuration
