import { useEffect, useRef } from 'react';

interface GoogleSignInButtonProps {
  onSuccess: (credential: string) => void;
  onError?: (error: any) => void;
  text?: 'signin' | 'signup';
  disabled?: boolean;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

const GoogleSignInButton = ({ 
  onSuccess, 
  onError, 
  text = 'signin',
  disabled = false 
}: GoogleSignInButtonProps) => {
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (window.google && buttonRef.current) {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        // Debug: Remove in production
        // console.log('Google Client ID in component:', clientId ? 'SET' : 'NOT SET');
        
        if (!clientId || clientId === 'disabled') {
          console.log('Google Sign-In is disabled in this environment.');
          return;
        }
        
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            console.log('Google Sign-In response:', response);
            if (response.credential) {
              onSuccess(response.credential);
            } else {
              console.error('No credential in response:', response);
              onError?.(new Error('No credential received'));
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          text: text === 'signin' ? 'signin_with' : 'signup_with',
          width: '100%',
          disabled: disabled,
        });
      }
    };

    // Check if Google script is already loaded
    if (window.google) {
      initializeGoogleSignIn();
    } else {
      // Wait for Google script to load
      const checkGoogleLoaded = setInterval(() => {
        if (window.google) {
          clearInterval(checkGoogleLoaded);
          initializeGoogleSignIn();
        }
      }, 100);

      // Cleanup interval after 10 seconds
      setTimeout(() => {
        clearInterval(checkGoogleLoaded);
      }, 10000);
    }
  }, [onSuccess, onError, text, disabled]);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  
  if (!clientId || clientId === 'disabled') {
    return (
      <div className="w-full p-3 border border-gray-300 rounded-lg text-center text-gray-500">
        Google Sign-In is disabled in this environment
      </div>
    );
  }

  return (
    <div className="w-full">
      <div ref={buttonRef} className="w-full flex justify-center" />
      {disabled && (
        <div className="absolute inset-0 bg-gray-100 bg-opacity-50 cursor-not-allowed rounded-lg" />
      )}
    </div>
  );
};

export default GoogleSignInButton;
