import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform,
  FlatList, TextInput, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuthStore } from '../store/useAuthStore';
import { wsService } from '../services/websocket';
import { theme } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Chat'>;
  route: RouteProp<RootStackParamList, 'Chat'>;
};

// Assuming backend supports standard chat payloads
interface ChatMessage {
  id: string;
  roomId: string;
  senderId: number;
  senderName: string;
  content: string;
  timestamp: string;
}

export default function ChatScreen({ navigation, route }: Props) {
  const { roomId } = route.params;
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // 1. Fetch initial chat history (Simulated here if no API endpoint yet)
    setMessages([
      {
        id: 'msg_1',
        roomId,
        senderId: 0,
        senderName: 'Hỗ trợ DuLịch App',
        content: 'Chào bạn, chúng tôi có thể giúp gì cho chuyến đi của bạn?',
        timestamp: new Date().toISOString(),
      }
    ]);

    // 2. Subscribe to WebSocket chat topic
    const topic = `/topic/chat.${roomId}`;
    const subId = wsService.subscribe(topic, (msg: any) => {
      // msg could be ChatMessage object
      if (msg && msg.content) {
        setMessages(prev => [...prev, msg as ChatMessage]);
      }
    });

    return () => {
      wsService.unsubscribe(subId);
    };
  }, [roomId]);

  const handleSend = useCallback(() => {
    if (!inputText.trim() || !user) return;

    const newMsg: ChatMessage = {
      id: `local_${Date.now()}`,
      roomId,
      senderId: user.userId,
      senderName: user.fullName || 'User',
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
    };

    // Optimistic UI update
    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    // Send via WebSocket (Assuming backend listens to /app/chat.send)
    wsService.publish('/app/chat.send', newMsg);

  }, [inputText, user, roomId]);

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.senderId === user?.userId;

    return (
      <View style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperOther]}>
        {!isMe && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.senderName.charAt(0)}</Text>
          </View>
        )}
        <View style={isMe ? styles.messageBubbleMe : styles.messageBubbleOther}>
          {!isMe && <Text style={styles.senderName}>{item.senderName}</Text>}
          <Text style={[styles.messageText, isMe && styles.messageTextMe]}>{item.content}</Text>
          <Text style={[styles.timeText, isMe && styles.timeTextMe]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.hTitle}>Hỗ trợ trực tuyến</Text>
          <Text style={styles.hSubtitle}>Bao gồm nhóm chat & hỗ trợ viên</Text>
        </View>
        <TouchableOpacity style={styles.backBtn}>
          <Icon name="information-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TouchableOpacity style={styles.attachBtn}>
            <Icon name="paperclip" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor={theme.colors.textLight}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Icon name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  backBtn: { padding: 8 },
  headerInfo: { flex: 1, alignItems: 'center' },
  hTitle: { ...theme.typography.h3, color: theme.colors.text },
  hSubtitle: { ...theme.typography.caption, color: theme.colors.success, marginTop: 2 },
  listContent: { padding: 16, flexGrow: 1 },
  messageWrapper: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end', maxWidth: '80%' },
  messageWrapperMe: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  messageWrapperOther: { alignSelf: 'flex-start' },
  avatar: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: 8,
  },
  avatarText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  messageBubbleOther: {
    backgroundColor: '#fff', padding: 12, borderRadius: 18,
    borderBottomLeftRadius: 4, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3,
  },
  messageBubbleMe: {
    backgroundColor: theme.colors.primary, padding: 12, borderRadius: 18,
    borderBottomRightRadius: 4, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3,
  },
  senderName: { ...theme.typography.caption, fontWeight: '700', color: theme.colors.primary, marginBottom: 4 },
  messageText: { ...theme.typography.body, color: theme.colors.text },
  messageTextMe: { color: '#fff' },
  timeText: { fontSize: 10, color: theme.colors.textLight, marginTop: 4, alignSelf: 'flex-end' },
  timeTextMe: { color: 'rgba(255,255,255,0.7)' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: theme.colors.surface, paddingHorizontal: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  attachBtn: { padding: 10, marginBottom: 2 },
  textInput: {
    flex: 1, backgroundColor: theme.colors.background, minHeight: 40, maxHeight: 100,
    borderRadius: 20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
    color: theme.colors.text, marginRight: 8,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 2,
  },
  sendBtnDisabled: { backgroundColor: theme.colors.textLight },
});
