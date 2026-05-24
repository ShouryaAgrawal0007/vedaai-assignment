'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Home, Users, FileText, Wrench, FolderOpen, Settings, Bell, 
  ChevronDown, Search, SlidersHorizontal, Plus, MoreVertical, Trash2, ArrowLeft, Menu, X
} from 'lucide-react';
import { useAssignmentStore } from '../store/useAssignmentStore';
import { AssignmentForm } from '../components/assignment/AssignmentForm';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useRouter } from 'next/navigation';
import { getUserProfile, UserProfile } from '../lib/userProfile';
import { OnboardingModal } from '../components/OnboardingModal';

export default function AssignmentCreationPage() {
  const router = useRouter();
  const { 
    assignments, 
    searchQuery, 
    activeTab,
    isLoading,
    setSearchQuery,
    setActiveTab,
    setActiveAssignment,
    deleteAssignment,
    loadAssignments
  } = useAssignmentStore();

  const [profile, setProfile] = useState<UserProfile>({ name: '', schoolName: '', schoolLocation: '' });
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  useEffect(() => {
    loadAssignments();
    
    // Load onboarding profile
    const p = getUserProfile();
    setProfile(p);
    if (!p.name || !p.schoolName || !p.schoolLocation) {
      setOnboardingOpen(true);
    }
  }, [loadAssignments]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCardMenu, setActiveCardMenu] = useState<string | null>(null);

  // Filter assignments based on search & tags
  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleCardClick = (assignmentId: string) => {
    setActiveAssignment(assignmentId);
    router.push('/output');
  };

  const toggleCardMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveCardMenu(activeCardMenu === id ? null : id);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteAssignment(id);
    setActiveCardMenu(null);
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-zinc-950 flex flex-col md:flex-row relative">
      
      {/* ----------------- DESKTOP SIDEBAR (Figma Spec) ----------------- */}
      <aside className="hidden md:flex flex-col w-[260px] bg-white border-r border-[#E5E7EB] shrink-0 sticky top-0 h-screen justify-between p-5">
        <div className="flex flex-col gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-2 mt-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF5722] to-[#FF8A65] flex items-center justify-center text-white font-black shadow-md shadow-[#FF5722]/15">
              V
            </div>
            <span className="text-xl font-extrabold tracking-tight text-zinc-950">
              Veda<span className="text-[#FF5722]">AI</span>
            </span>
          </div>

          {/* Sparkly Create Button */}
          <button
            onClick={() => setActiveTab('create')}
            className={`w-full bg-[#18181B] hover:bg-[#27272A] text-white py-3.5 px-5 rounded-full font-bold text-sm transition-all duration-200 active:scale-[0.98] border border-zinc-800 shadow-[0_0_20px_rgba(255,87,34,0.15)] flex items-center justify-center gap-2
              ${activeTab === 'create' ? 'ring-2 ring-[#FF5722]/50' : ''}`}
          >
            <Sparkles className="w-4 h-4 text-[#FF5722] animate-pulse" />
            Create Assignment
          </button>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 mt-2">
            {[
              { id: 'home', label: 'Home', icon: Home },
              { id: 'groups', label: 'My Groups', icon: Users },
              { id: 'assignments', label: 'Assignments', icon: FileText, count: assignments.length },
              { id: 'toolkit', label: "AI Teacher's Toolkit", icon: Wrench },
              { id: 'library', label: 'My Library', icon: FolderOpen },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === 'assignments' && item.id === 'assignments';
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'assignments') {
                      setActiveTab('assignments');
                    }
                  }}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150
                    ${isActive 
                      ? 'bg-zinc-100 text-[#18181B] font-bold' 
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF5722]' : 'text-zinc-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.count && (
                    <span className="bg-[#FF5722] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col gap-4 border-t border-zinc-100 pt-4">
          <button className="flex items-center gap-3 px-4 py-2 text-sm font-semibold text-zinc-500 hover:text-zinc-950 transition-colors">
            <Settings className="w-4 h-4 text-zinc-400" />
            <span>Settings</span>
          </button>
          
          {/* School Client Card */}
          <div className="flex items-center justify-between gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🎓</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-zinc-950 truncate leading-tight">
                  {profile.schoolName || 'Delhi Public School'}
                </p>
                <p className="text-[10px] text-zinc-500 font-semibold truncate mt-0.5">
                  {profile.schoolLocation || 'Bokaro Steel City'}
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => {
                setIsEditingProfile(true);
                setOnboardingOpen(true);
              }}
              className="p-1 hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 rounded transition-colors flex-shrink-0"
              title="Edit Profile"
            >
              <Wrench className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ----------------- MOBILE TOP BAR (Figma Spec) ----------------- */}
      <header className="flex md:hidden items-center justify-between bg-white border-b border-[#E5E7EB] px-4 py-3 sticky top-0 z-40 shadow-sm w-full">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 hover:bg-zinc-100 text-zinc-800 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FF5722] flex items-center justify-center text-white font-black text-sm shadow-md">
              V
            </div>
            <span className="font-extrabold text-base tracking-tight text-zinc-950">
              VedaAI
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 rounded-full text-zinc-600 transition-all relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#FF5722] rounded-full" />
          </button>
          <div 
            onClick={() => {
              setIsEditingProfile(true);
              setOnboardingOpen(true);
            }}
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF5722] to-[#FF8A65] border border-orange-100 overflow-hidden flex items-center justify-center text-white font-extrabold text-xs shadow-sm cursor-pointer select-none"
            title="Edit Profile"
          >
            {(profile.name || 'T')[0].toUpperCase()}
          </div>
        </div>
      </header>

      {/* ----------------- MOBILE DRAWER MENU ----------------- */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-[#0F0F11]/60 backdrop-blur-sm z-50 flex md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="w-[280px] bg-white h-full p-5 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FF5722] flex items-center justify-center text-white font-black">V</div>
                  <span className="font-extrabold text-lg text-zinc-950">VedaAI</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-zinc-500 hover:bg-zinc-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={() => {
                  setActiveTab('create');
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-[#18181B] text-white py-3 px-5 rounded-full font-bold text-sm flex items-center justify-center gap-2 border border-zinc-800"
              >
                <Sparkles className="w-4 h-4 text-[#FF5722]" />
                Create Assignment
              </button>

              <nav className="flex flex-col gap-1">
                {[
                  { id: 'home', label: 'Home', icon: Home },
                  { id: 'groups', label: 'My Groups', icon: Users },
                  { id: 'assignments', label: 'Assignments', icon: FileText, count: assignments.length },
                  { id: 'toolkit', label: "AI Teacher's Toolkit", icon: Wrench },
                  { id: 'library', label: 'My Library', icon: FolderOpen },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === 'assignments' && item.id === 'assignments';
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === 'assignments') {
                          setActiveTab('assignments');
                        }
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150
                        ${isActive ? 'bg-zinc-100 text-zinc-950 font-bold' : 'text-zinc-600'}`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF5722]' : 'text-zinc-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.count && (
                        <span className="bg-[#FF5722] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="flex flex-col gap-4 border-t border-zinc-100 pt-4">
              <button className="flex items-center gap-3 px-4 py-2 text-sm font-semibold text-zinc-500">
                <Settings className="w-4 h-4 text-zinc-400" />
                <span>Settings</span>
              </button>
              
              <div className="flex items-center justify-between gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">🎓</div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-950 leading-tight truncate">
                      {profile.schoolName || 'Delhi Public School'}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-semibold mt-0.5 truncate">
                      {profile.schoolLocation || 'Bokaro Steel City'}
                    </p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsEditingProfile(true);
                    setOnboardingOpen(true);
                  }}
                  className="p-1 hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 rounded transition-colors flex-shrink-0"
                  title="Edit Profile"
                >
                  <Wrench className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MAIN PANEL ----------------- */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 min-w-0">
        
        {/* DESKTOP HEADER (Figma style) */}
        <header className="hidden md:flex items-center justify-between bg-white border border-[#E5E7EB] rounded-2xl px-6 py-4 mb-6 shadow-sm">
          <div className="flex items-center gap-3">
            {activeTab === 'create' && (
              <button 
                onClick={() => setActiveTab('assignments')}
                className="p-1.5 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-950 rounded-full transition-colors border border-zinc-200 shadow-sm"
                title="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="text-sm font-bold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wide">
              <span>Assignment</span>
              <span>/</span>
              <span className="text-zinc-800">
                {activeTab === 'create' ? 'Create New' : 'List View'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2.5 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 rounded-full text-zinc-600 transition-all relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#FF5722] rounded-full" />
            </button>
            
            <div className="h-6 w-px bg-zinc-200" />

            <div 
              onClick={() => {
                setIsEditingProfile(true);
                setOnboardingOpen(true);
              }}
              className="flex items-center gap-2 cursor-pointer group select-none"
              title="Edit Profile"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FF5722] to-[#FF8A65] border border-orange-200 overflow-hidden flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
                {(profile.name || 'T')[0].toUpperCase()}
              </div>
              <span className="text-sm font-bold text-zinc-800 group-hover:text-zinc-950 transition-colors">
                {profile.name || 'Teacher'}
              </span>
              <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
            </div>
          </div>
        </header>

        {/* ----------------- RENDER SUBPAGES ----------------- */}
        {activeTab === 'create' ? (
          // 1. ASSIGNMENT CREATION PAGE FORM
          <div className="animate-in fade-in duration-200">
            <div className="flex items-center gap-3 mb-6 md:hidden">
              <button 
                onClick={() => setActiveTab('assignments')}
                className="p-1.5 bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-800 rounded-full"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-xl font-black text-zinc-900">Create Assignment</h1>
            </div>
            <AssignmentForm />
          </div>
        ) : (
          // 2. ASSIGNMENT DASHBOARD LIST (Figma View)
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            
            {/* Title & Description */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-zinc-950 tracking-tight">
                  Assignments
                </h1>
                <p className="text-xs text-zinc-500 font-semibold mt-1">
                  Manage, grade, and create assessments for your classrooms.
                </p>
              </div>

              {/* Mobile quick "+ Create" floating trigger */}
              <button
                onClick={() => setActiveTab('create')}
                className="md:hidden flex items-center justify-center gap-2 bg-[#FF5722] hover:bg-[#E65100] text-white font-bold text-sm px-5 py-3 rounded-xl shadow-md transition-all duration-150"
              >
                <Plus className="w-4 h-4" /> Create Assessment
              </button>
            </div>

            {/* Filter and Search Bar row */}
            <div className="flex flex-col sm:flex-row gap-3 bg-white border border-[#E5E7EB] rounded-2xl p-3 shadow-sm">
              {/* Filter selection trigger */}
              <button className="flex items-center gap-2 px-4 py-3 bg-[#F9FAFB] border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-colors">
                <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
                <span>Filter By</span>
              </button>

              {/* Search textfield */}
              <div className="flex-1 relative flex items-center">
                <Search className="absolute left-3.5 text-zinc-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search Assignment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-zinc-200 hover:border-zinc-300 focus:border-zinc-950 text-xs font-semibold text-zinc-800 placeholder-zinc-400 rounded-xl pl-10 pr-4 py-3 focus:outline-none"
                />
              </div>
            </div>

            {/* Empty state versus Assignment Cards Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 select-none animate-in fade-in duration-150">
                {[1, 2, 3].map((n) => (
                  <Card key={n} className="bg-white border border-zinc-200 rounded-2xl flex flex-col justify-between min-h-[160px] p-6 animate-pulse">
                    <div>
                      {/* Placeholder Title */}
                      <div className="h-5 bg-zinc-250 rounded-lg w-2/3 mb-4" />
                      {/* Placeholder Badges */}
                      <div className="flex gap-2.5">
                        <div className="h-5 bg-zinc-200 rounded-full w-20" />
                        <div className="h-5 bg-zinc-200 rounded-full w-16" />
                      </div>
                    </div>
                    {/* Placeholder Footer */}
                    <div className="flex justify-between border-t border-zinc-100 pt-4 mt-6">
                      <div className="h-3 bg-zinc-150 rounded w-24" />
                      <div className="h-3 bg-zinc-150 rounded w-16" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredAssignments.length === 0 ? (
              <Card className="flex flex-col items-center text-center py-16 px-6 bg-white border border-zinc-200 rounded-3xl shadow-sm">
                <div className="relative w-36 h-36 bg-zinc-50 rounded-full flex items-center justify-center border border-zinc-100 mb-6">
                  {/* Figma-style search document illustration */}
                  <span className="text-5xl">📄</span>
                  <div className="absolute -bottom-1 -right-1 w-12 h-12 bg-red-50 border-2 border-red-100 rounded-full flex items-center justify-center text-red-600 shadow-md">
                    <X className="w-6 h-6 stroke-[3px]" />
                  </div>
                </div>

                <h3 className="text-xl font-extrabold text-zinc-950 tracking-tight">
                  No assignments yet
                </h3>
                <p className="text-xs text-zinc-500 font-semibold max-w-sm leading-relaxed mt-2.5">
                  Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.
                </p>

                <Button
                  onClick={() => setActiveTab('create')}
                  variant="primary"
                  className="mt-6"
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Create Your First Assignment
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    onClick={() => handleCardClick(assignment.id)}
                    className="cursor-pointer group text-left"
                  >
                    <Card className="relative hover:shadow-md hover:border-zinc-300 rounded-2xl flex flex-col justify-between min-h-[160px] p-6">
                      
                      {/* Top Header info */}
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <h3 className="text-lg font-extrabold text-zinc-900 group-hover:text-[#FF5722] truncate transition-colors leading-tight select-none">
                            {assignment.title}
                          </h3>
                        </div>
                        
                        {/* More vertical trigger dropdown */}
                        <div className="relative">
                          <button
                            onClick={(e) => toggleCardMenu(e, assignment.id)}
                            className="p-1.5 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 rounded-lg transition-all"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeCardMenu === assignment.id && (
                            <div className="absolute right-0 top-9 w-36 bg-white border border-zinc-200 rounded-xl shadow-lg z-10 py-1.5 animate-in fade-in slide-in-from-top-2 duration-100">
                              <button
                                onClick={() => handleCardClick(assignment.id)}
                                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors flex items-center gap-2"
                              >
                                <FileText className="w-3.5 h-3.5 text-zinc-400" /> View Assignment
                              </button>
                              <button
                                onClick={(e) => handleDelete(e, assignment.id)}
                                className="w-full text-left px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 border-t border-zinc-100"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Marks and Questions Subtitle */}
                      <div className="flex gap-2.5 mt-3 select-none">
                        <Badge variant="neutral">
                          {assignment.numQuestions} Questions
                        </Badge>
                        <Badge variant="accent">
                          {assignment.marks} Marks
                        </Badge>
                      </div>

                      {/* Footer Dates */}
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-t border-zinc-100 pt-4 mt-6 text-[10px] font-bold text-zinc-500 tracking-wide uppercase select-none">
                        <div>
                          <span className="text-zinc-400">Assigned: </span>
                          <span className="text-zinc-700 font-semibold">{assignment.assignedOn}</span>
                        </div>
                        <div className="mt-1 sm:mt-0">
                          <span className="text-zinc-400">Due: </span>
                          <span className="text-[#FF5722] font-semibold">{assignment.due}</span>
                        </div>
                      </div>

                    </Card>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* ----------------- FLOATING ACTION TRIGGER (Figma Specs) ----------------- */}
      {activeTab === 'assignments' && assignments.length > 0 && (
        <button
          onClick={() => setActiveTab('create')}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#FF5722] hover:bg-[#E65100] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 group z-30"
          title="Create New Assignment"
        >
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" />
        </button>
      )}

      {/* ----------------- MOBILE BOTTOM NAVIGATION BAR (Figma Spec) ----------------- */}
      <footer className="md:hidden flex bg-[#18181B] text-zinc-400 border-t border-zinc-800 px-4 py-2 sticky bottom-0 z-40 justify-around select-none">
        {[
          { id: 'home', label: 'Home', icon: Home },
          { id: 'assignments', label: 'Assignments', icon: FileText },
          { id: 'library', label: 'Library', icon: FolderOpen },
          { id: 'toolkit', label: 'AI Toolkit', icon: Wrench }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === 'assignments' && tab.id === 'assignments';
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'assignments') {
                  setActiveTab('assignments');
                }
              }}
              className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all duration-150
                ${isActive ? 'text-[#FF5722]' : 'hover:text-zinc-200'}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-bold tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </footer>

      <OnboardingModal
        isOpen={onboardingOpen}
        onClose={() => {
          setOnboardingOpen(false);
          setIsEditingProfile(false);
        }}
        onSave={(p) => setProfile(p)}
        isEditing={isEditingProfile}
      />
    </div>
  );
}
