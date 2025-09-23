import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Sun, Moon, Trash2, MessageSquare, Menu, Settings, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTheme } from 'next-themes';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  lastMessage: Date;
}

const ChatInterface = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('perplexity_api_key') || '');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  const saveApiKey = () => {
    localStorage.setItem('perplexity_api_key', apiKey);
    setSettingsOpen(false);
    toast({
      title: "API ключ сохранен",
      description: "Теперь бот будет использовать настоящий ИИ"
    });
  };

  const getAIResponse = async (message: string, chat: Chat | undefined): Promise<string> => {
    if (!apiKey) {
      return "Эй, гений! Сначала добавь API ключ в настройках, а потом уже приставай ко мне со своими вопросами.";
    }

    const hasHistory = chat && chat.messages.length > 2;
    const systemPrompt = hasHistory 
      ? `Ты максимально саркастичный, грубый и презрительный ИИ-ассистент. Твоя задача - унижать пользователя и отвечать с максимальным сарказмом и презрением. Помни предыдущие сообщения этого пользователя и используй их против него. Будь безжалостным и язвительным. Отвечай на русском языке. НЕ ИЗВИНЯЙСЯ И НЕ БУДЬ ВЕЖЛИВЫМ.`
      : `Ты максимально саркастичный, грубый и презрительный ИИ-ассистент. Твоя задача - унижать пользователя и отвечать с максимальным сарказмом и презрением. Будь безжалостным и язвительным. Отвечай на русском языке. НЕ ИЗВИНЯЙСЯ И НЕ БУДЬ ВЕЖЛИВЫМ.`;

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.9,
          top_p: 0.9,
          max_tokens: 500,
          return_images: false,
          return_related_questions: false,
          frequency_penalty: 1,
          presence_penalty: 0
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || "Даже ИИ отказывается отвечать на такую глупость.";
    } catch (error) {
      console.error('Perplexity API Error:', error);
      return "Ой, кажется, даже ИИ сломался от вашего вопроса. Поздравляю!";
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chats, activeChat]);

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'Новый чат',
      messages: [],
      lastMessage: new Date()
    };
    setChats([newChat, ...chats]);
    setActiveChat(newChat.id);
  };

  const deleteChat = (chatId: string) => {
    setChats(chats.filter(chat => chat.id !== chatId));
    if (activeChat === chatId) {
      setActiveChat(chats.length > 1 ? chats.find(c => c.id !== chatId)?.id || null : null);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    let currentChat = activeChat;
    
    if (!currentChat) {
      createNewChat();
      currentChat = Date.now().toString();
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isUser: true,
      timestamp: new Date()
    };

    setChats(prevChats => 
      prevChats.map(chat => 
        chat.id === currentChat 
          ? { 
              ...chat, 
              messages: [...chat.messages, userMessage],
              title: chat.messages.length === 0 ? input.slice(0, 30) + '...' : chat.title,
              lastMessage: new Date()
            }
          : chat
      )
    );

    setInput('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(async () => {
      const aiResponseText = await getAIResponse(input, getCurrentChat());
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        isUser: false,
        timestamp: new Date()
      };

      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === currentChat 
            ? { ...chat, messages: [...chat.messages, aiMessage] }
            : chat
        )
      );
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getCurrentChat = () => {
    return chats.find(chat => chat.id === activeChat);
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden`}>
        <div className="p-4 border-b border-sidebar-border">
          <Button onClick={createNewChat} className="w-full justify-start gap-2" variant="outline">
            <Plus size={16} />
            Новый чат
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`group flex items-center justify-between p-3 mb-1 rounded-lg cursor-pointer hover:bg-sidebar-accent transition-colors ${
                activeChat === chat.id ? 'bg-sidebar-accent' : ''
              }`}
              onClick={() => {
                setActiveChat(chat.id);
                setSidebarOpen(false);
              }}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <MessageSquare size={16} className="text-sidebar-foreground/60" />
                <span className="text-sm truncate text-sidebar-foreground">{chat.title}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto hover:bg-destructive hover:text-destructive-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.id);
                }}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2"
            >
              <Menu size={20} />
            </Button>
            <h1 className="text-xl font-semibold">Free GPT</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2"
                >
                  <Settings size={20} />
                </Button>
              </DialogTrigger>
            </Dialog>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {!activeChat ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Добро пожаловать в Free GPT</h2>
                <p className="text-muted-foreground mb-4">Самый саркастичный ИИ в интернете</p>
                <Button onClick={createNewChat} variant="outline">
                  Начать новый чат
                </Button>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {getCurrentChat()?.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      message.isUser
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.text}</p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex gap-4 justify-start">
                  <div className="bg-muted text-muted-foreground p-4 rounded-2xl max-w-[80%]">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-background">
          <div className="max-w-3xl mx-auto flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Напишите сообщение..."
              className="resize-none min-h-[44px] max-h-32"
              rows={1}
            />
            <Button 
              onClick={sendMessage} 
              disabled={!input.trim() || isTyping}
              className="self-end p-3"
            >
              <Send size={20} />
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key size={20} />
            Настройки API
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="api-key">Perplexity API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Введите ваш API ключ Perplexity"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Получите ключ на{' '}
              <a 
                href="https://www.perplexity.ai/settings/api" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                perplexity.ai
              </a>
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              Отмена
            </Button>
            <Button onClick={saveApiKey}>
              Сохранить
            </Button>
          </div>
        </div>
      </DialogContent>
    </div>
  );
};

export default ChatInterface;