(() => {
  "use strict";

  const element_name = "mien-demo-banner";
  const embed_script = document.currentScript;

  if (!customElements.get(element_name)) {
    class MienDemoBanner extends HTMLElement {
      connectedCallback() {
        if (this.shadowRoot) return;

        const shadow_root = this.attachShadow({ mode: "open" });

        shadow_root.innerHTML = `
          <style>
            :host {
              --color-banner: #f3f4f6;
              --color-text: #292b30;
              --color-secondary-text: #3e4147;
              --color-border: #292b30;
              --color-link: #00459e;
              --color-link-hover: #002d68;
              --color-focus: #006ee6;
              --color-logo: #1a1a1a;
              --font-interface: Arial, Helvetica, sans-serif;
              color: var(--color-text);
              display: block;
              font-family: var(--font-interface);
              width: 100%;
            }

            *,
            *::before,
            *::after {
              box-sizing: border-box;
            }

            .demo_banner {
              background: var(--color-banner);
              border-top: 2px solid var(--color-border);
              overflow-x: hidden;
            }

            .demo_banner__details {
              margin: 0;
            }

            .demo_banner__summary {
              align-items: center;
              cursor: pointer;
              display: flex;
              gap: 8px;
              min-height: 30px;
              padding: 4px max(16px, env(safe-area-inset-right)) 4px max(16px, env(safe-area-inset-left));
              touch-action: manipulation;
            }

            .demo_banner__summary::-webkit-details-marker {
              display: none;
            }

            .demo_banner__summary::marker {
              content: "";
            }

            .demo_banner__summary:hover .demo_banner__action {
              color: var(--color-link-hover);
            }

            .demo_banner__summary:focus-visible {
              outline: 3px solid var(--color-focus);
              outline-offset: -3px;
            }

            .demo_banner__mark {
              color: var(--color-logo);
              flex: 0 0 auto;
              height: 16px;
              width: 16px;
            }

            .demo_banner__intro {
              font-size: 13px;
              line-height: 20px;
            }

            .demo_banner__action {
              color: var(--color-link);
              margin-left: 2px;
              text-decoration: underline;
              text-underline-offset: 2px;
            }

            .demo_banner__chevron {
              border-color: currentColor;
              border-style: solid;
              border-width: 0 1.5px 1.5px 0;
              display: inline-block;
              height: 6px;
              margin: 0 0 2px 4px;
              transform: rotate(45deg);
              transform-origin: center;
              transition: transform 160ms ease;
              width: 6px;
            }

            .demo_banner__details[open] .demo_banner__chevron {
              margin-bottom: -1px;
              transform: rotate(225deg);
            }

            .demo_banner__content {
              display: grid;
              gap: 48px;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              padding: 36px max(16px, env(safe-area-inset-right)) 44px max(16px, env(safe-area-inset-left));
            }

            .demo_banner__notice {
              align-items: flex-start;
              display: flex;
              gap: 14px;
              min-width: 0;
            }

            .demo_banner__icon {
              color: var(--color-text);
              flex: 0 0 auto;
              height: 20px;
              margin-top: 3px;
              width: 20px;
            }

            .demo_banner__copy {
              min-width: 0;
            }

            .demo_banner__heading {
              display: block;
              font-size: 16px;
              font-weight: 700;
              line-height: 24px;
              margin: 0 0 7px;
              text-wrap: balance;
            }

            .demo_banner__description {
              color: var(--color-secondary-text);
              font-size: 16px;
              line-height: 24px;
              margin: 0;
              max-width: 49ch;
              overflow-wrap: anywhere;
            }

            @media (max-width: 960px) {
              .demo_banner__content {
                gap: 30px 40px;
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }
            }

            @media (max-width: 720px) {
              .demo_banner__summary {
                align-items: flex-start;
                padding-block: 8px;
              }

              .demo_banner__mark {
                margin-top: 2px;
              }

              .demo_banner__content {
                gap: 26px;
                grid-template-columns: 1fr;
                padding-block: 24px 30px;
              }

              .demo_banner__heading,
              .demo_banner__description {
                font-size: 15px;
                line-height: 22px;
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .demo_banner__chevron {
                transition: none;
              }
            }
          </style>

          <aside class="demo_banner" aria-label="Demonstration website notice">
            <details class="demo_banner__details" open>
              <summary class="demo_banner__summary">
                <svg class="demo_banner__mark" viewBox="0 0 788 788" width="16" height="16" aria-hidden="true" focusable="false">
                  <path fill="currentColor" d="M368.074 377.676c-12.516 9.039-28.87 13.018-45.938 8.688L42.9689 315.526c-41.35535-10.495-55.8437-61.822-26.079-92.391l96.8351-99.45zM217.82 16.7872c29.767-30.5664 81.461-17.446259 93.052 23.6161l78.237 277.1747c4.497 15.934 1.64 31.436-5.949 43.833L129.19 107.798zM380.164 423.658c7.251 11.951 10.109 26.791 6.198 42.209L315.53 745.034c-10.495 41.356-61.828 55.845-92.397 26.079l-96.663-94.124zm-62.583-24.764c17.574-4.96 34.622-.977 47.557 8.439L110.589 661.519l-93.7989-91.336c-30.5686-29.767-17.452434-81.461 23.6108-93.052zm453.63-181.075c30.567 29.767 17.451 81.461-23.611 93.052l-277.18 78.237c-17.594 4.966-34.66.968-47.6-8.471l254.549-254.191zm-298.74-174.85c10.495-41.3555 61.823-55.8429 92.392-26.079l96.624 94.086-253.677 253.32c-7.23-11.943-10.077-26.763-6.171-42.161zm189.324 634.15-91.612 94.091c-29.767 30.569-81.466 17.452-93.057-23.611l-78.237-277.18c-4.95-17.533-.996-34.546 8.373-47.47zm-238.24-269.228c11.968-7.295 26.851-10.175 42.312-6.252l279.161 70.832c41.357 10.494 55.845 61.822 26.079 92.391l-93.847 96.376z"/>
                </svg>
                <span class="demo_banner__intro">
                  A demonstration website brought to you by Anthony @ Mien.
                  <span class="demo_banner__action">How to identify<span class="demo_banner__chevron" aria-hidden="true"></span></span>
                </span>
              </summary>

              <div class="demo_banner__content">
                <section class="demo_banner__notice" aria-labelledby="demo-domain-heading">
                  <svg class="demo_banner__icon" viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" focusable="false">
                    <path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M13 1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2zm-.293 3.293a1 1 0 0 0-1.414 0L6 9.586L4.707 8.293a1 1 0 1 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l6-6a1 1 0 0 0 0-1.414"/>
                  </svg>
                  <div class="demo_banner__copy">
                    <strong class="demo_banner__heading" id="demo-domain-heading">Demonstration website links start with <span translate="no">demo.mien.works</span></strong>
                    <p class="demo_banner__description">Check that the web address starts with <strong translate="no">demo.mien.works</strong> to confirm you’re viewing a Mien demo.</p>
                  </div>
                </section>

                <section class="demo_banner__notice" aria-labelledby="demo-security-heading">
                  <svg class="demo_banner__icon" viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" focusable="false">
                    <path fill="currentColor" d="M8 1a4 4 0 0 1 4 4v2l.204.01A2 2 0 0 1 14 9v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2V5a4 4 0 0 1 4-4m0 8a1 1 0 0 0-1 1v2a1 1 0 1 0 2 0v-2a1 1 0 0 0-1-1m0-6a2 2 0 0 0-2 2v2h4V5a2 2 0 0 0-2-2"/>
                  </svg>
                  <div class="demo_banner__copy">
                    <strong class="demo_banner__heading" id="demo-security-heading">Check for a secure connection</strong>
                    <p class="demo_banner__description">Look for a lock in your browser or <strong translate="no">https://</strong> in the web address to confirm the page is securely delivered.</p>
                  </div>
                </section>

                <section class="demo_banner__notice" aria-labelledby="demo-affiliation-heading">
                  <svg class="demo_banner__icon" viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" focusable="false">
                    <path fill="currentColor" d="M13 1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2zm-.793 2.793a1 1 0 0 0-1.414 0L8 6.586L5.207 3.793a1 1 0 1 0-1.414 1.414L6.586 8l-2.793 2.793a1 1 0 1 0 1.414 1.414L8 9.414l2.793 2.793a1 1 0 1 0 1.414-1.414L9.414 8l2.793-2.793a1 1 0 0 0 0-1.414"/>
                  </svg>
                  <div class="demo_banner__copy">
                    <strong class="demo_banner__heading" id="demo-affiliation-heading">We never claim to be official websites for unaffiliated agencies</strong>
                    <p class="demo_banner__description">A Mien demo is never presented as an official website for an agency we are not affiliated with.</p>
                  </div>
                </section>
              </div>
            </details>
          </aside>
        `;
      }
    }

    customElements.define(element_name, MienDemoBanner);
  }

  const mount_banner = () => {
    if (document.querySelector(element_name)) return;

    const banner_element = document.createElement(element_name);
    const script_parent = embed_script?.parentElement;

    if (script_parent && script_parent !== document.head) {
      embed_script.before(banner_element);
      return;
    }

    document.body.prepend(banner_element);
  };

  if (document.body) {
    mount_banner();
    return;
  }

  document.addEventListener("DOMContentLoaded", mount_banner, { once: true });
})();
