define('modules/dialog/base_dialog',['require','softkey_handler'],function(require) {
  'use strict';

  var SoftkeyHandler = require('softkey_handler');

  var BaseDialog = function(panelDOM, options) {
    this.panel = panelDOM;
    this._options = options || {};
  };

  BaseDialog.prototype.DIALOG_CLASS = 'dialog';
  BaseDialog.prototype.TRANSITION_CLASS = 'fade';
  BaseDialog.prototype.SUBMIT_BUTTON_SELECTOR = '[type="submit"]';
  BaseDialog.prototype.CANCEL_BUTTON_SELECTOR = '[type="reset"]';
  BaseDialog.prototype.MESSAGE_SELECTOR = '.settings-dialog-message';
  BaseDialog.prototype.TITLE_SELECTOR = '.settings-dialog-title';

  BaseDialog.prototype.init = function bd_init() {
    // We can override animation class from options
    this.TRANSITION_CLASS = this._options.transition || this.TRANSITION_CLASS;
    this.panel.classList.add(this.DIALOG_CLASS);
    this.panel.classList.add(this.TRANSITION_CLASS);
  };

  BaseDialog.prototype.initUI = function bd_initUI() {
    var message = this._options.message;
    var title = this._options.title;
    var submitButton = this._options.submitButton;
    var cancelButton = this._options.cancelButton;

    this._updateMessage(message);
    this._updateTitle(title);
    this._updateSubmitButton(submitButton);
    this._updateCancelButton(cancelButton);
  };

  BaseDialog.prototype.bindEvents = function bd_bindEvent() {
    var self = this;
    var cancelButton = this._options.cancelButton;
    var submitButton = this._options.submitButton;

    SoftkeyHandler.register(this.panel.id, {
      lsk: {
        name: (cancelButton && cancelButton.id) ? submitButton.id : 'cancel',
        action: function() {
          self._options.onWrapCancel();
        }
      },
      rsk: {
        name: (submitButton && submitButton.id) ? submitButton.id : 'ok',
        action: function() {
          self._options.onWrapSubmit();
        }
      }
    });

    this.getSubmitButton().onclick = function() {
      self._options.onWrapSubmit();
    };

    this.getCancelButton().onclick = function() {
      self._options.onWrapCancel();
    };
  };

  BaseDialog.prototype._updateMessage = function bd__updateMessage(message) {
    var messageDOM = this.panel.querySelector(this.MESSAGE_SELECTOR);
    if (messageDOM && message) {
      message = this._getWrapL10nObject(message);
      navigator.mozL10n.setAttributes(messageDOM, message.id, message.args);
    }
  };

  BaseDialog.prototype._updateTitle = function bd__updateTitle(title) {
    var titleDOM = this.panel.querySelector(this.TITLE_SELECTOR);
    if (titleDOM && title) {
      title = this._getWrapL10nObject(title);
      navigator.mozL10n.setAttributes(titleDOM, title.id, title.args);
    }
  };

  BaseDialog.prototype._updateSubmitButton = function bd__update(options) {
    var buttonDOM = this.getSubmitButton();
    if (buttonDOM && options) {
      options = this._getWrapL10nObject(options);
      navigator.mozL10n.setAttributes(buttonDOM, options.id, options.args);
      buttonDOM.className = options.style || 'recommend';
    }
  };

  BaseDialog.prototype._updateCancelButton = function bd__updateText(options) {
    var buttonDOM = this.getCancelButton();
    if (buttonDOM && options) {
      options = this._getWrapL10nObject(options);
      navigator.mozL10n.setAttributes(buttonDOM, options.id, options.args);
      buttonDOM.className = options.style || '';
    }
  };

  BaseDialog.prototype._getWrapL10nObject =
    function bd__getWrapL10nObject(input) {
      if (typeof input === 'string') {
        return {id: input, args: null};
      } else if (typeof input === 'object') {
        if (typeof input.id === 'undefined') {
          throw new Error('You forgot to put l10nId - ' +
            JSON.stringify(input));
        } else {
          return {id: input.id, args: input.args || null, style: input.style};
        }
      } else {
        throw new Error('You are using the wrong L10nObject, ' +
          'please check its format again');
      }
  };

  BaseDialog.prototype.getDOM = function bd_getDOM() {
    return this.panel;
  };

  BaseDialog.prototype.getSubmitButton = function bd_getSubmitButton() {
    return this.panel.querySelector(this.SUBMIT_BUTTON_SELECTOR);
  };

  BaseDialog.prototype.getCancelButton = function bd_getCancelButton() {
    return this.panel.querySelector(this.CANCEL_BUTTON_SELECTOR);
  };

  BaseDialog.prototype.cleanup = function bd_cleanup() {
    // We only have to restore system-wise panels instead of custom panels
    if (this.DIALOG_CLASS !== 'panel-dialog') {
      this._updateTitle('settings-' + this.DIALOG_CLASS + '-header');
      this._updateSubmitButton('ok');
      this._updateCancelButton('cancel');
    }

    // clear all added classes
    this.panel.classList.remove(this.DIALOG_CLASS);
    this.panel.classList.remove(this.TRANSITION_CLASS);
  };

  return BaseDialog;
});

