import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Bot, Database, ExternalLink, Loader2, Send, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiService } from '@/services/api';
import { DatabaseChatResponse } from '@/types/api';
import { toast } from 'sonner';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sqlQuery?: string;
  confidence?: number;
  sources?: string[];
};

const DatabaseChat: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [dbUrl, setDbUrl] = useState(import.meta.env.VITE_DB_CHAT_URL || '');
  const allowManualDbUrl = import.meta.env.VITE_ENABLE_DB_URL_OVERRIDE === 'true';
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Ask a question about your HR data, and I will query the backend DB assistant endpoint for an accurate answer.',
    },
  ]);

  const askDbMutation = useMutation({
    mutationFn: (payload: { question: string; db_url?: string }) => apiService.askDatabase(payload),
    onSuccess: (data: DatabaseChatResponse) => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.answer || 'No answer returned by the server.',
          sqlQuery: data.sql_query,
          confidence: data.confidence,
          sources: data.sources,
        },
      ]);
    },
    onError: (error: { message?: string }) => {
      toast.error(error?.message || 'Failed to query DB assistant endpoint');
    },
  });

  const handleSend = async () => {
    const trimmed = question.trim();
    if (!trimmed) {
      toast.error('Please type a question first');
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
      },
    ]);

    setQuestion('');

    askDbMutation.mutate({
      question: trimmed,
      db_url: allowManualDbUrl ? (dbUrl.trim() || undefined) : undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Database Chat Assistant</h1>
        <p className="text-sm text-gray-600 mt-1">
          This sends your question to <code>/api/chat/db/</code> so the backend can safely query PostgreSQL and answer.
        </p>
      </div>

      {allowManualDbUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              DB Connection Override (dev only)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={dbUrl}
              onChange={(e) => setDbUrl(e.target.value)}
              placeholder="postgres://user:password@host:5432/database"
              type="password"
            />
            <p className="text-xs text-gray-500 mt-2">
              Keep DB credentials on backend in production. This override is only enabled when
              <code className="mx-1">VITE_ENABLE_DB_URL_OVERRIDE=true</code>.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-lg border p-3 ${
                  message.role === 'user' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {message.role === 'user' ? (
                    <User className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Bot className="h-4 w-4 text-purple-600" />
                  )}
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-600">
                    {message.role === 'user' ? 'You' : 'Assistant'}
                  </span>
                  {typeof message.confidence === 'number' && (
                    <Badge variant="outline">Confidence: {Math.round(message.confidence * 100)}%</Badge>
                  )}
                </div>

                <p className="text-sm text-gray-800 whitespace-pre-wrap">{message.content}</p>

                {message.sqlQuery && (
                  <div className="mt-3 rounded-md bg-gray-900 text-gray-100 p-2 text-xs overflow-x-auto">
                    <div className="text-gray-400 mb-1">SQL used:</div>
                    <code>{message.sqlQuery}</code>
                  </div>
                )}

                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs font-semibold text-gray-600 mb-2">Sources</div>
                    <div className="flex flex-wrap gap-2">
                      {message.sources.map((source, index) => (
                        <a
                          key={`${message.id}-source-${index}`}
                          href={source}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-blue-700 hover:bg-blue-50"
                        >
                          Source {index + 1}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {askDbMutation.isPending && (
              <div className="rounded-lg border bg-gray-50 border-gray-200 p-3 flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Asking database assistant...
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Example: How many active employees are in each department?"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <div className="flex justify-end">
              <Button onClick={handleSend} disabled={askDbMutation.isPending}>
                {askDbMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Ask Database
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseChat;
