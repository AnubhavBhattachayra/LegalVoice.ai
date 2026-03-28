'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { FaMicrophone, FaStopCircle, FaVolumeUp, FaSave, FaDownload } from 'react-icons/fa';
import { MdTranslate, MdHelp } from 'react-icons/md';

type DocumentType = 'challan' | 'affidavit' | 'poa' | 'rent' | 'vehicle-registration' | 'property-sale';
type FieldType = 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
type SupportedLanguage = 'English' | 'Hindi' | 'Tamil' | 'Bengali' | 'Marathi' | 'Telugu' | 'Kannada' | 'Gujarati';

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface DocumentDefinition {
  title: string;
  description: string;
  fields: FormField[];
}

// Document definitions
const documentDefinitions: Record<DocumentType, DocumentDefinition> = {
  'challan': {
    title: 'Traffic Challan',
    description: 'Complete the form below to generate a traffic challan payment receipt',
    fields: [
      { id: 'violatorName', type: 'text', label: 'Name of Violator', placeholder: 'Full name', required: true },
      { id: 'licenseNumber', type: 'text', label: 'License Number', placeholder: 'e.g., DL-0420190123456', required: true },
      { id: 'vehicleNumber', type: 'text', label: 'Vehicle Registration Number', placeholder: 'e.g., DL01AB1234', required: true },
      { id: 'violationType', type: 'select', label: 'Violation Type', required: true, options: ['Speeding', 'Red Light', 'Illegal Parking', 'No Helmet/Seatbelt', 'Other'] },
      { id: 'violationDate', type: 'date', label: 'Date of Violation', required: true },
      { id: 'violationPlace', type: 'text', label: 'Place of Violation', required: true },
      { id: 'fineAmount', type: 'number', label: 'Fine Amount (₹)', required: true },
      { id: 'remarks', type: 'textarea', label: 'Remarks', required: false }
    ]
  },
  'affidavit': {
    title: 'General Affidavit',
    description: 'Fill the form to create a general purpose affidavit',
    fields: [
      { id: 'name', type: 'text', label: 'Full Name', placeholder: 'Your complete legal name', required: true },
      { id: 'address', type: 'textarea', label: 'Current Address', required: true },
      { id: 'age', type: 'number', label: 'Age', required: true },
      { id: 'occupation', type: 'text', label: 'Occupation', required: true },
      { id: 'idProof', type: 'text', label: 'ID Proof Type and Number', placeholder: 'e.g., Aadhar 1234-5678-9012', required: true },
      { id: 'statementPurpose', type: 'text', label: 'Purpose of Affidavit', required: true },
      { id: 'affidavitText', type: 'textarea', label: 'Affidavit Statement', placeholder: 'I, the undersigned, do hereby solemnly affirm and declare that...', required: true },
      { id: 'placeOfExecution', type: 'text', label: 'Place of Execution', required: true },
      { id: 'dateOfExecution', type: 'date', label: 'Date of Execution', required: true }
    ]
  },
  'poa': {
    title: 'Power of Attorney',
    description: 'Complete this form to create a Power of Attorney document',
    fields: [
      { id: 'principalName', type: 'text', label: 'Principal Name', placeholder: 'Person granting authority', required: true },
      { id: 'principalAddress', type: 'textarea', label: 'Principal Address', required: true },
      { id: 'agentName', type: 'text', label: 'Agent/Attorney Name', placeholder: 'Person receiving authority', required: true },
      { id: 'agentAddress', type: 'textarea', label: 'Agent Address', required: true },
      { id: 'poaType', type: 'select', label: 'Type of Power of Attorney', required: true, options: ['General', 'Special', 'Healthcare', 'Financial', 'Limited'] },
      { id: 'powersGranted', type: 'textarea', label: 'Powers Granted', required: true },
      { id: 'effectiveDate', type: 'date', label: 'Effective Date', required: true },
      { id: 'terminationDate', type: 'date', label: 'Termination Date (if applicable)', required: false },
      { id: 'revocationRights', type: 'checkbox', label: 'Right to Revoke', required: true }
    ]
  },
  'rent': {
    title: 'Rent Agreement',
    description: 'Fill the details to create a rental agreement between landlord and tenant',
    fields: [
      { id: 'landlordName', type: 'text', label: 'Landlord Name', required: true },
      { id: 'landlordAddress', type: 'textarea', label: 'Landlord Address', required: true },
      { id: 'tenantName', type: 'text', label: 'Tenant Name', required: true },
      { id: 'tenantAddress', type: 'textarea', label: 'Tenant Current Address', required: true },
      { id: 'propertyAddress', type: 'textarea', label: 'Rental Property Address', required: true },
      { id: 'propertyType', type: 'select', label: 'Property Type', required: true, options: ['Apartment', 'House', 'Room', 'Commercial Space', 'Other'] },
      { id: 'rentAmount', type: 'number', label: 'Monthly Rent (₹)', required: true },
      { id: 'securityDeposit', type: 'number', label: 'Security Deposit (₹)', required: true },
      { id: 'leaseStartDate', type: 'date', label: 'Lease Start Date', required: true },
      { id: 'leaseDuration', type: 'select', label: 'Lease Duration', required: true, options: ['3 months', '6 months', '11 months', '1 year', '2 years', '3 years'] },
      { id: 'paymentMethod', type: 'text', label: 'Rent Payment Method', required: true },
      { id: 'additionalTerms', type: 'textarea', label: 'Additional Terms and Conditions', required: false }
    ]
  },
  'vehicle-registration': {
    title: 'Vehicle Registration',
    description: 'Complete the form to register a vehicle',
    fields: [
      { id: 'ownerName', type: 'text', label: 'Owner Name', required: true },
      { id: 'ownerAddress', type: 'textarea', label: 'Owner Address', required: true },
      { id: 'vehicleMake', type: 'text', label: 'Vehicle Make', placeholder: 'e.g., Maruti, Honda, Tata', required: true },
      { id: 'vehicleModel', type: 'text', label: 'Vehicle Model', placeholder: 'e.g., Swift, City, Nexon', required: true },
      { id: 'vehicleYear', type: 'number', label: 'Manufacturing Year', required: true },
      { id: 'chassisNumber', type: 'text', label: 'Chassis Number', required: true },
      { id: 'engineNumber', type: 'text', label: 'Engine Number', required: true },
      { id: 'fuelType', type: 'select', label: 'Fuel Type', required: true, options: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'] },
      { id: 'color', type: 'text', label: 'Vehicle Color', required: true },
      { id: 'purchaseDate', type: 'date', label: 'Purchase Date', required: true },
      { id: 'dealerName', type: 'text', label: 'Dealer Name', required: true }
    ]
  },
  'property-sale': {
    title: 'Property Sale Agreement',
    description: 'Fill the details to create a property sale agreement',
    fields: [
      { id: 'sellerName', type: 'text', label: 'Seller Name', required: true },
      { id: 'sellerAddress', type: 'textarea', label: 'Seller Address', required: true },
      { id: 'buyerName', type: 'text', label: 'Buyer Name', required: true },
      { id: 'buyerAddress', type: 'textarea', label: 'Buyer Address', required: true },
      { id: 'propertyAddress', type: 'textarea', label: 'Property Address', required: true },
      { id: 'propertyDescription', type: 'textarea', label: 'Property Description', required: true },
      { id: 'propertyArea', type: 'text', label: 'Property Area', placeholder: 'e.g., 1500 sq ft', required: true },
      { id: 'salePrice', type: 'number', label: 'Sale Price (₹)', required: true },
      { id: 'paymentMethod', type: 'textarea', label: 'Payment Details and Schedule', required: true },
      { id: 'closingDate', type: 'date', label: 'Closing Date', required: true },
      { id: 'encumbrances', type: 'textarea', label: 'Encumbrances (if any)', required: false },
      { id: 'additionalTerms', type: 'textarea', label: 'Additional Terms', required: false }
    ]
  }
};

// Field label translations
const fieldLabelTranslations: Record<string, Record<string, string>> = {
  'Hindi': {
    'Name of Violator': 'उल्लंघनकर्ता का नाम',
    'License Number': 'लाइसेंस नंबर',
    'Vehicle Registration Number': 'वाहन पंजीकरण संख्या',
    'Violation Type': 'उल्लंघन प्रकार',
    'Date of Violation': 'उल्लंघन की तारीख',
    'Place of Violation': 'उल्लंघन का स्थान',
    'Fine Amount (₹)': 'जुर्माना राशि (₹)',
    'Remarks': 'टिप्पणियाँ',
    'Landlord Name': 'मकान मालिक का नाम',
    'Landlord Address': 'मकान मालिक का पता',
    'Tenant Name': 'किरायेदार का नाम',
    'Tenant Current Address': 'किरायेदार का वर्तमान पता',
    'Rental Property Address': 'किराए की संपत्ति का पता',
    'Property Type': 'संपत्ति का प्रकार',
    'Monthly Rent (₹)': 'मासिक किराया (₹)',
    'Security Deposit (₹)': 'सुरक्षा जमा (₹)',
    'Lease Start Date': 'लीज प्रारंभ तिथि',
    'Lease Duration': 'लीज अवधि',
    'Rent Payment Method': 'किराया भुगतान विधि',
    'Additional Terms and Conditions': 'अतिरिक्त नियम और शर्तें'
  },
  // Add more languages as needed
};

// Available languages
const languages: SupportedLanguage[] = [
  'English', 'Hindi', 'Tamil', 'Bengali', 
  'Marathi', 'Telugu', 'Kannada', 'Gujarati'
];

export default function CreateDocument() {
  const searchParams = useSearchParams();
  const documentType = (searchParams.get('type') || 'rent') as DocumentType;
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [currentFieldId, setCurrentFieldId] = useState<string | null>(null);
  const [processingVoice, setProcessingVoice] = useState(false);
  const [completedFields, setCompletedFields] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('English');
  const [showVoiceInstructions, setShowVoiceInstructions] = useState(true);
  
  // Get document definition
  const documentDef = documentDefinitions[documentType] || documentDefinitions.rent;

  // Initialize form data with empty values
  useEffect(() => {
    const initialData: Record<string, string> = {};
    documentDef.fields.forEach(field => {
      initialData[field.id] = '';
    });
    setFormData(initialData);
  }, [documentType]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // If the field has a value and is not in completedFields, add it
    if (value && !completedFields.includes(name)) {
      setCompletedFields(prev => [...prev, name]);
    }
    // If the field is empty and is in completedFields, remove it
    else if (!value && completedFields.includes(name)) {
      setCompletedFields(prev => prev.filter(id => id !== name));
    }
  };
  
  const toggleRecording = (fieldId: string) => {
    if (isRecording && currentFieldId === fieldId) {
      stopRecording();
    } else {
      startRecording(fieldId);
    }
  };
  
  // Start voice recording
  const startRecording = (fieldId: string) => {
    setCurrentFieldId(fieldId);
    setIsRecording(true);
    setShowVoiceInstructions(false);
    
    // In a real implementation, this would use the Web Speech API
    // For demonstration, we'll simulate recording and transcribing
    
    setTimeout(() => {
      // Simulate receiving voice input after 3 seconds
      setProcessingVoice(true);
      
      setTimeout(() => {
        const voiceInput = getSampleVoiceInput(fieldId);
        
        setFormData(prev => ({ ...prev, [fieldId]: voiceInput }));
        
        if (!completedFields.includes(fieldId)) {
          setCompletedFields(prev => [...prev, fieldId]);
        }
        
        setProcessingVoice(false);
        stopRecording();
      }, 2000);
    }, 3000);
  };
  
  const stopRecording = () => {
    setIsRecording(false);
    setCurrentFieldId(null);
  };
  
  // Get sample voice input for demonstration
  const getSampleVoiceInput = (fieldId: string): string => {
    const sampleData: Record<string, string> = {
      // Traffic Challan samples
      violatorName: 'Ajay Kumar Singh',
      licenseNumber: 'DL-0420190123456',
      vehicleNumber: 'DL01AB1234',
      violationType: 'Speeding',
      violationPlace: 'Rajiv Chowk, New Delhi',
      fineAmount: '2000',
      
      // Rent Agreement samples
      landlordName: 'Suresh Patel',
      landlordAddress: '456 Green Park, New Delhi, 110016',
      tenantName: 'Priya Sharma',
      tenantAddress: '789 Model Town, New Delhi, 110009',
      propertyAddress: '123 Vasant Kunj, New Delhi, 110070',
      propertyType: 'Apartment',
      rentAmount: '25000',
      securityDeposit: '50000',
      paymentMethod: 'Bank Transfer',
      
      // Generic
      name: 'Rahul Verma',
      address: '123 Main Street, Mumbai, Maharashtra',
      remarks: 'No additional comments',
      additionalTerms: 'No pets allowed. Electricity charges as per meter reading.'
    };
    
    return sampleData[fieldId] || `Sample data for ${fieldId}`;
  };
  
  // Translate field label
  const translateFieldLabel = (label: string): string => {
    if (selectedLanguage === 'English') {
      return label;
    }
    
    const translations = fieldLabelTranslations[selectedLanguage];
    return translations?.[label] || label;
  };
  
  // Change language
  const changeLanguage = (language: SupportedLanguage) => {
    setSelectedLanguage(language);
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Here you would handle the document generation/submission
  };
  
  // Calculate form completion percentage
  const getCompletionPercentage = () => {
    const requiredFields = documentDef.fields.filter(field => field.required).length;
    const completedRequiredFields = documentDef.fields
      .filter(field => field.required && completedFields.includes(field.id))
      .length;
    
    return Math.round((completedRequiredFields / requiredFields) * 100);
  };
  
  // Get field help text
  const getFieldHelp = (fieldId: string): string => {
    const helpTexts: Record<string, string> = {
      licenseNumber: 'Your driving license number is typically found on your driving license card',
      vehicleNumber: 'The registration number as shown on your vehicle\'s number plate',
      rentAmount: 'The monthly rent amount in Indian Rupees without any commas',
      propertyAddress: 'Full address of the property including pin code',
      leaseStartDate: 'The date when the tenant will start occupying the property',
      leaseDuration: 'The total duration of the rental agreement'
    };
    
    return helpTexts[fieldId] || '';
  };

  return (
    <main className="pt-32 pb-16 min-h-screen">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 p-6 text-white">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">{documentDef.title}</h1>
              <div className="flex items-center space-x-4">
                {/* Language selector */}
                <div className="flex items-center">
                  <MdTranslate className="text-xl mr-2" />
                  <select
                    value={selectedLanguage}
                    onChange={(e) => changeLanguage(e.target.value as SupportedLanguage)}
                    className="bg-indigo-700 text-white rounded-lg py-1 px-2 border border-indigo-500"
                  >
                    {languages.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
                
                {/* Completion indicator */}
                <div className="flex items-center">
                  <div className="w-24 bg-indigo-800 rounded-full h-2.5 mr-2">
                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${getCompletionPercentage()}%` }}></div>
                  </div>
                  <span className="text-xs font-medium">{getCompletionPercentage()}% complete</span>
                </div>
              </div>
            </div>
            <p className="mt-2">{documentDef.description}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            {/* Voice instructions */}
            {showVoiceInstructions && (
              <div className="p-4 bg-indigo-50 border-l-4 border-indigo-500">
                <h2 className="font-bold text-indigo-800 mb-2">Voice Command Instructions</h2>
                <p className="text-gray-700 mb-2">
                  Click the microphone icon next to any field to fill it using your voice. Speak clearly and include the field name in your response.
                </p>
                <p className="text-gray-700">
                  For example, for a rental agreement you can say &quot;The tenant name is Priya Patel&quot; or &quot;Monthly rent is 25000 rupees&quot;.
                </p>
                <button
                  onClick={() => setShowVoiceInstructions(false)}
                  className="mt-2 text-indigo-600 font-medium hover:text-indigo-800"
                >
                  Got it
                </button>
              </div>
            )}
            
            {/* Form fields */}
            <div className="mt-6 space-y-6">
              {documentDef.fields.map(field => (
                <div key={field.id} className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {translateFieldLabel(field.label)}
                    {field.required && <span className="text-red-500">*</span>}
                    
                    {/* Help tooltip */}
                    {getFieldHelp(field.id) && (
                      <span className="group relative ml-2">
                        <MdHelp className="inline text-gray-400 hover:text-gray-600 cursor-help" />
                        <span className="absolute left-full top-0 ml-2 w-48 p-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          {getFieldHelp(field.id)}
                        </span>
                      </span>
                    )}
                  </label>
                  
                  <div className="relative">
                    {field.type === 'textarea' ? (
                      <textarea
                        name={field.id}
                        value={formData[field.id] || ''}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        required={field.required}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-10"
                      />
                    ) : field.type === 'select' ? (
                      <select
                        name={field.id}
                        value={formData[field.id] || ''}
                        onChange={handleChange}
                        required={field.required}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-10"
                      >
                        <option value="">Select {field.label}</option>
                        {field.options?.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : field.type === 'checkbox' ? (
                      <input
                        type="checkbox"
                        name={field.id}
                        checked={formData[field.id] === 'true'}
                        onChange={e => setFormData(prev => ({ ...prev, [field.id]: e.target.checked ? 'true' : 'false' }))}
                        required={field.required}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    ) : (
                      <input
                        type={field.type}
                        name={field.id}
                        value={formData[field.id] || ''}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        required={field.required}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-10"
                      />
                    )}
                    
                    {/* Voice input button */}
                    <button
                      type="button"
                      onClick={() => toggleRecording(field.id)}
                      disabled={isRecording && currentFieldId !== field.id}
                      className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full 
                        ${isRecording && currentFieldId === field.id 
                          ? 'bg-red-100 text-red-600 animate-pulse' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        } ${isRecording && currentFieldId !== field.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isRecording && currentFieldId === field.id ? <FaStopCircle /> : <FaMicrophone />}
                    </button>
                  </div>
                  
                  {/* Voice processing indicator */}
                  {processingVoice && currentFieldId === field.id && (
                    <div className="mt-1 text-sm text-indigo-600 flex items-center">
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing voice input...
                    </div>
                  )}
                  
                  {/* Animated completion indicator */}
                  {completedFields.includes(field.id) && (
                    <div className="mt-1 text-sm text-green-600">
                      ✓ Field completed
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Action buttons */}
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 flex items-center"
              >
                <FaSave className="mr-2" />
                Save Document
              </button>
              
              <button
                type="button"
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 flex items-center"
              >
                <FaDownload className="mr-2" />
                Download as PDF
              </button>
              
              {selectedLanguage !== 'English' && (
                <button
                  type="button"
                  onClick={() => setSelectedLanguage('English')}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 flex items-center"
                >
                  <FaVolumeUp className="mr-2" />
                  Read Aloud
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}