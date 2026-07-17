import { useChatStore } from './useChatStore';

describe('useChatStore', () => {
  beforeEach(() => {
    useChatStore.getState().reset();
    useChatStore.getState().setMaxMessages(3);
  });

  it('reconciles optimistic temp ids with server message ids', () => {
    const store = useChatStore.getState();
    store.addMessage({
      messageId: 'temp-1',
      clientMessageId: 'temp-1',
      senderName: 'alice',
      message: 'hello',
      roomName: 'general',
      timestamp: '2026-01-01T00:00:00.000Z'
    });

    store.reconcileMessage('temp-1', {
      messageId: 'server-1',
      senderName: 'alice',
      message: 'hello',
      roomName: 'general',
      timestamp: '2026-01-01T00:00:01.000Z'
    });

    const messages = useChatStore.getState().messages;
    expect(messages).toHaveLength(1);
    expect(messages[0].messageId).toBe('server-1');
    expect(messages[0].clientMessageId).toBe('temp-1');
  });

  it('trims messages to maxMessages', () => {
    const store = useChatStore.getState();
    store.addMessage({
      messageId: '1',
      senderName: 'a',
      message: '1',
      roomName: 'r',
      timestamp: '1'
    });
    store.addMessage({
      messageId: '2',
      senderName: 'a',
      message: '2',
      roomName: 'r',
      timestamp: '2'
    });
    store.addMessage({
      messageId: '3',
      senderName: 'a',
      message: '3',
      roomName: 'r',
      timestamp: '3'
    });
    store.addMessage({
      messageId: '4',
      senderName: 'a',
      message: '4',
      roomName: 'r',
      timestamp: '4'
    });

    const messages = useChatStore.getState().messages;
    expect(messages.map((message) => message.messageId)).toEqual(['2', '3', '4']);
  });
});
