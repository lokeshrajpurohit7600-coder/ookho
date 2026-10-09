'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  Square, 
  Languages, 
  Sparkles, 
  Loader2
} from 'lucide-react';
import { sendChatMessage } from '@/lib/api';

interface VoiceAssistantBarProps {
  uploadId: string;
}

interface Message {
  speaker: 'user' | 'assistant';
  text: string;
  language?: string;
}

const LANGUAGES = [
  { id: 'english', name: 'English', voiceLang: 'en-US' },
  { id: 'hinglish', name: 'Hinglish (हिंग्लिश)', voiceLang: 'hi-IN' },
  { id: 'hindi', name: 'Hindi (हिंदी)', voiceLang: 'hi-IN' },
  { id: 'gujarati', name: 'Gujarati (ગુજરાતી)', voiceLang: 'gu-IN' },
  { id: 'marathi', name: 'Marathi (मराठी)', voiceLang: 'mr-IN' },
  { id: 'tamil', name: 'Tamil (தமிழ்)', voiceLang: 'ta-IN' },
  { id: 'telugu', name: 'Telugu (తెలుగు)', voiceLang: 'te-IN' },
];

const SUGGESTED_QUESTIONS = [
  'Was AI used to generate or edit this media?',
  'What regions of this image were manipulated?',
  'Explain the camera EXIF and provenance data',
  'Why did the detector reach this verdict?',
  'What forensic tool or generator was likely used?',
];

export function VoiceAssistantBar({ uploadId }: VoiceAssistantBarProps) {
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initial welcome message
  useEffect(() => {
    setMessages([
      {
        speaker: 'assistant',
        text: 'Hello! I am your Aookho AI Forensic Assistant. You can ask me anything about this image or video—such as detected manipulation regions, camera metadata, frequency anomalies, or any questions about the analysis!',
        language: 'english'
      }
    ]);
  }, [uploadId]);

  // Scroll internal chat container ONLY when user sends or receives conversation messages
  useEffect(() => {
    if (messages.length > 1 && chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  // Speech-to-text recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputText(transcript);
          setIsListening(false);
          handleSendMessage(transcript);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
      }
    }
  }, [selectedLanguage]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Microphone speech recognition works in Google Chrome or Microsoft Edge. Please use one of those browsers or type your question.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      const currentLangConfig = LANGUAGES.find(l => l.id === selectedLanguage);
      recognitionRef.current.lang = currentLangConfig?.voiceLang || 'hi-IN';
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const newMessages: Message[] = [...messages, { speaker: 'user', text }];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const data = await sendChatMessage(uploadId, text, selectedLanguage);
      const updatedMessages: Message[] = [
        ...newMessages,
        { speaker: 'assistant', text: data.reply, language: selectedLanguage }
      ];
      setMessages(updatedMessages);

      speakResponse(data.reply, updatedMessages.length - 1, selectedLanguage);
    } catch (err: any) {
      setMessages([
        ...newMessages,
        { 
          speaker: 'assistant', 
          text: `I'm sorry, I could not process your request at this time. ${err.message || 'Please check your connection and try again.'}`,
          language: 'english'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const speakResponse = (text: string, msgIndex: number, langId: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingIndex === msgIndex) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    const langConfig = LANGUAGES.find(l => l.id === langId);
    utterance.lang = langConfig?.voiceLang || 'hi-IN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => v.lang.startsWith(utterance.lang.slice(0, 2)));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);

    window.speechSynthesis.speak(utterance);
    setSpeakingIndex(msgIndex);
  };

  return (
    <div className="w-full rounded-3xl artistic-panel border border-white/[0.08] p-6 flex flex-col gap-4 shadow-sm">
      {/* Header with Title & Language Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 via-violet-500/20 to-rose-500/20 border border-white/10 flex items-center justify-center text-indigo-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span>Ask Aookho Assistant</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950/70 text-indigo-300 font-mono border border-indigo-800/40">
                Interactive
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Have questions about this forensic result? Counter-argue or ask any doubt below.
            </p>
          </div>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-2 bg-slate-950/90 px-3 py-1.5 rounded-xl border border-white/[0.08]">
          <Languages className="w-3.5 h-3.5 text-amber-300" />
          <span className="text-xs text-slate-400">Language:</span>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-transparent text-xs font-medium text-amber-300 focus:outline-none cursor-pointer"
          >
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id} className="bg-slate-950 text-slate-200">
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Suggested Question Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] text-slate-400 flex-shrink-0 font-medium">Suggested:</span>
        {SUGGESTED_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(q)}
            className="text-xs px-3 py-1 rounded-full bg-slate-950/80 hover:bg-indigo-950/60 border border-white/[0.08] hover:border-indigo-500/40 text-slate-300 hover:text-indigo-200 transition-all flex-shrink-0"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Message History Stream */}
      <div 
        ref={chatContainerRef}
        className="min-h-[160px] max-h-[300px] overflow-y-auto space-y-3 p-4 rounded-2xl bg-slate-950/70 border border-white/[0.06]"
      >
        {messages.map((m, idx) => {
          const isUser = m.speaker === 'user';
          const isSpeaking = speakingIndex === idx;

          return (
            <div
              key={idx}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-semibold ${
                  isUser
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white'
                    : 'bg-slate-800 text-amber-300 border border-white/10'
                }`}
              >
                {isUser ? 'You' : 'AI'}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-tr-none shadow-sm'
                    : 'bg-slate-900/90 border border-white/[0.07] text-slate-200 rounded-tl-none'
                }`}
              >
                <p className="whitespace-pre-line">{m.text}</p>

                {/* Voice button on assistant messages */}
                {!isUser && (
                  <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => speakResponse(m.text, idx, m.language || selectedLanguage)}
                      className="text-[11px] text-amber-300 hover:text-amber-200 flex items-center gap-1.5 transition-colors font-medium"
                    >
                      {isSpeaking ? (
                        <>
                          <Square className="w-3 h-3 fill-current text-rose-400" />
                          <span className="text-rose-300">Stop Speaking</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Listen (Voice)</span>
                        </>
                      )}
                    </button>

                    {isSpeaking && (
                      <div className="flex items-end gap-1 h-3">
                        <span className="w-1 bg-amber-400 rounded-full h-1.5 animate-pulse" />
                        <span className="w-1 bg-rose-400 rounded-full h-3 animate-bounce" />
                        <span className="w-1 bg-indigo-400 rounded-full h-2 animate-pulse" />
                        <span className="w-1 bg-emerald-400 rounded-full h-2.5 animate-bounce" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span>Thinking...</span>
          </div>
        )}
      </div>

      {/* Input Bar with Mic & Send */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={toggleListening}
          className={`p-3 rounded-xl border transition-all flex-shrink-0 ${
            isListening
              ? 'bg-rose-950 border-rose-500 text-rose-300 animate-pulse'
              : 'bg-slate-950 hover:bg-slate-800 border-white/[0.08] text-slate-300 hover:text-white'
          }`}
          title={isListening ? 'Listening (Click to stop)' : 'Click to speak your question'}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <div className="flex-1 relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder={
              isListening
                ? 'Listening... Speak now...'
                : 'Ask any question about this forensic report (e.g., "Why was this flagged as AI?", "What regions were modified?")...'
            }
            className="w-full rounded-xl bg-slate-950/90 border border-white/[0.1] px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400 transition-all"
          />
        </div>

        <button
          type="button"
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || isLoading}
          className="p-2.5 px-5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:opacity-40 text-white font-medium text-xs flex items-center gap-1.5 transition-all flex-shrink-0 shadow-sm"
        >
          <span>Send</span>
          <Send className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
