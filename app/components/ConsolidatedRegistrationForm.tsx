import React from 'react';
import AvatarSelector from './AvatarSelector';

interface ConsolidatedFormProps {
  formData: {
    name: string;
    phoneNumber: string;
    avatar?: string;
  };
  onSubmit: (e: React.FormEvent) => void;
  onChange: (field: string, value: string) => void;
  error?: string;
  loading?: boolean;
}

const ConsolidatedRegistrationForm: React.FC<ConsolidatedFormProps> = ({
  formData,
  onSubmit,
  onChange,
  error,
  loading
}) => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Review Registration</h1>
          
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="flex justify-center mb-6">
              <AvatarSelector 
                onAvatarSelect={(avatar) => onChange('avatar', avatar)}
                initialAvatar={formData.avatar}
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => onChange('name', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => onChange('phoneNumber', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter your phone number"
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 disabled:bg-blue-400"
              >
                {loading ? 'Registering...' : 'Continue to Quiz'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ConsolidatedRegistrationForm; 