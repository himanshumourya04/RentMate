

const ConversationItem = ({ conv, selectedId, onSelect, currentUserId }) => {
  const otherParticipant = conv.participants.find(p => p._id !== currentUserId);
  const isActive = selectedId === conv._id;
  const lastMsg = conv.lastMessage?.messageText || 'No messages yet';

  return (
    <div
      onClick={() => onSelect(conv)}
      className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-all border-l-4 ${
        isActive 
          ? 'bg-slate-100 border-indigo-600' 
          : 'bg-white border-transparent hover:bg-slate-50'
      }`}
    >
      <div className="relative flex-shrink-0">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${
          otherParticipant?.role === 'management' ? 'bg-indigo-600' : 'bg-slate-800'
        }`}>
          {otherParticipant?.name?.[0]?.toUpperCase()}
        </div>
        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <h3 className={`text-sm font-bold truncate ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}>
            {otherParticipant?.name}
          </h3>
          <span className="text-[10px] text-slate-400 font-medium">
            {conv.updatedAt ? new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={`text-xs truncate font-medium flex-1 ${isActive ? 'text-indigo-600/70' : 'text-slate-500'}`}>
            {lastMsg}
          </p>
          {conv.unreadCount > 0 && (
            <span className="min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 animate-pulse shadow-sm shadow-rose-200">
              {conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;
