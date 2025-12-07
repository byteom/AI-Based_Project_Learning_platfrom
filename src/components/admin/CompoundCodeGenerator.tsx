"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { generateCompoundCode } from "@/ai/flows/generate-compound-code";
import { Loader2, Plus, Trash2, Code, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CodeBlock from "@/components/projects/CodeBlock";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypePrism from "rehype-prism-plus";

interface FileSpec {
  name: string;
  type: string;
  description: string;
}

export function CompoundCodeGenerator() {
  const [description, setDescription] = useState("");
  const [technology, setTechnology] = useState("");
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [dependencyInput, setDependencyInput] = useState("");
  const [files, setFiles] = useState<FileSpec[]>([
    { name: "", type: "", description: "" }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const { toast } = useToast();

  // Get API key from localStorage
  useEffect(() => {
    const GEMINI_KEY_STORAGE = 'Project Code_gemini_api_key';
    const stored = typeof window !== 'undefined' ? localStorage.getItem(GEMINI_KEY_STORAGE) : null;
    setApiKey(stored);
  }, []);

  const handleAddFile = () => {
    setFiles([...files, { name: "", type: "", description: "" }]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleFileChange = (index: number, field: keyof FileSpec, value: string) => {
    const updated = [...files];
    updated[index] = { ...updated[index], [field]: value };
    setFiles(updated);
  };

  const handleAddDependency = () => {
    if (dependencyInput.trim()) {
      setDependencies([...dependencies, dependencyInput.trim()]);
      setDependencyInput("");
    }
  };

  const handleRemoveDependency = (index: number) => {
    setDependencies(dependencies.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!description.trim() || !technology.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide a description and technology stack.",
      });
      return;
    }

    const validFiles = files.filter(f => f.name && f.type && f.description);
    if (validFiles.length === 0) {
      toast({
        variant: "destructive",
        title: "No Files Specified",
        description: "Please specify at least one file to generate.",
      });
      return;
    }

    if (!apiKey) {
      toast({
        variant: "destructive",
        title: "API Key Required",
        description: "Please enter your Gemini API key in the sidebar.",
      });
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      const output = await generateCompoundCode({
        description,
        technology,
        files: validFiles,
        dependencies: dependencies.length > 0 ? dependencies : undefined,
        apiKey,
      });

      setResult(output);
      toast({
        title: "Code Generated!",
        description: `Successfully generated ${output.files.length} files.`,
      });
    } catch (error: any) {
      console.error("Failed to generate compound code:", error);
      const errorMessage = error?.message || error?.toString() || '';
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: errorMessage.includes('API key') 
          ? "Please check your API key."
          : "There was a problem generating the code. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadFile = (file: any) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-headline">Compound Code Generator</h2>
        <p className="text-muted-foreground mt-1">
          Generate multiple related code files/components together for a complete feature or module.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Code Generation Request</CardTitle>
          <CardDescription>
            Describe what you want to build and specify the files you need.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="e.g., Create a user authentication system with login, register, and logout components"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Technology Stack</Label>
            <Input
              placeholder="e.g., React with TypeScript, Node.js with Express, Python Flask"
              value={technology}
              onChange={(e) => setTechnology(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Dependencies (Optional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., react-router-dom, express, axios"
                value={dependencyInput}
                onChange={(e) => setDependencyInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddDependency()}
              />
              <Button type="button" onClick={handleAddDependency}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {dependencies.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {dependencies.map((dep, i) => (
                  <span key={i} className="flex items-center gap-1 px-2 py-1 bg-secondary rounded text-sm">
                    {dep}
                    <button onClick={() => handleRemoveDependency(i)}>
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Files to Generate</Label>
              <Button type="button" size="sm" variant="outline" onClick={handleAddFile}>
                <Plus className="h-4 w-4 mr-2" />
                Add File
              </Button>
            </div>
            {files.map((file, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>File Name</Label>
                    <Input
                      placeholder="e.g., Login.tsx"
                      value={file.name}
                      onChange={(e) => handleFileChange(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Input
                      placeholder="e.g., component, service"
                      value={file.type}
                      onChange={(e) => handleFileChange(index, 'type', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="What this file does"
                        value={file.description}
                        onChange={(e) => handleFileChange(index, 'description', e.target.value)}
                      />
                      {files.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Code...
              </>
            ) : (
              <>
                <Code className="mr-2 h-4 w-4" />
                Generate Compound Code
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Code</CardTitle>
            <CardDescription>
              {result.files.length} files generated successfully
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="setup" className="w-full">
              <TabsList>
                <TabsTrigger value="setup">Setup Instructions</TabsTrigger>
                <TabsTrigger value="files">Generated Files</TabsTrigger>
              </TabsList>
              <TabsContent value="setup" className="space-y-4">
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                    {result.setupInstructions}
                  </ReactMarkdown>
                </div>
                {result.dependencies.length > 0 && (
                  <div>
                    <h3 className="font-bold mb-2">Dependencies to Install:</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {result.dependencies.map((dep: string, i: number) => (
                        <li key={i} className="font-mono text-sm">{dep}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="files" className="space-y-4">
                {result.files.map((file: any, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{file.fileName}</CardTitle>
                          <CardDescription>{file.filePath}</CardDescription>
                          <p className="text-sm text-muted-foreground mt-1">{file.description}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadFile(file)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CodeBlock className={`language-${file.language}`}>
                        {file.content}
                      </CodeBlock>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

