export const getDeviceId = (): string => {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem('vedaai_device_id');
  if (!id) {
    id = 'device_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    localStorage.setItem('vedaai_device_id', id);
  }
  return id;
};
