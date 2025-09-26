// Utility functions for stock taking app

// Format quantity level as percentage
export const formatQuantityLevel = (level) => {
  if (level === null || level === undefined) return 'Not set';
  return `${Math.round(level * 100)}%`;
};

// Format quantity level as descriptive text
export const getQuantityDescription = (level) => {
  if (level === null || level === undefined) return 'Not counted';
  if (level === 0) return 'Empty';
  if (level < 0.25) return 'Nearly empty';
  if (level < 0.5) return 'Quarter full';
  if (level < 0.75) return 'Half full';
  if (level < 1) return 'Three-quarters full';
  return 'Full';
};

// Generate UUID for frontend operations
export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Format date for display
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Calculate completion percentage
export const calculateProgress = (completed, total) => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};