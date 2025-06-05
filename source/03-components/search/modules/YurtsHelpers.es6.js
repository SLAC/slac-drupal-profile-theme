/*
 * Helpers for initializing and customizing the Yurts Search Widget
 */

class YurtsHelpers {
  /**
   * @constructor
   * @param {HTMLElement} yurtsDiv - The div where yurts search is contained
   */
  constructor(yurtsDiv) {
    this.searchButtonEventListenerAdded = null;
    this.yurtsDiv = yurtsDiv;
    this.init();
  }

  init() {
    // Remove ID from any existing yurtsDivs
    const existingYurtsDiv = document.querySelector('#YurtsSearch');
    if (existingYurtsDiv) {
      existingYurtsDiv.removeAttribute('id');
    }
    if (this.yurtsDiv) {
      this.yurtsDiv.id = 'YurtsSearch';
      try {
        // eslint-disable-next-line no-undef
        Yurts().searchWidget({
          settings: {
            assistantId: '16f03000-d92d-48a0-849c-5bf30f658048',
            NEXT_PUBLIC_API: 'https://api-yurts.slac.stanford.edu/',
            NEXT_PUBLIC_APPLICATION_URL: 'https://yurts.slac.stanford.edu',
            AUTH_URL: 'https://auth-yurts.slac.stanford.edu/realms/yurts',
            CLIENT_ID: 'yurtswidgets',
            theme: 'light'
          },
        });
        this.addYurtsButtonEvent();
        return true;
      }
      catch {
        this.yurtsUnavailable();
      }
    }
    return false;
  }

  addYurtsButtonEvent() {
    if (this.yurtsDiv) {
      // When the Yurts Button is in the DOM, add an event listener which enables
      // and disables the mutation observer to modify text in the Yurts modal.
      if (!this.searchButtonEventListenerAdded) {
        const yurtsTextModifierObserver = this.yurtsTextModifier();
        const searchButtonObserver = new MutationObserver((mutations, observer) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
              mutation.addedNodes.forEach((node) => {
                const searchButton = node.querySelector('button[name="search"]');
                if (searchButton) {
                  searchButton.innerText = 'Search across SLAC websites'
                  searchButton.addEventListener('click', () => {
                    yurtsTextModifierObserver.observe(document, {childList: true, subtree: true});
                  });
                  this.searchButtonEventListenerAdded = true;
                  observer.disconnect();
                }
              });
            }
          });
        });
        searchButtonObserver.observe(this.yurtsDiv, { childList: true, subtree: true });
      }
    }
  }

  yurtsTextModifier(){
    return new MutationObserver((mutations, observer) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            const firstLineXpath = "//span[text()='The Gateway to Your Knowledge']";
            const firstLineTextElement = document.evaluate(firstLineXpath, node, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (firstLineTextElement) {
              firstLineTextElement.textContent = "SLAC IT has heard your feedback—and we are relaunching SLAC Search, now powered by GenAI/ML";
            }
            const secondLineXpath = "//span[text()='Ready to explore? Your search begins here.']";
            const secondLineTextElement = document.evaluate(secondLineXpath, node, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (secondLineTextElement) {
              secondLineTextElement.textContent = 'The content collections include Drupal content, open SharePoint data, relevant Confluence pages, Oracle backend data, and open ServiceNow knowledge articles (HR, BSD, IT), along with external resources like the Stanford Administration Guide and DOE Financial Management Guidelines. We’re committed to continuous improvement, so if you have suggestions for missing content, please share them in our new feedback channel, #slac-it-search-feedback';
              observer.disconnect();
            }
          });
        }
      });
    });
  }

  yurtsUnavailable() {
    if (this.yurtsDiv) {
      const unavailableMessageElement = document.createElement('p');
      const unavailableMessage = document.createTextNode('SLAC web search is temporarily unavailable.');
      unavailableMessageElement.appendChild(unavailableMessage);
      this.yurtsDiv.appendChild(unavailableMessageElement);
    }
  }
}

export default YurtsHelpers;