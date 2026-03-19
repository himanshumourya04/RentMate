
import ConversationItem from './ConversationItem';

const ConversationList = ({ conversations, selectedId, onSelect, currentUserId }) => {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-xl mb-3">📭</div>
        <p className="text-xs text-slate-400 font-medium whitespace-pre-wrap">No active conversations found</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {conversations.map((conv) => (
        <ConversationItem 
            key={conv._id} 
            conv={conv} 
            selectedId={selectedId} 
            onSelect={onSelect} 
            currentUserId={currentUserId} 
        />
      ))}
    </div>
  );
};

export default ConversationList;
