"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { BookOpen, Upload, FileText, HelpCircle, MessageSquare, Sparkles, Brain } from "lucide-react"

export default function StudyHub() {
  const [hasDocument, setHasDocument] = useState(false)

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            Study Hub
          </h2>
          <p className="text-muted-foreground mt-1">Upload documents and get AI-powered study assistance</p>
        </div>
        {hasDocument && (
          <div className="flex items-center gap-2 px-4 py-2 bg-success/10 rounded-full text-success text-sm font-medium animate-pulse-subtle">
            <Sparkles className="w-4 h-4" />
            Document Ready
          </div>
        )}
      </div>

      {!hasDocument ? (
        <Card className="border-2 border-dashed hover:border-primary/50 transition-all duration-300 max-w-2xl mx-auto">
          <CardContent className="p-12">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                <Upload className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Upload Your Document</h3>
                <p className="text-muted-foreground mt-2">Drag and drop or click to upload PDF, DOCX, or TXT files</p>
              </div>
              <Button
                size="lg"
                className="shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
                onClick={() => setHasDocument(true)}
              >
                <Upload className="w-5 h-5 mr-2" />
                Choose File
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left column - Document info and actions */}
          <div className="space-y-6">
            <Card className="border-2 hover:border-primary/20 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Uploaded Document
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Data Structures Notes.pdf</p>
                      <p className="text-sm text-muted-foreground">2.4 MB • 45 pages</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3">
                  <Button
                    size="lg"
                    variant="outline"
                    className="justify-start h-auto py-4 hover:bg-primary/5 hover:border-primary/50 hover:scale-105 active:scale-95 transition-all duration-300 group bg-transparent"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-semibold">Generate Summary</p>
                        <p className="text-xs text-muted-foreground">Get a concise overview of the document</p>
                      </div>
                    </div>
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    className="justify-start h-auto py-4 hover:bg-secondary/5 hover:border-secondary/50 hover:scale-105 active:scale-95 transition-all duration-300 group bg-transparent"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-2 rounded-lg bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                        <HelpCircle className="w-5 h-5 text-secondary" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-semibold">Generate Short Quiz</p>
                        <p className="text-xs text-muted-foreground">Test your understanding with MCQs</p>
                      </div>
                    </div>
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    className="justify-start h-auto py-4 hover:bg-accent/5 hover:border-accent/50 hover:scale-105 active:scale-95 transition-all duration-300 group bg-transparent"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                        <Brain className="w-5 h-5 text-accent" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-semibold">Generate Long Questions</p>
                        <p className="text-xs text-muted-foreground">Practice with detailed questions</p>
                      </div>
                    </div>
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  className="w-full hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setHasDocument(false)}
                >
                  Remove Document
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right column - AI Teaching Assistant */}
          <Card className="border-2 hover:border-primary/20 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                AI Teaching Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 max-h-96 overflow-y-auto p-2">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 p-3 rounded-lg bg-muted/50">
                    <p className="text-sm">
                      Hello! I've analyzed your document on Data Structures. I can help you understand any concept,
                      explain examples, or answer questions about the content. What would you like to learn about?
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <div className="flex-1 max-w-md p-3 rounded-lg bg-primary/10">
                    <p className="text-sm">Can you explain how binary search trees work?</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold">You</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 p-3 rounded-lg bg-muted/50">
                    <p className="text-sm">
                      A Binary Search Tree (BST) is a tree data structure where each node has at most two children. The
                      key property is that for any node, all values in its left subtree are smaller, and all values in
                      its right subtree are larger. This property enables efficient searching, with O(log n) time
                      complexity in balanced trees. Would you like me to explain insertion or deletion operations?
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Textarea
                  placeholder="Ask a question about the document..."
                  className="min-h-20 transition-all duration-300 focus:scale-[1.01] focus:shadow-md"
                />
                <Button size="lg" className="px-6 hover:scale-110 active:scale-95 transition-all duration-300">
                  <MessageSquare className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
