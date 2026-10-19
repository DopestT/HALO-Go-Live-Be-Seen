import {
  MessengerApiError,
  createConversation,
  getUnreadCount,
  listConversations,
  markConversationRead,
  sendMessage,
} from '../src/api/messageClient';

describe('NSCENE Messenger API client', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('fails closed when the Messenger API base URL is not configured', async () => {
    await expect(listConversations('jwt-token', 'inbox', undefined, undefined, '')).rejects.toThrow(
      'Messenger is not configured for this deployment.',
    );
  });

  it('lists inbox conversations with bearer auth and encoded cursor pagination', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ conversations: [], next_cursor: 0 }),
    } as Response);

    await listConversations('jwt-token', 'requests', 42, 25, 'https://api.nscene.watch/');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.nscene.watch/api/v1/messages/conversations?bucket=requests&cursor=42&limit=25',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer jwt-token' }),
      }),
    );
  });

  it('never sends client-selected sender identity when starting a conversation', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        conversation: {
          id: 10,
          created_by: 1,
          user_low_id: 1,
          user_high_id: 2,
          request_status: 'pending',
        },
        message: { id: 100, conversation_id: 10, sender_id: 1, body: 'hello' },
      }),
    } as Response);

    await createConversation('jwt-token', 2, 'hello', 'https://api.nscene.watch');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.nscene.watch/api/v1/messages/conversations',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer jwt-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target_user_id: 2, message: 'hello' }),
      }),
    );
  });

  it('sends text only to a server-selected conversation actor', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ id: 101, conversation_id: 10, sender_id: 1, body: 'persisted' }),
    } as Response);

    await sendMessage('jwt-token', 10, 'persisted', 'https://api.nscene.watch');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.nscene.watch/api/v1/messages/conversations/10/messages',
      expect.objectContaining({ body: JSON.stringify({ message: 'persisted' }) }),
    );
  });

  it('handles successful no-content mutations without attempting JSON parsing', async () => {
    const json = jest.fn();
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, status: 204, json } as unknown as Response);

    await markConversationRead('jwt-token', 10, 101, 'https://api.nscene.watch');

    expect(json).not.toHaveBeenCalled();
  });

  it('preserves stable server error code, message, and status', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: 'message_request_pending', message: 'Message request is still pending' }),
    } as Response);

    try {
      await sendMessage('jwt-token', 10, 'blocked', 'https://api.nscene.watch');
      throw new Error('expected rejection');
    } catch (error) {
      expect(error).toBeInstanceOf(MessengerApiError);
      expect(error).toMatchObject({
        code: 'message_request_pending',
        status: 409,
        message: 'Message request is still pending',
      });
    }
  });

  it('rejects incomplete unread-count responses instead of inventing state', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);

    await expect(getUnreadCount('jwt-token', 'https://api.nscene.watch')).rejects.toThrow(
      'Messenger unread response was incomplete.',
    );
  });
});
