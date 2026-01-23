'use client';

import { useState, useEffect, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/UserAuth';
import { db, auth } from '../../lib/firebase/firebase-client';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import AvatarSelector from '../../components/AvatarSelector';
import RegistrationLayout from '../../components/RegistrationLayout';
import { signInAnonymously } from 'firebase/auth';

interface FormData {
  name: string;
  phoneNumber: string;
  avatar?: string;
}

interface RegistrationState {
  formData: FormData;
  currentStep: number;
  isInitializing: boolean;
  hasCheckedRegistration: boolean;
  isRegistered: boolean;
  isReturningUser: boolean;
  error: string;
  isSubmitting: boolean;
  isEditing: boolean;
}

type RegistrationAction =
  | { type: 'SET_FORM_DATA'; payload: FormData }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_USER_STATUS'; payload: { isRegistered: boolean; isReturningUser: boolean } }
  | { type: 'COMPLETE_INITIALIZATION' }
  | { type: 'START_SUBMIT' }
  | { type: 'COMPLETE_SUBMIT' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'EDIT_MODE' }
  | { type: 'RESET_EDIT_STATE' };

const initialState: RegistrationState = {
  formData: {
    name: '',
    phoneNumber: '',
    avatar: ''
  },
  currentStep: 1,
  isInitializing: true,
  hasCheckedRegistration: false,
  isRegistered: false,
  isReturningUser: false,
  error: '',
  isSubmitting: false,
  isEditing: false
};

function registrationReducer(state: RegistrationState, action: RegistrationAction): RegistrationState {
  switch (action.type) {
    case 'SET_FORM_DATA':
      return { ...state, formData: action.payload };
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_USER_STATUS':
      return {
        ...state,
        isRegistered: action.payload.isRegistered,
        isReturningUser: action.payload.isReturningUser,
        currentStep: action.payload.isRegistered || action.payload.isReturningUser ? 4 : 1
      };
    case 'COMPLETE_INITIALIZATION':
      return {
        ...state,
        isInitializing: false,
        hasCheckedRegistration: true
      };
    case 'START_SUBMIT':
      return { ...state, isSubmitting: true, error: '' };
    case 'COMPLETE_SUBMIT':
      return {
        ...state,
        isSubmitting: false,
        isRegistered: !state.isEditing,
        currentStep: 4
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isSubmitting: false };
    case 'EDIT_MODE':
      return {
        ...initialState,
        formData: {
          name: state.formData.name,
          phoneNumber: state.formData.phoneNumber,
          avatar: state.formData.avatar
        },
        isEditing: true,
        currentStep: 1
      };
    case 'RESET_EDIT_STATE':
      return {
        ...state,
        isRegistered: false,
        isReturningUser: false,
        isSubmitting: false,
        error: '',
        isEditing: false
      };
    default:
      return state;
  }
}

const PhoneStep = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
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
      onChange(formatPhoneNumber(digits));
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-2xl text-white/90 font-['PP_Object_Sans']">What's your phone number?</div>
      <div className="relative">
        <input
          type="tel"
          value={value}
          onChange={handlePhoneChange}
          className="w-full text-3xl font-light border-2 border-white/20 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:outline-none bg-transparent text-white"
          placeholder="(XXX) XXX-XXXX"
          autoFocus
          maxLength={14}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">
          {value.length === 0 ? '10 digits' : ''}
        </div>
      </div>
    </div>
  );
};

const NameStep = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
  <div className="space-y-4">
    <div className="text-2xl text-white/90 font-['PP_Object_Sans']">What's your name?</div>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-3xl font-light border-none focus:ring-0 focus:outline-none bg-transparent text-white placeholder-white/50"
      placeholder="Type your answer here..."
      autoFocus
    />
  </div>
);

const AvatarStep = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
  <div className="flex flex-col items-start gap-2">
    <div className="text-2xl text-white/90 font-['PP_Object_Sans'] mb-2">Choose your avatar</div>
    <AvatarSelector
      onAvatarSelect={onChange}
      initialAvatar={value}
    />
  </div>
);

