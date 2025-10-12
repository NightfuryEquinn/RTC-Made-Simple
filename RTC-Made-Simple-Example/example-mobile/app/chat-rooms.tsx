import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  TextInput,
  SafeAreaView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Device from 'expo-device';

interface ChatRoom {
  id: string;
  name: string;
  lastMessage?: string;
  unreadCount?: number;
}

export default function ChatRoomsScreen() {
  const router = useRouter();
  const [rooms, setRooms] = useState<ChatRoom[]>([
    { id: '1', name: 'general', lastMessage: 'Welcome to general chat!', unreadCount: 0 },
    { id: '2', name: 'random', lastMessage: 'Say hello!', unreadCount: 2 },
    { id: '3', name: 'team', lastMessage: 'Meeting at 3 PM', unreadCount: 5 },
  ]);
  const [newRoomName, setNewRoomName] = useState('');
  const [currentUser, setCurrentUser] = useState<string>('');

  useEffect(() => {
    const initializeDeviceInfo = async () => {
      try {
        const deviceName = Device.deviceName || `${Platform.OS}-${Device.modelName}` || Platform.OS;
        setCurrentUser(deviceName);
      } catch (error) {
        console.error('Error getting device info:', error);
        setCurrentUser(`${Platform.OS}-device`);
      }
    };

    initializeDeviceInfo();
  }, []);

  const handleJoinRoom = (roomName: string) => {
    router.push({
      pathname: '/chat',
      params: { roomName }
    });
  };

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) {
      alert('Please enter a room name');
      return;
    }

    const newRoom: ChatRoom = {
      id: Date.now().toString(),
      name: newRoomName.trim(),
      unreadCount: 0
    };

    setRooms([...rooms, newRoom]);
    setNewRoomName('');
    handleJoinRoom(newRoom.name);
  };

  const renderRoom = ({ item }: { item: ChatRoom }) => (
    <TouchableOpacity 
      style={styles.roomCard}
      onPress={() => handleJoinRoom(item.name)}
    >
      <View style={styles.roomIcon}>
        <Text style={styles.roomIconText}>#</Text>
      </View>
      <View style={styles.roomInfo}>
        <Text style={styles.roomName}>{item.name}</Text>
        {item.lastMessage && (
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        )}
      </View>
      {item.unreadCount ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.unreadCount}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat Rooms</Text>
        <Text style={styles.headerSubtitle}>You: {currentUser}</Text>
      </View>

      <View style={styles.createSection}>
        <TextInput
          style={styles.input}
          value={newRoomName}
          onChangeText={setNewRoomName}
          placeholder="Enter new room name..."
          placeholderTextColor="#999"
        />
        <TouchableOpacity 
          style={styles.createButton}
          onPress={handleCreateRoom}
        >
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={rooms}
        renderItem={renderRoom}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  createSection: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginRight: 10,
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: 'center',
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  list: {
    padding: 15,
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  roomIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  roomIconText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  separator: {
    height: 10,
  },
});
