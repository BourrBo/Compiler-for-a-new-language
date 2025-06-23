import { Lexer } from './lexer';
import { Parser } from './parser';
import { SemanticAnalyzer } from './semantic';
import { IRGenerator } from './ir';
import { Optimizer } from './optimizer';
import { AssemblyGenerator } from './codegen';
import { Interpreter } from './interpreter';
import type { Token, Program, SemanticReport, IRInstruction } from './types';

export interface CompilationResult {
  tokens: Token[];
  ast: Program | null;
  semanticReport: SemanticReport;
  ir: IRInstruction[];
  optimizedIr: IRInstruction[];
  assembly: string;
  error: string | null;
  executionOutput: number | string;
}

export function compile(sourceCode: string): CompilationResult {
  const result: CompilationResult = {
    tokens: [],
    ast: null,
    semanticReport: { errors: [] },
    ir: [],
    optimizedIr: [],
    assembly: '',
    error: null,
    executionOutput: ''
  };

  try {
    // 1. Lexical Analysis
    const lexer = new Lexer(sourceCode);
    result.tokens = lexer.tokenize();

    // 2. Syntactic Analysis (Parsing)
    const parser = new Parser(result.tokens);
    result.ast = parser.parse();

    // 3. Semantic Analysis
    const semanticAnalyzer = new SemanticAnalyzer();
    result.semanticReport = semanticAnalyzer.analyze(result.ast);
    if (result.semanticReport.errors.length > 0) {
      result.error = "Semantic errors found.";
      return result; // Stop if there are semantic errors
    }

    // 4. Intermediate Code Generation
    const irGenerator = new IRGenerator();
    result.ir = irGenerator.generate(result.ast);

    // 5. Code Optimization
    const optimizer = new Optimizer();
    result.optimizedIr = optimizer.optimize(result.ir);

    // 6. Code Generation
    const codeGenerator = new AssemblyGenerator();
    result.assembly = codeGenerator.generate(result.ast, result.optimizedIr);

    // 7. Interpretation
    const interpreter = new Interpreter(result.ast, result.optimizedIr);
    result.executionOutput = interpreter.run();


  } catch (e: any) {
    result.error = e.message;
  }

  return result;
}
