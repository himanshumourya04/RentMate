import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import { markAsRead } from '../services/api';

import { BACKEND_URL } from '../config';
const ENDPOINT = BACKEND_URL;

const ChatPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [, setLoading] = useState(true);
  const socket = useRef(null);

  // Initialize Socket.io
  useEffect(() => {
    socket.current = io(ENDPOINT);
    
    if (user) {
      // Register user with their ID (matches registerUser requirement)
      socket.current.emit('registerUser', user._id);
    }

    socket.current.on('receiveMessage', async (newMessage) => {
        const msgConvId = newMessage.conversationId?._id || newMessage.conversationId;
        const currentConvId = selectedConversation?._id;

        // If message is for the current open conversation
        if (selectedConversation && currentConvId === msgConvId) {
            setMessages((prev) => {
                // Prevent duplicates (local sender state vs socket emit back)
                const exists = prev.some(m => 
                    m._id === newMessage._id || 
                    (m.messageText === newMessage.messageText && 
                     m.fileUrl === newMessage.fileUrl && 
                     m.senderId === (newMessage.senderId?._id || newMessage.senderId))
                );
                if (exists) return prev;
                return [...prev, newMessage];
            });

            // Mark as read immediately if conversation is open
            try {
              await markAsRead(msgConvId);
              window.dispatchEvent(new Event('unread-update'));
            } catch (err) { console.error(err); }
        }
        
        // Refresh conversations list to update last message/unread count/order
        fetchConversations();
    });

    return () => {
      if (socket.current) socket.current.disconnect();
    };
  }, [user, selectedConversation]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('rentmate_token');
      const { data } = await axios.get(`${BACKEND_URL}/api/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(data);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const params = new URLSearchParams(window.location.search);
      const targetUserId = params.get('userId');

      try {
        const token = localStorage.getItem('rentmate_token');
        const { data: convs } = await axios.get(`${BACKEND_URL}/api/chat/conversations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setConversations(convs);

        if (targetUserId) {
          // Try to find an existing conversation with this user first
          const existing = convs.find(c => c.participants.some(p => p._id === targetUserId));
          if (existing) {
            setSelectedConversation(existing);
          } else {
            // No existing conversation: fetch the target user directly by ID
            try {
              const { data: targetUser } = await axios.get(
                `${BACKEND_URL}/api/users/basic/${targetUserId}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              if (targetUser && targetUser._id) {
                setSelectedConversation({
                  _id: 'new',
                  participants: [targetUser, { _id: user._id, name: user.name, role: user.role }],
                  isNew: true
                });
              }
            } catch (e) { console.error('User fetch failed:', e); }
          }
        }
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Refresh conversations list when it updates externally (e.g. socket)
  useEffect(() => {
    if (selectedConversation && !selectedConversation.isNew) {
      const updated = conversations.find(c => c._id === selectedConversation._id);
      if (updated && updated.lastMessage !== selectedConversation.lastMessage) {
        // keep the selected object fresh without looping
      }
    }
  }, [conversations]);

  const fetchMessages = async (conversationId) => {
    if (!conversationId || conversationId === 'new') return;
    try {
      const token = localStorage.getItem('rentmate_token');
      const { data } = await axios.get(`${BACKEND_URL}/api/chat/messages/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  useEffect(() => {
    if (selectedConversation && !selectedConversation.isNew) {
        fetchMessages(selectedConversation._id);
        
        // Mark as read when opening conversation
        const clearUnread = async () => {
          try {
            await markAsRead(selectedConversation._id);
            fetchConversations(); // Update sidebar badges
            window.dispatchEvent(new Event('unread-update'));
          } catch (err) { console.error(err); }
        };
        clearUnread();
    } else {
        setMessages([]);
    }
  }, [selectedConversation]);

  const handleSendMessage = async (messageText, fileUrl = null, fileType = null) => {
    if (!messageText.trim() && !fileUrl) return;

    try {
      const token = localStorage.getItem('rentmate_token');
      const otherParticipant = selectedConversation.participants.find(p => p._id !== user._id);
      
      const payload = {
        messageText,
        receiverId: otherParticipant._id,
        fileUrl,
        fileType
      };
      
      if (!selectedConversation.isNew) {
          payload.conversationId = selectedConversation._id;
      }

      const { data } = await axios.post(`${BACKEND_URL}/api/chat/message`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      if (selectedConversation.isNew) {
          // Fetch updated list to get the real conversation object with participants
          const res = await axios.get(`${BACKEND_URL}/api/chat/conversations`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const updatedConversations = res.data;
          setConversations(updatedConversations);
          
          // Find the new conversation in the list
          const newConv = updatedConversations.find(c => c._id === (data.conversationId?._id || data.conversationId));
          if (newConv) {
            setSelectedConversation(newConv);
          }
      } else {
          setMessages([...messages, data]);
          fetchConversations(); // Trigger list refresh for last message
      }
      
      // Emit via socket with required fields
      socket.current.emit('sendMessage', {
          ...data,
          senderId: user._id,
          receiverId: otherParticipant._id,
          messageText,
          fileUrl,
          fileType
      });
      
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] w-full bg-[#f0f2f5] overflow-hidden">
      <div className="max-w-[1600px] h-full mx-auto flex bg-white shadow-2xl overflow-hidden border-x border-slate-200">
        <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-[350px] lg:w-[400px] flex-shrink-0 border-r border-slate-200 flex-col bg-white h-full`}>
          <ChatSidebar 
            conversations={conversations} 
            selectedId={selectedConversation?._id} 
            onSelect={setSelectedConversation}
            currentUserId={user?._id}
          />
        </div>
        
        <div className={`${!selectedConversation ? 'hidden md:flex' : 'flex'} flex-1 flex flex-col bg-[#efeae2] relative`}>
          {selectedConversation && (
            <button 
              onClick={() => setSelectedConversation(null)}
              className="md:hidden absolute top-4 left-4 z-50 p-2 bg-white/80 rounded-full shadow-md text-slate-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}
          <ChatWindow 
            selectedConversation={selectedConversation} 
            messages={messages} 
            onSendMessage={handleSendMessage}
            currentUserId={user?._id}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
