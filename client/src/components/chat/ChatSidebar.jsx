import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../config';
import ConversationList from './ConversationList';

const ChatSidebar = ({ conversations, selectedId, onSelect, currentUserId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
          setSearchResults([]);
          setIsSearching(false);
          return;
      }

      setIsSearching(true);
      try {
        const token = localStorage.getItem('rentmate_token');
        const { data } = await axios.get(`${BACKEND_URL}/api/chat/search?query=${searchQuery}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSearchResults(data);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchUsers, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleUserSelect = (user) => {
    // Create a pseudo-conversation object to tell ChatPage to start a new chat
    onSelect({
        _id: 'new',
        participants: [user, { _id: currentUserId }],
        isNew: true
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="w-80 border-r border-slate-100 flex flex-col bg-white h-full">
      <div className="p-6 border-b border-slate-100">
        <h1 className="text-xl font-black text-slate-900 mb-4">Messages</h1>
        <div className="relative">
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {searchQuery.length > 0 ? (
          <div className="p-2">
            <h2 className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Search Results</h2>
            {isSearching ? (
                <div className="text-center py-4 text-xs text-slate-400 font-bold animate-pulse">Searching...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map(user => (
                <div 
                    key={user._id} 
                    onClick={() => handleUserSelect(user)}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-slate-100 cursor-pointer transition-all border-b border-slate-50"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${user.role === 'management' ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                    {user.name?.[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-slate-900 truncate">{user.name}</p>
                    <p className="text-xs font-medium text-slate-500">{user.role === 'management' ? 'Management' : user.role}</p>
                  </div>
                </div>
              ))
            ) : (
                <div className="text-center py-4 text-xs text-slate-400 font-bold">No users found</div>
            )}
          </div>
        ) : (
          <ConversationList 
            conversations={conversations} 
            selectedId={selectedId} 
            onSelect={onSelect} 
            currentUserId={currentUserId}
          />
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
