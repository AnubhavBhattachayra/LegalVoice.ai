import Link from 'next/link';
import {
  FaFileAlt,
  FaUserTie,
  FaRobot,
  FaCloudUploadAlt,
  FaSearch,
  FaComments,
  FaLock,
  FaMobileAlt,
  FaChartBar,
  FaUsers,
  FaBell,
  FaDatabase
} from 'react-icons/fa';

export default function Features() {
  // Features grouped by category
  const featureCategories = [
    {
      title: "Document Management",
      description: "Create, store, and manage all your legal documents in one secure place.",
      features: [
        {
          icon: <FaFileAlt />,
          title: "Smart Document Creation",
          description: "Generate legal documents with AI assistance. Save time and ensure accuracy with templates that adapt to your specific needs."
        },
        {
          icon: <FaCloudUploadAlt />,
          title: "Document Upload & Storage",
          description: "Securely upload and store your existing legal documents in the cloud, accessible anytime, anywhere."
        },
        {
          icon: <FaSearch />,
          title: "Advanced Search",
          description: "Quickly find any document with our powerful search capabilities that scan through document content and metadata."
        }
      ]
    },
    {
      title: "AI Assistance",
      description: "Leverage cutting-edge AI to understand, create, and analyze legal documents.",
      features: [
        {
          icon: <FaRobot />,
          title: "Legal AI Assistant",
          description: "Get instant answers to legal questions and document explanations using our conversational AI assistant."
        },
        {
          icon: <FaComments />,
          title: "Document Analysis",
          description: "AI-powered analysis of legal documents that extracts key information and explains terms in plain language."
        },
        {
          icon: <FaDatabase />,
          title: "Legal Research",
          description: "Access comprehensive legal research and precedents to strengthen your understanding and document preparation."
        }
      ]
    },
    {
      title: "Expert Consultations",
      description: "Connect with qualified legal professionals for personalized advice.",
      features: [
        {
          icon: <FaUserTie />,
          title: "Lawyer Marketplace",
          description: "Browse and connect with experienced lawyers specializing in various legal fields."
        },
        {
          icon: <FaUsers />,
          title: "Collaborative Review",
          description: "Share documents with legal professionals for review and feedback with collaborative tools."
        },
        {
          icon: <FaChartBar />,
          title: "Case Tracking",
          description: "Monitor the progress of your legal matters with comprehensive tracking and reporting."
        }
      ]
    },
    {
      title: "Security & Access",
      description: "Enterprise-grade security with flexible access options.",
      features: [
        {
          icon: <FaLock />,
          title: "End-to-End Encryption",
          description: "All your documents and communications are secured with enterprise-grade encryption protocols."
        },
        {
          icon: <FaMobileAlt />,
          title: "Mobile Accessibility",
          description: "Access your legal documents and services on-the-go with our responsive mobile experience."
        },
        {
          icon: <FaBell />,
          title: "Smart Notifications",
          description: "Stay informed with timely notifications about document updates, deadlines, and consultation reminders."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen pt-32 pb-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Powerful Features for Your Legal Needs
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover how LegalVoice.AI combines AI technology, legal expertise, and user-friendly design to simplify your legal documentation experience.
          </p>
        </div>

        {/* Feature Categories */}
        {featureCategories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{category.title}</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">{category.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {category.features.map((feature, featureIndex) => (
                <div key={featureIndex} className="bg-white rounded-xl shadow-md p-8 transition-transform hover:scale-105">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6 text-indigo-600 text-2xl">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Comparison Table */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Plans Comparison</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Choose the plan that's right for you with our flexible pricing options.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl shadow-md">
              <thead>
                <tr className="bg-indigo-100">
                  <th className="py-4 px-6 text-left text-gray-900 font-semibold">Feature</th>
                  <th className="py-4 px-6 text-center text-gray-900 font-semibold">Free</th>
                  <th className="py-4 px-6 text-center text-gray-900 font-semibold">Pro</th>
                  <th className="py-4 px-6 text-center text-gray-900 font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-6 text-gray-800">Document Creation</td>
                  <td className="py-4 px-6 text-center">Basic templates only</td>
                  <td className="py-4 px-6 text-center">All templates</td>
                  <td className="py-4 px-6 text-center">All templates + Custom</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-6 text-gray-800">Document Storage</td>
                  <td className="py-4 px-6 text-center">5 documents</td>
                  <td className="py-4 px-6 text-center">Unlimited</td>
                  <td className="py-4 px-6 text-center">Unlimited + Versioning</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-6 text-gray-800">AI Assistant</td>
                  <td className="py-4 px-6 text-center">Limited queries</td>
                  <td className="py-4 px-6 text-center">Unlimited queries</td>
                  <td className="py-4 px-6 text-center">Advanced AI features</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-6 text-gray-800">Document Analysis</td>
                  <td className="py-4 px-6 text-center">Basic</td>
                  <td className="py-4 px-6 text-center">Advanced</td>
                  <td className="py-4 px-6 text-center">Comprehensive</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-6 text-gray-800">Lawyer Consultations</td>
                  <td className="py-4 px-6 text-center">Pay per use</td>
                  <td className="py-4 px-6 text-center">3 free/month</td>
                  <td className="py-4 px-6 text-center">10 free/month</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-6 text-gray-800">Team Members</td>
                  <td className="py-4 px-6 text-center">None</td>
                  <td className="py-4 px-6 text-center">Up to 5</td>
                  <td className="py-4 px-6 text-center">Unlimited</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-6 text-gray-800">Priority Support</td>
                  <td className="py-4 px-6 text-center">Email only</td>
                  <td className="py-4 px-6 text-center">Email + Chat</td>
                  <td className="py-4 px-6 text-center">Email + Chat + Phone</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-800">Custom Branding</td>
                  <td className="py-4 px-6 text-center">No</td>
                  <td className="py-4 px-6 text-center">No</td>
                  <td className="py-4 px-6 text-center">Yes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Users Say</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Discover how LegalVoice.AI has helped users streamline their legal documentation process.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                quote: "LegalVoice.AI saved my small business countless hours and legal expenses. The document creation is intuitive, and the AI explanations help me understand complex legal terms.",
                author: "Rahul Mehta",
                title: "Small Business Owner"
              },
              {
                quote: "As someone with no legal background, I was intimidated by legal documents. Now I feel confident creating and understanding my legal documents thanks to LegalVoice.AI.",
                author: "Anita Sharma",
                title: "Freelance Consultant"
              },
              {
                quote: "The lawyer marketplace feature connected me with an experienced attorney who helped with my specific needs. The whole process was seamless and efficient.",
                author: "Vikram Desai",
                title: "Real Estate Investor"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md p-8">
                <div className="flex-1">
                  <p className="text-gray-600 italic mb-6">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.author}</p>
                    <p className="text-gray-500 text-sm">{testimonial.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg overflow-hidden">
          <div className="p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Ready to Experience These Features?</h2>
            <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto">
              Join thousands of users who are simplifying their legal documentation process with LegalVoice.AI
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/auth/register" 
                className="bg-white text-indigo-600 hover:bg-indigo-50 px-8 py-3 rounded-lg font-semibold transition duration-300 inline-block"
              >
                Start Free Trial
              </Link>
              <Link 
                href="/contact" 
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-indigo-600 px-8 py-3 rounded-lg font-semibold transition duration-300 inline-block"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 