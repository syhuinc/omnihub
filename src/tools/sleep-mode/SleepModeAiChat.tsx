import { useEffect, useRef, useState } from 'react';
import { FirebaseFirestore, type CallbackId } from '@capacitor-firebase/firestore';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { useAuth } from '../../cloud/AuthContext';
import { sendSleepAiMessage, SleepAiChatError } from '../../cloud/sleepAiChat';
import { hapticTap, hapticSuccess, hapticWarning } from '../../haptics';
import { PERSONALITY_META } from './types';
import './SleepMode.css';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: number;
}

interface SleepModeAiChatProps {
  onBack: () => void;
}

const personality = PERSONALITY_META.find((p) => p.id === 'gentle')!;

export function SleepModeAiChat({ onBack }: SleepModeAiChatProps) {
  const { user, signingIn, error: authError, signInWithGoogle } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [optimisticUser, setOptimisticUser] = useState<string | null>(null);
  const [awaitingReply, setAwaitingReply] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const preSendCountRef = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    let callbackId: CallbackId | null = null;
    let cancelled = false;

    FirebaseFirestore.addCollectionSnapshotListener<{ role: 'user' | 'assistant'; text: string; createdAt: number | null }>(
      {
        reference: `users/${user.uid}/sleepAiChats`,
        queryConstraints: [{ type: 'orderBy', fieldPath: 'createdAt', directionStr: 'asc' }],
      },
      (event) => {
        if (cancelled || !event) return;
        const next = event.snapshots
          .filter((s) => s.data)
          .map((s) => ({
            id: s.id,
            role: s.data!.role,
            text: s.data!.text,
            createdAt: s.data!.createdAt ?? Date.now(),
          }));
        setMessages(next);
        if (next.length >= preSendCountRef.current + 2) {
          setOptimisticUser(null);
          setAwaitingReply(false);
        }
      },
    ).then((id) => {
      if (cancelled) FirebaseFirestore.removeSnapshotListener({ callbackId: id });
      else callbackId = id;
    });

    return () => {
      cancelled = true;
      if (callbackId) FirebaseFirestore.removeSnapshotListener({ callbackId });
    };
  }, [user]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, optimisticUser, awaitingReply]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    hapticTap();
    setInput('');
    setError(null);
    setSending(true);
    setOptimisticUser(text);
    setAwaitingReply(true);
    preSendCountRef.current = messages.length;
    try {
      await sendSleepAiMessage(text);
      hapticSuccess();
    } catch (err) {
      hapticWarning();
      setOptimisticUser(null);
      setAwaitingReply(false);
      setError(err instanceof SleepAiChatError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  }

  if (!user) {
    return (
      <div className="screen">
        <ScreenHeader title="Sleep Mode AI" subtitle="Gentle" onBack={onBack} />
        <div className="sm__chat-signin">
          <span className="sm__personality-emoji sm__chat-signin-emoji" style={{ '--emoji-color': personality.color } as never}>
            {personality.image ? <img src={personality.image} alt="" /> : null}
          </span>
          <h3>Sign in to chat with Sleep Mode AI</h3>
          <p>Your conversation is saved to your account so you can pick it back up anytime.</p>
          <button type="button" className="smp__upgrade-btn" onClick={signInWithGoogle} disabled={signingIn}>
            <Icon name="user" size={16} />
            {signingIn ? 'Signing in…' : 'Sign in with Google'}
          </button>
          {authError && <p className="sm__chat-error">{authError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="screen sm__chat-screen">
      <ScreenHeader title="Gentle" subtitle="Sleep Mode AI" onBack={onBack} action={<span className="sm__badge sm__badge--ai">AI</span>} />

      <div className="sm__chat-list" ref={listRef}>
        {messages.length === 0 && !optimisticUser && (
          <div className="sm__chat-empty">
            <span className="sm__personality-emoji" style={{ '--emoji-color': personality.color } as never}>
              {personality.image ? <img src={personality.image} alt="" /> : null}
            </span>
            <p>Say hi — Gentle's here to help you wind down.</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`sm__chat-bubble sm__chat-bubble--${m.role}`}>
            {m.text}
          </div>
        ))}
        {optimisticUser && <div className="sm__chat-bubble sm__chat-bubble--user sm__chat-bubble--pending">{optimisticUser}</div>}
        {awaitingReply && (
          <div className="sm__chat-bubble sm__chat-bubble--assistant sm__chat-bubble--typing">
            <span />
            <span />
            <span />
          </div>
        )}
      </div>

      {error && <p className="sm__chat-error">{error}</p>}

      <div className="sm__chat-input-row">
        <input
          type="text"
          className="sm__chat-input"
          placeholder="Message Gentle…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          disabled={sending}
        />
        <button
          type="button"
          className="sm__chat-send"
          onClick={handleSend}
          disabled={sending || !input.trim()}
          aria-label="Send"
        >
          <Icon name="send" size={18} />
        </button>
      </div>
    </div>
  );
}
