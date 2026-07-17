import { VideoCallGateway } from './video-call.gateway';
import { VideoCallService } from './video-call.service';
import { CallStatus } from './dtos/end-call.dto';

function createMockClient(overrides: Record<string, unknown> = {}) {
  return {
    handshake: { query: { callerName: 'alice', roomName: 'alice' } },
    data: {
      user: 'alice',
      homeRoom: 'alice',
      roomName: 'bob',
      activeCall: null
    },
    join: jest.fn(),
    leave: jest.fn(),
    to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    emit: jest.fn(),
    disconnect: jest.fn(),
    ...overrides
  };
}

describe('VideoCallGateway', () => {
  it('returns joinCallRoom acknowledgement', async () => {
    const service = {
      canConnect: jest.fn().mockResolvedValue(true)
    } as unknown as VideoCallService;
    const gateway = new VideoCallGateway(service);
    const client = createMockClient();

    const result = await gateway.handleJoinCallRoom(
      { roomName: 'bob' },
      client as any
    );

    expect(result).toEqual({ ok: true, roomName: 'bob' });
    expect(client.join).toHaveBeenCalledWith('bob');
  });

  it('ends call with ENDED status on hang up', async () => {
    const service = {
      endCall: jest.fn().mockResolvedValue({ message: 'ok', statusCode: 200 }),
      canConnect: jest.fn().mockResolvedValue(true)
    } as unknown as VideoCallService;
    const gateway = new VideoCallGateway(service);
    const roomEmit = jest.fn();
    const client = createMockClient({
      to: jest.fn().mockReturnValue({ emit: roomEmit })
    });

    await gateway.handleEndCall(
      { callerName: 'alice', receiverName: 'bob', conversationId: 1 },
      client as any
    );

    expect(service.endCall).toHaveBeenCalledWith('alice', 'bob', CallStatus.ENDED);
    expect(client.data.roomName).toBe('alice');
    expect(roomEmit).toHaveBeenCalledWith(
      'callEnded',
      expect.objectContaining({ endedBy: 'alice' })
    );
  });

  it('notifies peers when an active call disconnects', async () => {
    const service = {
      endCall: jest.fn().mockResolvedValue({ message: 'ok', statusCode: 200 }),
      canConnect: jest.fn().mockResolvedValue(true)
    } as unknown as VideoCallService;
    const gateway = new VideoCallGateway(service);
    const roomEmit = jest.fn();
    const client = createMockClient({
      data: {
        user: 'alice',
        homeRoom: 'alice',
        roomName: 'bob',
        activeCall: {
          callerName: 'alice',
          receiverName: 'bob',
          conversationId: 9
        }
      },
      to: jest.fn().mockReturnValue({ emit: roomEmit })
    });

    await gateway.handleDisconnect(client as any);

    expect(roomEmit).toHaveBeenCalledWith(
      'callEnded',
      expect.objectContaining({
        reason: 'Peer disconnected',
        endedBy: 'alice'
      })
    );
    expect(service.endCall).toHaveBeenCalledWith('alice', 'bob', CallStatus.ENDED);
  });
});
