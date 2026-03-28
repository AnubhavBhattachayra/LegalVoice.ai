'use client';

import { useState } from 'react';
import { FaExclamationCircle } from 'react-icons/fa';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'date' | 'number';
  placeholder?: string;
  required?: boolean;
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    custom?: (value: any) => boolean;
  };
  errorMessage?: string;
  options?: Array<{ value: string; label: string }>;
}

interface FormProps {
  fields: FormField[];
  onSubmit: (data: any) => Promise<void>;
  submitLabel?: string;
  isLoading?: boolean;
  className?: string;
}

export default function Form({ fields, onSubmit, submitLabel = 'Submit', isLoading = false, className = '' }: FormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (field: FormField, value: any): string | null => {
    if (field.required && !value) {
      return `${field.label} is required`;
    }

    if (field.validation) {
      if (field.validation.pattern && !field.validation.pattern.test(value)) {
        return field.errorMessage || `${field.label} is invalid`;
      }

      if (field.validation.minLength && value.length < field.validation.minLength) {
        return `${field.label} must be at least ${field.validation.minLength} characters`;
      }

      if (field.validation.maxLength && value.length > field.validation.maxLength) {
        return `${field.label} must be at most ${field.validation.maxLength} characters`;
      }

      if (field.validation.custom && !field.validation.custom(value)) {
        return field.errorMessage || `${field.label} is invalid`;
      }
    }

    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = e.target;
    const field = fields.find(f => f.name === name);
    if (field) {
      const error = validateField(field, formData[name]);
      setErrors(prev => ({ ...prev, [name]: error || '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate all fields
    const newErrors: Record<string, string> = {};
    fields.forEach(field => {
      const error = validateField(field, formData[field.name]);
      if (error) {
        newErrors[field.name] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors(prev => ({
        ...prev,
        submit: error instanceof Error ? error.message : 'An error occurred while submitting the form'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const commonProps = {
      name: field.name,
      value: formData[field.name] || '',
      onChange: handleChange,
      onBlur: handleBlur,
      className: `w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
        errors[field.name] ? 'border-red-500' : 'border-gray-300'
      }`,
      placeholder: field.placeholder,
      required: field.required,
    };

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={4}
          />
        );

      case 'select':
        return (
          <select {...commonProps}>
            <option value="">Select {field.label}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            {...commonProps}
            type={field.type}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {fields.map(field => (
        <div key={field.name}>
          <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {renderField(field)}
          {errors[field.name] && (
            <div className="flex items-center mt-1 text-sm text-red-600">
              <FaExclamationCircle className="mr-1" />
              {errors[field.name]}
            </div>
          )}
        </div>
      ))}

      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
          {errors.submit}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || isLoading}
        className={`w-full py-2 px-4 border border-transparent rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
          (isSubmitting || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isSubmitting || isLoading ? 'Submitting...' : submitLabel}
      </button>
    </form>
  );
} 