define('modules/dialog/panel_dialog',['require','modules/dialog/base_dialog'],function(require) {
  'use strict';

  var BaseDialog = require('modules/dialog/base_dialog');

  var PanelDialog = function(panelDOM, options) {
    BaseDialog.call(this, panelDOM, options);
  };

  PanelDialog.prototype = Object.create(BaseDialog.prototype);
  PanelDialog.prototype.constructor = PanelDialog;
  PanelDialog.prototype.DIALOG_CLASS = 'panel-dialog';
  PanelDialog.prototype.TRANSITION_CLASS = 'fade';

  return function ctor_PanelDialog(panelDOM, options) {
    return new PanelDialog(panelDOM, options);
  };
});

define('modules/dialog/alert_dialog',['require','modules/dialog/base_dialog','softkey_handler'],function(require) {
  'use strict';

  var BaseDialog = require('modules/dialog/base_dialog');
  var SoftkeyHandler = require('softkey_handler');

  var AlertDialog = function(panelDOM, options) {
    BaseDialog.call(this, panelDOM, options);
  };

  AlertDialog.prototype = Object.create(BaseDialog.prototype);
  AlertDialog.prototype.constructor = AlertDialog;
  AlertDialog.prototype.DIALOG_CLASS = 'alert-dialog';
  AlertDialog.prototype.TRANSITION_CLASS = 'fade';

  AlertDialog.prototype.bindEvents = function() {
    var self = this;

    SoftkeyHandler.register(this.panel.id, {
      lsk: {
        name: ' ',
        action: function() {}
      },
      dpe: {
        name: 'ok',
        action: function() {
          self._options.onWrapSubmit();
        }
      },
      rsk: {
        name: ' ',
        action: function() {}
      }
    });

    this.getSubmitButton().onclick = function() {
      self._options.onWrapSubmit();
    };
  };

  return function ctor_alertDialog(panelDOM, options) {
    return new AlertDialog(panelDOM, options);
  };
});

define('modules/dialog/confirm_dialog',['require','softkey_handler','modules/dialog/base_dialog'],function(require) {
  'use strict';

  var SoftkeyHandler = require('softkey_handler');
  var BaseDialog = require('modules/dialog/base_dialog');

  var ConfirmDialog = function(panelDOM, options) {
    BaseDialog.call(this, panelDOM, options);
  };

  ConfirmDialog.prototype = Object.create(BaseDialog.prototype);
  ConfirmDialog.prototype.constructor = ConfirmDialog;
  ConfirmDialog.prototype.DIALOG_CLASS = 'confirm-dialog';
  ConfirmDialog.prototype.TRANSITION_CLASS = 'fade';

  ConfirmDialog.prototype.bindEvents = function() {
    var self = this;

    SoftkeyHandler.register(this.panel.id, {
      lsk: {
        name: 'cancel',
        action: function() {
          self._options.onWrapCancel();
        }
      },
      rsk: {
        name: 'ok',
        action: function() {
          self._options.onWrapSubmit();
        }
      }
    });

    this.getSubmitButton().onclick = function() {
      self._options.onWrapSubmit();
    };

    this.getCancelButton().onclick = function() {
      self._options.onWrapCancel();
    };
  };

  return function ctor_confirmDialog(panelDOM, options) {
    return new ConfirmDialog(panelDOM, options);
  };
});

