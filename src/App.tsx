/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Briefcase, 
  Building2, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  Download, 
  Sparkles, 
  QrCode, 
  Layout, 
  Palette, 
  Type as TypeIcon,
  Moon,
  Sun,
  Copy,
  Check,
  Share2,
  ChevronRight,
  ChevronLeft,
  Upload,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { GoogleGenAI, Type } from "@google/genai";

// --- Types & Constants ---

interface CardData {
  name: string;
  jobTitle: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  logo: string | null;
}

interface AIDesign {
  colors: {
    background: string;
    text: string;
    accent: string;
    secondary: string;
  };
  font: string;
  tagline: string;
  layout: 'minimal' | 'modern' | 'premium';
}

const DEFAULT_CARD_DATA: CardData = {
  name: 'Alex Rivera',
  jobTitle: 'Senior Product Designer',
  company: 'DesignFlow Studio',
  phone: '+1 (555) 000-1234',
  email: 'alex@designflow.com',
  website: 'www.designflow.com',
  address: '123 Design Way, San Francisco, CA',
  logo: null,
};

const DEFAULT_AI_DESIGN: AIDesign = {
  colors: {
    background: '#ffffff',
    text: '#1a1a1a',
    accent: '#3b82f6',
    secondary: '#64748b',
  },
  font: 'Inter',
  tagline: 'Crafting digital experiences that matter.',
  layout: 'modern',
};

