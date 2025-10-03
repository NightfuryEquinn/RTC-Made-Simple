"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallOverlay = void 0;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const useCallOverlay_1 = require("../hooks/useCallOverlay");
const CallOverlay = ({ onAccept, onDecline, avatarUrl }) => {
    const { incomingCall, isCallVisible } = (0, useCallOverlay_1.useCallOverlay)();
    if (!isCallVisible || !incomingCall) {
        return null;
    }
    return (<react_native_1.View style={styles.overlay}>
      <react_native_1.View style={styles.callContainer}>
        {avatarUrl && (<react_native_1.Image source={{ uri: avatarUrl }} style={styles.avatar}/>)}
        <react_native_1.Text style={styles.callerName}>{incomingCall.callerName}</react_native_1.Text>
        <react_native_1.Text style={styles.callText}>Incoming video call</react_native_1.Text>
        
        <react_native_1.View style={styles.buttonContainer}>
          <react_native_1.TouchableOpacity style={[styles.button, styles.declineButton]} onPress={onDecline}>
            <react_native_1.Text style={styles.buttonText}>Decline</react_native_1.Text>
          </react_native_1.TouchableOpacity>
          <react_native_1.TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={onAccept}>
            <react_native_1.Text style={styles.buttonText}>Accept</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>
      </react_native_1.View>
    </react_native_1.View>);
};
exports.CallOverlay = CallOverlay;
const styles = react_native_1.StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    callContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        minWidth: 280,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 16,
    },
    callerName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    callText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 24,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    button: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    acceptButton: {
        backgroundColor: '#4CAF50',
    },
    declineButton: {
        backgroundColor: '#f44336',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
//# sourceMappingURL=CallOverlay.js.map