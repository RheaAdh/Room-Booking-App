// Date utility functions to handle timezone issues

/**
 * Converts a Date object to a local date string in YYYY-MM-DD format
 * This prevents timezone issues when sending dates to the backend
 */
export const toLocalDateString = (date) => {
  if (!date) return '';
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return '';
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Converts a Date object to a local datetime string in YYYY-MM-DDTHH:mm:ss format
 * This prevents timezone issues when sending datetime to the backend
 */
export const toLocalDateTimeString = (date) => {
  if (!date) return null;
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return null;
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

/**
 * Creates a Date object from a date string (YYYY-MM-DD) in local timezone
 * This prevents timezone conversion issues when parsing dates from the backend
 */
export const fromLocalDateString = (dateString) => {
  if (!dateString) return null;
  
  // Split the date string and create a Date object in local timezone
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Creates a Date object from a datetime string in local timezone
 * This prevents timezone conversion issues when parsing datetimes from the backend
 */
export const fromLocalDateTimeString = (dateTimeString) => {
  if (!dateTimeString) return null;
  
  // Handle both date and datetime strings
  if (dateTimeString.includes('T')) {
    const [datePart, timePart] = dateTimeString.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [time, timezone] = timePart.split(/[+-Z]/);
    const [hours, minutes, seconds] = time.split(':').map(Number);
    
    return new Date(year, month - 1, day, hours, minutes, seconds || 0);
  } else {
    return fromLocalDateString(dateTimeString);
  }
};

/**
 * Formats a date for display in a readable format
 */
export const formatDateForDisplay = (date) => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  return dateObj.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Formats a datetime for display in a readable format
 */
export const formatDateTimeForDisplay = (date) => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  return dateObj.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Gets today's date in YYYY-MM-DD format
 */
export const getTodayDateString = () => {
  return toLocalDateString(new Date());
};

/**
 * Gets tomorrow's date in YYYY-MM-DD format
 */
export const getTomorrowDateString = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return toLocalDateString(tomorrow);
};
