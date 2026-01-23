'use client';

import { useState } from 'react';
import AvatarSelector from './AvatarSelector';

export interface QuickRegistrationData {
  name: string;
  avatar?: string;
  phoneNumber?: string;
}

interface QuickRegistrationModalProps {
  isOpen: boolean;
  onSubmit: (data: QuickRegistrationData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function QuickRegistrationModal({
  isOpen,
  onSubmit,
  onCancel,
  loading = false,
}: QuickRegistrationModalProps) {
  const [name, setName] = useState('');
  const [showAvatar, setShowAvatar] = useState(false);
  const [avatar, setAvatar] = useState('');
  const [showPhone, setShowPhone] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    let formattedNumber = '';
    if (digits.length > 0) {
      formattedNumber = '(' + digits.substring(0, 3);
      if (digits.length > 3) {
        formattedNumber += ') ' + digits.substring(3, 6);
        if (digits.length > 6) {
          formattedNumber += '-' + digits.substring(6, 10);
        }
      }
    }
    return formattedNumber;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const digits = input.replace(/\D/g, '');
    if (digits.length <= 10) {
      const formatted = formatPhoneNumber(digits);
      setPhoneNumber(formatted);
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (showPhone && phoneNumber.length > 0 && phoneNumber.replace(/\D/g, '').length !== 10) {
      setError('Phone number must be 10 digits');
      return;
    }

    setError('');
    onSubmit({
      name: name.trim(),
      avatar: avatar || undefined,
      phoneNumber: phoneNumber.replace(/\D/g, '') || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl p-8 max-w-md w-full mx-4 border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white font-['PP_Object_Sans'] mb-2">
            Almost done!
          </h2>
          <p className="text-white/60 text-sm">
            Just a few details before we submit your quiz
          </p>
        </div>

        {/* Name Field (Required) */}
        <div className="mb-4">
          <label className="block text-white/80 text-sm mb-2 font-['PP_Object_Sans']">
            Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all font-['PP_Object_Sans']"
            autoFocus
          />
        </div>

        {/* Avatar Selector (Optional, Collapsed) */}
        <div className="mb-4">
          {!showAvatar ? (
            <button
              onClick={() => setShowAvatar(true)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white/70 hover:text-white hover:bg-slate-800 transition-all text-left font-['PP_Object_Sans'] flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add avatar (optional)
            </button>
          ) : (
            <div className="border border-white/10 rounded-lg p-4 bg-slate-800/30">
              <div className="flex items-center justify-between mb-3">
                <label className="text-white/80 text-sm font-['PP_Object_Sans']">
                  Choose your avatar
                </label>
                <button
                  onClick={() => {
                    setShowAvatar(false);
                    setAvatar('');
                  }}
                  className="text-white/50 hover:text-white/80 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <AvatarSelector
                onAvatarSelect={setAvatar}
                initialAvatar={avatar}
              />
            </div>
          )}
        </div>

        {/* Phone Number (Optional, Collapsed) */}
        <div className="mb-6">
          {!showPhone ? (
            <button
              onClick={() => setShowPhone(true)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white/70 hover:text-white hover:bg-slate-800 transition-all text-left font-['PP_Object_Sans'] flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Add phone for cross-device access
            </button>
          ) : (
            <div className="border border-white/10 rounded-lg p-4 bg-slate-800/30">
              <div className="flex items-center justify-between mb-3">
                <label className="text-white/80 text-sm font-['PP_Object_Sans']">
                  Phone number
                </label>
                <button
                  onClick={() => {
                    setShowPhone(false);
                    setPhoneNumber('');
                  }}
                  className="text-white/50 hover:text-white/80 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="(XXX) XXX-XXXX"
                maxLength={14}
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all font-['PP_Object_Sans']"
              />
              <p className="text-white/50 text-xs mt-2">
                Save your progress across devices
              </p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Helper Text */}
        <p className="text-white/40 text-xs mb-6 text-center">
          Your answers are saved to this device. Add phone to access from anywhere.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-slate-800 border border-white/10 rounded-lg text-white/70 hover:text-white hover:bg-slate-700 transition-all font-['PP_Object_Sans'] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
            className="flex-1 px-6 py-3 bg-cyan-400 rounded-lg text-slate-900 font-semibold hover:bg-cyan-300 transition-all font-['PP_Object_Sans'] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
}
