'use client';

import { useState, useEffect, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../components/UserAuth';
import { db } from '../../../lib/firebase/firebase-client';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import AvatarSelector from '../../../components/AvatarSelector';
import UserAuth from '../../../components/UserAuth';
import RegistrationLayout from '../../../components/RegistrationLayout';

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
}

type RegistrationAction =
  | { type: 'SET_FORM_DATA'; payload: FormData }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_USER_STATUS'; payload: { isRegistered: boolean; isReturningUser: boolean } }
  | { type: 'COMPLETE_INITIALIZATION' }
  | { type: 'START_SUBMIT' }
  | { type: 'COMPLETE_SUBMIT' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'EDIT_MODE' };

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
  isSubmitting: false
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
        isRegistered: true,
        currentStep: 4
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isSubmitting: false };
    case 'EDIT_MODE':
      return {
        ...state,
        currentStep: 1,
        isRegistered: false,
        isReturningUser: false
      };
    default:
      return state;
  }
}

const NameStep = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
  <div className="space-y-4">
    <div className="text-2xl text-gray-700">What's your name?</div>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-3xl font-light border-none focus:ring-0 focus:outline-none bg-transparent"
      placeholder="Type your answer here..."
      autoFocus
    />
  </div>
);

const PhoneStep = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
  <div className="space-y-4">
    <div className="text-2xl text-gray-700">What's your phone number?</div>
    <input
      type="tel"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-3xl font-light border-none focus:ring-0 focus:outline-none bg-transparent"
      placeholder="Type your answer here..."
      autoFocus
    />
  </div>
);

const AvatarStep = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
  <div className="space-y-4">
    <div className="text-2xl text-gray-700">Choose your avatar</div>
    <div className="flex justify-center">
      <AvatarSelector
        onAvatarSelect={onChange}
        initialAvatar={value}
      />
    </div>
  </div>
);

// Add new utility function to check for returning users
const checkReturningUser = async (phoneNumber: string) => {
  try {
    if (!db) {
      console.error('Database not initialized');
      return false;
    }

    // Check if user exists in userProfiles collection
    const userProfilesQuery = query(
      collection(db, 'userProfiles'),
      where('phoneNumber', '==', phoneNumber)
    );
    const userProfilesSnapshot = await getDocs(userProfilesQuery);
    
    return !userProfilesSnapshot.empty;
  } catch (error) {
    console.error('Error checking returning user:', error);
    return false;
  }
};

