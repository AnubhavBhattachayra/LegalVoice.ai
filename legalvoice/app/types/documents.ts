// Document Types
export type DocumentType = 
  | 'challan' 
  | 'affidavit' 
  | 'poa' 
  | 'rent' 
  | 'income' 
  | 'will';

// Field Types
export type FieldType = 
  | 'text' 
  | 'number' 
  | 'date' 
  | 'select' 
  | 'textarea' 
  | 'checkbox';

// Form Field Definition
export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select fields
}

// Document Definition
export interface DocumentDefinition {
  id: DocumentType;
  title: string;
  description: string;
  fields: FormField[];
}

// Document Data
export interface DocumentData {
  id: string;
  type: DocumentType;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  data: Record<string, any>;
}

// Document Mapping
export const documentDefinitions: Record<DocumentType, DocumentDefinition> = {
  challan: {
    id: 'challan',
    title: 'Traffic Challan',
    description: 'Complete your traffic violation payment forms with ease.',
    fields: [
      {
        id: 'challanNumber',
        type: 'text',
        label: 'Challan Number',
        placeholder: 'Enter challan number',
        required: true
      },
      {
        id: 'vehicleNumber',
        type: 'text',
        label: 'Vehicle Registration Number',
        placeholder: 'e.g., DL01AB1234',
        required: true
      },
      {
        id: 'violationType',
        type: 'select',
        label: 'Violation Type',
        required: true,
        options: [
          'Speeding',
          'Red Light Violation',
          'No Parking',
          'Wrong Side Driving',
          'No Helmet/Seatbelt',
          'Other'
        ]
      },
      {
        id: 'violationDate',
        type: 'date',
        label: 'Violation Date',
        required: true
      },
      {
        id: 'violationLocation',
        type: 'text',
        label: 'Violation Location',
        placeholder: 'Enter location of violation',
        required: true
      },
      {
        id: 'fullName',
        type: 'text',
        label: 'Full Name',
        placeholder: 'Enter your full name',
        required: true
      },
      {
        id: 'phoneNumber',
        type: 'text',
        label: 'Phone Number',
        placeholder: 'Enter your phone number',
        required: true
      },
      {
        id: 'remarks',
        type: 'textarea',
        label: 'Remarks (if any)',
        placeholder: 'Add any additional information',
        required: false
      }
    ]
  },
  affidavit: {
    id: 'affidavit',
    title: 'General Affidavit',
    description: 'Create general-purpose affidavits for various legal needs.',
    fields: [
      {
        id: 'fullName',
        type: 'text',
        label: 'Full Name',
        placeholder: 'Enter your full name',
        required: true
      },
      {
        id: 'fatherName',
        type: 'text',
        label: 'Father\'s Name',
        placeholder: 'Enter your father\'s name',
        required: true
      },
      {
        id: 'age',
        type: 'number',
        label: 'Age',
        placeholder: 'Enter your age',
        required: true
      },
      {
        id: 'address',
        type: 'textarea',
        label: 'Residential Address',
        placeholder: 'Enter your complete address',
        required: true
      },
      {
        id: 'purpose',
        type: 'select',
        label: 'Purpose of Affidavit',
        required: true,
        options: [
          'Name Change',
          'Address Proof',
          'Income Proof',
          'Marriage',
          'Birth Certificate Correction',
          'Other'
        ]
      },
      {
        id: 'statementContent',
        type: 'textarea',
        label: 'Statement Content',
        placeholder: 'Enter the details of your affidavit statement',
        required: true
      },
      {
        id: 'place',
        type: 'text',
        label: 'Place of Execution',
        placeholder: 'Enter the place where this will be signed',
        required: true
      },
      {
        id: 'date',
        type: 'date',
        label: 'Date of Execution',
        required: true
      }
    ]
  },
  poa: {
    id: 'poa',
    title: 'Power of Attorney',
    description: 'Designate someone to act on your behalf for specified matters.',
    fields: [
      {
        id: 'donorName',
        type: 'text',
        label: 'Donor\'s Full Name (You)',
        placeholder: 'Enter your full name',
        required: true
      },
      {
        id: 'donorAddress',
        type: 'textarea',
        label: 'Donor\'s Address',
        placeholder: 'Enter your complete address',
        required: true
      },
      {
        id: 'attorneyName',
        type: 'text',
        label: 'Attorney\'s Full Name (Representative)',
        placeholder: 'Enter the name of your representative',
        required: true
      },
      {
        id: 'attorneyAddress',
        type: 'textarea',
        label: 'Attorney\'s Address',
        placeholder: 'Enter the complete address of your representative',
        required: true
      },
      {
        id: 'poaType',
        type: 'select',
        label: 'Type of Power of Attorney',
        required: true,
        options: [
          'General Power of Attorney',
          'Special Power of Attorney',
          'Durable Power of Attorney',
          'Limited Power of Attorney'
        ]
      },
      {
        id: 'powers',
        type: 'textarea',
        label: 'Powers Granted',
        placeholder: 'Describe the powers you are granting to your representative',
        required: true
      },
      {
        id: 'duration',
        type: 'select',
        label: 'Duration',
        required: true,
        options: [
          'Until Revoked',
          '6 Months',
          '1 Year',
          '2 Years',
          '5 Years',
          'Other'
        ]
      },
      {
        id: 'witnesses',
        type: 'text',
        label: 'Witnesses (Comma Separated)',
        placeholder: 'Enter the names of witnesses',
        required: true
      },
      {
        id: 'place',
        type: 'text',
        label: 'Place of Execution',
        placeholder: 'Enter the place where this will be signed',
        required: true
      },
      {
        id: 'date',
        type: 'date',
        label: 'Date of Execution',
        required: true
      }
    ]
  },
  rent: {
    id: 'rent',
    title: 'Rent Agreement',
    description: 'Generate standard rental agreements with customizable terms.',
    fields: [
      {
        id: 'landlordName',
        type: 'text',
        label: 'Landlord\'s Full Name',
        placeholder: 'Enter landlord\'s full name',
        required: true
      },
      {
        id: 'landlordAddress',
        type: 'textarea',
        label: 'Landlord\'s Address',
        placeholder: 'Enter landlord\'s complete address',
        required: true
      },
      {
        id: 'tenantName',
        type: 'text',
        label: 'Tenant\'s Full Name',
        placeholder: 'Enter tenant\'s full name',
        required: true
      },
      {
        id: 'tenantAddress',
        type: 'textarea',
        label: 'Tenant\'s Permanent Address',
        placeholder: 'Enter tenant\'s permanent address',
        required: true
      },
      {
        id: 'propertyAddress',
        type: 'textarea',
        label: 'Rental Property Address',
        placeholder: 'Enter complete address of the property being rented',
        required: true
      },
      {
        id: 'propertyDescription',
        type: 'textarea',
        label: 'Property Description',
        placeholder: 'Describe the property (size, rooms, amenities)',
        required: true
      },
      {
        id: 'rentAmount',
        type: 'number',
        label: 'Monthly Rent (₹)',
        placeholder: 'Enter monthly rent amount',
        required: true
      },
      {
        id: 'securityDeposit',
        type: 'number',
        label: 'Security Deposit (₹)',
        placeholder: 'Enter security deposit amount',
        required: true
      },
      {
        id: 'leaseStartDate',
        type: 'date',
        label: 'Lease Start Date',
        required: true
      },
      {
        id: 'leaseDuration',
        type: 'select',
        label: 'Lease Duration',
        required: true,
        options: [
          '11 Months',
          '1 Year',
          '2 Years',
          '3 Years',
          'Other'
        ]
      },
      {
        id: 'noticePeriod',
        type: 'select',
        label: 'Notice Period',
        required: true,
        options: [
          '1 Month',
          '2 Months',
          '3 Months'
        ]
      },
      {
        id: 'specialTerms',
        type: 'textarea',
        label: 'Special Terms & Conditions',
        placeholder: 'Enter any special terms or conditions',
        required: false
      }
    ]
  },
  income: {
    id: 'income',
    title: 'Income Declaration',
    description: 'Create income declaration forms for various official purposes.',
    fields: [
      {
        id: 'fullName',
        type: 'text',
        label: 'Full Name',
        placeholder: 'Enter your full name',
        required: true
      },
      {
        id: 'fatherName',
        type: 'text',
        label: 'Father\'s Name',
        placeholder: 'Enter your father\'s name',
        required: true
      },
      {
        id: 'address',
        type: 'textarea',
        label: 'Residential Address',
        placeholder: 'Enter your complete address',
        required: true
      },
      {
        id: 'occupation',
        type: 'text',
        label: 'Occupation',
        placeholder: 'Enter your occupation',
        required: true
      },
      {
        id: 'employerName',
        type: 'text',
        label: 'Employer Name',
        placeholder: 'Enter your employer\'s name',
        required: false
      },
      {
        id: 'employerAddress',
        type: 'textarea',
        label: 'Employer Address',
        placeholder: 'Enter employer\'s address',
        required: false
      },
      {
        id: 'annualIncome',
        type: 'number',
        label: 'Annual Income (₹)',
        placeholder: 'Enter your annual income',
        required: true
      },
      {
        id: 'financialYear',
        type: 'select',
        label: 'Financial Year',
        required: true,
        options: [
          '2022-2023',
          '2023-2024',
          '2024-2025'
        ]
      },
      {
        id: 'incomeSource',
        type: 'select',
        label: 'Source of Income',
        required: true,
        options: [
          'Salary',
          'Business',
          'Self-employed Professional',
          'Rental Income',
          'Investment Income',
          'Agriculture',
          'Multiple Sources'
        ]
      },
      {
        id: 'purpose',
        type: 'select',
        label: 'Purpose of Declaration',
        required: true,
        options: [
          'Bank Loan',
          'Education Loan',
          'Visa Application',
          'Housing Society',
          'Government Benefit',
          'Other'
        ]
      },
      {
        id: 'place',
        type: 'text',
        label: 'Place of Declaration',
        placeholder: 'Enter the place where this is being declared',
        required: true
      },
      {
        id: 'date',
        type: 'date',
        label: 'Date of Declaration',
        required: true
      }
    ]
  },
  will: {
    id: 'will',
    title: 'Will',
    description: 'Draft a basic will document with proper legal formatting.',
    fields: [
      {
        id: 'testatorName',
        type: 'text',
        label: 'Testator\'s Full Name',
        placeholder: 'Enter your full name',
        required: true
      },
      {
        id: 'testatorAddress',
        type: 'textarea',
        label: 'Testator\'s Address',
        placeholder: 'Enter your complete address',
        required: true
      },
      {
        id: 'testatorAge',
        type: 'number',
        label: 'Testator\'s Age',
        placeholder: 'Enter your age',
        required: true
      },
      {
        id: 'soundMind',
        type: 'checkbox',
        label: 'I declare that I am of sound mind and this will is made voluntarily',
        required: true
      },
      {
        id: 'executorName',
        type: 'text',
        label: 'Executor\'s Full Name',
        placeholder: 'Enter the name of the person who will execute your will',
        required: true
      },
      {
        id: 'executorAddress',
        type: 'textarea',
        label: 'Executor\'s Address',
        placeholder: 'Enter executor\'s complete address',
        required: true
      },
      {
        id: 'executorRelationship',
        type: 'text',
        label: 'Relationship with Executor',
        placeholder: 'e.g., Son, Daughter, Friend',
        required: true
      },
      {
        id: 'beneficiaries',
        type: 'textarea',
        label: 'Beneficiaries (Name, Relationship, Share/Asset)',
        placeholder: 'List all beneficiaries and what they will receive',
        required: true
      },
      {
        id: 'assets',
        type: 'textarea',
        label: 'Asset Description',
        placeholder: 'Describe your major assets (property, investments, valuables)',
        required: true
      },
      {
        id: 'specialInstructions',
        type: 'textarea',
        label: 'Special Instructions (if any)',
        placeholder: 'Any specific instructions regarding distribution or handling of assets',
        required: false
      },
      {
        id: 'witnesses',
        type: 'text',
        label: 'Witnesses (Comma Separated)',
        placeholder: 'Enter the names of witnesses (at least two)',
        required: true
      },
      {
        id: 'place',
        type: 'text',
        label: 'Place of Execution',
        placeholder: 'Enter the place where this will be signed',
        required: true
      },
      {
        id: 'date',
        type: 'date',
        label: 'Date of Execution',
        required: true
      }
    ]
  }
}; 