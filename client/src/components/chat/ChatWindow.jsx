import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

const ChatWindow = ({ selectedConversation, messages, onSendMessage, currentUserId }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!selectedConversation || !selectedConversation.participants) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-10 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-4xl">💬</div>
        <h3 className="font-bold text-slate-700 text-lg">Select a conversation</h3>
        <p className="text-slate-400 text-sm mt-1">Click on a user in the sidebar or tap<br />"I Have This" on any request to start chatting.</p>
      </div>
    );
  }

  const otherParticipant = selectedConversation.participants.find(p => p._id !== currentUserId);

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
      {/* Header */}
      <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between bg-[#f0f2f5] sticky top-0 z-[40] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${
                otherParticipant?.role === 'management' ? 'bg-indigo-600' : 'bg-slate-800'
            }`}>
              {otherParticipant?.name?.[0]?.toUpperCase()}
            </div>
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900 leading-tight">{otherParticipant?.name}</h2>
            <p className="text-[11px] text-slate-500 font-medium lowercase">online</p>
          </div>
        </div>
        <div className="flex gap-4">
            <button className="text-slate-550 hover:text-slate-700 transition-colors">
                <svg className="w-5 h-5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
            <button className="text-slate-550 hover:text-slate-700 transition-colors">
                <svg className="w-5 h-5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
            </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto relative bg-[#efeae2] custom-scrollbar min-h-0 z-0">
        <div className="absolute inset-0 pattern-bg pointer-events-none opacity-40"></div>
        <div className="relative z-10 py-4 flex flex-col">
          {messages.map((msg, idx) => (
            <MessageBubble key={msg._id || idx} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <MessageInput onSendMessage={onSendMessage} />
    </div>
  );
};

export default ChatWindow;
