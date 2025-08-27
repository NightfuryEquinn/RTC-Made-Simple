import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useCallOverlay } from '../hooks/useCallOverlay';

interface CallOverlayProps {
  onAccept: () => void;
  onDecline: () => void;
  avatarUrl?: string;
}

export const CallOverlay: React.FC<CallOverlayProps> = ({
  onAccept,
  onDecline,
  avatarUrl
}) => {
  const { incomingCall, isCallVisible } = useCallOverlay();

  if (!isCallVisible || !incomingCall) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.callContainer}>
        {avatarUrl && (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        )}
        <Text style={styles.callerName}>{incomingCall.callerName}</Text>
        <Text style={styles.callText}>Incoming video call</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, styles.declineButton]} onPress={onDecline}>
            <Text style={styles.buttonText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={onAccept}>
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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