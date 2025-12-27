
import React, { useState } from 'react';
import { useStore } from '../store';

const AcademicInfo: React.FC = () => {
  const { academyInfo, updateAcademyInfo } = useStore();
  const [formData, setFormData] = useState(academyInfo);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateAcademyInfo(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
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
                    rows={3}
                    placeholder="Physical location"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Academy Logo URL</label>
                  <div className="flex gap-4 items-start">
                    <img src={formData.logoUrl} className="w-16 h-16 rounded-xl object-cover border border-gray-100 shadow-sm" alt="Preview" />
                    <input 
                      required 
                      value={formData.logoUrl} 
                      onChange={e => setFormData({...formData, logoUrl: e.target.value})} 
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
                      placeholder="https://..."
                    />
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

            <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                <i className="fa-solid fa-circle-info mr-2"></i>
                These details will appear in the header of all PDF and Excel reports.
              </div>
              <button 
                type="submit" 
                className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${isSaved ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
              >
                <i className={`fa-solid ${isSaved ? 'fa-check' : 'fa-floppy-disk'}`}></i>
                {isSaved ? 'Information Saved!' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Preview Card */}
      <div className="bg-white p-8 rounded-3xl border border-dashed border-gray-200 text-center">
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Report Header Preview</p>
        <div className="max-w-2xl mx-auto p-8 border border-gray-100 rounded-2xl shadow-sm">
           <img src={formData.logoUrl} className="w-12 h-12 mx-auto mb-4 object-cover" alt="Logo" />
           <h2 className="text-xl font-bold text-indigo-600">{formData.name}</h2>
           <p className="text-sm text-gray-500 mt-1">{formData.address}</p>
           <p className="text-xs text-gray-400 mt-2">{formData.contact} | {formData.email}</p>
        </div>
      </div>
    </div>
  );
};

export default AcademicInfo;
