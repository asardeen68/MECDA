
import React, { useState, useRef } from 'react';
import { useStore } from '../store';

const AcademicInfo: React.FC = () => {
  const { academyInfo, updateAcademyInfo } = useStore();
  const [formData, setFormData] = useState(academyInfo);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateAcademyInfo(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File is too large. Please select an image smaller than 2MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const removeLogo = () => {
    setFormData({ ...formData, logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=200&auto=format&fit=crop' });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Academic Information</h1>
        <p className="text-gray-500">Manage your institute's profile and report branding.</p>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Academy / Institute Name</label>
                  <input 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
                    placeholder="Enter full legal name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Location / Address</label>
                  <textarea 
                    required 
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
                    rows={4}
                    placeholder="Physical location"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Academy Logo</label>
                  <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                    <div className="relative group">
                      <img 
                        src={formData.logoUrl} 
                        className="w-24 h-24 rounded-2xl object-cover border border-white shadow-md bg-white" 
                        alt="Logo Preview" 
                      />
                      <button 
                        type="button"
                        onClick={removeLogo}
                        className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        title="Reset to default"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/*" 
                        className="hidden" 
                      />
                      <button 
                        type="button"
                        onClick={triggerUpload}
                        className="w-full py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <i className="fa-solid fa-cloud-arrow-up"></i>
                        Upload New Logo
                      </button>
                      <p className="text-[10px] text-gray-400 text-center">
                        PNG, JPG or SVG. Max 2MB recommended.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                    <input 
                      type="email" 
                      required 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Contact Numbers</label>
                    <input 
                      required 
                      value={formData.contact} 
                      onChange={e => setFormData({...formData, contact: e.target.value})} 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-400 flex items-center gap-2">
                <i className="fa-solid fa-circle-info text-indigo-400"></i>
                Logo and profile details are saved locally and used for branding your PDF reports.
              </div>
              <button 
                type="submit" 
                className={`w-full sm:w-auto px-10 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 shadow-lg ${isSaved ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'}`}
              >
                <i className={`fa-solid ${isSaved ? 'fa-check-double' : 'fa-floppy-disk'}`}></i>
                {isSaved ? 'Information Updated' : 'Save Academy Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Real-time Preview */}
      <div className="bg-gray-50 p-8 rounded-3xl border border-dashed border-gray-200 text-center">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Live Document Header Preview</p>
        <div className="max-w-2xl mx-auto p-8 bg-white border border-gray-100 rounded-2xl shadow-sm">
           <img src={formData.logoUrl} className="w-16 h-16 mx-auto mb-4 object-contain" alt="Branding Logo" />
           <h2 className="text-2xl font-extrabold text-indigo-900 tracking-tight">{formData.name}</h2>
           <p className="text-sm text-gray-500 mt-2 font-medium">{formData.address}</p>
           <div className="h-px w-24 bg-indigo-100 mx-auto my-4"></div>
           <p className="text-xs text-indigo-400 font-bold">{formData.contact} &bull; {formData.email}</p>
        </div>
      </div>
    </div>
  );
};

export default AcademicInfo;
