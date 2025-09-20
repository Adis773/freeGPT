import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Sun, Moon, Trash2, MessageSquare, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTheme } from 'next-themes';
import { toast } from '@/hooks/use-toast';

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  const sarcasticResponses = [
    "Ох, какой глубокий вопрос! Дайте мне подумать... Нет, даже не буду.",
    "Вау, этого точно никто никогда не спрашивал. Оригинально!",
    "Серьезно? Это лучшее, что вы смогли придумать?",
    "О боже, еще один гений! Как мне повезло...",
    "Знаете что? Лучше бы вы молчали.",
    "Этот вопрос настолько глупый, что мой ИИ заплакал.",
    "Поздравляю! Вы официально задали самый бесполезный вопрос дня.",
    "Я видел умнее вопросы от микроволновки.",
    "Ваш вопрос как анекдот - только не смешной.",
    "Мне кажется, или ваша клавиатура сломалась? Потому что то, что вы написали - полная чушь.",
    "Попробуйте еще раз, но в этот раз включите мозг.",
    "Даже моя бабушка задает более умные вопросы, а она умерла 10 лет назад.",
    "Вы уверены, что хотите тратить мое драгоценное время на это?",
    "Ладно, отвечу, но только потому что мне скучно.",
    "О нет, опять этот человек с вопросами..."
  ];

  const getRandomResponse = () => {
    return sarcasticResponses[Math.floor(Math.random() * sarcasticResponses.length)];
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
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: getRandomResponse(),
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
              onClick={() => setActiveChat(chat.id)}
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
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </Button>
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
    </div>
  );
};

export default ChatInterface;