/**
*   h5-option-menu
*     <h5-option-menu></h5-option-menu>
*     var OptionMenu = new H5OptionMenu();
*
*   options for open method:
*
*   Methods
*
*/


Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _evt = require('evt');

var _evt2 = _interopRequireDefault(_evt);

var _SimpleKeyNavigator = require('SimpleKeyNavigator');

var _SimpleKeyNavigator2 = _interopRequireDefault(_SimpleKeyNavigator);

var NAV_KEY = {
  ESCAPE: 'Escape',
  RETURN: 'Enter',
  ACCEPT: 'Accept',
  UP: 'ArrowUp',
  DOWN: 'ArrowDown',
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight'
};

var KEY_CODE_MAPPING = new Map([[KeyboardEvent.DOM_VK_ESCAPE, NAV_KEY.ESCAPE], [KeyboardEvent.DOM_VK_RETURN, NAV_KEY.RETURN], [KeyboardEvent.DOM_VK_ACCEPT, NAV_KEY.ACCEPT], [KeyboardEvent.DOM_VK_DOWN, NAV_KEY.DOWN], [KeyboardEvent.DOM_VK_UP, NAV_KEY.UP], [KeyboardEvent.DOM_VK_LEFT, NAV_KEY.LEFT], [KeyboardEvent.DOM_VK_RIGHT, NAV_KEY.RIGHT]]);

