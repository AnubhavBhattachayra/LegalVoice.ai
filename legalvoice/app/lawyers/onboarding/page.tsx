'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaUser, FaGavel, FaMapMarkerAlt, FaLanguage, FaCheck, FaUpload, FaArrowLeft } from 'react-icons/fa';

export default function LawyerOnboarding() {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    barCouncilId: '',
    experience: '',
    specializations: [],
    location: '',
    languages: [],
    bio: '',
    education: [{ institution: '', degree: '', year: '' }],
    fees: '',
    availability: {
      monday: { available: false, from: '09:00', to: '17:00' },
      tuesday: { available: false, from: '09:00', to: '17:00' },
      wednesday: { available: false, from: '09:00', to: '17:00' },
      thursday: { available: false, from: '09:00', to: '17:00' },
      friday: { available: false, from: '09:00', to: '17:00' },
      saturday: { available: false, from: '09:00', to: '17:00' },
      sunday: { available: false, from: '09:00', to: '17:00' },
    },
    profileImage: null,
    idProof: null,
    degreeProof: null,
    barCertificate: null,
    terms: false
  });

  const specializations = [
    'Criminal Law', 'Family Law', 'Corporate Law', 'Property Law', 
    'Immigration Law', 'Tax Law', 'Labor Law', 'Intellectual Property',
    'Constitutional Law', 'Environmental Law', 'Cyber Law', 'Banking Law'
  ];

  const languages = [
    'English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 
    'Malayalam', 'Marathi', 'Gujarati', 'Bengali', 'Punjabi', 
    'Urdu', 'Odia', 'Assamese'
  ];

  const locations = [
    'Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai',
    'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSpecializationChange = (specialization) => {
    setFormData(prev => {
      const newSpecializations = [...prev.specializations];
      if (newSpecializations.includes(specialization)) {
        return {
          ...prev,
          specializations: newSpecializations.filter(s => s !== specialization)
        };
      } else {
        return {
          ...prev,
          specializations: [...newSpecializations, specialization]
        };
      }
    });
  };

  const handleLanguageChange = (language) => {
    setFormData(prev => {
      const newLanguages = [...prev.languages];
      if (newLanguages.includes(language)) {
        return {
          ...prev,
          languages: newLanguages.filter(l => l !== language)
        };
      } else {
        return {
          ...prev,
          languages: [...newLanguages, language]
        };
      }
    });
  };

  const handleAvailabilityChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [field]: field === 'available' ? value : value
        }
      }
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files.length > 0) {
      setFormData(prev => ({
        ...prev,
        [name]: files[0]
      }));
    }
  };

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { institution: '', degree: '', year: '' }]
    }));
  };

  const updateEducation = (index, field, value) => {
    setFormData(prev => {
      const newEducation = [...prev.education];
      newEducation[index] = {
        ...newEducation[index],
        [field]: value
      };
      return {
        ...prev,
        education: newEducation
      };
    });
  };

  const removeEducation = (index) => {
    setFormData(prev => {
      const newEducation = [...prev.education];
      newEducation.splice(index, 1);
      return {
        ...prev,
        education: newEducation
      };
    });
  };

  const nextStep = () => {
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Here you would typically:
    // 1. Validate the form data
    // 2. Create a FormData object for file uploads
    // 3. Send the data to your API
    
    console.log('Submitting lawyer profile:', formData);
    
    // Simulate API call
    setTimeout(() => {
      alert('Profile submitted successfully! It will be reviewed by our team.');
      router.push('/lawyers');
    }, 1500);
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name*</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address*</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number*</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your phone number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bar Council ID*</label>
                <input
                  type="text"
                  name="barCouncilId"
                  required
                  value={formData.barCouncilId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your Bar Council ID"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience*</label>
                <select
                  name="experience"
                  required
                  value={formData.experience}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select years of experience</option>
                  {[...Array(30)].map((_, i) => (
                    <option key={i+1} value={`${i+1} years`}>{i+1} years</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location*</label>
                <select
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select your location</option>
                  {locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
              <div className="flex items-center space-x-4">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  {formData.profileImage ? (
                    <img 
                      src={URL.createObjectURL(formData.profileImage)} 
                      alt="Profile Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FaUser className="text-gray-400 text-3xl" />
                  )}
                </div>
                <label className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg cursor-pointer hover:bg-indigo-200 transition duration-200">
                  <FaUpload className="inline mr-2" />
                  Upload Photo
                  <input
                    type="file"
                    name="profileImage"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Professional Bio*</label>
              <textarea
                name="bio"
                required
                rows={4}
                value={formData.bio}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Write a brief description about your professional background, expertise, and approach..."
              ></textarea>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200"
              >
                Next
              </button>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800">Professional Details</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Specializations*</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {specializations.map(specialization => (
                  <div key={specialization} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`spec-${specialization}`}
                      checked={formData.specializations.includes(specialization)}
                      onChange={() => handleSpecializationChange(specialization)}
                      className="h-4 w-4 text-indigo-600 rounded"
                    />
                    <label htmlFor={`spec-${specialization}`} className="ml-2 block text-sm text-gray-700">
                      {specialization}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Languages*</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {languages.map(language => (
                  <div key={language} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`lang-${language}`}
                      checked={formData.languages.includes(language)}
                      onChange={() => handleLanguageChange(language)}
                      className="h-4 w-4 text-indigo-600 rounded"
                    />
                    <label htmlFor={`lang-${language}`} className="ml-2 block text-sm text-gray-700">
                      {language}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Education*</label>
              {formData.education.map((edu, index) => (
                <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Institution</label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Institution name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Degree</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Degree obtained"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                      <input
                        type="text"
                        value={edu.year}
                        onChange={(e) => updateEducation(index, 'year', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Year of completion"
                      />
                    </div>
                  </div>
                  
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeEducation(index)}
                      className="text-red-500 text-sm hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={addEducation}
                className="text-indigo-600 text-sm font-medium hover:text-indigo-800"
              >
                + Add another education
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fees (INR)*</label>
              <input
                type="number"
                name="fees"
                required
                value={formData.fees}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your consultation fees"
              />
            </div>
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition duration-200"
              >
                Previous
              </button>
              
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200"
              >
                Next
              </button>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800">Availability & Documents</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Weekly Availability*</label>
              <div className="space-y-3">
                {Object.entries(formData.availability).map(([day, { available, from, to }]) => (
                  <div key={day} className="flex flex-wrap items-center gap-4">
                    <div className="w-24 capitalize">{day}</div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`available-${day}`}
                        checked={available}
                        onChange={(e) => handleAvailabilityChange(day, 'available', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 rounded"
                      />
                      <label htmlFor={`available-${day}`} className="ml-2 block text-sm text-gray-700">
                        Available
                      </label>
                    </div>
                    
                    {available && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="time"
                          value={from}
                          onChange={(e) => handleAvailabilityChange(day, 'from', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <span>to</span>
                        <input
                          type="time"
                          value={to}
                          onChange={(e) => handleAvailabilityChange(day, 'to', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-800">Required Documents</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Proof (Aadhar/PAN/Passport)*</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    name="idProof"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    id="id-proof"
                    onChange={handleFileChange}
                    required
                  />
                  <label 
                    htmlFor="id-proof"
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition duration-200 flex items-center"
                  >
                    <FaUpload className="mr-2" />
                    {formData.idProof ? formData.idProof.name : 'Choose file'}
                  </label>
                  {formData.idProof && <FaCheck className="text-green-500" />}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Degree Certificate*</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    name="degreeProof"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    id="degree-proof"
                    onChange={handleFileChange}
                    required
                  />
                  <label 
                    htmlFor="degree-proof"
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition duration-200 flex items-center"
                  >
                    <FaUpload className="mr-2" />
                    {formData.degreeProof ? formData.degreeProof.name : 'Choose file'}
                  </label>
                  {formData.degreeProof && <FaCheck className="text-green-500" />}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bar Council Certificate*</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    name="barCertificate"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    id="bar-certificate"
                    onChange={handleFileChange}
                    required
                  />
                  <label 
                    htmlFor="bar-certificate"
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition duration-200 flex items-center"
                  >
                    <FaUpload className="mr-2" />
                    {formData.barCertificate ? formData.barCertificate.name : 'Choose file'}
                  </label>
                  {formData.barCertificate && <FaCheck className="text-green-500" />}
                </div>
              </div>
            </div>
            
            <div className="flex items-start mt-6">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                checked={formData.terms}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 rounded mt-1"
                required
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                I certify that all the information provided is true and accurate. I understand that any false information may lead to the rejection of my application. I agree to the <Link href="#" className="text-indigo-600 hover:text-indigo-800">Terms and Conditions</Link>.
              </label>
            </div>
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition duration-200"
              >
                Previous
              </button>
              
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={!formData.terms}
                className={`px-6 py-2 rounded-lg transition duration-200 ${
                  formData.terms 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Submit Application
              </button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen pt-32 pb-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/lawyers" className="flex items-center text-indigo-600 mb-6 hover:text-indigo-800">
          <FaArrowLeft className="mr-2" /> Back to Lawyers
        </Link>
        
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-8 border-b border-gray-200">
            <h2 className="text-3xl font-bold text-gray-800">Join Our Legal Network</h2>
            <p className="text-gray-600 mt-2">
              Complete the profile below to register as a lawyer on our platform. Your profile will be reviewed by our team before being listed.
            </p>
          </div>
          
          <div className="bg-indigo-50 border-b border-indigo-100">
            <div className="container mx-auto px-8 py-4">
              <div className="flex justify-between relative">
                {[1, 2, 3].map((stepNumber) => (
                  <div 
                    key={stepNumber}
                    className={`flex flex-col items-center relative z-10 ${
                      step === stepNumber 
                        ? 'text-indigo-600' 
                        : step > stepNumber 
                          ? 'text-green-500' 
                          : 'text-gray-400'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step === stepNumber 
                        ? 'bg-indigo-100 border-2 border-indigo-600' 
                        : step > stepNumber 
                          ? 'bg-green-100 border-2 border-green-500' 
                          : 'bg-gray-100 border-2 border-gray-300'
                    }`}>
                      {step > stepNumber ? (
                        <FaCheck /> 
                      ) : (
                        stepNumber
                      )}
                    </div>
                    <div className="text-xs mt-1">
                      {stepNumber === 1 && 'Personal Info'}
                      {stepNumber === 2 && 'Professional Details'}
                      {stepNumber === 3 && 'Documents'}
                    </div>
                  </div>
                ))}
                
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
                  <div 
                    className="h-full bg-indigo-600 transition-all duration-300" 
                    style={{ width: `${((step - 1) / 2) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <form className="p-8">
            {renderStep()}
          </form>
        </div>
        
        <div className="mt-8 bg-indigo-50 rounded-xl p-6 border border-indigo-100">
          <h3 className="text-lg font-semibold text-indigo-800 mb-2 flex items-center">
            <FaGavel className="mr-2" /> Why Join LegalVoice.ai?
          </h3>
          <ul className="space-y-2 text-indigo-700">
            <li className="flex items-start">
              <FaCheck className="text-indigo-600 mt-1 mr-2" />
              <span>Connect with clients seeking legal assistance for their specific needs.</span>
            </li>
            <li className="flex items-start">
              <FaCheck className="text-indigo-600 mt-1 mr-2" />
              <span>Expand your practice with our tech-enabled platform's wide reach.</span>
            </li>
            <li className="flex items-start">
              <FaCheck className="text-indigo-600 mt-1 mr-2" />
              <span>Flexible scheduling that works around your availability.</span>
            </li>
            <li className="flex items-start">
              <FaCheck className="text-indigo-600 mt-1 mr-2" />
              <span>Transparent and timely payments for your consultations and services.</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
} 