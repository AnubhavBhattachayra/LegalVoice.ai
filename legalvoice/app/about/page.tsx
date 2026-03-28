import { FaRobot, FaFileAlt, FaUserTie, FaUsers, FaGlobe, FaShieldAlt } from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';

export default function About() {
  return (
    <main className="min-h-screen pt-32 pb-16 bg-[color:var(--background)] chat-gradient-bg">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Hero Section */}
        <div className="bg-[color:var(--card)] rounded-xl shadow-md overflow-hidden mb-12 border border-[color:var(--border)]">
          <div className="md:flex">
            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
              <h1 className="text-4xl font-bold text-[color:var(--foreground)] mb-6">
                About LegalVoice.AI
              </h1>
              <p className="text-xl text-[color:var(--foreground)] opacity-80 mb-6">
                Making legal documentation accessible and easy for everyone through voice commands and artificial intelligence.
              </p>
              <p className="text-[color:var(--foreground)] opacity-70 mb-6">
                Founded in 2023, LegalVoice.AI was created with a simple mission: to bridge the gap between complex legal processes and the average citizen in India. Our platform leverages advanced voice recognition and AI to simplify the creation and understanding of legal documents.
              </p>
            </div>
            <div className="md:w-1/2 relative h-64 md:h-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--primary-dark)] to-[color:var(--primary)] flex items-center justify-center">
                <div className="text-center text-white p-8">
                  <FaRobot className="mx-auto text-6xl mb-4" />
                  <p className="text-2xl font-semibold">AI-Powered Legal Solutions</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Our Mission */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-[color:var(--foreground)] mb-8 text-center">Our Mission</h2>
          <div className="bg-[color:var(--card)] rounded-xl shadow-md overflow-hidden border border-[color:var(--border)]">
            <div className="p-8 md:p-12">
              <div className="max-w-3xl mx-auto">
                <p className="text-[color:var(--foreground)] opacity-80 text-lg mb-6">
                  LegalVoice.AI aims to democratize access to legal services by providing a user-friendly platform that allows individuals to create, understand, and manage legal documents without requiring extensive legal knowledge.
                </p>
                <p className="text-[color:var(--foreground)] opacity-80 text-lg mb-6">
                  We believe that legal processes should be transparent, accessible, and affordable for everyone. By combining cutting-edge voice recognition technology with artificial intelligence, we're reducing the barriers that often prevent people from properly handling their legal needs.
                </p>
                <div className="flex items-center justify-center mt-8">
                  <div className="w-16 h-1 bg-[color:var(--primary)] rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Our Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-[color:var(--foreground)] mb-8 text-center">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[color:var(--card)] p-8 rounded-xl shadow-md border border-[color:var(--border)]">
              <div className="w-16 h-16 bg-[color:var(--primary)] bg-opacity-10 rounded-lg flex items-center justify-center mb-6">
                <FaUsers className="text-[color:var(--primary)] text-3xl" />
              </div>
              <h3 className="text-xl font-semibold text-[color:var(--foreground)] mb-3">Accessibility</h3>
              <p className="text-[color:var(--foreground)] opacity-70">
                We believe legal services should be accessible to everyone, regardless of their technical knowledge or legal background. Our platform is designed to be intuitive and easy to use.
              </p>
            </div>
            
            <div className="bg-[color:var(--card)] p-8 rounded-xl shadow-md border border-[color:var(--border)]">
              <div className="w-16 h-16 bg-[color:var(--secondary)] bg-opacity-10 rounded-lg flex items-center justify-center mb-6">
                <FaShieldAlt className="text-[color:var(--secondary)] text-3xl" />
              </div>
              <h3 className="text-xl font-semibold text-[color:var(--foreground)] mb-3">Integrity</h3>
              <p className="text-[color:var(--foreground)] opacity-70">
                We uphold the highest standards of integrity in all our operations. We're transparent about our services, pricing, and the limitations of our technology.
              </p>
            </div>
            
            <div className="bg-[color:var(--card)] p-8 rounded-xl shadow-md border border-[color:var(--border)]">
              <div className="w-16 h-16 bg-[color:var(--accent)] bg-opacity-10 rounded-lg flex items-center justify-center mb-6">
                <FaGlobe className="text-[color:var(--accent)] text-3xl" />
              </div>
              <h3 className="text-xl font-semibold text-[color:var(--foreground)] mb-3">Innovation</h3>
              <p className="text-[color:var(--foreground)] opacity-70">
                We continuously strive to improve our technology and services, integrating the latest advancements in AI and voice recognition to provide the best possible experience for our users.
              </p>
            </div>
          </div>
        </div>

        {/* Our Team */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-[color:var(--foreground)] mb-8 text-center">Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Amit Patel",
                role: "Founder & CEO",
                bio: "Former lawyer with 15 years of experience, Amit founded LegalVoice.AI to make legal services more accessible to the average citizen.",
                image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80"
              },
              {
                name: "Priya Sharma",
                role: "Chief Legal Officer",
                bio: "With a background in corporate law, Priya ensures all documents and advice provided through our platform are legally sound and up-to-date.",
                image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80"
              },
              {
                name: "Vikram Singh",
                role: "CTO",
                bio: "A computer scientist specializing in AI and natural language processing, Vikram leads our technical team in developing cutting-edge solutions.",
                image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80"
              },
              {
                name: "Neha Reddy",
                role: "Head of User Experience",
                bio: "Neha has dedicated her career to creating intuitive digital experiences, ensuring our platform remains accessible to users of all technical abilities.",
                image: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80"
              },
              {
                name: "Rajesh Kumar",
                role: "Legal Content Director",
                bio: "A veteran in legal documentation, Rajesh oversees the creation and maintenance of all document templates and legal content on the platform.",
                image: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80"
              },
              {
                name: "Ananya Desai",
                role: "AI Research Lead",
                bio: "With a PhD in Artificial Intelligence, Ananya leads our research initiatives to continuously improve our voice recognition and document processing capabilities.",
                image: "https://images.unsplash.com/photo-1551836022-d5d88e92185f?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80"
              }
            ].map((member, index) => (
              <div key={index} className="bg-[color:var(--card)] rounded-xl shadow-md overflow-hidden border border-[color:var(--border)]">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <img 
                      src={member.image} 
                      alt={member.name} 
                      className="w-16 h-16 rounded-full object-cover mr-4"
                    />
                    <div>
                      <h3 className="text-xl font-semibold text-[color:var(--foreground)]">{member.name}</h3>
                      <p className="text-[color:var(--primary)]">{member.role}</p>
                    </div>
                  </div>
                  <p className="text-[color:var(--foreground)] opacity-70">
                    {member.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Our Services */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-[color:var(--foreground)] mb-8 text-center">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[color:var(--card)] p-8 rounded-xl shadow-md text-center border border-[color:var(--border)]">
              <div className="mx-auto w-16 h-16 bg-[color:var(--primary)] bg-opacity-10 rounded-full flex items-center justify-center mb-6">
                <FaFileAlt className="text-[color:var(--primary)] text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-[color:var(--foreground)] mb-3">Document Creation</h3>
              <p className="text-[color:var(--foreground)] opacity-70 mb-4">
                Create legally valid documents using simple voice commands. Our AI guides you through the process, ensuring all necessary information is included.
              </p>
              <Link 
                href="/documents" 
                className="text-[color:var(--primary)] font-medium hover:text-[color:var(--primary-hover)] transition"
              >
                Explore Documents →
              </Link>
            </div>
            
            <div className="bg-[color:var(--card)] p-8 rounded-xl shadow-md text-center border border-[color:var(--border)]">
              <div className="mx-auto w-16 h-16 bg-[color:var(--accent)] bg-opacity-10 rounded-full flex items-center justify-center mb-6">
                <FaRobot className="text-[color:var(--accent)] text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-[color:var(--foreground)] mb-3">OCR Analysis</h3>
              <p className="text-[color:var(--foreground)] opacity-70 mb-4">
                Upload existing legal documents to extract text, analyze content, and get explanations in simple language that's easy to understand.
              </p>
              <Link 
                href="/ocr" 
                className="text-[color:var(--accent)] font-medium hover:text-[color:var(--accent-hover)] transition"
              >
                Try OCR →
              </Link>
            </div>
            
            <div className="bg-[color:var(--card)] p-8 rounded-xl shadow-md text-center border border-[color:var(--border)]">
              <div className="mx-auto w-16 h-16 bg-[color:var(--secondary)] bg-opacity-10 rounded-full flex items-center justify-center mb-6">
                <FaUserTie className="text-[color:var(--secondary)] text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-[color:var(--foreground)] mb-3">Legal Consultations</h3>
              <p className="text-[color:var(--foreground)] opacity-70 mb-4">
                Connect with experienced lawyers specialized in various fields for personalized legal advice and document review.
              </p>
              <Link 
                href="/lawyers" 
                className="text-[color:var(--secondary)] font-medium hover:text-[color:var(--secondary-hover)] transition"
              >
                Find a Lawyer →
              </Link>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-[color:var(--primary-dark)] to-[color:var(--primary)] rounded-xl shadow-md overflow-hidden">
          <div className="p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Join thousands of users who are simplifying their legal documentation process with LegalVoice.AI
            </p>
            <Link 
              href="/documents/create" 
              className="bg-white text-[color:var(--primary-dark)] hover:bg-opacity-90 px-8 py-4 rounded-lg font-semibold text-lg transition duration-300 inline-block"
            >
              Create Your First Document
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
} 