'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaSpinner, 
  FaArrowLeft,
  FaCheck,
  FaPencilAlt,
  FaTrash,
  FaCamera,
  FaSave,
  FaIdCard,
  FaBuilding,
  FaBirthdayCake
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

// Profile interface
interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  dateOfBirth?: string;
  occupation?: string;
  company?: string;
  bio?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
}

const ProfilePage = () => {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Mock profile data
  const mockProfile: UserProfile = {
    id: 'usr_123456',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    address: {
      street: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'United States'
    },
    dateOfBirth: '1985-06-15',
    occupation: 'Software Engineer',
    company: 'Tech Solutions Inc.',
    bio: 'Professional with 10+ years of experience in software development, working primarily with web technologies.',
    emailVerified: true,
    phoneVerified: false
  };
  
  // Load user data
  useEffect(() => {
    if (!user && !authLoading) {
      router.push('/login?redirect=/user/profile');
      return;
    }
    
    if (user) {
      // In a real app, this would be an API call
      setTimeout(() => {
        setProfile(mockProfile);
        setEditedProfile(mockProfile);
        setIsLoading(false);
      }, 1000);
    }
  }, [user, authLoading, router]);
  
  // Reset success message after 3 seconds
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);
  
  // Handle form change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editedProfile) return;
    
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEditedProfile({
        ...editedProfile,
        [parent]: {
          ...editedProfile[parent as keyof UserProfile] as Record<string, any>,
          [child]: value
        }
      });
    } else {
      setEditedProfile({
        ...editedProfile,
        [name]: value
      });
    }
  };
  
  // Handle save profile
  const handleSaveProfile = () => {
    if (!editedProfile) return;
    
    setIsSaving(true);
    setError('');
    
    // Validation
    if (!editedProfile.firstName.trim()) {
      setError('First name is required');
      setIsSaving(false);
      return;
    }
    
    if (!editedProfile.lastName.trim()) {
      setError('Last name is required');
      setIsSaving(false);
      return;
    }
    
    if (!editedProfile.email.trim()) {
      setError('Email is required');
      setIsSaving(false);
      return;
    }
    
    // Simulate API call
    setTimeout(() => {
      setProfile(editedProfile);
      setIsSaving(false);
      setIsEditing(false);
      setSaveSuccess(true);
    }, 1500);
  };
  
  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditedProfile(profile);
    setIsEditing(false);
    setError('');
  };
  
  // Handle avatar upload
  const handleAvatarClick = () => {
    if (fileInputRef.current && isEditing) {
      fileInputRef.current.click();
    }
  };
  
  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editedProfile || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onloadend = () => {
      setEditedProfile({
        ...editedProfile,
        avatar: reader.result as string
      });
    };
    
    reader.readAsDataURL(file);
  };
  
  // Remove avatar
  const handleRemoveAvatar = () => {
    if (!editedProfile) return;
    
    setEditedProfile({
      ...editedProfile,
      avatar: undefined
    });
  };
  
  // Format date of birth
  const formatDateOfBirth = (dateString?: string) => {
    if (!dateString) return 'Not provided';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Get age
  const getAge = (dateString?: string) => {
    if (!dateString) return null;
    
    const birthDate = new Date(dateString);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };
  
  // Format phone number
  const formatPhoneNumber = (phone: string) => {
    return phone;
  };
  
  // Format address
  const formatAddress = (address: UserProfile['address']) => {
    return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}`;
  };
  
  // Loading state
  if (authLoading || (isLoading && user)) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex items-center justify-center">
        <FaSpinner className="animate-spin text-indigo-600 text-4xl" />
      </div>
    );
  }
  
  // No user, redirect handled in useEffect
  if (!user && !authLoading) {
    return null;
  }
  
  return (
    <main className="min-h-screen pt-32 pb-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <Link 
            href="/user/dashboard" 
            className="flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <FaArrowLeft className="mr-2" />
            Back to Dashboard
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Profile</h1>
        
        {/* Success message */}
        {saveSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 rounded-md p-4 flex items-center">
            <FaCheck className="text-green-500 mr-3" />
            Profile updated successfully
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
            {error}
          </div>
        )}
        
        {/* Profile form */}
        {profile && editedProfile && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="flex justify-between items-center p-6 bg-gray-50 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
              {isEditing ? (
                <div className="flex space-x-3">
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaSave className="-ml-1 mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FaPencilAlt className="-ml-1 mr-2 h-4 w-4" />
                  Edit Profile
                </button>
              )}
            </div>
            
            <div className="p-6">
              <div className="flex flex-col md:flex-row">
                {/* Avatar */}
                <div className="md:w-1/3 mb-6 md:mb-0 flex flex-col items-center">
                  <div 
                    className={`relative h-40 w-40 rounded-full overflow-hidden border-4 ${isEditing ? 'border-indigo-200 cursor-pointer' : 'border-gray-200'}`}
                    onClick={handleAvatarClick}
                  >
                    {editedProfile.avatar ? (
                      <Image 
                        src={editedProfile.avatar} 
                        alt={`${editedProfile.firstName} ${editedProfile.lastName}`}
                        width={160}
                        height={160}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <FaUser className="text-gray-400 text-6xl" />
                      </div>
                    )}
                    
                    {isEditing && (
                      <div className="absolute inset-0 bg-black bg-opacity-[0.5] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <FaCamera className="text-white text-2xl" />
                      </div>
                    )}
                  </div>
                  
                  {isEditing && (
                    <div className="mt-3 space-y-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={handleAvatarClick}
                        className="text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        Change Photo
                      </button>
                      {editedProfile.avatar && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="text-sm text-red-600 hover:text-red-800 block"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Form fields */}
                <div className="md:w-2/3 md:pl-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                        First Name*
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={editedProfile.firstName}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      ) : (
                        <p className="text-gray-900">{profile.firstName}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name*
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={editedProfile.lastName}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      ) : (
                        <p className="text-gray-900">{profile.lastName}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email*
                      </label>
                      <div className="flex items-center">
                        {isEditing ? (
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={editedProfile.email}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                          />
                        ) : (
                          <p className="text-gray-900">{profile.email}</p>
                        )}
                        {profile.emailVerified && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <div className="flex items-center">
                        {isEditing ? (
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={editedProfile.phone}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        ) : (
                          <p className="text-gray-900">{formatPhoneNumber(profile.phone)}</p>
                        )}
                        {profile.phoneVerified ? (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Verified
                          </span>
                        ) : (
                          profile.phone && !isEditing && (
                            <button className="ml-2 text-sm text-indigo-600 hover:text-indigo-800">
                              Verify
                            </button>
                          )
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth
                      </label>
                      {isEditing ? (
                        <input
                          type="date"
                          id="dateOfBirth"
                          name="dateOfBirth"
                          value={editedProfile.dateOfBirth || ''}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      ) : (
                        <p className="text-gray-900">
                          {formatDateOfBirth(profile.dateOfBirth)}
                          {getAge(profile.dateOfBirth) && ` (${getAge(profile.dateOfBirth)} years old)`}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-1">
                        Occupation
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          id="occupation"
                          name="occupation"
                          value={editedProfile.occupation || ''}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      ) : (
                        <p className="text-gray-900">{profile.occupation || 'Not provided'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                        Company
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          id="company"
                          name="company"
                          value={editedProfile.company || ''}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      ) : (
                        <p className="text-gray-900">{profile.company || 'Not provided'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Divider */}
              <hr className="my-8 border-gray-200" />
              
              {/* Address */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
                
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                        Street Address
                      </label>
                      <input
                        type="text"
                        id="street"
                        name="address.street"
                        value={editedProfile.address.street}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="address.city"
                        value={editedProfile.address.city}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                        State / Province
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="address.state"
                        value={editedProfile.address.state}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP / Postal Code
                      </label>
                      <input
                        type="text"
                        id="zipCode"
                        name="address.zipCode"
                        value={editedProfile.address.zipCode}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        id="country"
                        name="address.country"
                        value={editedProfile.address.country}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start">
                    <FaMapMarkerAlt className="text-gray-400 mt-1 mr-3" />
                    <p className="text-gray-900">{formatAddress(profile.address)}</p>
                  </div>
                )}
              </div>
              
              {/* Divider */}
              <hr className="my-8 border-gray-200" />
              
              {/* Bio */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Bio</h3>
                
                {isEditing ? (
                  <textarea
                    id="bio"
                    name="bio"
                    value={editedProfile.bio || ''}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-gray-900">{profile.bio || 'No bio information provided.'}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default ProfilePage; 