import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, 
  Upload, 
  FileText, 
  Download, 
  Sparkles, 
  Trash2, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Copy,
  Check
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { jsPDF } from "jspdf";
import { generateStudyNotes } from "@/src/lib/gemini";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export default function App() {
  const [inputText, setInputText] = useState("");
  const [isEli5, setIsEli5] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    if (!notes) return;
    navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateStudyNotes(inputText, isEli5);
      setNotes(result);
    } catch (err) {
      setError("Failed to generate notes. Please check your API key and try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Only PDF files are supported.");
      return;
    }

    setIsLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const response = await fetch("/api/parse-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to parse PDF");
      
      const data = await response.json();
      setInputText(data.text);
    } catch (err) {
      setError("Failed to read PDF. You can try pasting the text manually.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const exportToPDF = () => {
    if (!notes) return;
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(notes.replace(/[#*]/g, ''), 180);
    doc.text("Study Notes", 10, 10);
    doc.text(splitText, 10, 20);
    doc.save("study-notes.pdf");
  };

  const clearAll = () => {
    setInputText("");
    setNotes(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">StudyGenie</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="eli5-mode" className="text-sm font-medium text-gray-600">
                Explain like I'm 5
              </Label>
              <Switch 
                id="eli5-mode" 
                checked={isEli5} 
                onCheckedChange={setIsEli5}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Input Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <Card className="border-gray-200 shadow-sm overflow-hidden bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Source Content
                </CardTitle>
                <CardDescription>
                  Paste your study material or upload a PDF to get started.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div 
                  className={cn(
                    "relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 flex flex-col items-center justify-center gap-3 group",
                    isDragging ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300 bg-gray-50/50",
                    inputText && "py-4"
                  )}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                >
                  {!inputText && (
                    <>
                      <div className="bg-white p-3 rounded-full shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700">Drop your PDF here</p>
                        <p className="text-xs text-gray-500 mt-1">or click to browse files</p>
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept=".pdf"
                      />
                    </>
                  )}
                  {inputText && (
                    <div className="w-full flex items-center justify-between px-2">
                      <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        Content Loaded
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setInputText("")} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Text Content</Label>
                  <Textarea 
                    placeholder="Paste your text here..." 
                    className="min-h-[300px] resize-none border-gray-200 focus-visible:ring-blue-500 bg-white"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50/50 border-t border-gray-100 p-4 flex justify-between items-center">
                <Button variant="ghost" size="sm" onClick={clearAll} className="text-gray-500">
                  Clear All
                </Button>
                <Button 
                  onClick={handleGenerate} 
                  disabled={!inputText.trim() || isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200 transition-all active:scale-95"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Notes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}
          </motion.div>

          {/* Output Section */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="h-full"
          >
            <Card className="border-gray-200 shadow-lg h-full flex flex-col bg-white overflow-hidden">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                      Study Notes
                    </CardTitle>
                    <CardDescription>
                      {isEli5 ? "Explained simply for quick understanding." : "Structured academic summary."}
                    </CardDescription>
                  </div>
                  {notes && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={copyToClipboard} className="border-gray-200 hover:bg-gray-50">
                        {copied ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
                        {copied ? "Copied" : "Copy"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={exportToPDF} className="border-gray-200 hover:bg-gray-50">
                        <Download className="w-4 h-4 mr-2" />
                        Export PDF
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-[calc(100vh-320px)] lg:h-[calc(100vh-280px)] p-6">
                  <AnimatePresence mode="wait">
                    {!notes && !isLoading && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20"
                      >
                        <div className="bg-gray-50 p-6 rounded-full">
                          <BookOpen className="w-12 h-12 text-gray-200" />
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium">No notes generated yet</p>
                          <p className="text-sm text-gray-400 max-w-[240px] mx-auto mt-1">
                            Your AI-powered study guide will appear here once you click generate.
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {isLoading && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-full flex flex-col items-center justify-center space-y-6 py-20"
                      >
                        <div className="relative">
                          <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
                          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-gray-800">Genie is thinking...</p>
                          <p className="text-sm text-gray-500 animate-pulse">Analyzing content and structuring notes</p>
                        </div>
                      </motion.div>
                    )}

                    {notes && !isLoading && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="prose prose-slate max-w-none"
                      >
                        <ReactMarkdown 
                          components={{
                            h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4 text-gray-900 border-b pb-2" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-6 mb-3 text-gray-800" {...props} />,
                            p: ({node, ...props}) => <p className="text-gray-700 leading-relaxed mb-4" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-2 mb-4 text-gray-700" {...props} />,
                            li: ({node, ...props}) => <li className="pl-1" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-semibold text-blue-700 bg-blue-50 px-1 rounded" {...props} />,
                          }}
                        >
                          {notes}
                        </ReactMarkdown>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 py-12 text-center">
        <Separator className="mb-8" />
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <span>Powered by</span>
            <span className="font-semibold text-gray-600">Gemini AI</span>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <span>Built for Students</span>
          </div>
          <p className="text-xs text-gray-400 max-w-md">
            StudyGenie helps you learn faster by distilling information. Always verify important facts with your source material.
          </p>
        </div>
      </footer>
    </div>
  );
}
