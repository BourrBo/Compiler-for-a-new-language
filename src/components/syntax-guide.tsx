import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const CodeBlock = ({ children }: { children: React.ReactNode }) => (
    <pre className="font-code text-sm bg-muted rounded-md p-3 my-2 overflow-auto">
        <code>{children}</code>
    </pre>
);

export function SyntaxGuide() {
  return (
    <div className="h-full overflow-auto pr-4">
        <h2 className="text-2xl font-bold mb-2">SimpleC Language Syntax Guide</h2>
        <p className="text-muted-foreground mb-4">A brief overview of the language features.</p>
        
        <div className="space-y-6">
            <section>
                <h3 className="text-lg font-semibold">Comments</h3>
                <p>Single-line comments start with <code>//</code>.</p>
                <CodeBlock>
{`// This is a comment
int x = 5; // This is an inline comment`}
                </CodeBlock>
            </section>

            <Separator />

            <section>
                <h3 className="text-lg font-semibold">Data Types</h3>
                <p>The only supported data type is <code>int</code> for 32-bit signed integers.</p>
            </section>
            
            <Separator />

            <section>
                <h3 className="text-lg font-semibold">Variables</h3>
                <p>Variables must be declared with the <code>int</code> type before use.</p>
                <h4 className="font-medium mt-2">Declaration:</h4>
                <CodeBlock>int a;</CodeBlock>
                <h4 className="font-medium mt-2">Declaration with Initialization:</h4>
                <CodeBlock>int b = 10;</CodeBlock>
                <h4 className="font-medium mt-2">Assignment:</h4>
                <CodeBlock>a = b + 5;</CodeBlock>
            </section>

            <Separator />

            <section>
                <h3 className="text-lg font-semibold">Functions</h3>
                <p>Functions are defined with a return type, name, and parameters. The entry point of the program must be a function named <code>main</code>.</p>
                <CodeBlock>
{`int add(int x, int y) {
    return x + y;
}

int main() {
    int sum;
    sum = add(7, 3); // sum will be 10
    return sum;
}`}
                </CodeBlock>
            </section>

            <Separator />

            <section>
                <h3 className="text-lg font-semibold">Control Flow</h3>
                <h4 className="font-medium mt-2">If-Else Statement:</h4>
                <p>The <code>else</code> block is optional.</p>
                <CodeBlock>
{`if (a > b) {
    return a;
} else {
    return b;
}`}
                </CodeBlock>
                <h4 className="font-medium mt-2">While Loop:</h4>
                <CodeBlock>
{`int i = 0;
while (i < 5) {
    i = i + 1;
}
return i; // returns 5`}
                </CodeBlock>
            </section>

            <Separator />

            <section>
                <h3 className="text-lg font-semibold">Operators</h3>
                <ul className="list-disc list-inside space-y-1">
                    <li>Arithmetic: <code>+</code>, <code>-</code>, <code>*</code>, <code>/</code></li>
                    <li>Comparison: <code>==</code>, <code>!=</code>, <code>&lt;</code>, <code>&gt;</code>, <code>&lt;=</code>, <code>&gt;=</code></li>
                    <li>Assignment: <code>=</code></li>
                </ul>
            </section>
        </div>
    </div>
  );
}
