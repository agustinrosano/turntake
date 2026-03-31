/**
 * Time Utilities for Appointment Management
 */

/**
 * Converts a time string "HH:mm" to total minutes since start of day
 * @param {string} timeStr - Example: "13:30"
 * @returns {number} - Example: 810
 */
export const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Converts total minutes since start of day to "HH:mm" format
 * @param {number} totalMinutes
 * @returns {string} - Example: "13:30"
 */
export const formatMinutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Checks if two time ranges overlap, including a buffer.
 * Overlap formula: (Start1 < End2) AND (Start2 < End1)
 * 
 * @param {number} start1 - Start of first range in minutes
 * @param {number} duration1 - Duration of first range in minutes
 * @param {number} start2 - Start of second range in minutes
 * @param {number} duration2 - Duration of second range in minutes
 * @param {number} buffer - Buffer time in minutes (default 5)
export const isOverlapping = (start1, duration1, start2, duration2, buffer = 0) => {
  const end1 = start1 + duration1 + buffer;
  const end2 = start2 + duration2 + buffer;
  
  // We subtract buffer from actual start if we want to be symmetric, 
  // but usually buffer is at the end of each service.
  // Actually, if we have A (13:00-14:00 + 5) and B (14:00-15:00 + 5)
  // End A = 14:05. Start B = 14:00. This overlaps!
  // So B would have to start at 14:05.
  
  return start1 < end2 && start2 < end1;
};

/**
 * Checks if a proposed slot overlaps with any existing appointments
 * @param {string} proposedTime - "HH:mm"
 * @param {number} proposedDuration - in minutes
 * @param {Array} existingAppointments - Array of {time: "HH:mm", duration: number}
 * @param {number} buffer - in minutes
 * @returns {boolean}
 */
export const isSlotOccupied = (proposedTime, proposedDuration, existingAppointments, buffer = 0) => {
  const proposedStart = parseTimeToMinutes(proposedTime);
  
  return existingAppointments.some(appt => {
    const existingStart = parseTimeToMinutes(appt.time);
    const existingDuration = Number(appt.duration || 30);
    
    return isOverlapping(proposedStart, proposedDuration, existingStart, existingDuration, buffer);
  });
};
