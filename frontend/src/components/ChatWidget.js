import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { 
  MessageCircle, 
  Send, 
  X, 
  User, 
  Building2,
  ChevronLeft
} from 'lucide-react';

const ChatWidget = () => {
  const { api, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastMessageId, setLastMessageId] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch contacts
  const fetchChatData = async () => {
    try {
      const contactsRes = await api.get('/chat/contacts');
      setContacts(contactsRes.data || []);
    } catch (error) {
      console.error('Chat data fetch error:', error);
      setContacts([]);
    }
  };

  // Fetch conversation messages
  const fetchConversation = async (contactId, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get(`/chat/${contactId}`);
      const newMessages = response.data.messages || [];
      
      // Only update if messages have changed
      setMessages(prevMessages => {
        const prevLength = prevMessages.length;
        const newLength = newMessages.length;
        
        // Check if there are new messages
        if (newLength > prevLength || JSON.stringify(prevMessages) !== JSON.stringify(newMessages)) {
          // Update last message ID for tracking
          if (newMessages.length > 0) {
            setLastMessageId(newMessages[newMessages.length - 1].id);
          }
          return newMessages;
        }
        return prevMessages;
      });
      
      setActiveChat(response.data.contact);
      
      // Update contacts list to reflect read messages
      setContacts(prev => prev.map(contact => 
        contact.user_id === contactId 
          ? { ...contact, unread_count: 0 }
          : contact
      ));
      
    } catch (error) {
      if (!silent) {
        console.error('Failed to fetch conversation:', error);
        toast.error('Failed to load conversation');
        // Reset to contacts list on error
        setActiveChat(null);
        setMessages([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    try {
      const response = await api.post('/chat/send', {
        receiver_id: activeChat.user_id,
        content: newMessage.trim()
      });

      // Add message to local state
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');

      // Update contacts list with latest message
      setContacts(prev => prev.map(contact => 
        contact.user_id === activeChat.user_id
          ? {
              ...contact,
              last_message: newMessage.trim(),
              last_message_time: new Date().toISOString()
            }
          : contact
      ));

    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  // Initialize chat data when opened
  useEffect(() => {
    if (isOpen) {
      fetchChatData();
    }
  }, [isOpen]);

  // Poll for new messages every 3 seconds when chat is open
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      if (activeChat) {
        fetchConversation(activeChat.user_id, true); // Silent mode to avoid loading spinner
      } else {
        // Also refresh contacts list to show new messages
        fetchChatData();
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [isOpen, activeChat]);


  // Poll for contacts data every 15 seconds to show new messages and update last message
  useEffect(() => {
    if (!isOpen || activeChat) return; // Only when contacts list is visible

    const interval = setInterval(() => {
      fetchChatData();
    }, 30000);

    return () => clearInterval(interval);
  }, [isOpen, activeChat]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-lg transition-all duration-200 hover:scale-110 relative flex items-center justify-center"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b bg-emerald-600 text-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {activeChat && (
                    <button
                      onClick={() => setActiveChat(null)}
                      className="p-1 hover:bg-emerald-700 rounded transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  )}
                  <h3 className="font-semibold text-lg truncate">
                    {activeChat ? activeChat.user_name : 'Messages'}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setActiveChat(null);
                    setMessages([]);
                  }}
                  className="p-1 hover:bg-emerald-700 rounded transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {activeChat && (
                <div className="flex items-center gap-2 text-emerald-100 text-sm mt-1">
                  {activeChat.user_role === 'donor' ? <Building2 className="h-3 w-3" /> : <User className="h-3 w-3" />}
                  <span className="text-xs">{activeChat.user_organization || `${activeChat.user_role.charAt(0).toUpperCase() + activeChat.user_role.slice(1)}`}</span>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                {!activeChat ? (
                  /* Contacts List */
                  <div className="flex-1 overflow-y-auto">
                    {contacts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                        <MessageCircle className="h-8 w-8 mb-3 text-gray-300" />
                        <p className="text-center text-sm">
                          No conversations yet. Complete orders to start chatting!
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 space-y-2">
                        {contacts.map((contact) => (
                          <div 
                            key={contact.user_id}
                            className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-gray-100"
                            onClick={() => fetchConversation(contact.user_id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-sm truncate">{contact.user_name}</h4>
                                  {contact.user_role === 'donor' ? 
                                    <Building2 className="h-3 w-3 text-blue-500" /> : 
                                    <User className="h-3 w-3 text-green-500" />
                                  }
                                </div>
                                {contact.user_organization && (
                                  <p className="text-xs text-gray-500 truncate">{contact.user_organization}</p>
                                )}
                                {contact.last_message && (
                                  <p className="text-xs text-gray-600 truncate mt-1">{contact.last_message}</p>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                {contact.last_message_time && (
                                  <span className="text-xs text-gray-400">
                                    {formatTime(contact.last_message_time)}
                                  </span>
                                )}
                                {contact.unread_count > 0 && (
                                  <div className="bg-red-500 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center">
                                    {contact.unread_count > 9 ? '9+' : contact.unread_count}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Chat Messages */
                  <>
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                      {loading ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No messages yet. Start the conversation!</p>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] px-3 py-2 rounded-lg ${
                                message.sender_id === user.id
                                  ? 'bg-emerald-600 text-white rounded-br-sm'
                                  : 'bg-gray-200 text-gray-800 rounded-bl-sm'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  message.sender_id === user.id ? 'text-emerald-100' : 'text-gray-500'
                                }`}
                              >
                                {formatTime(message.timestamp)}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="p-3 border-t bg-gray-50">
                      <form onSubmit={sendMessage} className="flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                        />
                        <button 
                          type="submit" 
                          disabled={!newMessage.trim()}
                          className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </>
                )}
              </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
