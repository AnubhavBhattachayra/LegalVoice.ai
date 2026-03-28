'use client';

import { useState } from 'react';
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

// Validation schema
const ContactSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name is too short')
    .max(50, 'Name is too long')
    .required('Name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  phone: Yup.string()
    .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits')
    .required('Phone number is required'),
  subject: Yup.string()
    .required('Subject is required'),
  message: Yup.string()
    .min(10, 'Message is too short')
    .required('Message is required'),
});

export default function Contact() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (values: {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
  }) => {
    try {
      // In a real app, this would send the form data to a backend API
      console.log('Form submitted:', values);
      setIsSubmitted(true);
      setSubmitError(null);
    } catch (error: any) {
      setSubmitError(error.message || 'An error occurred while submitting the form');
    }
  };

  return (
    <main className="min-h-screen pt-32 pb-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">Contact Us</h1>
        
        <div className="max-w-6xl mx-auto">
          {isSubmitted ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <FaCheck className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Thank You!</h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Your message has been sent successfully. We'll get back to you as soon as possible.
              </p>
              <button 
                onClick={() => setIsSubmitted(false)}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Contact Form */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Get in Touch</h2>
                
                {submitError && (
                  <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 flex items-start">
                    <FaExclamationTriangle className="mr-2 mt-1 flex-shrink-0" />
                    <p>{submitError}</p>
                  </div>
                )}
                
                <Formik
                  initialValues={{ name: '', email: '', phone: '', subject: '', message: '' }}
                  validationSchema={ContactSchema}
                  onSubmit={handleSubmit}
                >
                  {({ isValid, dirty, isSubmitting }) => (
                    <Form className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name
                          </label>
                          <Field
                            id="name"
                            name="name"
                            type="text"
                            placeholder="Your full name"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <ErrorMessage name="name" component="div" className="mt-1 text-sm text-red-600" />
                        </div>
                        
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                          </label>
                          <Field
                            id="email"
                            name="email"
                            type="email"
                            placeholder="Your email address"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <ErrorMessage name="email" component="div" className="mt-1 text-sm text-red-600" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number
                          </label>
                          <Field
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="Your phone number"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <ErrorMessage name="phone" component="div" className="mt-1 text-sm text-red-600" />
                        </div>
                        
                        <div>
                          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                            Subject
                          </label>
                          <Field
                            id="subject"
                            name="subject"
                            as="select"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="">Select a subject</option>
                            <option value="General Inquiry">General Inquiry</option>
                            <option value="Technical Support">Technical Support</option>
                            <option value="Document Assistance">Document Assistance</option>
                            <option value="Legal Consultation">Legal Consultation</option>
                            <option value="Feedback">Feedback</option>
                            <option value="Other">Other</option>
                          </Field>
                          <ErrorMessage name="subject" component="div" className="mt-1 text-sm text-red-600" />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                          Message
                        </label>
                        <Field
                          id="message"
                          name="message"
                          as="textarea"
                          rows={5}
                          placeholder="Your message"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <ErrorMessage name="message" component="div" className="mt-1 text-sm text-red-600" />
                      </div>

                      <div>
                        <button
                          type="submit"
                          disabled={isSubmitting || !(isValid && dirty)}
                          className={`px-6 py-3 rounded-lg font-medium text-white w-full
                            ${isSubmitting || !(isValid && dirty)
                              ? 'bg-indigo-400 cursor-not-allowed'
                              : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                        >
                          {isSubmitting ? 'Sending...' : 'Send Message'}
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>

              {/* Contact Information */}
              <div className="bg-indigo-900 text-white rounded-xl shadow-md p-8">
                <h2 className="text-2xl font-semibold mb-6">Contact Information</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="mt-1 mr-4">
                      <FaPhoneAlt />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Phone</h3>
                      <p>+91 98765 43210</p>
                      <p className="text-indigo-300 text-sm mt-1">Mon-Fri, 9:00 AM - 6:00 PM IST</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="mt-1 mr-4">
                      <FaEnvelope />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Email</h3>
                      <p>contact@legalvoice.ai</p>
                      <p className="text-indigo-300 text-sm mt-1">We'll respond within 24 hours</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="mt-1 mr-4">
                      <FaMapMarkerAlt />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Address</h3>
                      <p>123 Tech Park, Sector 15</p>
                      <p>Gurugram, Haryana 122001</p>
                      <p>India</p>
                    </div>
                  </div>
                </div>

                <div className="mt-12">
                  <h3 className="font-medium mb-4">Connect with us</h3>
                  <div className="flex space-x-4">
                    <a href="#" className="w-10 h-10 rounded-full bg-indigo-800 hover:bg-indigo-700 flex items-center justify-center transition-colors">
                      <span className="sr-only">Facebook</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>
                    </a>
                    <a href="#" className="w-10 h-10 rounded-full bg-indigo-800 hover:bg-indigo-700 flex items-center justify-center transition-colors">
                      <span className="sr-only">Twitter</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.03 10.03 0 01-3.127 1.195 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                    </a>
                    <a href="#" className="w-10 h-10 rounded-full bg-indigo-800 hover:bg-indigo-700 flex items-center justify-center transition-colors">
                      <span className="sr-only">LinkedIn</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 