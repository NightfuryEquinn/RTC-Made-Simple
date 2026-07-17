/**
 * Lightweight two-client Socket.IO smoke check for chat + call signaling.
 * Run with the example backend listening on PORT (default 3000):
 *   node scripts/signaling-smoke.mjs
 */
import { io } from 'socket.io-client';

const BASE_URL = process.env.RTC_BASE_URL || 'http://localhost:3000';
const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error(`timeout ${ms}ms`)), ms));

function connect(path, query) {
  return io(BASE_URL, {
    transports: ['websocket'],
    path,
    query,
    forceNew: true
  });
}

async function waitFor(socket, event, ms = 5000) {
  return Promise.race([
    new Promise((resolve) => socket.once(event, resolve)),
    timeout(ms)
  ]);
}

async function smokeChat() {
  const alice = connect('/chat', { userName: 'alice', roomName: 'smoke' });
  const bob = connect('/chat', { userName: 'bob', roomName: 'smoke' });

  await Promise.all([
    waitFor(alice, 'connect'),
    waitFor(bob, 'connect')
  ]);

  const ackPromise = waitFor(alice, 'messageAck');
  const messagePromise = waitFor(bob, 'newMessage');

  alice.emit('sendMessage', {
    message: 'hello smoke',
    clientMessageId: 'temp-smoke-1'
  });

  const [ack, message] = await Promise.all([ackPromise, messagePromise]);
  if (!ack.messageId || ack.clientMessageId !== 'temp-smoke-1') {
    throw new Error('messageAck missing reconciled ids');
  }
  if (message.messageId !== ack.messageId) {
    throw new Error('newMessage id does not match ack');
  }

  alice.disconnect();
  bob.disconnect();
  console.log('chat smoke ok', ack.messageId);
}

async function smokeCall() {
  const alice = connect('/call', { callerName: 'alice', roomName: 'alice' });
  const bob = connect('/call', { callerName: 'bob', roomName: 'bob' });

  await Promise.all([
    waitFor(alice, 'connect'),
    waitFor(bob, 'connect')
  ]);

  await new Promise((resolve) => {
    alice.emit('joinCallRoom', { roomName: 'bob' }, resolve);
  });

  const incomingPromise = waitFor(bob, 'incomingCall');
  alice.emit('incomingCall', {
    callerName: 'alice',
    receiverName: 'bob',
    conversationId: 99
  });
  const incoming = await incomingPromise;
  if (incoming.callerName !== 'alice') {
    throw new Error('incomingCall payload mismatch');
  }

  const acceptedPromise = waitFor(alice, 'callAccepted');
  bob.emit('acceptCall', {
    callerName: 'alice',
    receiverName: 'bob',
    conversationId: 99
  });
  await acceptedPromise;

  await new Promise((resolve) => {
    bob.emit('joinCallRoom', { roomName: 'bob' }, resolve);
  });

  const readyPromise = waitFor(alice, 'peerReady');
  bob.emit('peerReady', {
    roomName: 'bob',
    callerName: 'alice',
    receiverName: 'bob'
  });
  await readyPromise;

  const endedPromise = waitFor(bob, 'callEnded');
  alice.emit('endCall', {
    callerName: 'alice',
    receiverName: 'bob',
    conversationId: 99
  });
  await endedPromise;

  alice.disconnect();
  bob.disconnect();
  console.log('call smoke ok');
}

try {
  await smokeChat();
  await smokeCall();
  console.log('signaling smoke passed');
  process.exit(0);
} catch (error) {
  console.error('signaling smoke failed', error);
  process.exit(1);
}
