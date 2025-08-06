import React, { useState } from "react";
import { InvokeLLM } from "@/api/integrations";
import { TestRun } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  MessageSquare, 
  Lightbulb, 
  AlertTriangle,
  CheckCircle2,
  Send,
  Bot,
  User
} from "lucide-react";

import ChatMessage from "../components/ai-assistant/ChatMessage";
import SuggestedActions from "../components/ai-assistant/SuggestedActions";
import InsightCards from "../components/ai-assistant/InsightCards";

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: 'Hello! I\'m your AI test automation assistant. I can help you analyze failing tests, identify flaky patterns, suggest improvements, and provide insights about your test suite. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      // Get recent test data for context
      const recentTests = await TestRun.listByBuild(build.id);
      const testContext = recentTests.map(test => ({
        suite: test.test_suite,
        status: test.status,
        type: test.test_type,
        error: test.error_message,
        flaky_score: test.flaky_score
      }));

      const response = await InvokeLLM({
        prompt: `As an AI test automation assistant, analyze this query: "${currentMessage}"
        
        Context from recent test runs:
        ${JSON.stringify(testContext, null, 2)}
        
        Provide helpful, actionable advice about test automation, debugging, or optimization. Keep responses concise but informative.`,
        add_context_from_internet: false
      });

      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-purple-800 to-pink-800 bg-clip-text text-transparent">
              AI Assistant
            </h1>
            <p className="text-slate-600 mt-2 text-lg">
              Intelligent insights and recommendations for your test automation
            </p>
          </div>
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2">
            <Sparkles className="w-4 h-4 mr-2" />
            Powered by AI
          </Badge>
        </div>

        {/* Insights Cards */}
        <InsightCards />

        {/* Main Chat Interface */}
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="glass-effect border-0 shadow-xl h-[600px] flex flex-col">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                  Chat with AI Assistant
                </CardTitle>
              </CardHeader>
              
              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                
                {isLoading && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                        <span className="text-slate-600">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              
              {/* Message Input */}
              <div className="border-t border-slate-200/60 p-4">
                <div className="flex gap-3">
                  <Textarea
                    placeholder="Ask about test failures, flaky tests, performance optimization..."
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 min-h-[60px] resize-none bg-white/70"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!currentMessage.trim() || isLoading}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Suggested Actions */}
          <div>
            <SuggestedActions onActionSelect={(action) => setCurrentMessage(action)} />
          </div>
        </div>
      </div>
    </div>
  );
}