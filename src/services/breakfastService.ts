import { db } from './firebase'; // Ensure your firebase initialization file path is correct
import { doc, getDoc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';

export interface BreakfastRecord {
  roomNumber: string;
  guestName: string;
  totalGuests: number;
  packageType: string; // e.g., "Bed & Breakfast", "Room Only"
  status: 'Eligible' | 'Not Included' | 'Checked In';
  checkedInAt?: string;
}

// Check room eligibility for the current date
export const checkBreakfastStatus = async (roomNumber: string): Promise<BreakfastRecord | null> => {
  const today = new Date().toISOString().split('T')[0];
  const logRef = doc(db, 'breakfast_logs', `${today}_Room_${roomNumber}`);
  const logSnap = await getDoc(logRef);

  if (logSnap.exists()) {
    return logSnap.data() as BreakfastRecord;
  }

  // Fallback check to look up master booking status from standard room collection
  const roomRef = doc(db, 'rooms', roomNumber);
  const roomSnap = await getDoc(roomRef);

  if (roomSnap.exists()) {
    const data = roomSnap.data();
    return {
      roomNumber,
      guestName: data.currentGuestName || 'Unknown Guest',
      totalGuests: data.occupantsCount || 1,
      packageType: data.ratePlanCode?.includes('BB') ? 'Bed & Breakfast' : 'Room Only',
      status: data.ratePlanCode?.includes('BB') ? 'Eligible' : 'Not Included'
    };
  }

  return null;
};

// Complete breakfast validation log entry
export const checkInForBreakfast = async (roomNumber: string, record: BreakfastRecord) => {
  const today = new Date().toISOString().split('T')[0];
  const logRef = doc(db, 'breakfast_logs', `${today}_Room_${roomNumber}`);

  await setDoc(logRef, {
    ...record,
    status: 'Checked In',
    checkedInAt: new Date().toLocaleTimeString()
  }, { merge: true });
};