define('modules/dialog/prompt_dialog',['require','modules/dialog/base_dialog','softkey_handler'],function(require) {
  'use strict';

  var BaseDialog = require('modules/dialog/base_dialog');
  var SoftkeyHandler = require('softkey_handler');

  var PromptDialog = function(panelDOM, options) {
    BaseDialog.call(this, panelDOM, options);
  };

  PromptDialog.prototype = Object.create(BaseDialog.prototype);
  PromptDialog.prototype.constructor = PromptDialog;
  PromptDialog.prototype.DIALOG_CLASS = 'prompt-dialog';
  PromptDialog.prototype.TRANSITION_CLASS = 'fade';
  PromptDialog.prototype.INPUT_SELECTOR = '.settings-dialog-input';

  PromptDialog.prototype.bindEvents = function() {
    var self = this;

    SoftkeyHandler.register(this.panel.id, {
      lsk: {
        name: 'cancel',
        action: function() {
          self._options.onWrapCancel();
        }
      },
      rsk: {
        name: 'ok',
        action: function() {
          self._options.onWrapSubmit();
        }
      }
    });

    this.getSubmitButton().onclick = function() {
      self._options.onWrapSubmit();
    };

    this.getCancelButton().onclick = function() {
      self._options.onWrapCancel();
    };
  };

  PromptDialog.prototype.initUI = function() {
    BaseDialog.prototype.initUI.call(this);

    var input = this.getInput();
    input.value = this._options.defaultValue || '';
    input.setSelectionRange(0, input.value.length);
  };

  PromptDialog.prototype.getInput = function() {
    return this.panel.querySelector(this.INPUT_SELECTOR);
  };

  PromptDialog.prototype.getResult = function() {
    return this.getInput().value;
  };

  return function ctor_promptDialog(panelDOM, options) {
    return new PromptDialog(panelDOM, options);
  };
});

/**
 * DialogService is a singleton that provides few ways for you to show/hide
 * dialogs. Here, we predefined alert/confirm/prompt dialogs to replace
 * window.alert/window.confirm/window.prompt if you want any further controls
 * of animations and UI.
 *
 * And also, there is one more dialog called panelDialog that would be used
 * when you are going to show any predefined panel in dialog way.
 *
 * API:
 *
 * 1. Alert dialog
 *
 * DialogService.alert({
 *   id: 'MessageId',
 *   args: {}
 * }, {
 *   title: { id: 'TitleId', args: {} }
 * })
 * .then(function(result) {
 *   var type = result.type;
 * });
 *
 * NOTE:
 * If there is no args in locales, you can direclty pass l10nId without args.
 *
 * DialogService.alert('MessageId', {
 *   title: 'TitleId'
 * })
 * .then(function(result) {
 *   var type = result.type;
 * });
 *
 * 2. Confirm dialog
 *
 * DialogService.confirm({
 *   id: 'MessageId',
 *   args: {}
 * }, {
 *   title: { id: 'TitleId', args: {} },
 *   submitButton: { id: 'SubmitButtonId', args: {}, style: 'recommend' },
 *   cancelButton: { id: 'CancelButtonId', args: {} }
 * })
 * .then(function(result) {
 *   var type = result.type;
 * });
 *
 * 3. Prompt dialog
 *
 * DialogService.prompt({
 *   id: 'MessageId',
 *   args: {}
 * }, {
 *   title: { id: 'TitleId', args: {} },
 *   defaultValue: 'e.g. test@mozilla.com',
 * }).then(function(result) {
 *   var type = result.type;
 *   var value = result.value;
 * });
 *
 * 4. Panel dialog
 *
 * DialogService.show('screen-lcok', {
 *   transition: 'zoom-in',
 * }).then(function(result) {
 *   // type would be submit or cancel
 *   var type = result.type;
 *   var value = result.value;
 * });
 *
 * NOTES:
 * We support some customized options for each dialog, please check the API
 * below to know what you can customize !
 *
 * @module DialogService
 */