exports['default'] = (function () {
  var template = `<div class="panel root-panel inactivated">
        <ul role="listbox" class="listbox root-list"></ul>
      </div>
      <div class="panel sub-panel inactivated">
        <ul role="listbox" class="listbox sub-list"></ul>
      </div>
  <style>
    div.panel.inactivated {
      display: none;
    }

    ul.listbox {
      color: #fff;
      font-size: 20px;
      list-style: none;
      opacity: 0.5;
      padding: 0px;
      margin: 0px;
    }
    ul.listbox li {
      min-height: 3rem;
      background: #ee5900;
      padding: 1rem;
    }

    ul.listbox li:hover,
    ul.listbox li:focus {
      background: #ee9500;
    }
  </style>`;

  // Extend from the HTMLElement prototype
  var proto = (0, _evt2['default'])(Object.create(HTMLElement.prototype));
  // Register and return the constructor
  proto.createdCallback = function () {

    this._isListeningToKeyUp = false;
    // init
    this._init();
    // setup root element
    this._setupRootElement();
  };

  proto._init = function () {
    // make H5OptionMenu focusable
    this.tabIndex = 1;
    this.items = [];
    this.subItems = [];
    this.softKeysHelper = {};
    this.isSupportSoftKey = false;
    this.eles = {};
    // default close
    this.setAttribute('hidden', 'true');
    this.simpleKeyNavigators = [];
    this._activePanel = undefined;
    this._panelIndex = -1;
  };

  Object.defineProperty(proto, 'activePanel', {
    set: function set(value) {
      // TODO validate value
      if (typeof value === 'undefined') {
        // reset this._activePanel
        this._activePanel = undefined;
        return;
      }
      if (value !== this._activePanel) {
        this._activePanel = value;
        this._activePanel.classList.remove('inactivated');
        this._activePanel.classList.add('active');
        // XXX: this focus() only works in async way
        setTimeout(() => {
          this.focus();
        });
        this.emit('h5options:panelChanged', value);
      }
    },
    get: function get() {
      return this._activePanel;
    }
  });

  Object.defineProperty(proto, 'isListeningToKeyUp', {
    set: function set(value) {
      if (typeof value === 'boolean' && value !== this._isListeningToKeyUp) {
        this._isListeningToKeyUp = value;
        var eventName = value === true ? 'keyup' : 'keydown';
        this.emit('h5options:keyEventListenerChanged', eventName);
        this._detachKeyEventListener();
        this._bindKeyEventListener();
      }
    },
    get: function get() {
      return this._isListeningToKeyUp;
    }
  });

  proto._bindKeyEventListener = function () {
    if (this.isListeningToKeyUp) {
      this.addEventListener('keyup', this);
    } else {
      this.addEventListener('keydown', this);
    }
  };

  proto._detachKeyEventListener = function () {
    // Remove all event listeners anyway.
    this.removeEventListener('keyup', this);
    this.removeEventListener('keydown', this);
  };

  proto._bindAll = function () {
    var eles = this.eles;
    if (Object.getOwnPropertyNames(eles).length === 0) {
      return;
    }
    this._handleListEvent = this._handleListEvent.bind(this);
    this._handleSubListEvent = this._handleSubListEvent.bind(this);
    eles.rootList.addEventListener('click', this._handleListEvent);
    eles.subList.addEventListener('click', this._handleSubListEvent);
    this.simpleKeyNavigators[0] = _SimpleKeyNavigator2['default'].create(eles.rootPanel, '.panel.active > ul.listbox > li');
    this.simpleKeyNavigators[1] = _SimpleKeyNavigator2['default'].create(eles.subPanel, '.panel.active > ul.listbox > li');
    this._bindKeyEventListener();
  };

  proto._detachAll = function () {
    var eles = this.eles;
    if (Object.getOwnPropertyNames(eles).length === 0) {
      return;
    }
    eles.rootList.removeEventListener('click', this._handleListEvent);
    eles.subList.removeEventListener('click', this._handleSubListEvent);
    this.simpleKeyNavigators.forEach(keyNavigator => {
      keyNavigator.destroy();
    });
    this.simpleKeyNavigators = [];
    this._detachKeyEventListener();
  };

  proto._setupRootElement = function () {
    this._rootElem = document.createElement('div');
    this._rootElem.innerHTML = this._template();
    this.appendChild(this._rootElem);
  };

  proto.focus = function () {
    var activeNavigator = this.simpleKeyNavigators[this._panelIndex];
    if (activeNavigator) {
      activeNavigator.focus();
    }
  };

  proto.open = function () {
    if (this.items.length === 0) {
      console.warn('no items!!!');
      return;
    }

    // According to spec always show root panel
    // when option menu is opened.
    this._showPanel(0);

    // make sure we don't bind event listeners twice
    this._detachAll();
    // bind event
    this._bindAll();
    // show it
    this.removeAttribute('hidden');
    // emit opened event
    this.emit('h5options:opened');
  };

  proto.handleEvent = function (e) {
    var focusedItem = document.activeElement;
    var keyEventName = this.isListeningToKeyUp ? 'keyup' : 'keydown';
    switch (e.type) {
      case keyEventName:
        var lowerKey = e.key.toLowerCase();
        if (lowerKey === 'unidentified') {
          lowerKey = KEY_CODE_MAPPING.get(e.keyCode).toLowerCase();
        }
        switch (lowerKey) {
          case 'enter':
            if (focusedItem.classList.contains('h5-option-menu-item')) {
              switch (this._panelIndex) {
                case 0:
                  this._selectListItem(focusedItem);
                  break;
                case 1:
                  this._selectSubListItem(focusedItem);
                  break;
              }
            }
            break;
          case 'acasoftleft':
          case 'escape':
            if (focusedItem.classList.contains('h5-option-menu-item')) {
              this.back();
            }
            break;
          case 'acasoftright':
          case 'accept':
            break;
        }
        e.preventDefault();
        e.stopPropagation();
        break;
    }
  };

  proto._renderSoftkey = function () {
    var softKeysHelper = window.SoftKeysHelper;
    this.isSupportSoftKey = true;
    // config softkey via helper
    softKeysHelper.registerKeys({
      lsk: 'back',
      dpe: 'select',
      rsk: ''
    }, this);
    this.emit('h5options:supportSoftKey');
  };

  proto._close = function () {
    // detach all listener
    this._detachAll();

    // hide all
    this._resetActivePanel();

    // hide panel
    this.setAttribute('hidden', 'true');

    // emit closed event
    this.emit('h5options:closed');
  };

  proto._render = function () {
    // set up elements
    this._setUpElements();

    // redner softkey if SoftKeysHelper exists in window.
    if (typeof window.SoftKeysHelper !== 'undefined') {
      this._renderSoftkey();
    }
    // reset panel first.
    this._resetActivePanel();

    // generate root panel
    this._genRootPanel();

    // set root panel is active.
    this._panelIndex = 0;
  };

  proto._resetActivePanel = function () {
    // find out the activePanel and clean up.
    var panel = this._rootElem.querySelector('div.panel.active');
    if (panel) {
      panel.classList.remove('active');
      panel.classList.add('inactivated');
    }

    this.activePanel = undefined;
  };

  proto.config = function (config) {
    if (config) {
      if (typeof config.isListeningToKeyUp === 'boolean') {
        this.isListeningToKeyUp = config.isListeningToKeyUp;
      }
    }
  };

  proto.setOptions = function (options) {
    if (Object.getOwnPropertyNames(options).length === 0) {
      // clean up items
      // reset all properties
      this._close();
      this._init();
      return;
    }
    this.items = options.items;
    this._render();
  };

  proto._setUpElements = function () {
    if (Object.getOwnPropertyNames(this.eles).length > 0) {
      return;
    }
    // setup elements
    this.eles = {
      rootPanel: this._rootElem.querySelector('.root-panel'),
      rootList: this._rootElem.querySelector('.root-list'),
      subPanel: this._rootElem.querySelector('.sub-panel'),
      subList: this._rootElem.querySelector('.sub-list')
    };
  };

  proto.close = function () {
    // do close;
    this._close();
  };

  proto._showPanel = function (index) {
    var matches = this._rootElem.querySelectorAll('div.panel');
    this._resetActivePanel();
    index = parseInt(index, 10);

    this._panelIndex = index;
    // set new active panel via index
    this.activePanel = matches[index];
  };

  proto.back = function () {
    var backIndex = this._panelIndex - 1;
    if (backIndex < 0) {
      this._close();
    } else {
      this._showPanel(backIndex);
    }
  };

  proto._selectListItem = function (item) {
    var key = item.dataset.indexId;
    var hasSubPanel = this._hasSubPanel(key);
    if (hasSubPanel) {
      // generate and set subpanel as acitve panel
      this._genSubPanel(key);
      this._showPanel(this._panelIndex + 1);
    } else {
      // emit item selected via 'h5options:selected' event
      this.emit('h5options:selected', {
        detail: this.items[key]
      });

      this._endSelectItem();
    }
  };

  proto._selectSubListItem = function (item) {
    var key = item.dataset.indexId;
    this.emit('h5options:selected', {
      detail: this.subItems[key]
    });
    this._endSelectItem();
  };

  proto._endSelectItem = function () {
    this._close();
  };

  proto._handleListEvent = function (e) {
    var item = e.target;
    if (item.tagName.toLowerCase() !== 'li') {
      return;
    }
    this._selectListItem(item);
  };

  proto._handleSubListEvent = function (e) {
    var item = e.target;
    if (item.tagName.toLowerCase() !== 'li') {
      return;
    }
    this._selectSubListItem(item);
  };

  proto._hasSubPanel = function (key) {
    var obj = this.items[key].options;
    // We only have 2 levels of panel.
    // There should be no sub panel if _panelIndex is larger than 1.
    if (typeof obj === 'undefined' || this._panelIndex > 0) {
      return false;
    }
    return true;
  };

  proto._genRootPanel = function () {
    var rootList = this.eles.rootList;

    //clean up first
    rootList.innerHTML = '';
    var docFragment = this._generateList(this.items);
    rootList.appendChild(docFragment);
  };

  proto._genSubPanel = function (key) {
    this.subItems = this.items[key].options.items;
    var subList = this.eles.subList;

    //clean up first
    subList.innerHTML = '';
    var docFragment = this._generateList(this.subItems);
    subList.appendChild(docFragment);
  };

  proto._generateList = function (items) {
    var docFragment = document.createDocumentFragment();
    for (var item in items) {
      var li = document.createElement('li');

      li.dataset.indexId = item;
      li.dataset.key = items[item].key;
      li.dataset.title = items[item].title;
      li.classList.add('h5-option-menu-item');
      li.textContent = items[item].title;
      // make li element focusable
      li.tabIndex = 1;

      // TODO
      // generate icon info if it exists in items.
      docFragment.appendChild(li);
    }

    return docFragment;
  };

  proto._template = function () {
    return template;
  };

  return document.registerElement('h5-option-menu', { prototype: proto });
})();

module.exports = exports['default'];