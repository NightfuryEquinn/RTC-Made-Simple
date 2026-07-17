import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

function createMockClient(overrides: Record<string, unknown> = {}) {
  return {
    handshake: { query: { userName: 'alice', roomName: 'general' } },
    data: { user: 'alice', roomName: 'general' },
    join: jest.fn(),
    leave: jest.fn(),
    to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    emit: jest.fn(),
    disconnect: jest.fn(),
    ...overrides
  };
}

describe('ChatGateway', () => {
  it('broadcasts newMessage with server messageId and acks sender', async () => {
    const chatService = {
      saveMessage: jest.fn().mockResolvedValue({
        messageId: 'msg-1',
        senderName: 'alice',
        receiverName: null,
        message: 'hello',
        roomName: 'general',
        timestamp: '2026-01-01T00:00:00.000Z',
        metadata: undefined
      }),
      canConnect: jest.fn().mockResolvedValue(true)
    } as unknown as ChatService;

    const gateway = new ChatGateway(chatService);
    const roomEmit = jest.fn();
    const client = createMockClient({
      to: jest.fn().mockReturnValue({ emit: roomEmit })
    });

    const result = await gateway.handleSendMessage(
      { message: 'hello', clientMessageId: 'temp-1' },
      client as any
    );

    expect(result.ok).toBe(true);
    expect(roomEmit).toHaveBeenCalledWith(
      'newMessage',
      expect.objectContaining({
        messageId: 'msg-1',
        clientMessageId: 'temp-1'
      })
    );
    expect(client.emit).toHaveBeenCalledWith(
      'messageAck',
      expect.objectContaining({
        messageId: 'msg-1',
        clientMessageId: 'temp-1'
      })
    );
  });

  it('emits messageHistory for getMessages', async () => {
    const messages = [
      {
        messageId: '1',
        senderName: 'alice',
        message: 'hi',
        roomName: 'general',
        timestamp: '2026-01-01T00:00:00.000Z'
      }
    ];
    const chatService = {
      getMessages: jest.fn().mockResolvedValue(messages),
      canConnect: jest.fn().mockResolvedValue(true)
    } as unknown as ChatService;

    const gateway = new ChatGateway(chatService);
    const client = createMockClient();

    const result = await gateway.handleGetMessages({ limit: 10 }, client as any);

    expect(result.ok).toBe(true);
    expect(client.emit).toHaveBeenCalledWith('messageHistory', {
      roomName: 'general',
      messages
    });
  });
});