define('modules/dialog_service',['require','settings','modules/defer','modules/dialog_manager','softkey_handler','modules/dialog/panel_dialog','modules/dialog/alert_dialog','modules/dialog/confirm_dialog','modules/dialog/prompt_dialog'],function(require) {
  'use strict';

  var Settings = require('settings');
  var Defer = require('modules/defer');
  var DialogManager = require('modules/dialog_manager');
  var SoftkeyHandler = require('softkey_handler');

  var PanelDialog = require('modules/dialog/panel_dialog');
  var AlertDialog = require('modules/dialog/alert_dialog');
  var ConfirmDialog = require('modules/dialog/confirm_dialog');
  var PromptDialog = require('modules/dialog/prompt_dialog');

  var DialogService = function() {
    this._navigating = false;
    this._pendingRequests = [];
    this._settingsAlertDialogId = 'settings-alert-dialog';
    this._settingsBaseDialogId = 'settings-base-dialog';
    this._settingsConfirmDialogId = 'settings-confirm-dialog';
    this._settingsPromptDialogId = 'settings-prompt-dialog';
  };

  DialogService.prototype = {
    /**
     * Alert dialog with more controls.
     *
     * @memberOf DialogService
     * @access public
     * @param {String} message
     * @param {Object} userOptions
     * @return {Promise}
     */
    alert: function(message, userOptions) {
      var options = userOptions || {};
      return this.show(this._settingsAlertDialogId, {
        type: 'alert',
        message: message,
        title: options.title,
        submitButton: options.submitButton
      });
    },

    /**
     * Confirm dialog with more controls.
     *
     * @memberOf DialogService
     * @access public
     * @param {String} message
     * @param {Object} userOptions
     * @return {Promise}
     */
    confirm: function(message, userOptions) {
      var options = userOptions || {};
      return this.show(this._settingsConfirmDialogId, {
        type: 'confirm',
        message: message,
        title: options.title,
        submitButton: options.submitButton,
        cancelButton: options.cancelButton
      });
    },

    /**
     * Prompt dialog with more controls.
     *
     * @memberOf DialogService
     * @access public
     * @param {String} message
     * @param {Object} userOptions
     * @return {Promise}
     */
    prompt: function(message, userOptions) {
      var options = userOptions || {};
      return this.show(this._settingsPromptDialogId, {
        type: 'prompt',
        message: message,
        title: options.title,
        defaultValue: options.defaultValue,
        submitButton: options.submitButton,
        cancelButton: options.cancelButton
      });
    },

    /**
     * Panel dialog. If you are going to show any panel as a dialog,
     * you have to use this method to show them.
     *
     * @memberOf DialogService
     * @access public
     * @param {String} panelId
     * @param {Object} userOptions
     * @return {Promise}
     */
    show: function dm_show(panelId, userOptions, _pendingDefer) {
      var self = this;
      var defer;
      var dialog;
      var dialogDOM = document.getElementById(panelId);
      var currentPanel = Settings.currentPanel;
      var options = userOptions || {};

      if (_pendingDefer) {
        defer = _pendingDefer;
      } else {
        defer = Defer();
      }

      if (this._navigating) {
        this._pendingRequests.push({
          defer: defer,
          panelId: panelId,
          userOptions: userOptions
        });
      } else {
        if ('#' + panelId === currentPanel) {
          defer.reject('You are showing the same panel #' + panelId);
        } else {
          options.onWrapSubmit = function() {
            SoftkeyHandler.disable();
            DialogManager.close(dialog, 'submit', options)
            .then(function onSuccess(result) {
              defer.resolve({
                type: 'submit',
                value: result
              });
              self._navigating = false;
              SoftkeyHandler.activate();
              self._execPendingRequest();
            }, function onReject() {
              SoftkeyHandler.activate();
            });
          };

          options.onWrapCancel = function() {
            SoftkeyHandler.disable();
            DialogManager.close(dialog, 'cancel', options)
            .then(function(result) {
              defer.resolve({
                type: 'cancel',
                value: result
              });
              self._navigating = false;
              SoftkeyHandler.activate();
              self._execPendingRequest();
            });
          };
          SoftkeyHandler.disable();

          switch (options.type) {
            case 'alert':
              dialog = AlertDialog(dialogDOM, options);
              break;
            case 'confirm':
              dialog = ConfirmDialog(dialogDOM, options);
              break;
            case 'prompt':
              dialog = PromptDialog(dialogDOM, options);
              break;
            default:
              dialog = PanelDialog(dialogDOM, options);
              break;
          }
          this._navigating = true;
          DialogManager.open(dialog, options).then(function() {
            SoftkeyHandler.activate();
          });
        }
      }

      return defer.promise;
    },

    /**
     * This method can help us pop up any pending request and would try to
     * show it after previous request was done.
     *
     * @memberOf DialogService
     * @access private
     */
    _execPendingRequest: function() {
      var request = this._pendingRequests.pop();
      if (request) {
        this.show(request.panelId, request.userOptions, request.defer);
      }
    },
    get currentDialog() {
      return DialogManager.currentDialog;
    }
  };

  var dialogService = new DialogService();
  return dialogService;
});

