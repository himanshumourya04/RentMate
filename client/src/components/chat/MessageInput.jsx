import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { uploadChatFile } from '../../services/api';

const EMOJIS = ['❤️', '😂', '🙌', '🔥', '👏', '👍', '😊', '😍', '🤔', '😎', '✅', '❌', '📷', '📦', '💰', '📅'];

const MessageInput = ({ onSendMessage }) => {
  const [text, setText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onSendMessage(text);
      setText('');
      setShowEmojis(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  const addEmoji = (emoji) => {
    setText(prev => prev + emoji);
    // setShowEmojis(false); // Keep open for multi-emoji
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await uploadChatFile(formData);
      // Automatically send message with attachment
      onSendMessage('', data.fileUrl, data.fileType);
      toast.success('File uploaded');
    } catch (err) {
      toast.error('File upload failed');
      console.error(err);
    } finally {
      setUploading(false);
      e.target.value = null; // Reset input
    }
  };

  return (
    <div className="relative">
      {/* Emoji Picker Popup */}
      {showEmojis && (
        <div className="absolute bottom-full left-4 mb-2 p-2 bg-white rounded-xl shadow-xl border border-slate-100 grid grid-cols-4 sm:grid-cols-8 gap-1 z-50 animate-in slide-in-from-bottom-2 duration-200">
          {EMOJIS.map(e => (
            <button key={e} onClick={() => addEmoji(e)} className="w-8 h-8 hover:bg-slate-100 rounded flex items-center justify-center text-lg">{e}</button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="px-4 py-3 bg-[#f0f2f5] flex items-center gap-4 border-t border-slate-200">
        <div className="flex gap-4 text-slate-500">
          <button 
            type="button" 
            onClick={() => setShowEmojis(!showEmojis)} 
            className={`transition-colors ${showEmojis ? 'text-primary-600' : 'hover:text-slate-700'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </button>
          
          <button 
            type="button" 
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()} 
            className={`hover:text-slate-700 transition-colors ${uploading ? 'animate-pulse text-primary-400' : ''}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
        </div>
        
        <div className="flex-1">
          <input
            type="text"
            className="w-full px-4 py-2 bg-white border border-transparent rounded-xl text-[14px] focus:ring-1 focus:ring-primary-500 outline-none placeholder:text-slate-400 transition-all"
            placeholder={uploading ? "Uploading file..." : "Type a message"}
            value={text}
            readOnly={uploading}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <button
          type="submit"
          disabled={!text.trim() || uploading}
          className={`p-2 transition-all transform active:scale-90 ${
            text.trim() ? 'text-[#008069]' : 'text-slate-400 opacity-50'
          }`}
        >
          <svg className="w-6 h-6 rotate-[-45deg]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
