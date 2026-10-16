import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ success: null, message: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ success: null, message: '' });

    if (e.target.botcheck.checked) {
      setIsSubmitting(false);
      return;
    }

    const dataToSend = {
      ...formData,
      access_key: import.meta.env.VITE_WEB3FORMS_ACCESS_KEY 
    };

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      const result = await response.json();

      if (response.status === 200) {
        setSubmitStatus({ 
          success: true, 
          message: 'TRANSMISSION VERIFIED: Your manifest update has been logged. Our fleet dispatch unit will respond shortly.' 
        });
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setSubmitStatus({ 
          success: false, 
          message: result.message || 'TRANSMISSION FAILURE: Core link dropped.' 
        });
      }
    } catch {
      setSubmitStatus({ 
        success: false, 
        message: 'NETWORK INTERRUPT: Secured satellite uplink could not be established.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // 🌟 التعديل الجوهري للـ Spacing: إزالة mt-16 وجعل الارتفاع يعوض مساحة الـ Navbar بشكل دقيق
    <div className="min-h-[calc(100vh-120px)] bg-[#F8F9FA] flex flex-col items-center justify-center pt-8 pb-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#FF6B00] selection:text-white" dir="ltr">
      
      {/* Upper Navigation Indicator / Brand Header */}
      <div className="max-w-5xl w-full mb-8 text-left pl-4 md:pl-0">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-4xl font-black text-[#0B132B] tracking-tight uppercase"
        >
          CONTACT <span className="text-[#FF6B00]">SUPPORT</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.2 }}
          className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1"
        >
          FLEET MANAGEMENT & LOGISTICS HUB
        </motion.p>
      </div>

      {/* Main Structural Core */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-5xl w-full bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 border border-gray-100"
      >
        
        {/* Left Module: Cargo Vault Info Panel */}
        <div className="md:col-span-5 bg-[#0D1527] p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black uppercase tracking-tight text-white">LOGISTICS HUB</h2>
              <span className="bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider animate-pulse">
                UNIT 01 ONLINE
              </span>
            </div>
            
            <p className="text-gray-400 mb-10 text-sm leading-relaxed">
              Have a structural change, custom manifest query, or technical deployment issue? File a secure transmission directly to our command unit.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4 bg-[#152039] p-4 rounded-2xl border border-gray-800/50 hover:border-[#FF6B00]/30 transition-all duration-300 group">
                <div className="text-[#FF6B00] text-xl bg-[#0D1527] p-3 rounded-xl group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L22 8m-2 5v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4M5 18h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">SECURE EMAIL</p>
                  <p className="text-sm font-semibold text-gray-200 mt-0.5">support@dktec.com</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 bg-[#152039] p-4 rounded-2xl border border-gray-800/50 hover:border-[#FF6B00]/30 transition-all duration-300 group">
                <div className="text-[#FF6B00] text-xl bg-[#0D1527] p-3 rounded-xl group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">HOTLINE LINK</p>
                  <p className="text-sm font-semibold text-gray-200 mt-0.5" dir="ltr">+20 100 234 5678</p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Module Footer */}
          <div className="flex space-x-2 mt-8 md:mt-0 relative z-10">
            {['DISCORD', 'GITHUB', 'LINKEDIN'].map((platform) => (
              <a key={platform} href="#" className="px-3 py-2 bg-[#152039] border border-gray-800 rounded-xl text-[10px] font-bold tracking-wider hover:bg-[#FF6B00] hover:text-white hover:border-[#FF6B00] transition-all duration-300">
                {platform}
              </a>
            ))}
          </div>
        </div>

        {/* Right Module: Input Console */}
        <div className="md:col-span-7 p-8 sm:p-12 bg-white">
          <h3 className="text-xl font-black text-[#0B132B] uppercase tracking-tight mb-6">INITIATE DISPATCH PROTOCOL</h3>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2">FULL LEGAL NAME</label>
                <input 
                  type="text" name="name" required value={formData.name} onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-[#F8F9FA] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent outline-none transition duration-200 text-[#0B132B] font-semibold tracking-wide" 
                  placeholder="Mohamed Elattarrr" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2">EMAIL ADDRESS</label>
                <input 
                  type="email" name="email" required value={formData.email} onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-[#F8F9FA] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent outline-none transition duration-200 text-[#0B132B] font-semibold tracking-wide" 
                  placeholder="name@dktec.com" 
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2">SUBJECT / PROTOCOL</label>
              <input 
                type="text" name="subject" required value={formData.subject} onChange={handleChange}
                className="w-full px-4 py-3.5 bg-[#F8F9FA] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent outline-none transition duration-200 text-[#0B132B] font-semibold tracking-wide" 
                placeholder="e.g., Requesting Payload Structural Changes" 
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2">TRANSMISSION DETAILS (MESSAGE)</label>
              <textarea 
                name="message" rows="4" required value={formData.message} onChange={handleChange}
                className="w-full px-4 py-3.5 bg-[#F8F9FA] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent outline-none transition duration-200 text-[#0B132B] font-semibold tracking-wide resize-none" 
                placeholder="Describe your structural adjustments or log requests here..."
              ></textarea>
            </div>

            {/* Anti-Spam Honeypot Field */}
            <input type="checkbox" name="botcheck" className="hidden" style={{ display: 'none' }} />

            {/* Action Commit Button with Loading Feedback */}
            <Button 
              type="submit" disabled={isSubmitting} loading={isSubmitting}
              variant="primary" className="w-full"
            >
              {isSubmitting ? 'TRANSMITTING DATA...' : 'COMMIT STRUCTURAL CHANGES 🔒'}
            </Button>

            {/* Animated Feedback Notifications */}
            <AnimatePresence>
              {submitStatus.message && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-4 rounded-xl text-xs font-bold text-center border uppercase tracking-wider ${
                    submitStatus.success 
                      ? 'bg-emerald-950/20 text-emerald-400 border-emerald-800/40' 
                      : 'bg-rose-950/20 text-rose-400 border-rose-800/40'
                  }`}
                >
                  {submitStatus.message}
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

      </motion.div>
    </div>
  );
}