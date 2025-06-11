declare namespace google {
  namespace accounts {
    namespace id {
      interface IdConfiguration {
        client_id: string;
        callback: (response: CredentialResponse) => void;
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
        context?: 'signin' | 'signup' | 'use';
        use_fedcm_for_prompt?: boolean;
        itp_support?: boolean;
      }

      interface CredentialResponse {
        credential: string;
        select_by?: string;
      }

      interface GsiButtonConfiguration {
        type?: 'standard' | 'icon';
        theme?: 'outline' | 'filled_blue' | 'filled_black';
        size?: 'large' | 'medium' | 'small';
        text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
        shape?: 'rectangular' | 'pill' | 'circle' | 'square';
        logo_alignment?: 'left' | 'center';
        width?: string | number;
        locale?: string;
      }

      function initialize(input: IdConfiguration): void;
      function prompt(
        momentListener?: (res: PromptMomentNotification) => void
      ): void;
      function renderButton(
        parent: HTMLElement,
        options: GsiButtonConfiguration
      ): void;
      function disableAutoSelect(): void;
      function storeCredential(credential: {
        id: string;
        password: string;
      }): void;
      function cancel(): void;
      function onGoogleLibraryLoad(): void;
      function revoke(
        hint: string,
        callback: (done: RevocationResponse) => void
      ): void;
    }
  }

  interface PromptMomentNotification {
    isDisplayMoment(): boolean;
    isDisplayed(): boolean;
    isNotDisplayed(): boolean;
    getNotDisplayedReason():
      | 'browser_not_supported'
      | 'invalid_client'
      | 'missing_client_id'
      | 'opt_out_or_no_session'
      | 'secure_http_required'
      | 'suppressed_by_user'
      | 'unregistered_origin'
      | 'unknown_reason';
    isSkippedMoment(): boolean;
    getSkippedReason():
      | 'auto_cancel'
      | 'user_cancel'
      | 'tap_outside'
      | 'issuing_failed';
    isDismissedMoment(): boolean;
    getDismissedReason():
      | 'credential_returned'
      | 'cancel_called'
      | 'flow_restarted';
    getMomentType(): 'display' | 'skipped' | 'dismissed';
  }

  interface RevocationResponse {
    successful: boolean;
    error?: string;
  }
}
