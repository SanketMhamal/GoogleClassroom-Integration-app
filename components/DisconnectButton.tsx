'use client';
import { useState } from "react";
import { signOut } from "next-auth/react";

export function DisconnectButton() {
    const [loading, setLoading] = useState(false);

    const handleDisconnect = async () => {
        if (!confirm("This will reset your Google connection. You will need to sign in again. Continue?")) return;

        setLoading(true);
        try {
            const res = await fetch('/api/auth/disconnect', { method: 'POST' });
            if (res.ok) {
                // Sign out locally to clear session cookies
                await signOut({ callbackUrl: '/' });
            } else {
                alert("Failed to reset connection.");
            }
        } catch (e) {
            alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleDisconnect}
            disabled={loading}
            className="text-red-600 hover:text-red-800 text-sm font-medium underline"
        >
            {loading ? "Resetting..." : "Reset Connection"}
        </button>
    );
}
