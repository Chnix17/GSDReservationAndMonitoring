import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMessageCircle, FiMoreVertical, FiPaperclip, 
  FiSend, FiX, FiChevronLeft, 
  FiSmile, FiImage, FiVideo, FiFile,
  FiSearch, 
  FiMoreHorizontal,  FiEdit,
  FiArchive,  FiStar, 
  FiCheck, FiCheckCircle, FiUserPlus, FiRefreshCw,
  FiAlertCircle, FiHeart, FiThumbsUp, FiCornerUpRight,
 FiTrash,  FiPlus
} from 'react-icons/fi';
import {  FaRegLaughBeam} from 'react-icons/fa';
import { useInView } from 'react-intersection-observer';
import Sidebar from './component/dean_sidebar';
import {SecureStorage} from '../utils/encryption';

const MessageItem = memo(({ message, isOwn, onSelect, isSelected, showReactionPicker, onReaction, currentUser }) => {
  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: true
  });

  // Get the appropriate avatar URL based on whether it's own message or not
  const getAvatarUrl = (picture) => {
    if (!picture || picture === undefined || picture === null) return 'default-avatar.svg';
    return `http://localhost/coc/gsd/${picture}`;
  };
  
  // Format timestamp
  const messageTime = format(new Date(message.timestamp), 'HH:mm');
  
  // Status icons based on message status
  const renderStatus = () => {
    if (message.status === 'sent') {
      return <FiCheck className="w-3.5 h-3.5 text-gray-400" />;
    } else if (message.status === 'delivered') {
      return <FiCheckCircle className="w-3.5 h-3.5 text-gray-400" />;
    } else if (message.status === 'read') {
      return <FiCheckCircle className="w-3.5 h-3.5 text-primary" />;
    }
    return null;
  };

  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group relative mb-3`}
      onContextMenu={(e) => {
        e.preventDefault();
        onSelect();
      }}
    >
      {!isOwn && (
        <div className="mr-2 flex-shrink-0">
          <img 
            src={getAvatarUrl(message.senderPic)}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full" 
            alt="avatar"
            onError={(e) => { e.target.src = 'default-avatar.svg' }}
          />
        </div>
      )}
      <div 
        className={`max-w-[75%] sm:max-w-[70%] ${isSelected ? 'bg-primary/5 ring-2 ring-primary/20' : ''} rounded-2xl p-1 relative group`}
      >
        <div
          className={`rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 backdrop-blur-sm ${
            isOwn 
              ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-md' 
              : 'bg-white border border-gray-100 shadow-sm'
          }`}
        >
          {!isOwn && (
            <p className="text-xs font-medium text-primary mb-1">{message.senderName}</p>
          )}
          
          {/* Reply info if this message is a reply */}
          {message.replyTo && (
            <div className={`mb-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-medium ${isOwn ? 'bg-primary-dark/30 text-white' : 'bg-gray-100 text-gray-600'}`}>
              <p className="flex items-center gap-1 mb-1">
                <FiCornerUpRight className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{isOwn && message.replyTo.senderName === currentUser.name ? 'Replying to yourself' : `Replying to ${message.replyTo.senderName}`}</span>
              </p>
              <p className="truncate">{message.replyTo.text}</p>
            </div>
          )}
          
          {message.fileUrl && (
            <div className="mb-2 rounded-lg overflow-hidden">
              {message.fileType?.startsWith('image') ? (
                <img 
                  src={message.fileUrl} 
                  alt="attachment" 
                  className="w-full rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                  loading="lazy"
                />
              ) : message.fileType?.startsWith('audio') ? (
                <div className="bg-gray-50 p-2 rounded-lg">
                  <audio controls className="w-full h-8">
                    <source src={message.fileUrl} type={message.fileType} />
                  </audio>
                </div>
              ) : message.fileType?.startsWith('video') ? (
                <video 
                  controls 
                  className="w-full rounded-lg"
                  poster={message.thumbnail}
                >
                  <source src={message.fileUrl} type={message.fileType} />
                </video>
              ) : (
                <a 
                  href={message.fileUrl} 
                  className="flex items-center gap-2 p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <FiFile className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">{message.fileName}</span>
                </a>
              )}
            </div>
          )}
          <p className={`text-sm leading-relaxed ${isOwn ? 'text-white' : 'text-gray-800'}`}>
            {message.text}
          </p>
          <div className="flex items-center justify-end gap-2 mt-1">
            <span className={`text-[10px] ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>
              {messageTime}
            </span>
            {isOwn && (
              <span className={`text-[10px] ${isOwn ? 'text-white/70' : 'text-gray-400'} flex`}>
                {renderStatus()}
              </span>
            )}
          </div>
        </div>
        
        {/* Quick reactions that appear on hover/touch */}
        <div className="absolute bottom-0 right-0 translate-y-full opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all duration-200 flex gap-1 mt-1 bg-white rounded-full shadow-lg p-1 border border-gray-100 z-10">
          <button 
            onClick={() => onReaction('❤️')}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiHeart className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-500" />
          </button>
          <button 
            onClick={() => onReaction('👍')}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiThumbsUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
          </button>
          <button 
            onClick={() => onReaction('😂')}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FaRegLaughBeam className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500" />
          </button>
          <button 
            onClick={() => onSelect()}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiMoreHorizontal className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500" />
          </button>
        </div>
      </div>
      {isOwn && (
        <div className="ml-2 flex-shrink-0">
          <img 
            src={getAvatarUrl(currentUser.picture)}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full" 
            alt="avatar"
            onError={(e) => { e.target.src = 'default-avatar.svg' }}
          />
        </div>
      )}
    </motion.div>
  );
});

