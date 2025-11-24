import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { X } from 'lucide-react';

const GratitudeLogList = ({ userId, onClose }) => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (!userId) return;

    const logsCollectionRef = collection(db, 'gratitude-logs');
    const q = query(logsCollectionRef, where('userId', '==', userId), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const logsArray = [];
      querySnapshot.forEach((doc) => {
        logsArray.push({ ...doc.data(), id: doc.id });
      });
      setLogs(logsArray);
    });

    return () => unsubscribe();
  }, [userId]);

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-bold mb-4 text-center text-dark-blue dark:text-ivory">Your Past Logs</h3>
      {logs.length === 0 ? (
        <p className="text-center text-sm text-dark-blue dark:text-ivory">You haven't added any gratitude logs yet. Start by writing one above!</p>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="bg-white dark:bg-dark-blue p-4 rounded-xl shadow-inner">
              <p className="text-lg font-semibold text-dark-blue dark:text-ivory">
                {log.timestamp && log.timestamp.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleString() : 'You are grateful for:'}
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-dark-blue dark:text-ivory">
                {log.things.map((thing, index) => (
                  <li key={index}>{thing}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GratitudeLogList;
