import React, { useState } from 'react';
import { checkBreakfastStatus, checkInForBreakfast, BreakfastRecord } from '../services/breakfastService';

export const BreakfastMonitor: React.FC = () => {
  const [roomInput, setRoomInput] = useState('');
  const [record, setRecord] = useState<BreakfastRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomInput.trim()) return;
    
    setLoading(true);
    setMessage('');
    try {
      const res = await checkBreakfastStatus(roomInput.trim());
      if (res) {
        setRecord(res);
      } else {
        setMessage('❌ No active booking found for this room number.');
        setRecord(null);
      }
    } catch (err) {
      setMessage('⚠️ Error retrieving database profile matrix.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCheckIn = async () => {
    if (!record) return;
    try {
      await checkInForBreakfast(record.roomNumber, record);
      setRecord({ ...record, status: 'Checked In', checkedInAt: new Date().toLocaleTimeString() });
      setMessage('✅ Guest authenticated and checked in for breakfast successfully!');
    } catch (err) {
      setMessage('❌ Failed to log entry to Cloud Firestore.');
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#131435', borderBottom: '2px solid #cfa950', paddingBottom: '8px' }}>
        🍳 CML Breakfast Monitoring Dashboard
      </h2>
      
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', margin: '20px 0' }}>
        <input 
          type="text" 
          placeholder="Enter Room Number (e.g. 104)" 
          value={roomInput}
          onChange={(e) => setRoomInput(e.target.value)}
          style={{ padding: '10px', flex: 1, borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#131435', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {loading ? 'Searching...' : 'Verify'}
        </button>
      </form>

      {message && <p style={{ fontWeight: '600', padding: '10px', borderRadius: '4px', backgroundColor: '#f0f4f8' }}>{message}</p>}

      {record && (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', backgroundColor: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#131435' }}>Room {record.roomNumber} Profile</h3>
          <p><strong>Primary Guest:</strong> {record.guestName}</p>
          <p><strong>Pax count:</strong> {record.totalGuests} Person(s)</p>
          <p><strong>Rate Plan Included:</strong> {record.packageType}</p>
          
          <div style={{ margin: '20px 0', padding: '12px', borderRadius: '6px', textAlign: 'center', fontWeight: 'bold',
            backgroundColor: record.status === 'Checked In' ? '#def7ec' : record.status === 'Eligible' ? '#e1effe' : '#fde8e8',
            color: record.status === 'Checked In' ? '#03543f' : record.status === 'Eligible' ? '#1e429f' : '#9b1c1c'
          }}>
            Status: {record.status} {record.checkedInAt ? `at ${record.checkedInAt}` : ''}
          </div>

          {record.status === 'Eligible' && (
            <button onClick={handleVerifyCheckIn} style={{ width: '100%', padding: '12px', backgroundColor: '#cfa950', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
              Confirm Breakfast Entry
            </button>
          )}
        </div>
      )}
    </div>
  );
};