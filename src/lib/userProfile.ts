export interface UserProfile {
  name: string;
  schoolName: string;
  schoolLocation: string;
}

export const getUserProfile = (): UserProfile => {
  if (typeof window === 'undefined') return getDefaultProfile();
  const stored = localStorage.getItem('vedaai_profile');
  return stored ? JSON.parse(stored) : getDefaultProfile();
};

export const saveUserProfile = (profile: UserProfile): void => {
  localStorage.setItem('vedaai_profile', JSON.stringify(profile));
};

const getDefaultProfile = (): UserProfile => ({
  name: '',
  schoolName: '',
  schoolLocation: '',
});
