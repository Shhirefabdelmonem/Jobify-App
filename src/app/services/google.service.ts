import { Injectable } from '@angular/core';
import { environment } from '../env/env.developmnet';

declare global {
  interface Window {
    google: any;
  }
}

@Injectable({
  providedIn: 'root',
})
export class GoogleService {
  private googleScriptLoaded = false;
  private googleInitialized = false;

  constructor() {
    this.loadGoogleScript();
  }

  private loadGoogleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.googleScriptLoaded) {
        resolve();
        return;
      }

      if (!document.getElementById('google-signin-script')) {
        const script = document.createElement('script');
        script.id = 'google-signin-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          this.googleScriptLoaded = true;
          this.initializeGoogleSignIn().then(resolve).catch(reject);
        };
        script.onerror = () => {
          reject(new Error('Failed to load Google Sign-In script'));
        };
        document.head.appendChild(script);
      } else {
        this.googleScriptLoaded = true;
        this.initializeGoogleSignIn().then(resolve).catch(reject);
      }
    });
  }

  private async initializeGoogleSignIn(): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkGoogle = () => {
        if (
          typeof window.google !== 'undefined' &&
          window.google.accounts?.id
        ) {
          try {
            // Initialize Google Identity Services with proper configuration
            window.google.accounts.id.initialize({
              client_id: environment.google.clientId,
              callback: () => {}, // We'll handle this in signInWithPopup
              auto_select: false,
              cancel_on_tap_outside: true,
              // Ensure we get a proper ID token
              use_fedcm_for_prompt: false,
              itp_support: true,
            });
            this.googleInitialized = true;
            resolve();
          } catch (error) {
            reject(error);
          }
        } else {
          setTimeout(checkGoogle, 100);
        }
      };

      checkGoogle();

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!this.googleInitialized) {
          reject(new Error('Google Sign-In initialization timeout'));
        }
      }, 10000);
    });
  }

  async signInWithPopup(): Promise<any> {
    await this.loadGoogleScript();

    return new Promise((resolve, reject) => {
      if (!this.googleInitialized) {
        reject(new Error('Google Sign-In not initialized'));
        return;
      }

      try {
        // Create a temporary callback element for popup
        const tempDiv = document.createElement('div');
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);

        // Set up the callback to handle the credential response
        window.google.accounts.id.initialize({
          client_id: environment.google.clientId,
          callback: async (response: any) => {
            try {
              // Clean up the temporary element
              if (document.body.contains(tempDiv)) {
                document.body.removeChild(tempDiv);
              }

              console.log('Google callback response:', {
                hasCredential: !!response.credential,
                responseKeys: Object.keys(response),
              });

              if (response.credential) {
                const userInfo = await this.parseCredentialResponse(
                  response.credential
                );
                resolve(userInfo);
              } else {
                reject(new Error('No credential received from Google'));
              }
            } catch (error) {
              // Clean up on error
              if (document.body.contains(tempDiv)) {
                document.body.removeChild(tempDiv);
              }
              reject(error);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          // Ensure we get a proper ID token for backend validation
          use_fedcm_for_prompt: false,
          itp_support: true,
        });

        // Render the Google Sign-In button
        window.google.accounts.id.renderButton(tempDiv, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          text: 'signin_with',
          shape: 'rectangular',
        });

        // Programmatically click the button to trigger the sign-in flow
        setTimeout(() => {
          const button = tempDiv.querySelector(
            'div[role="button"]'
          ) as HTMLElement;
          if (button) {
            button.click();
          } else {
            // Fallback: try using prompt() method
            window.google.accounts.id.prompt((notification: any) => {
              if (
                notification.isNotDisplayed() ||
                notification.isSkippedMoment()
              ) {
                // Clean up and reject if prompt fails
                if (document.body.contains(tempDiv)) {
                  document.body.removeChild(tempDiv);
                }
                reject(
                  new Error('Google Sign-In prompt was blocked or dismissed')
                );
              }
            });
          }
        }, 100);

        // Timeout after 30 seconds
        setTimeout(() => {
          if (document.body.contains(tempDiv)) {
            document.body.removeChild(tempDiv);
            reject(new Error('Google Sign-In timeout'));
          }
        }, 30000);
      } catch (error) {
        reject(error);
      }
    });
  }

  private async parseCredentialResponse(credential: string): Promise<any> {
    try {
      console.log('Parsing Google credential:', {
        length: credential.length,
        parts: credential.split('.').length,
        preview: credential.substring(0, 100) + '...',
      });

      // Validate that this is a proper JWT format
      const parts = credential.split('.');
      if (parts.length !== 3) {
        throw new Error(
          `Invalid JWT format: expected 3 parts, got ${parts.length}`
        );
      }

      // The credential is a JWT token, we need to decode it to get user info
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );

      const payload = JSON.parse(jsonPayload);
      console.log('Decoded Google JWT payload:', {
        iss: payload.iss,
        aud: payload.aud,
        sub: payload.sub,
        email: payload.email,
        email_verified: payload.email_verified,
        exp: payload.exp,
        iat: payload.iat,
      });

      // Validate that this is actually from Google
      if (
        payload.iss !== 'https://accounts.google.com' &&
        payload.iss !== 'accounts.google.com'
      ) {
        throw new Error(`Invalid token issuer: ${payload.iss}`);
      }

      // Validate audience matches our client ID
      if (payload.aud !== environment.google.clientId) {
        console.warn('Token audience mismatch:', {
          expected: environment.google.clientId,
          received: payload.aud,
        });
      }

      return {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        id: payload.sub,
        credential: credential, // This is the actual Google ID token
      };
    } catch (error) {
      console.error('Error parsing credential:', error);
      throw new Error('Failed to parse Google credential');
    }
  }

  // Validate Google JWT token before sending to backend
  private validateGoogleJWT(credential: string): boolean {
    try {
      const parts = credential.split('.');
      if (parts.length !== 3) {
        console.error(
          'Invalid JWT format: expected 3 parts, got',
          parts.length
        );
        return false;
      }

      // Decode header
      const headerBase64 = parts[0].replace(/-/g, '+').replace(/_/g, '/');
      const header = JSON.parse(atob(headerBase64));
      console.log('JWT Header:', header);

      // Decode payload
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(
        decodeURIComponent(
          atob(payloadBase64)
            .split('')
            .map(function (c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join('')
        )
      );

      console.log('JWT Payload validation:', {
        iss: payload.iss,
        aud: payload.aud,
        expectedAud: environment.google.clientId,
        audienceMatches: payload.aud === environment.google.clientId,
        sub: payload.sub,
        email: payload.email,
        exp: payload.exp,
        iat: payload.iat,
        currentTime: Math.floor(Date.now() / 1000),
        isExpired: payload.exp < Math.floor(Date.now() / 1000),
        issuerValid:
          payload.iss === 'https://accounts.google.com' ||
          payload.iss === 'accounts.google.com',
      });

      // Validate issuer
      if (
        payload.iss !== 'https://accounts.google.com' &&
        payload.iss !== 'accounts.google.com'
      ) {
        console.error('Invalid issuer:', payload.iss);
        return false;
      }

      // Validate audience
      if (payload.aud !== environment.google.clientId) {
        console.error(
          'Audience mismatch. Expected:',
          environment.google.clientId,
          'Got:',
          payload.aud
        );
        return false;
      }

      // Check if token is expired
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        console.error(
          'Token is expired. Exp:',
          payload.exp,
          'Current:',
          Math.floor(Date.now() / 1000)
        );
        return false;
      }

      console.log('✅ JWT validation passed');
      return true;
    } catch (error) {
      console.error('JWT validation error:', error);
      return false;
    }
  }

  // Return the actual Google ID token for backend validation
  createIdToken(userInfo: any): string {
    console.log('Creating ID token from userInfo:', {
      hasCredential: !!userInfo.credential,
      credentialLength: userInfo.credential ? userInfo.credential.length : 0,
    });

    // Always return the original Google credential - this is what the backend expects
    if (userInfo.credential) {
      // Validate the token before returning it
      const isValid = this.validateGoogleJWT(userInfo.credential);
      if (!isValid) {
        throw new Error('Google JWT token validation failed');
      }
      return userInfo.credential;
    }

    // If for some reason there's no credential, throw an error
    throw new Error('No valid Google credential available');
  }

  // Test method to verify Google API setup
  async testGoogleApiSetup(): Promise<any> {
    try {
      await this.loadGoogleScript();

      return {
        scriptLoaded: this.googleScriptLoaded,
        googleInitialized: this.googleInitialized,
        googleAvailable: typeof window.google !== 'undefined',
        accountsIdAvailable: !!window.google?.accounts?.id,
        clientId: environment.google.clientId,
        currentOrigin: window.location.origin,
      };
    } catch (error) {
      console.error('Google API setup test failed:', error);
      throw error;
    }
  }

  // Debug method to extract full JWT payload for backend troubleshooting
  debugJWTToken(credential: string): any {
    try {
      const parts = credential.split('.');
      if (parts.length !== 3) {
        return { error: 'Invalid JWT format' };
      }

      // Decode header
      const header = JSON.parse(
        atob(parts[0].replace(/-/g, '+').replace(/_/g, '/'))
      );

      // Decode payload
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(
        decodeURIComponent(
          atob(payloadBase64)
            .split('')
            .map(function (c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join('')
        )
      );

      const currentTime = Math.floor(Date.now() / 1000);

      return {
        header: header,
        payload: {
          // Standard claims
          iss: payload.iss, // Issuer
          aud: payload.aud, // Audience (should match client ID)
          sub: payload.sub, // Subject (Google user ID)
          exp: payload.exp, // Expiration time
          iat: payload.iat, // Issued at

          // Google-specific claims
          email: payload.email,
          email_verified: payload.email_verified,
          name: payload.name,
          picture: payload.picture,
          given_name: payload.given_name,
          family_name: payload.family_name,
          locale: payload.locale,

          // Additional claims that might be present
          azp: payload.azp, // Authorized party
          nonce: payload.nonce,
          hd: payload.hd, // Hosted domain (for Google Workspace accounts)

          // All other claims
          ...payload,
        },
        validation: {
          isExpired: payload.exp < currentTime,
          timeUntilExpiry: payload.exp - currentTime,
          issuerValid:
            payload.iss === 'https://accounts.google.com' ||
            payload.iss === 'accounts.google.com',
          audienceMatches: payload.aud === environment.google.clientId,
          emailVerified: payload.email_verified === true,
          currentTime: currentTime,
        },
        rawToken: {
          fullToken: credential,
          tokenLength: credential.length,
          parts: parts.length,
        },
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }
}
