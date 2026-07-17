"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatWindow = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const useChatSocket_1 = require("../hooks/useChatSocket");
const MessageItem_1 = require("./MessageItem");
const ChatWindow = ({ userName, roomName, baseUrl, onMessageReceived, placeholder = 'Type a message...', emptyStateText = 'No messages yet', showTypingIndicator = true, maxMessages, loadHistory = true }) => {
    const [inputText, setInputText] = (0, react_1.useState)('');
    const flatListRef = (0, react_1.useRef)(null);
    const markedReadRef = (0, react_1.useRef)(new Set());
    const { messages, typingUsers, isConnected, connectionError, sendMessage, setTyping, markMessageAsRead, deleteMessage } = (0, useChatSocket_1.useChatSocket)({
        userName,
        roomName,
        baseUrl,
        onMessageReceived,
        maxMessages,
        loadHistory
    });
    (0, react_1.useEffect)(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);
    (0, react_1.useEffect)(() => {
        messages.forEach((message) => {
            if (message.messageId &&
                message.senderName !== userName &&
                !message.isRead &&
                !markedReadRef.current.has(message.messageId)) {
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
    const handleTextChange = (text) => {
        setInputText(text);
        setTyping(text.length > 0);
    };
    const renderMessage = ({ item }) => (<MessageItem_1.MessageItem message={item} isOwnMessage={item.senderName === userName} onLongPress={(message) => {
            if (message.messageId && message.senderName === userName) {
                deleteMessage(message.messageId);
            }
        }}/>);
    const renderTypingIndicator = () => {
        if (!showTypingIndicator || typingUsers.length === 0) {
            return null;
        }
        const typingText = typingUsers.length === 1
            ? `${typingUsers[0]} is typing...`
            : `${typingUsers.length} people are typing...`;
        return (<react_native_1.View style={styles.typingIndicator}>
        <react_native_1.Text style={styles.typingText}>{typingText}</react_native_1.Text>
      </react_native_1.View>);
    };
    return (<react_native_1.KeyboardAvoidingView style={styles.container} behavior={react_native_1.Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={react_native_1.Platform.OS === 'ios' ? 90 : 0}>
      <react_native_1.View style={styles.header}>
        <react_native_1.Text style={styles.headerText}>{roomName}</react_native_1.Text>
        <react_native_1.Text style={styles.connectionText}>
          {connectionError
            ? connectionError
            : isConnected
                ? 'Connected'
                : 'Connecting...'}
        </react_native_1.Text>
      </react_native_1.View>

      <react_native_1.FlatList ref={flatListRef} data={messages} renderItem={renderMessage} keyExtractor={(item, index) => item.messageId || item.clientMessageId || `message-${index}`} contentContainerStyle={styles.messagesList} ListEmptyComponent={<react_native_1.View style={styles.emptyState}>
            <react_native_1.Text style={styles.emptyStateText}>{emptyStateText}</react_native_1.Text>
          </react_native_1.View>}/>

      {renderTypingIndicator()}

      <react_native_1.View style={styles.inputContainer}>
        <react_native_1.TextInput style={styles.input} value={inputText} onChangeText={handleTextChange} placeholder={placeholder} multiline maxLength={1000}/>
        <react_native_1.TouchableOpacity style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} onPress={handleSendMessage} disabled={!inputText.trim()}>
          <react_native_1.Text style={styles.sendButtonText}>Send</react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>
    </react_native_1.KeyboardAvoidingView>);
};
exports.ChatWindow = ChatWindow;
const styles = react_native_1.StyleSheet.create({
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
//# sourceMappingURL=ChatWindow.js.map