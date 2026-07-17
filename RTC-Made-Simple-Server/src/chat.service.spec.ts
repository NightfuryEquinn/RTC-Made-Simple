import { ChatService } from './chat.service';
import { ChatCallbacks } from './interfaces/chat-callbacks.interface';
import { CallStatus } from './dtos/end-call.dto';
import { VideoCallService } from './video-call.service';

describe('ChatService', () => {
  it('generates a messageId when callback returns void', async () => {
    const callbacks: ChatCallbacks = {
      onMessageSent: jest.fn().mockResolvedValue(undefined)
    };
    const service = new ChatService(callbacks);

    const result = await service.saveMessage('alice', null, 'hello', 'general');

    expect(result.messageId).toBeTruthy();
    expect(result.senderName).toBe('alice');
    expect(result.message).toBe('hello');
    expect(result.roomName).toBe('general');
    expect(callbacks.onMessageSent).toHaveBeenCalled();
  });

  it('uses messageId returned by callback', async () => {
    const callbacks: ChatCallbacks = {
      onMessageSent: jest.fn().mockResolvedValue({
        messageId: 'server-123',
        timestamp: '2026-01-01T00:00:00.000Z'
      })
    };
    const service = new ChatService(callbacks);

    const result = await service.saveMessage('alice', 'bob', 'hi', 'dm');

    expect(result.messageId).toBe('server-123');
    expect(result.timestamp).toBe('2026-01-01T00:00:00.000Z');
  });

  it('returns empty history when no callback is configured', async () => {
    const service = new ChatService();
    await expect(service.getMessages('general')).resolves.toEqual([]);
  });

  it('rejects connections when canConnect returns false', async () => {
    const service = new ChatService({
      canConnect: () => false
    });

    await expect(
      service.canConnect('alice', 'general', {})
    ).resolves.toBe(false);
  });
});

describe('VideoCallService', () => {
  it('invokes create and end callbacks', async () => {
    const callbacks = {
      onCallCreated: jest.fn().mockResolvedValue(undefined),
      onCallEnded: jest.fn().mockResolvedValue(undefined)
    };
    const service = new VideoCallService(callbacks);

    const created = await service.createCall('alice', 'bob', 42);
    expect(created.callId).toBeTruthy();
    expect(callbacks.onCallCreated).toHaveBeenCalledWith('alice', 'bob', 42);

    await service.endCall('alice', 'bob', CallStatus.ENDED);
    expect(callbacks.onCallEnded).toHaveBeenCalledWith(
      'alice',
      'bob',
      CallStatus.ENDED
    );
  });

  it('allows connections by default', async () => {
    const service = new VideoCallService();
    await expect(service.canConnect('alice', 'alice', {})).resolves.toBe(true);
  });
});