const TEMPLATES = [
  { id: 'dark-minimal', name: 'Dark Minimal', colors: { bg: '#0f172a', text: '#f8fafc', accent: '#38bdf8', secondary: '#94a3b8' } },
  { id: 'light-prof', name: 'Light Professional', colors: { bg: '#ffffff', text: '#0f172a', accent: '#2563eb', secondary: '#475569' } },
  { id: 'gradient-creative', name: 'Gradient Creative', colors: { bg: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', text: '#ffffff', accent: '#fde047', secondary: '#e2e8f0' } },
];

// --- Components ---

export default function App() {
  const [cardData, setCardData] = useState<CardData>(DEFAULT_CARD_DATA);
  const [aiDesign, setAiDesign] = useState<AIDesign>(DEFAULT_AI_DESIGN);
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrType, setQrType] = useState<'website' | 'vcard' | 'whatsapp'>('website');
  const [qrPosition, setQrPosition] = useState<'left' | 'right' | 'bottom'>('right');
  const [darkMode, setDarkMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'design' | 'qr'>('info');
  
  const cardRef = useRef<HTMLDivElement>(null);

  // Initialize Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCardData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCardData(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const generateAIDesign = async () => {
    setIsGenerating(true);
    try {
      const prompt = `Generate a professional business card design in JSON format for the following person:
      Name: ${cardData.name}
      Job Title: ${cardData.jobTitle}
      Company: ${cardData.company}
      
      Return a JSON object with:
      - colors: { background: hex, text: hex, accent: hex, secondary: hex }
      - font: A professional Google Font name (e.g., 'Inter', 'Playfair Display', 'Roboto Mono', 'Montserrat')
      - tagline: A short, catchy professional tagline (max 6 words)
      - layout: one of ['minimal', 'modern', 'premium']
      
      Ensure colors have good contrast.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              colors: {
                type: Type.OBJECT,
                properties: {
                  background: { type: Type.STRING },
                  text: { type: Type.STRING },
                  accent: { type: Type.STRING },
                  secondary: { type: Type.STRING },
                },
                required: ['background', 'text', 'accent', 'secondary'],
              },
              font: { type: Type.STRING },
              tagline: { type: Type.STRING },
              layout: { type: Type.STRING },
            },
            required: ['colors', 'font', 'tagline', 'layout'],
          },
        },
      });

      const result = JSON.parse(response.text);
      setAiDesign(result);
    } catch (error) {
      console.error("AI Generation Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadCard = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: null,
    });
    const link = document.createElement('a');
    link.download = `${cardData.name.replace(/\s+/g, '_')}_BusinessCard.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const copyContact = () => {
    const text = `${cardData.name}\n${cardData.jobTitle} at ${cardData.company}\nPhone: ${cardData.phone}\nEmail: ${cardData.email}\nWebsite: ${cardData.website}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getQRValue = () => {
    switch (qrType) {
      case 'vcard':
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${cardData.name}\nORG:${cardData.company}\nTITLE:${cardData.jobTitle}\nTEL:${cardData.phone}\nEMAIL:${cardData.email}\nURL:${cardData.website}\nEND:VCARD`;
      case 'whatsapp':
        return `https://wa.me/${cardData.phone.replace(/\D/g, '')}`;
      default:
        return cardData.website.startsWith('http') ? cardData.website : `https://${cardData.website}`;
    }
  };

  const applyTemplate = (template: typeof TEMPLATES[0]) => {
    setAiDesign(prev => ({
      ...prev,
      colors: {
        background: template.colors.bg,
        text: template.colors.text,
        accent: template.colors.accent,
        secondary: template.colors.secondary,
      }
    }));
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-opacity-80 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">CardStudio AI</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button 
            onClick={downloadCard}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full font-medium transition-all active:scale-95 shadow-lg shadow-blue-500/25"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Panel: Editor */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800">
              {(['info', 'design', 'qr'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-4 text-sm font-semibold capitalize transition-colors relative ${
                    activeTab === tab ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {activeTab === 'info' && (
                  <motion.div
                    key="info"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="Full Name" name="name" value={cardData.name} onChange={handleInputChange} icon={<User className="w-4 h-4" />} />
                      <Input label="Job Title" name="jobTitle" value={cardData.jobTitle} onChange={handleInputChange} icon={<Briefcase className="w-4 h-4" />} />
                    </div>
                    <Input label="Company" name="company" value={cardData.company} onChange={handleInputChange} icon={<Building2 className="w-4 h-4" />} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="Phone" name="phone" value={cardData.phone} onChange={handleInputChange} icon={<Phone className="w-4 h-4" />} />
                      <Input label="Email" name="email" value={cardData.email} onChange={handleInputChange} icon={<Mail className="w-4 h-4" />} />
                    </div>
                    <Input label="Website" name="website" value={cardData.website} onChange={handleInputChange} icon={<Globe className="w-4 h-4" />} />
                    <Input label="Address" name="address" value={cardData.address} onChange={handleInputChange} icon={<MapPin className="w-4 h-4" />} />
                    
                    <div className="pt-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Logo</label>
                      <div className="flex items-center gap-4">
                        {cardData.logo ? (
                          <div className="relative group">
                            <img src={cardData.logo} alt="Logo" className="w-16 h-16 object-contain rounded-lg border border-slate-200 dark:border-slate-700 p-1" />
                            <button 
                              onClick={() => setCardData(prev => ({ ...prev, logo: null }))}
                              className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-16 h-16 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                            <Upload className="w-5 h-5 text-slate-400" />
                            <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                          </label>
                        )}
                        <p className="text-xs text-slate-500">Upload your company logo (PNG/JPG)</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'design' && (
                  <motion.div
                    key="design"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <button
                      onClick={generateAIDesign}
                      disabled={isGenerating}
                      className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Sparkles className="w-5 h-5" />
                      )}
                      {isGenerating ? 'Generating Magic...' : 'Generate AI Design'}
                    </button>

                    <div className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Templates</h3>
                      <div className="grid grid-cols-1 gap-3">
                        {TEMPLATES.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => applyTemplate(t)}
                            className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full" style={{ background: t.colors.bg }} />
                              <span className="text-sm font-medium">{t.name}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Custom Styles</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <ColorPicker label="Background" value={aiDesign.colors.background} onChange={(v) => setAiDesign(p => ({ ...p, colors: { ...p.colors, background: v } }))} />
                        <ColorPicker label="Text" value={aiDesign.colors.text} onChange={(v) => setAiDesign(p => ({ ...p, colors: { ...p.colors, text: v } }))} />
                        <ColorPicker label="Accent" value={aiDesign.colors.accent} onChange={(v) => setAiDesign(p => ({ ...p, colors: { ...p.colors, accent: v } }))} />
                        <ColorPicker label="Secondary" value={aiDesign.colors.secondary} onChange={(v) => setAiDesign(p => ({ ...p, colors: { ...p.colors, secondary: v } }))} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'qr' && (
                  <motion.div
                    key="qr"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">QR Content</h3>
                      <div className="flex gap-2">
                        {(['website', 'vcard', 'whatsapp'] as const).map((type) => (
                          <button
                            key={type}
                            onClick={() => setQrType(type)}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                              qrType === type ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            {type.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">QR Position</h3>
                      <div className="flex gap-2">
                        {(['left', 'right', 'bottom'] as const).map((pos) => (
                          <button
                            key={pos}
                            onClick={() => setQrPosition(pos)}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                              qrPosition === pos ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            {pos.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Panel: Preview */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center space-y-8">
          <div className="w-full max-w-lg perspective-1000">
            <motion.div 
              className="relative aspect-[1.75/1] w-full rounded-2xl shadow-2xl overflow-hidden"
              initial={false}
              animate={{ rotateY: 0 }}
              whileHover={{ rotateY: 5, rotateX: -2 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              ref={cardRef}
              style={{ 
                background: aiDesign.colors.background,
                color: aiDesign.colors.text,
                fontFamily: aiDesign.font,
              }}
            >
              {/* Card Content Layouts */}
              <div className={`h-full w-full p-8 flex ${aiDesign.layout === 'minimal' ? 'flex-col justify-center items-center text-center' : 'flex-row'}`}>
                
                {/* Main Info */}
                <div className={`flex-1 flex flex-col justify-center ${aiDesign.layout === 'minimal' ? 'items-center' : 'items-start'}`}>
                  {cardData.logo && aiDesign.layout !== 'minimal' && (
                    <img src={cardData.logo} alt="Logo" className="w-12 h-12 object-contain mb-6" />
                  )}
                  
                  <h2 className="text-3xl font-bold tracking-tight mb-1">{cardData.name}</h2>
                  <p className="text-lg font-medium opacity-90 mb-4" style={{ color: aiDesign.colors.accent }}>{cardData.jobTitle}</p>
                  
                  {aiDesign.tagline && (
                    <p className="text-sm italic opacity-70 mb-6 max-w-[250px]">{aiDesign.tagline}</p>
                  )}

                  <div className="space-y-2 text-xs font-medium opacity-80">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3" style={{ color: aiDesign.colors.accent }} />
                      <span>{cardData.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3" style={{ color: aiDesign.colors.accent }} />
                      <span>{cardData.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-3 h-3" style={{ color: aiDesign.colors.accent }} />
                      <span>{cardData.website}</span>
                    </div>
                  </div>
                </div>

                {/* QR Code Section */}
                <div className={`flex flex-col items-center justify-center ${
                  qrPosition === 'left' ? 'order-first mr-8' : 
                  qrPosition === 'right' ? 'ml-8' : 
                  'absolute bottom-8 right-8'
                }`}>
                  <div className="bg-white p-2 rounded-xl shadow-sm">
                    <QRCodeCanvas 
                      value={getQRValue()} 
                      size={80} 
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <span className="text-[8px] mt-2 uppercase tracking-widest opacity-50 font-bold">Scan to Connect</span>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none">
                  <div className="absolute top-0 right-0 w-full h-full bg-current rounded-full translate-x-1/2 -translate-y-1/2" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-4">
            <button 
              onClick={copyContact}
              className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 shadow-sm hover:shadow-md"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Info'}
            </button>
            <button 
              className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 shadow-sm hover:shadow-md"
            >
              <Share2 className="w-4 h-4" />
              Share Card
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-200 dark:border-slate-800 text-center">
        <p className="text-slate-500 text-sm">Powered by Google Gemini AI & CardStudio</p>
      </footer>
    </div>
  );
}

// --- Helper Components ---

function Input({ label, icon, ...props }: { label: string; icon?: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 ${icon ? 'pl-10' : 'px-4'} pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
        />
      </div>
    </div>
  );
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">{label}</label>
      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none"
        />
        <span className="text-xs font-mono uppercase">{value}</span>
      </div>
    </div>
  );
}
