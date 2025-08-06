import React from 'react';
import { Bot, User } from "lucide-react";
import { format } from 'date-fns';

export default function ChatMessage({ message }) {
  const isAssistant = message.type === 'assistant';

  return (
    <div className={`flex items-start gap-3 ${!isAssistant ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isAssistant 
          ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
          : 'bg-gradient-to-br from-blue-500 to-emerald-500'
      }`}>
        {isAssistant ? (
          <Bot className="w-5 h-5 text-white" />
        ) : (
          <User className="w-5 h-5 text-white" />
        )}
      </div>
      
      <div className={`flex-1 max-w-[80%] ${!isAssistant ? 'text-right' : ''}`}>
        <div className={`rounded-xl p-4 ${
          isAssistant 
            ? 'bg-slate-50 text-slate-900' 
            : 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white'
        }`}>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
          </p>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {format(message.timestamp, 'HH:mm')}
        </p>
      </div>
    </div>
  );
}