import { useAuth } from '../../context/AuthContext';
import { getPhotoUrl } from '../../utils/photoUtils';

const MessageBubble = ({ message }) => {
  const { user } = useAuth();
  const isMyMessage = (message.senderId?._id || message.senderId) === user._id;

  return (
    <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} mb-3 px-6 animate-in fade-in slide-in-from-bottom-1 duration-300`}>
      <div className={`max-w-[80%] flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}>
        {!isMyMessage && (
          <span className="text-[10px] font-bold text-slate-500 mb-1 ml-2">
            {message.senderId?.name}
          </span>
        )}
        <div
          className={`px-3 py-2 rounded-xl shadow-sm relative ${
            isMyMessage
              ? 'bg-[#dcf8c6] text-slate-800 rounded-tr-none'
              : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
          }`}
        >
          {/* File Attachment Rendering */}
          {message.fileUrl && (
            <div className="mb-2 max-w-[240px]">
              {message.fileType?.startsWith('image/') ? (
                <a href={getPhotoUrl(message.fileUrl)} target="_blank" rel="noopener noreferrer">
                  <img src={getPhotoUrl(message.fileUrl)} alt="Sent file" className="rounded-lg w-full max-h-60 object-cover border border-black/5" />

                </a>
              ) : (
                <a 
                  href={getPhotoUrl(message.fileUrl)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-slate-200 hover:bg-white/80 transition-colors"
                >
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-xl">📄</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate text-slate-700">{message.fileUrl.split('-').slice(1).join('-')}</p>
                    <p className="text-[10px] text-slate-500 uppercase">{message.fileType?.split('/')?.[1] || 'FILE'}</p>
                  </div>
                </a>
              )}
            </div>
          )}

          {message.messageText && (
            <p className="text-[14px] leading-relaxed select_text">{message.messageText}</p>
          )}
          
          <div className="text-[9px] mt-1 flex justify-end text-slate-400 font-medium tracking-tight">
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {isMyMessage && (
              <span className="ml-1 text-sky-500 opacity-80">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
