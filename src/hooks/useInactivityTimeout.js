import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * useInactivityTimeout Hook
 * Automatically logs out user after 30 minutes of inactivity
 * Tracks: mouse movement, keyboard input, clicks, touches
 * Shows warning dialog 1 minute before logout
 */
export const useInactivityTimeout = (options = {}) => {
    const navigate = useNavigate();
    const inactivityTimeoutRef = useRef(null);
    const warningTimeoutRef = useRef(null);
    const lastActivityRef = useRef(Date.now());
    const isWarningShownRef = useRef(false);

    const {
        inactivityDuration = 30 * 60 * 1000, // 30 minutes
            warningDuration = 1 * 60 * 1000, // 1 minute before logout
            onLogout = null,
            enabled = true,
    } = options;

    // Handle logout
    const handleLogout = useCallback(() => {
        console.log('[InactivityTimeout] User logged out due to inactivity');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        isWarningShownRef.current = false;

        if (onLogout) {
            onLogout();
        } else {
            navigate('/login');
        }
    }, [navigate, onLogout]);

    // Show warning before logout
    const showWarning = useCallback(() => {
        if (isWarningShownRef.current) return;
        isWarningShownRef.current = true;

        console.log('[InactivityTimeout] Showing logout warning');

        const confirmed = confirm(
            'Your session is about to expire due to inactivity. Click OK to stay logged in, or Cancel to log out.'
        );

        if (!confirmed) {
            handleLogout();
        } else {
            // Reset warning flag and activity
            isWarningShownRef.current = false;
            lastActivityRef.current = Date.now();
            resetInactivityTimer();
        }
    }, [handleLogout]);

    // Reset inactivity timer
    const resetInactivityTimer = useCallback(() => {
        if (!enabled) return;

        // Clear existing timers
        if (inactivityTimeoutRef.current) {
            clearTimeout(inactivityTimeoutRef.current);
        }
        if (warningTimeoutRef.current) {
            clearTimeout(warningTimeoutRef.current);
        }

        lastActivityRef.current = Date.now();

        // Set warning timeout
        warningTimeoutRef.current = setTimeout(() => {
            showWarning();
        }, inactivityDuration - warningDuration);

        // Set logout timeout
        inactivityTimeoutRef.current = setTimeout(() => {
            handleLogout();
        }, inactivityDuration);
    }, [enabled, inactivityDuration, warningDuration, handleLogout, showWarning]);

    // Track user activity
    const handleActivity = useCallback(() => {
        if (!enabled) return;

        const timeSinceLastActivity = Date.now() - lastActivityRef.current;

        // Only reset if more than 1 second since last activity (debounce)
        if (timeSinceLastActivity > 1000) {
            console.log('[InactivityTimeout] User activity detected, resetting timer');
            resetInactivityTimer();
        }
    }, [enabled, resetInactivityTimer]);

    // Setup activity listeners
    useEffect(() => {
        if (!enabled) return;

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

        events.forEach(event => {
            document.addEventListener(event, handleActivity);
        });

        // Start initial timer
        resetInactivityTimer();

        // Cleanup
        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleActivity);
            });

            if (inactivityTimeoutRef.current) {
                clearTimeout(inactivityTimeoutRef.current);
            }
            if (warningTimeoutRef.current) {
                clearTimeout(warningTimeoutRef.current);
            }
        };
    }, [enabled, handleActivity, resetInactivityTimer]);

    return {
        resetTimer: resetInactivityTimer,
        getTimeSinceLastActivity: () => Date.now() - lastActivityRef.current,
    };
};

export default useInactivityTimeout;