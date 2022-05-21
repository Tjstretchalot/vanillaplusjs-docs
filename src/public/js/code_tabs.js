/**
 * A single button within a code tablist
 */
class CodeTab {
    /**
     * @param {!HTMLButtonElement} element The button element this is
     *   managing
     * @param {boolean} selected If this tab is selected
     * @param {boolean} active If this tab is active
     */
    constructor(element, selected, active) {
        /**
         * The button element this is managing
         * @type {!HTMLButtonElement}
         */
        this.element = element;

        /**
         * If this tab is selected
         * @type {boolean}
         * @private
         */
        this._selected = selected;

        /**
         * If this tab is active
         * @type {boolean}
         * @private
         */
        this._active = active;

        this.fixProperties();
    }

    /**
     * @returns {boolean} If this tab is selected
     */
    get selected() {
        return this._selected;
    }

    /**
     * @param {boolean} selected If this tab is selected
     */
    set selected(selected) {
        if (this._selected === selected) {
            return;
        }

        this._selected = selected;
        this.element.setAttribute('aria-selected', selected.toString());
    }

    /**
     * @returns {boolean} If this tab is active
     */
    get active() {
        return this._active;
    }

    /**
     * This does NOT focus the tab. Typically that is done by the code tablist
     * @param {boolean} active If this tab is active
     */
    set active(active) {
        if (this._active === active) {
            return;
        }

        this._active = active;
        this.element.setAttribute('tabindex', active ? '0' : '-1');
    }

    /**
     * Ensures that the buttons properties accurately reflect the selected
     * and active states
     */
    fixProperties() {
        this.element.setAttribute('aria-selected', this.selected.toString());
        this.element.setAttribute('tabindex', this.active ? '0' : '-1');
    }
}

/**
 * A panel within a code tablist
 */
class CodeTabPanel {
    /**
     * @param {HTMLDivElement} element The tab panel element this is
     *  managing
     * @param {boolean} visible If this tab is visible
     */
    constructor(element, visible) {
        /**
         * The tab panel element this is managing
         * @type {HTMLDivElement}
         */
        this.element = element;

        /**
         * If this tab is visible
         * @type {boolean}
         * @private
         */
        this._visible = visible;

        this.fixProperties();
    }

    /**
     * @returns {boolean} If this tab is visible
     */
    get visible() {
        return this._visible;
    }

    /**
     * @param {boolean} visible If this tab is visible
     */
    set visible(visible) {
        if (this._visible === visible) {
            return;
        }

        this._visible = visible;
        this.fixProperties();
    }

    /**
     * Ensures that the buttons properties accurately reflect the visible
     * state
     */
    fixProperties() {
        this.element.setAttribute('aria-hidden', !this.visible.toString());
        if (this._visible) {
            this.element.removeAttribute('hidden');
        } else {
            this.element.setAttribute('hidden', '');
        }
    }
}

/**
 * Manages a code tab, which is a class containing a tablist and corresponding
 * tab panels. This class is responsible for adding event listeners to the
 * tab buttons to change the active tab.
 */
export class CodeTabs {
    /**
     * @param {!Element} element The code-tabs element to manage.
     */
    constructor(element) {
        /**
         * The code-tabs element containing the tablist and tab panels.
         * @type {!Element}
         */
        this.element = element;

        /**
         * The button elements that control the tabs.
         * @type {Array.<CodeTab>}
         * @private
         */
        this._tabs = [];

        let selectedTabpanelID = null;
        for (const element of this.element.querySelector('.code-tablist').children) {
            const selected = (selectedTabpanelID === null) && element.hasAttribute("aria-selected") && element.getAttribute("aria-selected") === "true";
            if (selected) {
                selectedTabpanelID = element.getAttribute("aria-controls");
            }
            this._tabs.push(new CodeTab(element, selected, selected));
        }

        /**
         * The tab panels by their id.
         * @type {Object.<string, CodeTabPanel>}
         * @private
         */
        this._tabPanels = {};

        for (const element of this.element.querySelectorAll('.code-tabpanel')) {
            this._tabPanels[element.id] = new CodeTabPanel(element, element.id === selectedTabpanelID);
        }

        this.addListeners();
    }

    /**
     * Gets the id of the tabpanel which is currently selected
     */
    get selected() {
        for (const tab of this._tabs) {
            if (tab.selected) {
                return tab.element.getAttribute('aria-controls');
            }
        }
    }

    /**
     * Sets the selected tabpanel to the one with the given id. This updates
     * the selected button and the visible tabpanel, but does not change the
     * active tab.
     * @param {string} tabpanelID The id of the tabpanel to select
     */
    set selected(tabpanelID) {
        for (const tab of this._tabs) {
            tab.selected = tab.element.getAttribute('aria-controls') === tabpanelID;
        }

        for (const [id, tabpanel] of Object.entries(this._tabPanels)) {
            tabpanel.visible = id === tabpanelID;
        }
    }

    /**
     * Gets the id of the tabpanel which is currently active
     * @returns {string} The id of the tabpanel which is currently active
     */
    get active() {
        for (const tab of this._tabs) {
            if (tab.active) {
                return tab.element.getAttribute('aria-controls');
            }
        }
    }

    /**
     * Sets the active tabpanel to the one with the given id. This updates
     * the active button, but not the selected or visible tabpanel.
     */
    set active(tabpanelID) {
        for (const tab of this._tabs) {
            tab.active = tab.element.getAttribute('aria-controls') === tabpanelID;
        }
    }

    /**
     * Handles the user selecting the given tabpanel id.
     * @param {string} tabpanelID The id of the tabpanel to select
     */
    onSelected(tabpanelID) {
        this.selected = tabpanelID;
        this.active = tabpanelID;

        for (const tab of this._tabs) {
            if (tab.active) {
                tab.element.focus();
            }
        }
    }

    /**
     * Handles the user activating the given tabpanel id.
     * @param {string} tabpanelID The id of the tabpanel to activate
     */
    onActivated(tabpanelID) {
        this.active = tabpanelID;

        for (const tab of this._tabs) {
            if (tab.active) {
                tab.element.focus();
            }
        }
    }

    /**
     * Attaches the appropriate event listeners to the tab buttons
     * in the tablist.
     */
    addListeners() {
        this._tabs.forEach((tab, idx) => {
            tab.element.addEventListener('click', () => {
                this.onSelected(tab.element.getAttribute('aria-controls'));
            });
            tab.element.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    this.onSelected(tab.element.getAttribute('aria-controls'));
                } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                    if (idx < this._tabs.length - 1) {
                        this.onActivated(this._tabs[idx + 1].element.getAttribute('aria-controls'));
                    } else {
                        this.onActivated(this._tabs[0].element.getAttribute('aria-controls'));
                    }
                } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                    if (idx > 0) {
                        this.onActivated(this._tabs[idx - 1].element.getAttribute('aria-controls'));
                    } else {
                        this.onActivated(this._tabs[this._tabs.length - 1].element.getAttribute('aria-controls'));
                    }
                }
            });
        });
    }
}

function onDocumentLoaded() {
    const codeTabs = document.querySelectorAll('.code-tabs');

    for (const codeTab of codeTabs) {
        new CodeTabs(codeTab);
    }
}

if (document.readyState !== 'complete') {
    window.addEventListener('load', onDocumentLoaded);
} else {
    onDocumentLoaded();
}
