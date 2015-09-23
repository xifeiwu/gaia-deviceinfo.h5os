
/**
 * AppStarter determines the initial panel to be displayed for this launch. It
 * is also reponsible for attaching basic panel handlers for enabling the
 * ability of interacting with users.
 *
 * @module AppStarter
 */
(function(exports) {
  'use strict';

  /**
   * @class AppStarter
   * @returns {AppStarter}
   */
  function AppStarter() {
    this._started = false;
    this._launchContext = null;
  }

  AppStarter.prototype = {
    /**
     * Returns the initial panel id based on the pending system message. If
     * there is no system message available, it returns 'root'.
     *
     * @access private
     * @memberOf AppStarter.prototype
     * @returns {Promise.<String>}
     */
    _getInitialPanelId: function as_getInitialPanelId() {
      return new Promise(function(resolve) {
        if (navigator.mozHasPendingMessage('activity')) {
          // Load activity handler only when we need to handle it.
          LazyLoader.load(['js/activity_handler.js'], function ah_loaded() {
            window.ActivityHandler.ready().then(function ah_ready() {
              resolve(window.ActivityHandler.targetPanelId);
            });
          });
        } else {
          resolve('root');
        }
      });
    },

    /**
     * Insert the elements of the initial panel.
     *
     * @access private
     * @memberOf AppStarter.prototype
     */
    _showInitialPanel: function as_showInitialPanel(initialPanelId) {
      var initialPanel = document.getElementById(initialPanelId);
      // Use lazy loade because it handles the case in DEBUG mode.
      return LazyLoader.load([initialPanel]).then(() => {
        initialPanel.classList.add('current');
      });
    },

    /**
     * The function defines a launch context storing the information regarding
     * the launch to be used by the AMD modules.
     *
     * @access private
     * @memberOf AppStarter.prototype
     */
    _createLaunchContext: function as_createLaunchContext(initialPanelId,
      initialPanelHandler, activityHandler) {

      this._launchContext = {
        get initialPanelId() {
          return initialPanelId;
        },
        get initialPanelHandler() {
          return initialPanelHandler;
        },
        get activityHandler() {
          return activityHandler;
        }
      };

      var that = this;
      Object.defineProperty(exports, 'LaunchContext', {
        configurable: true,
        get: function() {
          return that._launchContext;
        }
      });
    },

    /**
     * Load alameda and the required modules defined in main.js.
     *
     * @access private
     * @memberOf AppStarter.prototype
     */
    _loadAlameda: function as_loadAlameda() {
      var scriptNode = document.createElement('script');
      scriptNode.setAttribute('data-main', 'js/main.js');
      scriptNode.src = 'js/vendor/alameda.js';
      document.head.appendChild(scriptNode);
    },

    /**
     * Adjust scroll offset in order to display entire element on screen. If the
     * element is too small like gaia-switch, we needs to scroll based on its'
     * parent element
     *
     * @access private
     * @memberOf AppStarter.prototype
     */
    adjustScroll: function as_adjustScroll(elem) {
      var smallElements = ['GAIA-SWITCH', 'GAIA-CHECKBOX', 'INPUT',
                           'GAIA-RADIO', 'GAIA-BUTTON'];
      var stopElements = ['BODY', 'SECTION', 'H5-TABS-VIEW'];
      if (!elem.hasAttribute('nav-scope')) {
        if (smallElements.indexOf(elem.tagName) >= 0) {
          elem = elem.parentElement;
        }
        var viewContainer = elem;
        while (stopElements.indexOf(viewContainer.parentElement.tagName) < 0) {
          viewContainer = viewContainer.parentElement;
        }

        var rect = elem.getBoundingClientRect();
        var containerRect = viewContainer.getBoundingClientRect();
        if (rect.top < containerRect.top) {
          viewContainer.scrollTop -= (containerRect.top - rect.top);
          if (viewContainer.scrollTop < 40) {
            viewContainer.scrollTop = 0;
          }
        } else if (rect.bottom > containerRect.bottom - 12) {
          viewContainer.scrollTop += (rect.bottom - containerRect.bottom + 12);
        }

        setTimeout(function() {
          // XXX: Focus an element would introduce auto-scroll
          var rect = elem.getBoundingClientRect();
          var containerRect = viewContainer.getBoundingClientRect();
          if (rect.top < containerRect.top) {
            viewContainer.scrollTop -= (containerRect.top - rect.top);
            if (viewContainer.scrollTop < 40) {
              viewContainer.scrollTop = 0;
            }
          } else if (rect.bottom > containerRect.bottom - 12) {
            viewContainer.scrollTop +=
              (rect.bottom - containerRect.bottom + 12);
          }
        });
      }
    },

    /**
     * The function determines the first panel to be displayed and loads the
     * minimal set of modules for basic interaction. It also exposes the launch
     * context for the delay loaded AMD modules.
     *
     * @access public
     * @memberOf AppStarter.prototype
     */
    start: function as_start() {
      if (this._started) {
        return Promise.resolve();
      } else {
        this._started = true;
      }

      this.navigationManager = new NavigationManager(null, {
        defaultStrict: true,
        defaultDirection: {
          up: true,
          right: false,
          down: true,
          left: false
        }
      });
      this.navigationManager.on('beforeFocus', this.adjustScroll.bind(this));

      navigator.mozL10n.once(function l10nDone() {
        // Since the settings app contains its chrome already existing in the
        // DOM, we can fire that it's loaded as soon as the DOM is localized
        window.performance.mark('navigationLoaded');

        // Since the settings app has no functional chrome, we can fire the
        // interactive event now because there are no events to bind
        window.performance.mark('navigationInteractive');
      });

      var initialPanelId;
      return this._getInitialPanelId().then((panelId) => {
        initialPanelId = panelId;
        return this._showInitialPanel(panelId);
      }).then(() => {
        // XXX: This is an optimization for the root panel to avoid reflow that
        //      could be observed by users.
        var customPanelHandler;
        var rootTabview;
        var panel = document.getElementById(initialPanelId);
        panel.focus();
        if (window.SoftKeysHelper) {
          SoftKeysHelper.updateKeys({
            lsk: 'back'
          });
        }
        if (initialPanelId === 'root') {
          customPanelHandler = RootPanelHandler;
          rootTabview = panel.querySelector('h5-tabs-view');
          rootTabview.children[rootTabview.tabs.cursorIndex].focus();
        }

        var initialPanelHandler =
          InitialPanelHandler(panel, customPanelHandler);

        // Initial panel handler registers basic events for interaction so we
        // can fire the content interactive evnet here.
        window.performance.mark('contentInteractive');

        this._createLaunchContext(initialPanelId, initialPanelHandler,
          window.ActivityHandler);
      }).then(() => {
        // Add timeout as loading the modules could block scrolling.
        return new Promise((resolve) => {
          setTimeout(() => {
            this._loadAlameda();
            resolve();
          }, 100);
        });
      });
    },
    load : function as_load(){
      this._loadAlameda();
    }
  };

  exports.AppStarter = function ctor_appStarter() {
    return new AppStarter();
  };
})(window);


(function() {
  'use strict';
  console.log("in file startup.js");
  window.onload = function(){
    console.log("window onload.");
    var text = document.getElementById("label");
    text.innerHTML="Hello DeviceInfo.";
  }

  var appStarter = AppStarter();
  if (document.readyState !== 'loading') {
    // appStarter.start();
    appStarter.load();
  } else {
    document.addEventListener('readystatechange', function readyStateChange() {
      if (document.readyState == 'interactive') {
        document.removeEventListener('readystatechange', readyStateChange);
        // appStarter.start();
        appStarter.load();
      }
    });
  }
})();