export default function PredictThisRegistration() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [state, dispatch] = useReducer(registrationReducer, initialState);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [fadeIn, setFadeIn] = useState(true);
  const [prevStep, setPrevStep] = useState(1);

  const handleFieldChange = (field: string, value: string) => {
    dispatch({
      type: 'SET_FORM_DATA',
      payload: { ...state.formData, [field]: value }
    });
  };

  const handleFinalSubmit = () => {
    router.replace('/predict-this/menu');
  };

  const renderStep = () => {
    switch (state.currentStep) {
      case 1:
        return (
          <PhoneStep
            value={state.formData.phoneNumber}
            onChange={(value) => handleFieldChange('phoneNumber', value)}
          />
        );
      case 2:
        return (
          <NameStep
            value={state.formData.name}
            onChange={(value) => handleFieldChange('name', value)}
          />
        );
      case 3:
        return (
          <AvatarStep
            value={state.formData.avatar || ''}
            onChange={(value) => handleFieldChange('avatar', value)}
          />
        );
      case 4:
        return (
          <div className="space-y-4">
            <div className="text-2xl text-white/80 font-['PP_Object_Sans']">Review your information</div>
            <div className="space-y-2">
              <p className="text-xl text-white/90"><span className="font-semibold text-white/80">Name:</span> {state.formData.name}</p>
              <p className="text-xl text-white/90"><span className="font-semibold text-white/80">Phone:</span> {state.formData.phoneNumber}</p>
              {state.formData.avatar && (
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-semibold text-white/80">Avatar:</span>
                  <img src={state.formData.avatar} alt="Selected avatar" className="w-12 h-12 rounded-full bg-white/10" />
                </div>
              )}
            </div>
            <button
              onClick={handleEdit}
              className="text-cyan-300 hover:text-cyan-200 underline"
              style={{ transition: "transform 0.1s ease" }}
              onMouseDown={e => { e.currentTarget.style.transform = "translateY(2px)"; }}
              onMouseUp={e => { e.currentTarget.style.transform = "translateY(0)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              Edit Information
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const handleNext = async () => {
    if (state.currentStep === 1) {
      if (!state.formData.phoneNumber.trim()) return;

      if (state.isEditing) {
        dispatch({ type: 'SET_STEP', payload: 2 });
        return;
      }

      setCheckingPhone(true);
      try {
        if (!user && auth) {
          await signInAnonymously(auth);
        }

        if (!db) {
          dispatch({ type: 'SET_ERROR', payload: 'Database not initialized' });
          setCheckingPhone(false);
          return;
        }

        const userProfilesQuery = query(
          collection(db, 'userProfiles'),
          where('phoneNumber', '==', state.formData.phoneNumber.trim())
        );
        const userProfilesSnapshot = await getDocs(userProfilesQuery);
        if (!userProfilesSnapshot.empty) {
          const profileData = userProfilesSnapshot.docs[0].data();
          dispatch({
            type: 'SET_FORM_DATA',
            payload: {
              name: profileData.name || '',
              phoneNumber: profileData.phoneNumber || '',
              avatar: profileData.avatar || ''
            }
          });
          dispatch({
            type: 'SET_STEP',
            payload: 4
          });
        } else {
          dispatch({ type: 'SET_STEP', payload: 2 });
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to check phone number' });
      } finally {
        setCheckingPhone(false);
      }
      return;
    }
    if (state.currentStep === 2) {
      if (!state.formData.name.trim()) return;
      dispatch({ type: 'SET_STEP', payload: 3 });
      return;
    }
    if (state.currentStep === 3) {
      try {
        await handleSubmit();
      } catch (error) {
        // error handled in handleSubmit
      }
      return;
    }
    if (state.currentStep === 4) {
      handleFinalSubmit();
      return;
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    dispatch({ type: 'START_SUBMIT' });
    try {
      if (!user?.uid) {
        throw new Error('Please sign in to continue');
      }
      if (!db) {
        throw new Error('Database not initialized');
      }
      if (!state.formData.name.trim() || !state.formData.phoneNumber.trim()) {
        throw new Error('Please fill in all required fields');
      }

      if (!state.isEditing) {
        await setDoc(doc(db, 'userProfiles', user.uid), {
          name: state.formData.name.trim(),
          phoneNumber: state.formData.phoneNumber.trim(),
          avatar: state.formData.avatar || null,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      dispatch({ type: 'COMPLETE_SUBMIT' });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to register'
      });
      throw error;
    }
  };

  const handleEdit = () => {
    dispatch({ type: 'RESET_EDIT_STATE' });
    setTimeout(() => {
      dispatch({ type: 'EDIT_MODE' });
    }, 0);
  };

  const canProceed = () => {
    switch (state.currentStep) {
      case 1:
        return state.formData.phoneNumber.trim().length > 0;
      case 2:
        return state.formData.name.trim().length > 0;
      case 3:
      case 4:
        return true;
      default:
        return false;
    }
  };

  useEffect(() => {
    if (!authLoading && state.isInitializing) {
      dispatch({ type: 'COMPLETE_INITIALIZATION' });
    }
  }, [authLoading, state.isInitializing]);

  useEffect(() => {
    if (state.currentStep !== prevStep) {
      setFadeIn(false);
      const timeout = setTimeout(() => {
        setFadeIn(true);
        setPrevStep(state.currentStep);
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [state.currentStep, prevStep]);

  if (authLoading || state.isInitializing || checkingPhone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0e162a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <RegistrationLayout currentStep={state.currentStep} totalSteps={4}>
      <div className="space-y-8">
        <div
          style={{
            opacity: fadeIn ? 1 : 0,
            transition: 'opacity 1s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {renderStep()}
        </div>
        {state.error && (
          <div className="text-red-400 text-sm">
            {state.error}
          </div>
        )}
        <button
          onClick={handleNext}
          disabled={!canProceed() || state.isSubmitting || checkingPhone}
          className="w-[150px] h-12 bg-cyan-400 text-[#0e162a] px-6 py-3 rounded-lg font-medium hover:bg-cyan-300 transition-colors duration-200 disabled:bg-cyan-400/50 disabled:text-[#0e162a]/50 mx-auto"
          style={{ transition: "transform 0.1s ease" }}
          onMouseDown={e => { e.currentTarget.style.transform = "translateY(2px)"; }}
          onMouseUp={e => { e.currentTarget.style.transform = "translateY(0)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          {state.isSubmitting || checkingPhone
            ? 'Processing...'
            : state.currentStep === 4
              ? 'Continue'
              : 'Continue'
          }
        </button>
      </div>
    </RegistrationLayout>
  );
}