export default function QuizRegistration({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [state, dispatch] = useReducer(registrationReducer, initialState);

  const handleFieldChange = (field: string, value: string) => {
    dispatch({
      type: 'SET_FORM_DATA',
      payload: { ...state.formData, [field]: value }
    });
  };

  const handleFinalSubmit = () => {
    router.replace(`/quiz/${params.id}/take`);
  };

  useEffect(() => {
    const checkUserStatus = async () => {
      if (authLoading) {
        console.log('⏳ Waiting for auth to load...');
        return;
      }
      
      if (!user) {
        console.log('❌ No authenticated user found');
        dispatch({ type: 'COMPLETE_INITIALIZATION' });
        return;
      }

      if (!state.hasCheckedRegistration && db) {
        try {
          console.log('🔍 Checking user status for:', user.uid);
          
          const userProfileDoc = await getDoc(doc(db, 'userProfiles', user.uid));
          let isReturning = false;
          let profileData = null;
          
          if (userProfileDoc.exists()) {
            profileData = userProfileDoc.data();
            const phoneNumber = profileData?.phoneNumber;
            
            if (phoneNumber) {
              isReturning = await checkReturningUser(phoneNumber);
              if (isReturning) {
                dispatch({
                  type: 'SET_FORM_DATA',
                  payload: {
                    name: profileData?.name || '',
                    phoneNumber: phoneNumber || '',
                    avatar: profileData?.avatar || ''
                  }
                });
              }
            }
          }

          const registrationId = `${params.id}_${user.uid}`;
          const quizRegistrationDoc = await getDoc(doc(db, 'quizRegistrations', registrationId));
          const isRegistered = quizRegistrationDoc.exists();

          dispatch({
            type: 'SET_USER_STATUS',
            payload: { isRegistered, isReturningUser: isReturning }
          });
          
          if (isRegistered && quizRegistrationDoc.exists()) {
            const registrationData = quizRegistrationDoc.data();
            dispatch({
              type: 'SET_FORM_DATA',
              payload: {
                name: registrationData.name || '',
                phoneNumber: registrationData.phoneNumber || '',
                avatar: registrationData.avatar || ''
              }
            });
          }

          dispatch({ type: 'COMPLETE_INITIALIZATION' });
        } catch (error) {
          console.error('❌ Error checking user status:', error);
          dispatch({ type: 'COMPLETE_INITIALIZATION' });
        }
      }
    };

    checkUserStatus();
  }, [user, authLoading, params.id, state.hasCheckedRegistration, db]);

  const handleNext = async () => {
    if (state.currentStep < 3) {
      dispatch({ type: 'SET_STEP', payload: state.currentStep + 1 });
    } else if (state.currentStep === 3) {
      try {
        await handleSubmit();
      } catch (error) {
        return;
      }
    } else if (state.currentStep === 4) {
      handleFinalSubmit();
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

      await setDoc(doc(db, 'userProfiles', user.uid), {
        name: state.formData.name.trim(),
        phoneNumber: state.formData.phoneNumber.trim(),
        avatar: state.formData.avatar || null,
      }, { merge: true });

      await setDoc(doc(db, 'quizRegistrations', `${params.id}_${user.uid}`), {
        userId: user.uid,
        name: state.formData.name.trim(),
        phoneNumber: state.formData.phoneNumber.trim(),
        avatar: state.formData.avatar || null,
        quizId: params.id,
        createdAt: new Date().toISOString(),
      });

      sessionStorage.setItem('userId', user.uid);
      sessionStorage.setItem('userName', state.formData.name.trim());
      sessionStorage.setItem('quizId', params.id);

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
    dispatch({ type: 'EDIT_MODE' });
  };

  const renderStep = () => {
    switch (state.currentStep) {
      case 1:
        return (
          <NameStep
            value={state.formData.name}
            onChange={(value) => handleFieldChange('name', value)}
          />
        );
      case 2:
        return (
          <PhoneStep
            value={state.formData.phoneNumber}
            onChange={(value) => handleFieldChange('phoneNumber', value)}
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
            <div className="text-2xl text-gray-700">Review your information</div>
            <div className="space-y-2">
              <p className="text-xl">Name: {state.formData.name}</p>
              <p className="text-xl">Phone: {state.formData.phoneNumber}</p>
              {state.formData.avatar && (
                <div className="flex items-center space-x-2">
                  <span className="text-xl">Avatar:</span>
                  <img src={state.formData.avatar} alt="Selected avatar" className="w-12 h-12 rounded-full" />
                </div>
              )}
            </div>
            <button
              onClick={handleEdit}
              className="text-blue-500 hover:text-blue-700"
            >
              Edit Information
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (state.currentStep) {
      case 1:
        return state.formData.name.trim().length > 0;
      case 2:
        return state.formData.phoneNumber.trim().length > 0;
      case 3:
      case 4:
        return true;
      default:
        return false;
    }
  };

  if (authLoading || state.isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <UserAuth />;
  }

  return (
    <RegistrationLayout currentStep={state.currentStep} totalSteps={4}>
      <div className="space-y-8">
        {renderStep()}
        
        {state.error && (
          <div className="text-red-600 text-sm">
            {state.error}
          </div>
        )}

        <button
          onClick={handleNext}
          disabled={!canProceed() || state.isSubmitting}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 disabled:bg-blue-400"
        >
          {state.isSubmitting 
            ? 'Processing...' 
            : state.currentStep === 4 
              ? 'Start Quiz' 
              : 'Continue'
          }
        </button>
      </div>
    </RegistrationLayout>
  );
} 