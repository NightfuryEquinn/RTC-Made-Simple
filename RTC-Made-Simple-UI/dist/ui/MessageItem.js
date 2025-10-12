"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageItem = void 0;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const MessageItem = ({ message, isOwnMessage, onLongPress, showSenderName = true }) => {
    return (<react_native_1.TouchableOpacity style={[
            styles.container,
            isOwnMessage ? styles.ownMessage : styles.otherMessage
        ]} onLongPress={() => onLongPress?.(message)} activeOpacity={0.7}>
      {!isOwnMessage && showSenderName && (<react_native_1.Text style={styles.senderName}>{message.senderName}</react_native_1.Text>)}
      <react_native_1.View style={[
            styles.bubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble
        ]}>
        <react_native_1.Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
        ]}>
          {message.message}
        </react_native_1.Text>
        <react_native_1.View style={styles.footer}>
          <react_native_1.Text style={[
            styles.timestamp,
            isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp
        ]}>
            {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        })}
          </react_native_1.Text>
          {isOwnMessage && message.isRead && (<react_native_1.Text style={styles.readReceipt}>✓✓</react_native_1.Text>)}
        </react_native_1.View>
      </react_native_1.View>
    </react_native_1.TouchableOpacity>);
};
exports.MessageItem = MessageItem;
const styles = react_native_1.StyleSheet.create({
    container: {
        marginBottom: 16,
        maxWidth: '80%',
    },
    ownMessage: {
        alignSelf: 'flex-end',
        alignItems: 'flex-end',
    },
    otherMessage: {
        alignSelf: 'flex-start',
        alignItems: 'flex-start',
    },
    senderName: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
        marginLeft: 8,
    },
    bubble: {
        borderRadius: 16,
        padding: 12,
        maxWidth: '100%',
    },
    ownBubble: {
        backgroundColor: '#007AFF',
    },
    otherBubble: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    messageText: {
        fontSize: 16,
        marginBottom: 4,
    },
    ownMessageText: {
        color: '#fff',
    },
    otherMessageText: {
        color: '#333',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    timestamp: {
        fontSize: 10,
    },
    ownTimestamp: {
        color: 'rgba(255,255,255,0.7)',
    },
    otherTimestamp: {
        color: '#999',
    },
    readReceipt: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.7)',
        marginLeft: 4,
    },
});
//# sourceMappingURL=MessageItem.js.map