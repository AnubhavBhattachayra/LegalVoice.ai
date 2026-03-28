'use client';

import Link from 'next/link';
import {
  FaFileAlt,
  FaUserTie,
  FaRobot,
  FaShieldAlt, 
import {
    FaArrowRight
  } from 'react-icons/fa';
import { Mic, FileText, Scale, Cpu, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import MiniChatBot from './components/MiniChatBot';
import HomeChatBar from './components/HomeChatBar';
import { Button } from './components/ui/button';

const features = [
  {
    icon: Mic,
    title: "Multilingual Voice-to-Text",
    description: "Built with Whisper & PyTorch. Real-time transcription supporting 8 regional Indian languages with 92% tested accuracy.",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: FileText,
    title: "Agentic Form Processing",
    description: "Powered by AutoGen. Automated workflow maps and extracts document fields instantly — reducing processing time by 73%.",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    icon: Scale,
    title: "Hybrid RAG Search",
    description: "Combines dense (FAISS) and sparse (BM25) vector retrieval for pinpoint contextual accuracy of Indian laws.",
    gradient: "from-emerald-500 to-teal-500"
  },
  {
    icon: Cpu,
    title: "Chain-of-Thought AI",
    description: "Advanced SLM deployment using optimized prompt frameworks. Delivers deep legal reasoning with 40% reduced latency.",
    gradient: "from-orange-500 to-red-500"
  }
];

export default function Home() {
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      boxShadow: "0 0 15px var(--primary)"
    },
    tap: { scale: 0.98 }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#120e33] via-[#1e1654] to-[#0c2157] text-white relative overflow-hidden py-24">
        <div className="absolute inset-0 z-0 overflow-hidden">
          {/* Background SVG pattern */}
          <svg className="absolute top-0 left-0 w-full h-full opacity-[0.15]" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <radialGradient id="grid-gradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#fff" stopOpacity="0" />
              </radialGradient>
            </defs>
            <g stroke="url(#grid-gradient)" strokeWidth="0.5">
              {[...Array(12)].map((_, i) => (
                <line key={`h-${i}`} x1="0" y1={i * 8.33} x2="100" y2={i * 8.33} />
              ))}
              {[...Array(12)].map((_, i) => (
                <line key={`v-${i}`} x1={i * 8.33} y1="0" x2={i * 8.33} y2="100" />
              ))}
            </g>
          </svg>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Hero Content */}
          <div className="relative max-w-[900px] mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center space-x-2 bg-[#00f0ff]/10 text-[#00f0ff] px-4 py-2 rounded-full mb-8 border border-[#00f0ff]/30 backdrop-blur-md">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium tracking-wide">
                  PyTorch &middot; Whisper &middot; AutoGen &middot; RAG
                </span>
              </div>
            </motion.div>

            <motion.h1
              className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Voice-Powered{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] via-[#bf00ff] to-[#ff003c] animate-gradient-x">
                Legal Assistant
              </span>
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Built on advanced AI architectures. Supporting multilingual voice-to-text in 8 regional languages with 92% accuracy.
              Automate document processing, retrieve case laws instantly with hybrid RAG, and generate legal drafts at the speed of thought.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Link href="/chat">
                <Button size="lg" className="bg-[#00f0ff] text-black hover:bg-white hover:text-black hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] font-bold px-8 py-6 text-lg rounded-full transition-all duration-300 w-full sm:w-auto h-auto">
                  <Mic className="mr-3 h-5 w-5" />
                  Start Voice Session
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="lg" variant="outline" className="border-[#00f0ff]/50 text-[#00f0ff] hover:bg-[#00f0ff]/10 hover:text-white hover:shadow-[0_0_30px_rgba(0,240,255,0.3)] font-bold px-8 py-6 text-lg rounded-full transition-all duration-300 w-full sm:w-auto h-auto">
                  Learn More
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[#0a0c20]">
        <div className="container mx-auto px-4">
          <motion.h2
            className="text-3xl font-bold text-center mb-4 text-[color:var(--foreground)]"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Why Choose LegalVoice.AI?
          </motion.h2>
          <motion.p
            className="text-center mb-12 text-[color:var(--foreground)] text-opacity-[0.8] max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Our AI-powered platform simplifies complex legal processes and brings legal services to your fingertips.
          </motion.p>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="bg-[#13162b] border border-gray-800 p-8 rounded-2xl hover:border-[#00f0ff]/50 transition-all duration-300 relative overflow-hidden group"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.gradient} opacity-5 group-hover:opacity-10 rounded-bl-full transition-opacity duration-300`} />
                <div className="w-14 h-14 bg-[#1c1f36] rounded-xl flex items-center justify-center mb-6 border border-gray-800 group-hover:border-gray-700 transition-colors relative z-10">
                  <feature.icon className="w-6 h-6 text-[#00f0ff]" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white relative z-10">{feature.title}</h3>
                <p className="text-gray-400 relative z-10 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-[#0f1129] to-[#07081a] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight">Ready to Transform Your Legal Workflow?</h2>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Join thousands of professionals using LegalVoice.ai to navigate Indian law instantly.
            </p>
            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Link
                href="/auth/register"
                className="bg-white text-black px-10 py-5 rounded-full font-bold hover:bg-gray-100 inline-flex items-center shadow-[0_0_30px_rgba(255,255,255,0.2)] text-lg transition-all"
              >
                Create Free Account <FaArrowRight className="ml-3" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Mini Chat Bot */}
      <MiniChatBot />
    </div>
  );
}
