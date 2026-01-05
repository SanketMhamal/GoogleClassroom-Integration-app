'use client';
import { useState } from "react";

export function SyncButton() {
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert("Success! Check your database.");
        // Optional: Refresh the page to show new data
        window.location.reload(); 
      } else {
        alert("Error: " + data.error);
      }
    } catch (e) {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleSync}
      disabled={loading}
      className={`px-6 py-3 rounded-lg font-medium text-white transition-all
        ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          Syncing...
        </span>
      ) : (
        "Sync Classrooms & Forms"
      )}
    </button>
  );
}