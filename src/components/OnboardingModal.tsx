import React, { useState, useEffect } from 'react';
import { UserProfile, getUserProfile, saveUserProfile } from '../lib/userProfile';
import { Sparkles, X } from 'lucide-react';
import { Button } from './ui/Button';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: UserProfile) => void;
  isEditing?: boolean;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isEditing = false,
}) => {
  const [name, setName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [schoolLocation, setSchoolLocation] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const profile = getUserProfile();
      setName(profile.name);
      setSchoolName(profile.schoolName);
      setSchoolLocation(profile.schoolLocation);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !schoolName.trim() || !schoolLocation.trim()) {
      setError('All fields are required.');
      return;
    }

    const newProfile: UserProfile = {
      name: name.trim(),
      schoolName: schoolName.trim(),
      schoolLocation: schoolLocation.trim(),
    };

    saveUserProfile(newProfile);
    onSave(newProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#0F0F11]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white border border-zinc-200 rounded-[2rem] p-8 shadow-xl flex flex-col gap-6 relative select-none animate-in zoom-in-95 duration-200">
        
        {isEditing && (
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 rounded-full transition-colors border border-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex flex-col gap-2 text-center items-center">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF5722] shadow-sm mb-1">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-xl font-extrabold text-zinc-950 tracking-tight">
            {isEditing ? 'Edit Profile' : 'Welcome to VedaAI'}
          </h2>
          <p className="text-xs text-zinc-500 font-semibold max-w-[280px]">
            {isEditing 
              ? 'Update your professional profile and school settings.' 
              : 'Let’s personalize your experience. Please set up your profile.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Teacher Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full bg-[#F9FAFB] border border-zinc-200 hover:border-zinc-300 focus:border-zinc-950 text-xs font-semibold text-zinc-800 placeholder-zinc-400 rounded-xl px-4 py-3 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              School Name
            </label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="e.g. Delhi Public School"
              className="w-full bg-[#F9FAFB] border border-zinc-200 hover:border-zinc-300 focus:border-zinc-950 text-xs font-semibold text-zinc-800 placeholder-zinc-400 rounded-xl px-4 py-3 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              School Location
            </label>
            <input
              type="text"
              value={schoolLocation}
              onChange={(e) => setSchoolLocation(e.target.value)}
              placeholder="e.g. Bokaro Steel City"
              className="w-full bg-[#F9FAFB] border border-zinc-200 hover:border-zinc-300 focus:border-zinc-950 text-xs font-semibold text-zinc-800 placeholder-zinc-400 rounded-xl px-4 py-3 focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-red-500 mt-1 text-center">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full mt-2">
            {isEditing ? 'Save Changes' : 'Get Started'}
          </Button>
        </form>
      </div>
    </div>
  );
};
