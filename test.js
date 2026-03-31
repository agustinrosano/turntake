const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const formatMinutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const isOverlapping = (start1, duration1, start2, duration2, buffer = 5) => {
  const end1 = start1 + duration1 + buffer;
  const end2 = start2 + duration2 + buffer;
  
  return start1 < end2 && start2 < end1;
};

const isSlotOccupied = (proposedTime, proposedDuration, existingAppointments, buffer = 5) => {
  const proposedStart = parseTimeToMinutes(proposedTime);
  
  return existingAppointments.some(appt => {
    const existingStart = parseTimeToMinutes(appt.time);
    const existingDuration = Number(appt.duration || 30);
    
    return isOverlapping(proposedStart, proposedDuration, existingStart, existingDuration, buffer);
  });
};

const appts = [];
console.log('Appts empty:', isSlotOccupied('09:00', 30, appts));

const appts2 = [{time: '10:00', duration: 30}];
console.log('09:00 (30m) vs 10:00 (30m):', isSlotOccupied('09:00', 30, appts2));
console.log('09:00 (60m) vs 10:00 (30m):', isSlotOccupied('09:00', 60, appts2));
console.log('09:30 (30m) vs 10:00 (30m):', isSlotOccupied('09:30', 30, appts2));
console.log('10:00 (30m) vs 10:00 (30m):', isSlotOccupied('10:00', 30, appts2));
console.log('10:30 (30m) vs 10:00 (30m):', isSlotOccupied('10:30', 30, appts2));
