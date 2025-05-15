import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMessageCircle, FiMoreVertical, FiPaperclip, 
  FiSend, FiX, FiChevronLeft, 
  FiSmile, FiImage, FiVideo, FiFile,
  FiSearch, FiPhone, FiVideo as FiVideoCall,
  FiMoreHorizontal, FiShare, FiBookmark, FiEdit,
  FiArchive, FiFolder, FiStar, FiChevronDown,
  FiCheck, FiCheckCircle, FiUserPlus, FiRefreshCw,
  FiAlertCircle, FiHeart, FiThumbsUp, FiCornerUpRight,
  FiChevronRight, FiTrash, FiArrowLeft, FiMessageSquare, FiPlus,
  FiMenu
} from 'react-icons/fi';
import { FaComments, FaLock, FaRegLaughBeam, FaShieldAlt } from 'react-icons/fa';
import { debounce } from 'lodash';
import { Virtuoso } from 'react-virtuoso';
import { useInView } from 'react-intersection-observer';
import Sidebar from './Sidebar';
import {SecureStorage} from '../utils/encryption';

const MessageItem = memo(({ message, isOwn, onSelect, isSelected, showReactionPicker, onReaction, currentUser }) => {
  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: true
  });

  // Get the appropriate avatar URL based on whether it's own message or not
  const getAvatarUrl = (picture) => {
    if (!picture) return 'default-avatar.svg';
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
      return <FiCheckCircle className="w-3.5 h-3.5 text-blue-500" />;
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
            className="w-8 h-8 rounded-full" 
            alt="avatar"
            onError={(e) => { e.target.src = 'default-avatar.svg' }}
          />
        </div>
      )}
      <div 
        className={`max-w-[70%] ${isSelected ? 'bg-blue-50 ring-2 ring-blue-200' : ''} rounded-2xl p-1 relative group`}
      >
        <div
          className={`rounded-2xl px-4 py-3 backdrop-blur-sm ${
            isOwn 
              ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-md' 
              : 'bg-white border border-gray-100 shadow-sm'
          }`}
        >
          {!isOwn && (
            <p className="text-xs font-medium text-indigo-600 mb-1">{message.senderName}</p>
          )}
          
          {/* Reply info if this message is a reply */}
          {message.replyTo && (
            <div className={`mb-2 px-3 py-2 rounded-lg text-xs font-medium ${isOwn ? 'bg-indigo-400/30 text-white' : 'bg-gray-100 text-gray-600'}`}>
              <p className="flex items-center gap-1 mb-1">
                <FiCornerUpRight className="w-3 h-3" />
                <span>{isOwn && message.replyTo.senderName === currentUser.name ? 'Replying to yourself' : `Replying to ${message.replyTo.senderName}`}</span>
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
                  className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <FiFile className="w-5 h-5" />
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
        
        {/* Quick reactions that appear on hover */}
        <div className="absolute bottom-0 right-0 translate-y-full opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-1 mt-1 bg-white rounded-full shadow-lg p-1 border border-gray-100 z-10">
          <button 
            onClick={() => onReaction('❤️')}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiHeart className="w-3.5 h-3.5 text-red-500" />
          </button>
          <button 
            onClick={() => onReaction('👍')}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiThumbsUp className="w-3.5 h-3.5 text-blue-500" />
          </button>
          <button 
            onClick={() => onReaction('😂')}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FaRegLaughBeam className="w-3.5 h-3.5 text-amber-500" />
          </button>
          <button 
            onClick={() => onSelect()}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiMoreHorizontal className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>
      </div>
      {isOwn && (
        <div className="ml-2 flex-shrink-0">
          <img 
            src={getAvatarUrl(currentUser.picture)}
            className="w-8 h-8 rounded-full" 
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const messagesEndRef = useRef(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentUser] = useState({
    id: SecureStorage.getSessionItem('user_id'),
    name: SecureStorage.getSessionItem('name'),
    picture: SecureStorage.getSessionItem('profile_pic')
  });

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [reactions] = useState({});
  const fileInputRef = useRef(null);
  
  // Remove these states related to voice recording
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef(null);

  // Add new states for enhanced features
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [messageToReply, setMessageToReply] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const typingTimeoutRef = useRef(null);

  // Add new states for Telegram-like features
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [showForwardDialog, setShowForwardDialog] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [chatFilter, setChatFilter] = useState('all'); // all, unread, personal, groups
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  
  // Add state for view mode (list or conversation)
  const [viewMode, setViewMode] = useState('list');
  
  // Track previous conversations for back navigation
  const [conversationHistory, setConversationHistory] = useState([]);

  // Add state for conversation search
  const [conversationSearch, setConversationSearch] = useState('');

  // Track mobile view state
  const [isMobile, setIsMobile] = useState(false);

  // Set up responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Set initial value
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen for sidebar collapsed state changes from Sidebar component
  useEffect(() => {
    // Add event listener for sidebar toggle
    const handleSidebarToggle = (e) => {
      if (e.detail && typeof e.detail.collapsed !== 'undefined') {
        setIsSidebarCollapsed(e.detail.collapsed);
      }
    };

    window.addEventListener('sidebar-toggle', handleSidebarToggle);
    
    return () => {
      window.removeEventListener('sidebar-toggle', handleSidebarToggle);
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

  // Remove memoizedFetchChatHistory and replace with memorizeFetchAllChats
  const memorizeFetchAllChats = useCallback(async () => {
    try {
      const requestBody = {
        operation: 'get_message',
        userid: currentUser.id
      };

      const response = await fetch(`${apiUrl}fetchMaster.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response:', response);

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
        
        setMessages(formattedMessages);

        // Group messages by conversation
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
  }, [currentUser.id, apiUrl]);

  // Memoize fetchAllChats function
  const memoizedFetchAllChats = useCallback(async () => {
    try {
      const formData = new URLSearchParams();
      formData.append('operation', 'fetchChatHistory');
      formData.append('userId', currentUser.id);

      const response = await fetch(`${apiUrl}fetchMaster.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      if (data.status === 'success') {
        const chatsByConversation = (data.data || []).reduce((acc, msg) => {
          const otherId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
          const otherName = msg.sender_id === currentUser.id 
            ? `${msg.receiver_fname} ${msg.receiver_lname}`
            : `${msg.sender_fname} ${msg.sender_lname}`;
            
          if (!acc[otherId]) {
            acc[otherId] = {
              messages: [],
              name: otherName
            };
          }
          acc[otherId].messages.push({
            id: msg.chat_id,
            text: msg.message,
            timestamp: new Date(msg.created_at),
            status: 'delivered',
            isOwn: msg.sender_id === currentUser.id,
            senderPic: msg.sender_pic,
            receiverPic: msg.receiver_pic
          });
          return acc;
        }, {});

        const newConversations = Object.entries(chatsByConversation).map(([userId, data]) => {
          const lastMessage = data.messages[0];
          const otherUserPic = lastMessage.isOwn ? lastMessage.receiverPic : lastMessage.senderPic;
          return {
            id: userId,
            name: data.name,
            lastMessage: lastMessage.text,
            timestamp: lastMessage.timestamp,
            unread: data.messages.filter(m => !m.isOwn && !m.read).length,
            picture: otherUserPic
          };
        });

        setConversations(newConversations);

        if (activeConversation) {
          setMessages(chatsByConversation[activeConversation.id]?.messages || []);
        }
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  }, [currentUser.id, activeConversation, apiUrl]); // Add dependencies used inside the function

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

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const closeChat = () => {
    setIsVisible(false);
  };

  // Helper function to get avatar URL
  const getAvatarUrl = (picture) => {
    if (!picture) return 'default-avatar.svg';
    return `http://localhost/coc/gsd/${picture}`;
  };

  const renderChatHeader = () => (
    <div className="sticky top-0 z-10 border-b bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-md">
      <div className="container mx-auto">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveConversation(null)}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
              aria-label="Back"
            >
              <FiChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src={getAvatarUrl(activeConversation.picture)}
                  className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm" 
                  alt="avatar"
                  onError={(e) => { e.target.src = 'default-avatar.svg' }}
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full ring-2 ring-white flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-white">{activeConversation.name}</h4>
                <p className="text-sm text-white/80 flex items-center gap-1">
                  {isTyping ? (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                      </span>
                      <span className="text-xs">typing a message...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs">Active now</span>
                    </>
                  )}
                </p>
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

  const renderInputArea = () => (
    <div className="px-4 py-3 border-t border-gray-200 bg-white/95 backdrop-blur-md">
      {messageToReply && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="mb-3 p-3 bg-indigo-50 rounded-xl flex items-center justify-between border-l-4 border-indigo-400"
        >
          <div className="pl-2">
            <p className="text-xs text-indigo-500 flex items-center gap-1">
              <FiCornerUpRight className="w-3 h-3" />
              Replying to {messageToReply.senderName}
            </p>
            <p className="text-sm font-medium truncate text-gray-700">{messageToReply.text}</p>
          </div>
          <button 
            onClick={() => setMessageToReply(null)}
            className="p-1.5 hover:bg-indigo-100 rounded-full transition-colors"
          >
            <FiX className="w-4 h-4 text-indigo-500" />
          </button>
        </motion.div>
      )}
      
      {attachmentPreview && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 p-3 bg-gray-50 rounded-xl flex items-center justify-between border border-gray-200"
        >
          <div className="flex items-center gap-3">
            {attachmentPreview.type.startsWith('image/') ? (
              <img 
                src={URL.createObjectURL(attachmentPreview)} 
                alt="preview" 
                className="h-16 w-16 object-cover rounded-lg"
              />
            ) : attachmentPreview.type.startsWith('video/') ? (
              <div className="h-16 w-16 bg-indigo-100 rounded-lg flex items-center justify-center">
                <FiVideo className="w-6 h-6 text-indigo-500" />
              </div>
            ) : (
              <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiFile className="w-6 h-6 text-blue-500" />
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900 text-sm">{attachmentPreview.name}</p>
              <p className="text-xs text-gray-500">
                {(attachmentPreview.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button 
            onClick={() => setAttachmentPreview(null)}
            className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>
        </motion.div>
      )}
      
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-all text-gray-600"
            aria-label="Attach file"
          >
            <FiPaperclip className="w-5 h-5" />
          </button>
          <AnimatePresence>
            {showAttachMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-100 p-2 w-48 z-10"
              >
                <div className="flex flex-col gap-1">
                  <button 
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowAttachMenu(false);
                    }} 
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors w-full text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                      <FiImage className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">Photo or Video</span>
                  </button>
                  <button 
                    onClick={() => {
                      // Handle document selection
                      fileInputRef.current?.click();
                      setShowAttachMenu(false);
                    }}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors w-full text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500">
                      <FiFile className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">Document</span>
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
            className="w-full px-4 py-3 rounded-full bg-gray-100 focus:bg-white border border-gray-200 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition-all text-sm placeholder:text-gray-400"
          />
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-amber-500"
            aria-label="Add emoji"
          >
            <FiSmile className="w-5 h-5" />
          </button>
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-100 p-3 max-w-sm z-10"
              >
                <div className="grid grid-cols-8 gap-2">
                  {["😊", "😂", "❤️", "👍", "🔥", "🎉", "🙏", "😍", 
                    "😎", "🤔", "😢", "😡", "🤯", "💯", "💪", "👏"].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setNewMessage(prev => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
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
        <button
          onClick={handleSend}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all"
          aria-label="Send message"
        >
          <FiSend className="w-5 h-5" />
        </button>
        
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files?.[0]) {
              setAttachmentPreview(e.target.files[0]);
            }
          }}
          className="hidden"
        />
      </div>
    </div>
  );

  const handleSend = async () => {
    if ((!newMessage.trim() && !attachmentPreview) || !activeConversation || !ws || ws.readyState !== WebSocket.OPEN) return;

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
      // Send through WebSocket
      ws.send(JSON.stringify(messageData));

      // Add message to UI immediately but only once
      const newMsg = {
        id: tempMessageId,
        text: messageText,
        timestamp: new Date(),
        status: 'sending',
        isOwn: true,
        senderPic: currentUser.picture,
        senderName: currentUser.name
      };

      // Update messages using function form to ensure latest state
      setMessages(prev => {
        // Check if message already exists
        if (prev.some(msg => msg.id === tempMessageId)) {
          return prev;
        }
        return [...prev, newMsg];
      });

      // Reset states
      setSelectedMessages([]);
      setMessageToReply(null);
      setAttachmentPreview(null);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Add debounced typing indicator
  const debouncedSetTyping = useCallback(
    debounce((value) => {
      setIsTyping(value);
    }, 1000),
    []
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);
    debouncedSetTyping(true);
    setTimeout(() => debouncedSetTyping(false), 2000);
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
      const socket = new WebSocket('ws://localhost:8080');
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
          
          // Only add the message if it's relevant to the current conversation
          // and hasn't been added yet
          if (activeConversation && 
              (data.sender_id === parseInt(activeConversation.id) || 
               data.receiver_id === parseInt(activeConversation.id))) {
            
            const messageId = data.message_id || Date.now().toString();
            
            // Check if message already exists
            setMessages(prev => {
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
                senderName: data.sender_name
              };
              
              return [...prev, newMessage];
            });
          }
          // Refresh conversations list to update last messages
          memoizedFetchAllChats();
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
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setConnectionStatus('error');
      // Attempt to reconnect
      const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttempts);
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
    }
  }, [activeConversation, currentUser.id, memoizedFetchAllChats, reconnectAttempts]);

  useEffect(() => {
    const cleanup = connectWebSocket();
    return () => {
      if (cleanup) cleanup();
      if (ws) {
        ws.close();
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
  };

  // Add a handler for back button click
  const handleBackClick = () => {
    setViewMode('list');
    setActiveConversation(null);
  };

  // Render connection status indicator
  const renderConnectionStatus = () => {
    if (!activeConversation) return null;
    
    const statusConfig = {
      connected: { 
        color: "bg-green-500", 
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
      <div className="absolute left-0 right-0 top-[64px] z-20 px-4 py-1.5 flex justify-center">
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
  };

  const handleReaction = (messageId, emoji) => {
    // Handle reaction logic here
    console.log(`Reaction ${emoji} added to message ${messageId}`);
    // You would normally update the message with the reaction
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {/* Mobile top navbar - always visible on mobile */}
      {isMobile && (
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 py-3 px-4 flex items-center justify-between sticky top-0 z-20 shadow-md">
          <div className="flex items-center gap-2">
            <FiMessageCircle className="text-white w-6 h-6" />
            <h1 className="font-semibold text-lg text-white">Messages</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSearch(!showSearch)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all"
            >
              <FiSearch className="w-4 h-4 text-white" />
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all"
            >
              <FiMenu className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}
      
      {/* Search bar - conditionally rendered (mobile) */}
      {isMobile && (
        <AnimatePresence>
          {showSearch && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-3 bg-gradient-to-r from-indigo-500/95 to-blue-500/95 shadow-md backdrop-blur-sm"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={conversationSearch}
                  onChange={(e) => setConversationSearch(e.target.value)}
                  className="w-full bg-white/10 backdrop-blur-sm text-white placeholder-white/70 border border-white/20 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-white/30"
                />
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70" />
                {conversationSearch && (
                  <button 
                    onClick={() => setConversationSearch('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
      
      {/* Main layout with proper mobile ordering */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Sidebar */}
        {!isMobile ? (
          <div className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} border-r border-gray-200 bg-white transition-all duration-300 ease-in-out`}>
            <Sidebar onClose={() => {}} />
          </div>
        ) : mobileMenuOpen && (
          <div className="w-full h-64 overflow-y-auto z-20 border-b border-gray-200 bg-white">
            <Sidebar onClose={() => setMobileMenuOpen(false)} />
          </div>
        )}
        
        {/* Main Content Area */}
        <div className="flex flex-col flex-1 overflow-hidden transition-all duration-300 ease-in-out">
          {renderConnectionStatus()}
          {viewMode === 'list' ? (
            <>
              {/* List View */}
              <div className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-md">
                {!isMobile && ( // Only show this header on desktop, mobile has its own header
                  <div className="flex items-center justify-between px-6 py-4">
                    <h3 className="font-semibold text-white text-lg">Chats</h3>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setShowSearch(!showSearch)}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all"
                      >
                        <FiSearch className="w-4 h-4 text-white" />
                      </button>
                      <button 
                        onClick={() => setShowNewChat(true)}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all"
                      >
                        <FiPlus className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Desktop Search bar - conditionally rendered */}
                {!isMobile && (
                  <AnimatePresence>
                    {showSearch && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-6 pb-4"
                      >
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search conversations..."
                            value={conversationSearch}
                            onChange={(e) => setConversationSearch(e.target.value)}
                            className="w-full bg-white/10 backdrop-blur-sm text-white placeholder-white/70 border border-white/20 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-white/30"
                          />
                          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70" />
                          {conversationSearch && (
                            <button 
                              onClick={() => setConversationSearch('')}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                            >
                              <FiX className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>

              {/* Chat filter tabs */}
              <div className="bg-white border-b border-gray-200 px-2 overflow-x-auto">
                <div className="flex items-center space-x-1 py-2">
                  <button 
                    onClick={() => setChatFilter('all')}
                    className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${
                      chatFilter === 'all' 
                        ? 'bg-indigo-50 text-indigo-600' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    All Chats
                  </button>
                  <button 
                    onClick={() => setChatFilter('unread')}
                    className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${
                      chatFilter === 'unread' 
                        ? 'bg-indigo-50 text-indigo-600' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Unread
                  </button>
                  <button 
                    onClick={() => setChatFilter('groups')}
                    className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${
                      chatFilter === 'groups' 
                        ? 'bg-indigo-50 text-indigo-600' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Groups
                  </button>
                </div>
              </div>

              {/* Chat list */}
              <div className="flex-1 overflow-y-auto bg-white">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-32 py-6">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-sm text-gray-500">Loading conversations...</p>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                      <FiMessageCircle className="w-8 h-8 text-indigo-500" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2 text-center">No conversations found</h4>
                    <p className="text-sm text-gray-500 text-center mb-6">
                      {conversationSearch 
                        ? "Try a different search term" 
                        : "Start a new conversation with someone"}
                    </p>
                    <button
                      onClick={() => setShowNewChat(true)}
                      className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <FiPlus className="w-4 h-4" />
                      New Conversation
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredConversations.map(chat => (
                      <motion.div
                        key={chat.id}
                        onClick={() => handleConversationClick(chat)}
                        whileTap={{ scale: 0.98 }}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative flex-shrink-0">
                            <img 
                              src={getAvatarUrl(chat.picture)}
                              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" 
                              alt={chat.name}
                              onError={(e) => { e.target.src = 'default-avatar.svg' }}
                            />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-gray-900 truncate">{chat.name}</h4>
                              <span className="text-xs text-gray-500">
                                {format(new Date(chat.timestamp), 'HH:mm')}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                              {chat.unread > 0 && (
                                <div className="min-w-[1.5rem] h-6 bg-indigo-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
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
            </>
          ) : (
            <>
              {/* Conversation View */}
              <div className="flex-1 flex flex-col bg-white h-full">
                {/* Chat Header */}
                {renderChatHeader()}
                
                {/* Messages container */}
                <div className="flex-1 overflow-y-auto px-4 py-6 bg-gray-50">
                  {/* Messages will be displayed here */}
                  {messages
                    .filter(msg => {
                      // Filter messages for the active conversation
                      const isSenderOrReceiver = 
                        (msg.senderId === currentUser.id && msg.receiverId === activeConversation.id) ||
                        (msg.senderId === activeConversation.id && msg.receiverId === currentUser.id);
                      
                      // Also filter by search query if present
                      const matchesSearch = !searchQuery || 
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
                
                {/* Input area */}
                {renderInputArea()}
              </div>
            </>
          )}
        </div>
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
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
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
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 text-sm placeholder:text-gray-400"
                      autoFocus
                    />
                  </div>
                </div>
                
                <div className="max-h-80 overflow-y-auto custom-scrollbar rounded-xl">
                  {isLoading ? (
                    <div className="py-10 flex flex-col items-center justify-center text-gray-500 space-y-3">
                      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
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
                            <button className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-full transition-colors">
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
                        className="text-xs text-indigo-500 font-medium"
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

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            setAttachmentPreview(file);
            setSelectedFile(file);
          }
        }}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
      />
      
      {/* Add style for hiding scrollbar on the conversation list */}
      <style jsx global>{`
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
      `}</style>
    </div>
  );
};

export default Chat;
