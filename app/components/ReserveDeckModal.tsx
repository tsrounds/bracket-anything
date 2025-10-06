'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedButton from './AnimatedButton';
import { db } from '../lib/firebase/firebase-client';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

interface ReserveDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReserveDeckModal({ isOpen, onClose }: ReserveDeckModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setQuantity(1);
      setLoading(false);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  const handleDecrease = () => setQuantity(q => Math.max(1, q - 1));
  const handleIncrease = () => setQuantity(q => Math.min(99, q + 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!name.trim() || !email.trim()) {
      setError('Please provide your name and email.');
      return;
    }

    setLoading(true);
    try {
      // Prefer server API to avoid client Firestore rule issues
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, quantity })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Request failed with ${res.status}`);
      }
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      console.error('Failed to save reservation', err);
      setError('Sorry, something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <motion.div
            className="relative bg-white rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl text-neutral-900"
            initial={{ scale: 0.95, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-plush font-black text-xl text-neutral-900">Tell me you want one</h3>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100">
                <span className="sr-only">Close</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-600"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Name</label>
                <input
                  className="form-input text-neutral-900 placeholder-neutral-400"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>

              <div>
                <label className="form-label">Email</label>
                <input
                  className="form-input text-neutral-900 placeholder-neutral-400"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
                <p className="mt-2 text-sm text-neutral-500">I will not spam you (I do not have the time)</p>
              </div>

              <div>
                <label className="form-label">Quantity</label>
                <div className="flex items-center gap-3">
                  <AnimatedButton
                    type="button"
                    onClick={handleDecrease}
                    className="btn border border-neutral-300 bg-neutral-50 hover:bg-neutral-100 rounded-xl px-4 py-2 text-neutral-900"
                  >
                    −
                  </AnimatedButton>
                  <div className="min-w-[64px] text-center text-lg font-semibold text-neutral-900">{quantity}</div>
                  <AnimatedButton
                    type="button"
                    onClick={handleIncrease}
                    className="btn border border-neutral-300 bg-neutral-50 hover:bg-neutral-100 rounded-xl px-4 py-2 text-neutral-900"
                  >
                    +
                  </AnimatedButton>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600">{error}</div>
              )}
              {success && (
                <div className="text-sm text-emerald-600">Reserved! Ill email you with updates.</div>
              )}

              <AnimatedButton
                type="submit"
                disabled={loading}
                className="w-full btn rounded-xl font-plush font-bold text-lg uppercase tracking-wide"
                style={{
                  backgroundColor: '#ffc300',
                  color: '#003566'
                } as any}
              >
                {loading ? 'Reserving…' : 'Reserve'}
              </AnimatedButton>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