const Chat = () => {
  // Import SecureStorage
  const [apiUrl] = useState(() => {
    const url = SecureStorage.getLocalItem("url");
    return url || "http://localhost/coc/gsd/";
  });
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentUser] = useState({
    id: SecureStorage.getLocalItem('user_id'),
    name: SecureStorage.getLocalItem('name'),
    picture: SecureStorage.getLocalItem('profile_pic')
  });

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fileInputRef = useRef(null);
  
  // Remove these states related to voice recording
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef(null);

  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [messageToReply, setMessageToReply] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [chatFilter, setChatFilter] = useState('all'); // all, unread, personal, groups
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);

  const [viewMode, setViewMode] = useState('list');
  const [conversationSearch, setConversationSearch] = useState('');

  const [shouldAutoScroll, setShouldAutoScroll] = useState(false);

  const wsRef = useRef(null);

  // Set up responsive design


  // Listen for sidebar collapsed state changes from Sidebar component
  useEffect(() => {
    // Add event listener for sidebar toggle

    // Add event listener for mobile sidebar toggle
    const handleMobileSidebarToggle = (e) => {
      if (e.detail && typeof e.detail.open !== 'undefined') {
        const mobileContainer = document.querySelector('.mobile-chat-container');
        if (mobileContainer) {
          if (e.detail.open) {
            mobileContainer.classList.add('sidebar-open');
          } else {
            mobileContainer.classList.remove('sidebar-open');
          }
        }
      }
    };


    
    return () => {
      window.removeEventListener('mobile-sidebar-toggle', handleMobileSidebarToggle);
    };
  }, []);

  // Search filter for conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter(chat => {
      // First apply category filter
      if (chatFilter === 'unread' && chat.unread === 0) return false;
      if (chatFilter === 'groups' && !chat.isGroup) return false;
      
      // Then apply search filter if any
      if (!conversationSearch) return true;
      
      const searchTerm = conversationSearch.toLowerCase();
      return (
        chat.name.toLowerCase().includes(searchTerm) || 
        (chat.lastMessage && chat.lastMessage.toLowerCase().includes(searchTerm))
      );
    });
  }, [conversations, chatFilter, conversationSearch]);

  // Modify the memorizeFetchAllChats function to use get_message
  const memorizeFetchAllChats = useCallback(async () => {
    try {
      const requestBody = {
        operation: 'get_message',
        userid: currentUser.id
      };

      const response = await fetch(`${apiUrl}user.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      if (data.status === 'success' && Array.isArray(data.data)) {
        // Process the messages and update the state
        const formattedMessages = data.data.map(msg => ({
          id: msg.chat_id,
          text: msg.message,
          timestamp: new Date(msg.created_at),
          status: 'delivered',
          isOwn: msg.sender_id === currentUser.id,
          senderName: msg.sender_name,
          receiverName: msg.receiver_name,
          senderId: msg.sender_id,
          receiverId: msg.receiver_id
        }));
        
        // Only update messages if we have an active conversation
        if (activeConversation) {
          // Filter messages for current conversation
          const conversationMessages = formattedMessages.filter(msg => 
            (msg.senderId === currentUser.id && msg.receiverId === activeConversation.id) ||
            (msg.receiverId === currentUser.id && msg.senderId === activeConversation.id)
          );
          
          setMessages(
            conversationMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
          );
        }

        // Update conversations list
        const conversations = data.data.reduce((acc, msg) => {
          const otherId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
          const otherName = msg.sender_id === currentUser.id ? msg.receiver_name : msg.sender_name;
          
          if (!acc[otherId]) {
            acc[otherId] = {
              id: otherId,
              name: otherName,
              lastMessage: msg.message,
              timestamp: new Date(msg.created_at),
              unread: 0
            };
          }
          
          // Update last message if this message is newer
          const currentTimestamp = new Date(msg.created_at);
          const lastTimestamp = new Date(acc[otherId].timestamp);
          if (currentTimestamp > lastTimestamp) {
            acc[otherId].lastMessage = msg.message;
            acc[otherId].timestamp = currentTimestamp;
          }
          
          return acc;
        }, {});
        
        setConversations(Object.values(conversations));
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  }, [currentUser.id, activeConversation, apiUrl]);

  useEffect(() => {
    if (activeConversation) {
      memorizeFetchAllChats();
    }
  }, [activeConversation, memorizeFetchAllChats]);

  useEffect(() => {
    memorizeFetchAllChats();
    // Reduce refresh interval to 30 seconds and add debounce
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        memorizeFetchAllChats();
      }
    }, 30000);
    return () => clearInterval(intervalId);
  }, [memorizeFetchAllChats]);


  // Helper function to get avatar URL
  const getAvatarUrl = (picture) => {
    if (!picture || picture === undefined || picture === null) return 'default-avatar.svg';
    return `${apiUrl}${picture}`;
  };

  const renderChatHeader = () => {
    if (!activeConversation || !currentUser) return null;
    
    return (
      <div className="sticky top-0 z-10 bg-gradient-to-r from-lime-900 to-green-900 text-white rounded-t-lg">
        <div className="container mx-auto">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {/* Back button - always visible on mobile */}
              <button
                onClick={handleBackClick}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
                aria-label="Back"
              >
                <FiChevronLeft className="w-5 h-5 text-white" />
              </button>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img 
                    src={activeConversation && getAvatarUrl(activeConversation.picture)}
                    className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm" 
                    alt={activeConversation?.name || 'User'}
                    onError={(e) => { e.target.src = 'default-avatar.svg' }}
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full ring-2 ring-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm sm:text-base">{activeConversation?.name || 'Chat'}</h4>
                  <p className="text-xs text-white/70">Online</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200"
                aria-label="Search"
                onClick={() => setShowSearch(!showSearch)}
              >
                <FiSearch className="w-4 h-4 text-white" />
              </button>
              <button 
                onClick={() => setShowChatMenu(!showChatMenu)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 relative"
                aria-label="More options"
              >
                <FiMoreVertical className="w-4 h-4 text-white" />
                {showChatMenu && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl overflow-hidden z-50">
                    <div className="py-1">
                      <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100">
                        <FiUserPlus className="w-4 h-4" /> Add members
                      </button>
                      <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100">
                        <FiEdit className="w-4 h-4" /> Edit chat
                      </button>
                      <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100">
                        <FiStar className="w-4 h-4" /> Pin conversation
                      </button>
                      <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100">
                        <FiArchive className="w-4 h-4" /> Archive chat
                      </button>
                      <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-gray-100">
                        <FiTrash className="w-4 h-4" /> Delete chat
                      </button>
                    </div>
                  </div>
                )}
              </button>
            </div>
          </div>
          
          {/* Search bar - conditionally rendered */}
          <AnimatePresence>
            {showSearch && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 pb-4"
              >
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search in conversation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/10 backdrop-blur-sm text-white placeholder-white/70 border border-white/20 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70" />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

    const renderInputArea = () => (
    <div className="flex-shrink-0 px-3 sm:px-4 py-3 pb-4 sm:pb-6 border-t border-gray-200 bg-white/95 backdrop-blur-md shadow-md">
      {messageToReply && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="mb-3 p-2 sm:p-3 bg-slate-50 rounded-xl flex items-center justify-between border-l-4 border-primary"
        >
          <div className="pl-2 flex-1 min-w-0">
            <p className="text-xs text-slate-600 flex items-center gap-1">
              <FiCornerUpRight className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">Replying to {messageToReply.senderName}</span>
            </p>
            <p className="text-sm font-medium truncate text-gray-700">{messageToReply.text}</p>
          </div>
          <button 
            onClick={() => setMessageToReply(null)}
            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0 ml-2"
          >
            <FiX className="w-4 h-4 text-slate-500" />
          </button>
        </motion.div>
      )}
      
      {attachmentPreview && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 p-2 sm:p-3 bg-gray-50 rounded-xl flex items-center justify-between border border-gray-200"
        >
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {attachmentPreview.type.startsWith('image/') ? (
              <img 
                src={URL.createObjectURL(attachmentPreview)} 
                alt="preview" 
                className="h-12 w-12 sm:h-16 sm:w-16 object-cover rounded-lg flex-shrink-0"
              />
            ) : attachmentPreview.type.startsWith('video/') ? (
              <div className="h-12 w-12 sm:h-16 sm:w-16 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <FiVideo className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
              </div>
            ) : (
              <div className="h-12 w-12 sm:h-16 sm:w-16 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <FiFile className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">{attachmentPreview.name}</p>
              <p className="text-xs text-gray-500">
                {(attachmentPreview.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button 
            onClick={() => setAttachmentPreview(null)}
            className="p-1.5 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0 ml-2"
          >
            <FiX className="w-4 h-4" />
          </button>
        </motion.div>
      )}
      
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 transition-all text-primary"
            aria-label="Attach file"
          >
            <FiPaperclip className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <AnimatePresence>
            {showAttachMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-100 p-2 w-40 sm:w-48 z-10"
              >
                <div className="flex flex-col gap-1">
                  <button 
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowAttachMenu(false);
                    }} 
                    className="flex items-center gap-2 sm:gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors w-full text-left"
                  >
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <FiImage className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium">Photo or Video</span>
                  </button>
                  <button 
                    onClick={() => {
                      // Handle document selection
                      fileInputRef.current?.click();
                      setShowAttachMenu(false);
                    }}
                    className="flex items-center gap-2 sm:gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors w-full text-left"
                  >
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <FiFile className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium">Document</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex-1 relative">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Write a message..."
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-full bg-gray-100 focus:bg-white border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-sm placeholder:text-gray-400"
          />
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-amber-500"
            aria-label="Add emoji"
          >
            <FiSmile className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-100 p-2 sm:p-3 max-w-xs sm:max-w-sm z-10"
              >
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-1 sm:gap-2">
                  {["😊", "😂", "❤️", "👍", "🔥", "🎉", "🙏", "😍", 
                    "😎", "🤔", "😢", "😡", "🤯", "💯", "💪", "👏"].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setNewMessage(prev => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="w-6 h-6 sm:w-8 sm:h-8 hover:bg-gray-100 rounded-lg flex items-center justify-center text-lg sm:text-xl"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={handleSend}
          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary-dark text-white shadow-md hover:shadow-lg transition-all"
          aria-label="Send message"
        >
          <FiSend className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              const file = e.target.files[0];
              // Check file size (max 10MB)
              if (file.size > 10 * 1024 * 1024) {
                setErrorMessage('File size exceeds 10MB limit');
                return;
              }
              
              // Check file type
              const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'audio/mp3', 'application/pdf'];
              if (!allowedTypes.includes(file.type)) {
                setErrorMessage('Unsupported file type');
                return;
              }
              
    
              setAttachmentPreview(file);
            }
          }}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
        />
      </div>
    </div>
  );

  const handleSend = async () => {
    if ((!newMessage.trim() && !attachmentPreview) || !activeConversation?.id || !currentUser?.id) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    
    // Create a unique message ID
    const tempMessageId = Date.now().toString();
    
    // Create message object
    const messageData = {
      sender_id: parseInt(currentUser.id),
      receiver_id: parseInt(activeConversation.id),
      message: messageText,
      message_id: tempMessageId,
      timestamp: new Date().toISOString()
    };

    try {
      // Send message via fetch
      const formData = new URLSearchParams();
      formData.append('operation', 'sendMessage');
      formData.append('sender_id', currentUser.id);
      formData.append('receiver_id', activeConversation.id);
      formData.append('message', messageText);

      const response = await fetch(`${apiUrl}user.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // Try to send through WebSocket if available
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(messageData));
      }

      // Reset states
      setSelectedMessages([]);
      setMessageToReply(null);
      setAttachmentPreview(null);
    } catch (error) {
      console.error('Error sending message:', error);
      // Optionally, show error to user
      setErrorMessage('Failed to send message');
    }
  };



  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);
  
  };

  const handleNewConversation = (user) => {
    const newConversation = {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      lastMessage: '',
      timestamp: new Date(),
      unread: 0,
    };
    setConversations(prev => {
      if (!prev.find(conv => conv.id === user.id)) {
        return [...prev, newConversation];
      }
      return prev;
    });
    setActiveConversation(newConversation);
    setViewMode('conversation');
    setShowNewChat(false);
    setSearchEmail('');
  };

  // Memoize searchEmails function
  const memoizedSearchEmails = useCallback(async (query) => {
    if (!query || query.length < 2) { // Only search if query is at least 2 characters
      setSearchResults([]);
      return;
    }
  
    setIsLoading(true);
    setErrorMessage('');
  
    try {
      const response = await fetch(`${apiUrl}user.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: JSON.stringify({
          operation: 'fetchUserByEmailOrFullname',
          searchTerm: query
        })
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const result = await response.json();
      
      if (result.status === 'success' && Array.isArray(result.data)) {
        const filteredResults = result.data.filter(user => user.users_id !== currentUser.id);
        const userEmails = filteredResults.map(user => ({
          email: user.users_email,
          name: `${user.users_fname} ${user.users_mname} ${user.users_lname}`.trim(),
          id: user.users_id,
          picture: user.users_pic
        }));
        setSearchResults(userEmails);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching emails:', error);
      setErrorMessage('Failed to search emails');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser.id, apiUrl]); 

  const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
  
    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
  
      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);
  
    return debouncedValue;
  };

  // Add debounced search
  const debouncedSearchTerm = useDebounce(searchEmail, 500);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (debouncedSearchTerm) {
        memoizedSearchEmails(debouncedSearchTerm);
      } else {
        setSearchResults([]);
      }
    }, 500);
  
    return () => clearTimeout(timeoutId);
  }, [debouncedSearchTerm, memoizedSearchEmails]);

  // Update the search input handler
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchEmail(value);
    // searchEmails will be called automatically through the debounced effect
  };

  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000; // 3 seconds
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const connectWebSocket = useCallback(() => {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      setConnectionStatus('failed');
      console.error('Max reconnection attempts reached');
      return;
    }

    try {
      const apiUrl = SecureStorage.getLocalItem("url");
      // Convert http:// to ws:// for WebSocket connection
      const wsUrl = apiUrl.replace('http://', 'ws://').replace('/coc/gsd/', '');
      const socket = new WebSocket(`${wsUrl}:8080`);
      wsRef.current = socket;
      setConnectionStatus('connecting');

      socket.onopen = () => {
        console.log('WebSocket Connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        setReconnectAttempts(0); // Reset attempts on successful connection
      };

      socket.onclose = (event) => {
        console.log('WebSocket Disconnected', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // Don't reconnect if closure was clean
        if (event.wasClean) {
          console.log('Clean disconnection');
          return;
        }

        // Attempt to reconnect with exponential backoff
        const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttempts);
        console.log(`Attempting to reconnect in ${delay/1000} seconds...`);
        setReconnectAttempts(prev => prev + 1);
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received WebSocket message:', data);
          
          // Process the incoming message
          if (data.message && (data.sender_id || data.receiver_id)) {
            const messageId = data.message_id || Date.now().toString();
            
            // Add the message to state if it doesn't exist already
            setMessages(prev => {
              // Check if message already exists
              if (prev.some(msg => msg.id === messageId)) {
                return prev;
              }
              
              const newMessage = {
                id: messageId,
                text: data.message,
                timestamp: new Date(data.timestamp || Date.now()),
                status: 'received',
                isOwn: data.sender_id === parseInt(currentUser.id),
                senderPic: data.sender_pic,
                senderName: data.sender_name || (data.sender_id === parseInt(currentUser.id) ? currentUser.name : activeConversation?.name),
                senderId: data.sender_id,
                receiverId: data.receiver_id
              };
              
              return [...prev, newMessage];
            });
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket Error:', error);
        setConnectionStatus('error');
      };

      // Set up ping/pong to keep connection alive
      const pingInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000); // Send ping every 30 seconds

      setWs(socket);

      return () => {
        clearInterval(pingInterval);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close();
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setConnectionStatus('error');
      // Attempt to reconnect
      const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttempts);
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
    }
  }, [activeConversation?.name, currentUser.id, currentUser.name, reconnectAttempts]);

  useEffect(() => {
    const cleanup = connectWebSocket();
    return () => {
      if (cleanup) cleanup();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  // Add connection status indicator in the UI
  useEffect(() => {
    if (connectionStatus !== 'connected' && activeConversation) {
      // Show connection status to user
      const statusMessages = {
        disconnected: 'Disconnected from chat server. Reconnecting...',
        connecting: 'Connecting to chat server...',
        error: 'Connection error. Retrying...',
        failed: 'Failed to connect to chat server. Please refresh the page.'
      };
      
      // You can show this status in your UI
      console.log(statusMessages[connectionStatus]);
    }
  }, [connectionStatus, activeConversation]);

  // Update the handler for when a conversation is clicked
  const handleConversationClick = (conversation) => {
    setActiveConversation(conversation);
    setViewMode('conversation');
    setShouldAutoScroll(true); // Trigger auto-scroll when conversation opens
  };

  // Add a handler for back button click
  const handleBackClick = () => {
    setSearchQuery('');
    setShowSearch(false);
    setShowChatMenu(false);
    setViewMode('list');
    setActiveConversation(null);
    setMessages([]); // Clear current conversation messages
  };

  // Render connection status indicator
  const renderConnectionStatus = () => {
    if (!activeConversation) return null;
    
    const statusConfig = {
      connected: { 
        color: "bg-emerald-500", 
        icon: <FiCheck className="w-3 h-3" />, 
        text: "Connected" 
      },
      connecting: { 
        color: "bg-amber-500", 
        icon: <FiRefreshCw className="w-3 h-3 animate-spin" />, 
        text: "Connecting..." 
      },
      disconnected: { 
        color: "bg-amber-500", 
        icon: <FiRefreshCw className="w-3 h-3 animate-spin" />, 
        text: "Reconnecting..." 
      },
      error: { 
        color: "bg-red-500", 
        icon: <FiAlertCircle className="w-3 h-3" />, 
        text: "Connection error" 
      },
      failed: { 
        color: "bg-red-500", 
        icon: <FiAlertCircle className="w-3 h-3" />, 
        text: "Failed to connect" 
      }
    };
    
    const status = statusConfig[connectionStatus];
    
    if (connectionStatus === 'connected') return null;
    
    return (
      <div className="absolute left-[10.5rem] right-0 top-[94px] z-20 px-4 py-1.5 flex justify-center">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-white ${status.color} shadow-md`}
        >
          {status.icon}
          {status.text}
        </motion.div>
      </div>
    );
  };

  // Add these handlers for message selection and reactions
  const handleSelectMessage = (message) => {
    setSelectedMessages(prev => 
      prev.includes(message.id) 
        ? prev.filter(id => id !== message.id) 
        : [...prev, message.id]
    );
    setSelectedMessageId(message.id);
    setShowReactionPicker(true);
  };

  const handleReaction = (messageId, emoji) => {
    setShowReactionPicker(false);
    setSelectedMessageId(null);
    // Add reaction to message
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, reactions: [...(msg.reactions || []), { emoji, userId: currentUser.id }] }
          : msg
      )
    );
  };

  // Add a useEffect for polling new messages
  useEffect(() => {
    if (!activeConversation || !currentUser.id) return;
    
    // Poll for new messages every second
    const pollingInterval = setInterval(() => {
      // Use the existing memorizeFetchAllChats function to update messages
      memorizeFetchAllChats();
    }, 1000); // Poll every second
    
    // Clean up on unmount or when conversation changes
    return () => clearInterval(pollingInterval);
  }, [activeConversation, currentUser.id, memorizeFetchAllChats]);

  // Auto-scroll to bottom only when conversation is first opened
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
      setShouldAutoScroll(false); // Reset the flag after scrolling
    }
  }, [shouldAutoScroll, messages]);

  // Add error handling component
  const ErrorMessage = ({ message, onClose }) => (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
    >
      <FiAlertCircle className="w-5 h-5" />
      <p>{message}</p>
      <button onClick={onClose} className="ml-2 hover:text-white/80">
        <FiX className="w-4 h-4" />
      </button>
    </motion.div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
      {/* Fixed Sidebar */}
      <div className="flex-shrink-0">
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col h-[calc(100vh-7rem)] min-w-[300px] mt-20 md:mt-[7rem] mx-1.5 md:mx-2 rounded-xl">
        {renderConnectionStatus()}

        {viewMode === "list" ? (
          // List View
          <div className="flex flex-col h-full overflow-hidden rounded-xl">
            <div className="bg-gradient-to-r from-lime-900 to-green-900 text-white shadow-md rounded-xl">
              {/* Header - Now visible on all devices */}
              <div className="flex items-center justify-between p-3 sm:p-4">
                <h3 className="font-semibold text-white text-lg">Chats</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSearch(!showSearch)}
                    className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all"
                    aria-label="Search chats"
                  >
                    <FiSearch className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={() => setShowNewChat(true)}
                    className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all"
                    aria-label="New chat"
                  >
                    <FiPlus className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Search bar - now works on mobile too */}
              <AnimatePresence>
                {showSearch && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-4 sm:px-6 pb-3 sm:pb-4"
                  >
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search conversations..."
                        value={conversationSearch}
                        onChange={(e) => setConversationSearch(e.target.value)}
                        className="w-full bg-white/10 backdrop-blur-sm text-white placeholder-white/70 border border-white/20 rounded-full py-2 px-4 pl-10 pr-8 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm sm:text-base"
                      />
                      <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70" />
                      {conversationSearch && (
                        <button
                          onClick={() => setConversationSearch("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                          aria-label="Clear search"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chat filter tabs */}
              <div className="bg-white border-b border-gray-200 px-2 overflow-x-auto">
                <div className="flex items-center space-x-1 py-2">
                  {["all", "unread", "groups"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setChatFilter(filter)}
                      className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-full whitespace-nowrap transition-all ${
                        chatFilter === filter
                          ? "bg-slate-100 text-slate-800"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {filter === "all" && "All Chats"}
                      {filter === "unread" && "Unread"}
                      {filter === "groups" && "Groups"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat list */}
              <div className="flex-1 overflow-y-auto bg-white max-h-[calc(100vh-180px)] sm:max-h-[calc(100vh-200px)] rounded-b-xl">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-40 py-6">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-sm text-gray-500">
                      Loading conversations...
                    </p>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                      <FiMessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-slate-500" />
                    </div>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 text-center">
                      {conversationSearch
                        ? "No matches found"
                        : "No conversations"}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-500 text-center mb-4 sm:mb-6">
                      {conversationSearch
                        ? "Try a different search term"
                        : "Start a new conversation"}
                    </p>
                    <button
                      onClick={() => setShowNewChat(true)}
                      className="px-4 py-2 sm:px-5 sm:py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base"
                    >
                      <FiPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      New Conversation
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredConversations.map((chat) => (
                      <motion.div
                        key={chat.id}
                        onClick={() => handleConversationClick(chat)}
                        whileTap={{ scale: 0.98 }}
                        className="px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative flex-shrink-0">
                            <img
                              src={chat && getAvatarUrl(chat.picture)}
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white shadow-sm"
                              alt={chat?.name || "User"}
                              onError={(e) => {
                                e.target.src = "default-avatar.svg";
                              }}
                            />
                            {chat.online && (
                              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 rounded-full ring-2 ring-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium sm:font-semibold text-gray-900 truncate text-sm sm:text-base">
                                {chat.name}
                              </h4>
                              <span className="text-xs text-gray-500">
                                {format(new Date(chat.timestamp), "HH:mm")}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              <p className="text-xs sm:text-sm text-gray-500 truncate">
                                {chat.lastMessage}
                              </p>
                              {chat.unread > 0 && (
                                <div className="min-w-[1.25rem] h-5 sm:min-w-[1.5rem] sm:h-6 bg-primary text-white text-xs font-medium rounded-full flex items-center justify-center">
                                  {chat.unread}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Conversation View
          <div className="flex flex-col h-full bg-gradient-to-br from-white via-gray-50/50 to-green-100/20">
            {/* Chat Header - always visible on mobile and tablet */}
            {renderChatHeader()}

            {/* Messages container with proper spacing */}
            <div className="flex-1 overflow-y-auto px-4 py-6 bg-gradient-to-br from-white/90 via-gray-50/90 to-green-100/50 border border-gray-900 relative shadow-md">
              {/* Messages will be displayed here */}
              {messages
                .filter((msg) => {
                  // Filter messages for the active conversation
                  const isSenderOrReceiver =
                    (msg.senderId === currentUser.id &&
                      msg.receiverId === activeConversation.id) ||
                    (msg.senderId === activeConversation.id &&
                      msg.receiverId === currentUser.id);

                  // Also filter by search query if present
                  const matchesSearch =
                    !searchQuery ||
                    msg.text.toLowerCase().includes(searchQuery.toLowerCase());

                  return isSenderOrReceiver && matchesSearch;
                })
                .map((message) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    isOwn={message.senderId === currentUser.id}
                    onSelect={() => handleSelectMessage(message)}
                    isSelected={selectedMessages.includes(message.id)}
                    showReactionPicker={showReactionPicker === message.id}
                    onReaction={(emoji) => handleReaction(message.id, emoji)}
                    currentUser={currentUser}
                  />
                ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area - positioned at bottom without overlay */}
            {renderInputArea()}
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <AnimatePresence>
        {showNewChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg m-4 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-primary/90 to-primary-dark/90 text-white">
                <h3 className="text-lg font-medium">New Message</h3>
                <button
                  onClick={() => setShowNewChat(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5">
                <div className="relative mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <FiUserPlus className="w-4 h-4 text-gray-500" />
                    <p className="text-sm font-medium text-gray-700">Find someone to chat with</p>
                  </div>
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchEmail}
                      onChange={handleSearchInputChange}
                      placeholder="Search by name or email..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm placeholder:text-gray-400"
                      autoFocus
                    />
                  </div>
                </div>
                
                <div className="max-h-80 overflow-y-auto custom-scrollbar rounded-xl">
                  {isLoading ? (
                    <div className="py-10 flex flex-col items-center justify-center text-gray-500 space-y-3">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm">Searching...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="p-1">
                      {searchResults.map((user) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => {
                            handleNewConversation(user);
                            setShowNewChat(false);
                          }}
                          className="p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <img 
                              src={user.picture || 'default-avatar.svg'} 
                              className="w-12 h-12 rounded-full border border-gray-200" 
                              alt={user.name}
                            />
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{user.name}</h4>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                            <button className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors">
                              <FiMessageCircle className="w-5 h-5" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : searchEmail ? (
                    <div className="py-10 flex flex-col items-center justify-center text-gray-500 space-y-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <FiSearch className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-sm">No results found for "{searchEmail}"</p>
                      <button
                        onClick={() => setSearchEmail('')}
                        className="text-xs text-primary font-medium"
                      >
                        Clear search
                      </button>
                    </div>
                  ) : (
                    <div className="py-10 flex flex-col items-center justify-center text-gray-500 space-y-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <FiSearch className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-sm">Start typing to search for contacts</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add style for hiding scrollbar on the conversation list */}
      <style jsx global>{`
        :root {
          --color-primary: #10B981;
          --color-primary-dark: #059669;
        }
        
        html, body {
          height: 100%;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        
        #root {
          height: 100%;
        }
        
        .primary {
          color: var(--color-primary);
        }
        
        .bg-primary {
          background-color: var(--color-primary);
        }
        
        .bg-primary-dark {
          background-color: var(--color-primary-dark);
        }
        
        .text-primary {
          color: var(--color-primary);
        }
        
        .from-primary {
          --tw-gradient-from: var(--color-primary);
        }
        
        .to-primary-dark {
          --tw-gradient-to: var(--color-primary-dark);
        }
        
        .border-primary {
          border-color: var(--color-primary);
        }
        
        .focus\\:border-primary:focus {
          border-color: var(--color-primary);
        }
        
        .focus\\:ring-primary:focus {
          --tw-ring-color: var(--color-primary);
        }
        
        .hover\\:bg-primary\\/10:hover {
          background-color: rgba(16, 185, 129, 0.1);
        }
        
        .hover\\:bg-primary\\/20:hover {
          background-color: rgba(16, 185, 129, 0.2);
        }
        
        .bg-primary\\/10 {
          background-color: rgba(16, 185, 129, 0.1);
        }
        
        .bg-primary\\/20 {
          background-color: rgba(16, 185, 129, 0.2);
        }
        
        .bg-primary\\/5 {
          background-color: rgba(16, 185, 129, 0.05);
        }
        
        .ring-primary\\/20 {
          --tw-ring-color: rgba(16, 185, 129, 0.2);
        }
        
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #aaa;
        }
        
        /* Add transition for responsive layout */
        .transition-all {
          transition-property: all;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 300ms;
        }
        
        /* Responsive improvements */
        @media (max-width: 640px) {
          .rounded-2xl {
            border-radius: 1rem;
          }
          .p-4 {
            padding: 0.875rem;
          }
        }
        
        /* Mobile chat container responsiveness */
        @media (max-width: 768px) {
          .mobile-chat-container {
            width: 100%;
            height: calc(100vh - 60px);
            position: relative;
            display: flex;
            flex-direction: column;
          }
          
          .mobile-chat-container.sidebar-open {
            transform: translateX(80%);
          }
          
          /* Improve touch targets on mobile */
          button {
            min-height: 44px;
            min-width: 44px;
          }
          
          /* Better spacing for mobile */
          .px-3 {
            padding-left: 0.75rem;
            padding-right: 0.75rem;
          }
          
          .py-2.5 {
            padding-top: 0.625rem;
            padding-bottom: 0.625rem;
          }
          
          /* Improve text readability on mobile */
          .text-sm {
            font-size: 0.875rem;
            line-height: 1.25rem;
          }
          
          /* Better message bubble spacing on mobile */
          .mb-3 {
            margin-bottom: 0.75rem;
          }
          
          /* Improve input area on mobile */
          input[type="text"] {
            font-size: 16px; /* Prevents zoom on iOS */
          }
        }
        
        /* Tablet specific improvements */
        @media (min-width: 768px) and (max-width: 1024px) {
          .max-w-75 {
            max-width: 70%;
          }
          
          .px-3 {
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }
      `}</style>

      {/* Add error handling component */}
      <AnimatePresence>
        {errorMessage && (
          <ErrorMessage 
            message={errorMessage} 
            onClose={() => setErrorMessage('')} 
          />
        )}
      </AnimatePresence>

      {/* Update WebSocket connection status display */}
      {!isConnected && (
        <div className="fixed bottom-4 right-4 z-50 bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <FiAlertCircle className="w-5 h-5" />
          <p>Connection lost. Attempting to reconnect...</p>
        </div>
      )}

      {/* Update reaction picker */}
      <AnimatePresence>
        {showReactionPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50"
          >
            <div className="grid grid-cols-6 gap-1">
              {['❤️', '👍', '😂', '😊', '😍', '🎉'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(selectedMessageId, emoji)}
                  className="w-8 h-8 hover:bg-gray-100 rounded-lg flex items-center justify-center text-xl"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chat;