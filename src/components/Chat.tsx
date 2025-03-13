
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThemeToggle } from './ThemeToggle';
import { generateResponse, ChatMessage } from '@/lib/gemini';
import { formatMarkdown } from '@/lib/text-processor';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';

const Chat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Speech recognition setup
  const recognition = useRef<SpeechRecognition | null>(null);
  
  // Text to speech setup
  const synth = window.speechSynthesis;
  
  useEffect(() => {
    // Initialize speech recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      
      recognition.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        setInput(transcript);
      };
      
      recognition.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        toast({
          title: "Speech Recognition Error",
          description: `Error: ${event.error}`,
          variant: "destructive",
        });
      };
    }
    
    // Scroll to bottom when messages change
    scrollToBottom();
    
    // Clean up speech synthesis on unmount
    return () => {
      if (synth.speaking) {
        synth.cancel();
      }
    };
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const toggleListening = () => {
    if (!recognition.current) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }
    
    if (isListening) {
      recognition.current.stop();
      setIsListening(false);
    } else {
      recognition.current.start();
      setIsListening(true);
      toast({
        title: "Listening",
        description: "Speak now...",
      });
    }
  };
  
  const speakText = (text: string) => {
    if (synth.speaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }
    
    // Strip markdown for better speech
    const plainText = text.replace(/```[\s\S]*?```/g, 'Code block omitted for speech.')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/#+\s(.*)/g, '$1')
      .replace(/`(.*?)`/g, '$1');
    
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.rate = 1;
    utterance.pitch = 1;
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    
    setIsSpeaking(true);
    synth.speak(utterance);
  };
  
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Stop listening if active
      if (isListening && recognition.current) {
        recognition.current.stop();
        setIsListening(false);
      }
      
      // Scroll to the bottom
      scrollToBottom();
      
      // Generate AI response
      const response = await generateResponse([...messages, userMessage]);
      
      const aiMessage: ChatMessage = {
        role: 'model',
        content: response,
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto h-[calc(100vh-4rem)] p-4 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Gemini Chat</h1>
        <ThemeToggle />
      </div>
      
      <div className="flex-1 glass rounded-2xl overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-72 text-center p-6">
                <div className="opacity-70">
                  <h3 className="text-xl font-medium mb-2">Welcome to Gemini Chat</h3>
                  <p className="text-muted-foreground">
                    Start a conversation with the AI assistant. You can type your message below or use voice input.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div 
                  key={index}
                  className={cn(
                    "flex flex-col max-w-[90%] rounded-xl p-4 animate-scale-in",
                    message.role === "user" 
                      ? "bg-primary text-primary-foreground ml-auto" 
                      : "bg-secondary text-secondary-foreground mr-auto"
                  )}
                >
                  <div className="text-xs opacity-70 mb-1">
                    {message.role === "user" ? "You" : "Gemini AI"}
                  </div>
                  
                  {message.role === "user" ? (
                    <div>{message.content}</div>
                  ) : (
                    <div 
                      className="prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }}
                    />
                  )}
                  
                  {message.role === "model" && (
                    <div className="flex justify-end mt-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-full"
                        onClick={() => speakText(message.content)}
                        aria-label={isSpeaking ? "Stop speaking" : "Read aloud"}
                      >
                        {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t">
          <div className="flex items-center space-x-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="min-h-10 resize-none"
              disabled={isLoading}
            />
            
            <Button
              size="icon"
              variant="outline"
              className="shrink-0"
              onClick={toggleListening}
              disabled={isLoading}
              aria-label={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? <MicOff /> : <Mic />}
            </Button>
            
            <Button
              size="icon"
              className="shrink-0"
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
            >
              <Send />
            </Button>
          </div>
          
          {isLoading && (
            <div className="mt-2 text-sm text-muted-foreground animate-pulse">
              Generating response...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
