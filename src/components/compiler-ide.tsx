"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { compile } from "@/compiler";
import type { CompilationResult } from "@/compiler";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { SyntaxGuide } from "./syntax-guide";

const sampleProgram = `// Computes factorial of a number
int factorial(int n) {
    if (n < 2) {
        return 1;
    } else {
        return n * factorial(n - 1);
    }
}

// Main entry point
int main() {
    int result;
    result = factorial(5); // Calculate factorial of 5
    return result;
}
`;

export function CompilerIDE() {
  const [code, setCode] = useState<string>(sampleProgram);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("execution");
  const [compilationResult, setCompilationResult] = useState<CompilationResult | null>(null);

  const handleCompile = () => {
    setIsCompiling(true);
    try {
      const result = compile(code);
      setCompilationResult(result);
      if (result.error || result.semanticReport.errors.length > 0) {
        setActiveTab("error");
      } else {
        setActiveTab("execution");
      }
    } catch (e: any) {
      setCompilationResult({
        tokens: [],
        ast: null,
        semanticReport: { errors: [] },
        ir: [],
        optimizedIr: [],
        assembly: "",
        error: e.message,
        executionOutput: `Client-side error: ${e.message}`,
      });
      setActiveTab("error");
    } finally {
      setIsCompiling(false);
    }
  };

  const renderContent = (data: any) => {
    if (!data) return <p className="text-muted-foreground">Run the compiler to see output.</p>;
    if (Array.isArray(data) && data.length === 0) return <p className="text-muted-foreground">No output for this stage.</p>;
    if (typeof data === 'object' && Object.keys(data).length === 0) return <p className="text-muted-foreground">No output for this stage.</p>;
    if (typeof data === 'string' && data === '') return <p className="text-muted-foreground">No output for this stage.</p>;

    return (
      <pre className="font-code text-sm bg-muted rounded-md p-4 overflow-auto max-h-[40vh]">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };
  
  const renderAssembly = (asm: string) => {
    if (!asm) return <p className="text-muted-foreground">Run the compiler to see output.</p>;
     return (
        <pre className="font-code text-sm bg-muted rounded-md p-4 overflow-auto max-h-[40vh]">
            <code>{asm}</code>
        </pre>
    );
  }

  const renderError = (error: string | null, semanticErrors: string[]) => {
    if (!error && semanticErrors.length === 0) {
      return <p className="text-muted-foreground">No errors found. Great job!</p>;
    }
    const allErrors = [error, ...semanticErrors].filter(Boolean).join('\n');
    return (
      <Alert variant="destructive" className="max-h-[40vh] overflow-auto">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Compilation Error</AlertTitle>
        <AlertDescription>
          <pre className="font-code whitespace-pre-wrap">{allErrors}</pre>
        </AlertDescription>
      </Alert>
    );
  };

  const renderExecutionOutput = (output: number | string | undefined | null) => {
    if (output === null || output === undefined || output === '') {
      return <p className="text-muted-foreground">Run the compiler to see execution output.</p>;
    }
    
    const isError = typeof output === 'string' && output.startsWith('Execution Error:');
    
    if (isError) {
      return (
        <Alert variant="destructive" className="max-h-[40vh] overflow-auto">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Execution Error</AlertTitle>
          <AlertDescription>
            <pre className="font-code whitespace-pre-wrap">{output.replace('Execution Error: ', '')}</pre>
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="font-code text-lg bg-muted rounded-md p-4 overflow-auto max-h-[40vh] h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">Program returned</p>
          <p className="text-5xl font-bold">{output}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground p-4 gap-4">
      <header className="flex items-center justify-between bg-card border rounded-lg p-3 shadow-sm">
        <h1 className="text-xl font-bold font-headline text-primary">SimpleC Compiler IDE</h1>
        <Button onClick={handleCompile} disabled={isCompiling} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          {isCompiling ? "Compiling..." : "Compile & Run"}
        </Button>
      </header>
      
      <div className="flex-1 grid grid-rows-2 gap-4">
        <Card className="flex-1 flex flex-col shadow-lg">
          <CardHeader>
            <CardTitle>Source Code</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-full font-code text-base resize-none"
              placeholder="Write your SimpleC code here..."
            />
          </CardContent>
        </Card>

        <Card className="flex-1 flex flex-col shadow-lg">
          <CardContent className="p-4 flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-8">
                <TabsTrigger value="syntax">Syntax</TabsTrigger>
                <TabsTrigger value="execution">Output</TabsTrigger>
                <TabsTrigger value="assembly">Assembly</TabsTrigger>
                <TabsTrigger value="tokens">Tokens</TabsTrigger>
                <TabsTrigger value="ast">AST</TabsTrigger>
                <TabsTrigger value="semantic">Semantics</TabsTrigger>
                <TabsTrigger value="ir">IR</TabsTrigger>
                <TabsTrigger value="error">Errors</TabsTrigger>
              </TabsList>
              <div className="flex-1 mt-4 overflow-hidden">
                <TabsContent value="syntax" className="h-full"><SyntaxGuide /></TabsContent>
                <TabsContent value="execution" className="h-full">{renderExecutionOutput(compilationResult?.executionOutput)}</TabsContent>
                <TabsContent value="assembly" className="h-full">{renderAssembly(compilationResult?.assembly ?? '')}</TabsContent>
                <TabsContent value="tokens" className="h-full">{renderContent(compilationResult?.tokens)}</TabsContent>
                <TabsContent value="ast" className="h-full">{renderContent(compilationResult?.ast)}</TabsContent>
                <TabsContent value="semantic" className="h-full">{renderContent(compilationResult?.semanticReport)}</TabsContent>
                <TabsContent value="ir" className="h-full">{renderContent(compilationResult?.ir)}</TabsContent>
                <TabsContent value="error" className="h-full">{renderError(compilationResult?.error ?? null, compilationResult?.semanticReport?.errors ?? [])}</TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
