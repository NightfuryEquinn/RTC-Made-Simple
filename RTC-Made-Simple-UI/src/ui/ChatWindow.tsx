import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useChatSocket } from '../hooks/useChatSocket';
import { ChatMessage } from '../types/chat.types';
import { MessageItem } from './MessageItem';

interface ChatWindowProps {
  userName: string;
  roomName: string;
  baseUrl: string;
  onMessageReceived?: (message: ChatMessage) => void;
  placeholder?: string;
  emptyStateText?: string;
  showTypingIndicator?: boolean;
  maxMessages?: number;
  loadHistory?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  userName,
  roomName,
  baseUrl,
  onMessageReceived,
  placeholder = 'Type a message...',
  emptyStateText = 'No messages yet',
  showTypingIndicator = true,
  maxMessages,
  loadHistory = true
}) => {
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const markedReadRef = useRef<Set<string>>(new Set());

  const {
    messages,
    typingUsers,
    isConnected,
    connectionError,
    sendMessage,
    setTyping,
    markMessageAsRead,
    deleteMessage
  } = useChatSocket({
    userName,
    roomName,
    baseUrl,
    onMessageReceived,
    maxMessages,
    loadHistory
  });

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    messages.forEach((message) => {
      if (
        message.messageId &&
        message.senderName !== userName &&
        !message.isRead &&
        !markedReadRef.current.has(message.messageId)
      ) {
        markedReadRef.current.add(message.messageId);
        markMessageAsRead(message.messageId, message.senderName);
      }
    });
  }, [messages, userName, markMessageAsRead]);

  const handleSendMessage = () => {
    if (inputText.trim()) {
      sendMessage(inputText);
      setInputText('');
      setTyping(false);
    }
  };

  const handleTextChange = (text: string) => {
    setInputText(text);
    setTyping(text.length > 0);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <MessageItem
      message={item}
      isOwnMessage={item.senderName === userName}
      onLongPress={(message) => {
        if (message.messageId && message.senderName === userName) {
          deleteMessage(message.messageId);
        }
      }}
    />
  );

  const renderTypingIndicator = () => {
    if (!showTypingIndicator || typingUsers.length === 0) {
      return null;
    }

    const typingText =
      typingUsers.length === 1
        ? `${typingUsers[0]} is typing...`
        : `${typingUsers.length} people are typing...`;

    return (
      <View style={styles.typingIndicator}>
        <Text style={styles.typingText}>{typingText}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>{roomName}</Text>
        <Text style={styles.connectionText}>
          {connectionError
            ? connectionError
            : isConnected
              ? 'Connected'
              : 'Connecting...'}
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) =>
          item.messageId || item.clientMessageId || `message-${index}`
        }
        contentContainerStyle={styles.messagesList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{emptyStateText}</Text>
          </View>
        }
      />

      {renderTypingIndicator()}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  connectionText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 4
  },
  messagesList: {
    padding: 16,
    flexGrow: 1
  },
  typingIndicator: {
    padding: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f9f9f9'
  },
  typingText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic'
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end'
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc'
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999'
  }
});
