# **App Name**: SimpleC Compiler IDE

## Core Features:

- Code Editor: Code Editor: A text editor to write and modify the SimpleC code.
- Lexical Analysis: Lexical Analysis: Tokenizes the source code into a stream of tokens. Each token represents a basic building block of the language.
- Syntactic Analysis: Syntactic Analysis: Parses the token stream to generate an Abstract Syntax Tree (AST), verifying the grammatical structure of the code.
- Semantic Analysis: Semantic Analysis: Performs static analysis on the AST to ensure type correctness and resolve identifiers. May include bootstrapping to handle initial compilation phases.
- Intermediate Code Generation: Intermediate Code Generation: Translates the AST into an intermediate representation for optimization.
- Code Optimization: Code Optimization: Improves the intermediate code to reduce resource consumption and increase execution speed.
- Code Generation: Code Generation: Converts optimized intermediate code to x86-64 assembly language, compatible with standard assemblers.

## Style Guidelines:

- Primary color: Deep violet (#673AB7) for a professional and sophisticated feel.
- Background color: Very light gray (#F5F5F5), providing a neutral backdrop to avoid eye strain.
- Accent color: Teal (#009688), used sparingly for key interactive elements and important messages.
- Body and headline font: 'Inter' (sans-serif) for a modern and readable interface.
- Code font: 'Source Code Pro' for displaying code clearly, aiding in debugging and readability.
- Layout: Use a left sidebar for project navigation and compiler options, and a main panel for the code editor and output display.