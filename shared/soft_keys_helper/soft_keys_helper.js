/* exported SoftKeysHelper */
/* global WeakMap */
/* jshint node: true */
/* jshint browser:true */



(function(exports) {
  var SoftKeysHelper = {
    DEBUG: false,
    /**
     * This map stores all elements which had registered to
     * update the softkeys.
     * @type {WeakMap}
     */
    _elements: new WeakMap(),
    _registeredKeys: {},
    _emptyKeys: { lsk: '', dpe: '', rsk: '' },
    _savedKeys: {},
    _stashedKeysArray: [],
    meta: document.head.querySelector('meta[name="soft-keys"]'),

    /**
     * Initialization will append empty meta to the document.
     */
    start: function() {
      if (this.meta &&
          this.meta === document.head.querySelector('meta[name="soft-keys"]')) {
        return;
      }
      this.meta = document.head.querySelector('meta[name="soft-keys"]');
      if (!this.meta) {
        this.meta = document.createElement('meta');
        this.meta.name = 'soft-keys';
        if (!document.head.contains(this.meta)) {
          document.head.appendChild(this.meta);
        }
      }
    },

    /**
     * Clear the meta tag and the internal keys
     */
    stop: function() {
      this.deregisterKeys();
      this.meta = null;
      this._savedKeys = {};
      this._stashedKeysArray = {};
    },

    /**
     * Turn on debug by <code>SoftKeysHelper.DEBUG=true;</code>
     */
    debug: function(msg) {
      var completeMsg = '[SoftKeysHelper] ' +
            Array.slice(arguments).concat();
      if (this.DEBUG) {
        console.log(completeMsg);
      } else if (window.DUMP) {
        window.DUMP(completeMsg);
      }
    },

    _revertKeys: function(plainKeys) {
      var keyArray = plainKeys.split(/,\s*/);
      var keys = {};

      for (var key in this._emptyKeys) {
        keys[key] = this._emptyKeys[key];
      }

      keyArray.forEach(function(key) {
        var a = key.split('=');
        keys[a[0]] = a[1];
      });

      return keys;
    },

    _convertKeys: function(keys) {
      var plainKeys = '';
      var count = 0;
      var keyCount = Object.keys(this._emptyKeys).length;

      for (var key in this._emptyKeys) {
        // Fill the missing key with empty value.
        if (!keys[key]) {
          keys[key] = this._emptyKeys[key];
        }

        count++;
        var comma = (count === keyCount) ? '' : ', ' ;
        var keyText = key + '=' + keys[key] + comma;
        plainKeys = plainKeys + keyText;
      }

      return plainKeys;
    },

    /**
     * Save and print the provided keys object
     * @param  {Object} keys
     */
    _printKeys: function(keys) {
      this.debug('outputing: ' + JSON.stringify(keys));
      // In case start is never called before using.
      this.start();
      var plainKeys = this._convertKeys(keys);
      this._registeredKeys = keys;
      this.meta.content = plainKeys;
    },

    registeredKeys: function() {
      var cloneKeys = Object.create(this._registeredKeys);
      return cloneKeys;
    },

    /**
     * Registering to show the keys.
     * @param {Object}
     * @param {DOMElement} [domElement]
     */
    registerKeys: function(keys, domElement) {
      // Create a new meta tag for the document, or if the meta already exists,
      // Save it to the registeredKeys.

      if (domElement) {
        this.debug('registering '+JSON.stringify(keys)+' with DOM element');
        var instance = this._elements.get(domElement);
        if (instance) {
          instance.keys = keys;
          // Focus won't trigger twice when it's already focused.
          if (document.activeElement === domElement) {
            this.debug('Already active!');
            this._printKeys(keys);
          }
          return;
        }
        this._elements.set(domElement, {
          keys: keys,
          element: domElement,
          start: function() {
            // In order to capture the children's focus event,
            // we use capturing.
            this.element.addEventListener('focus', this, true);
            // We don't care the children here.
            this.element.addEventListener('blur', this);
            if (document.activeElement === domElement) {
              SoftKeysHelper.debug('Already active!');
              SoftKeysHelper.updateKeys(keys);
            }
          },
          handleEvent: function(evt) {
            SoftKeysHelper.debug(evt.type, JSON.stringify(this.keys));
            if (evt.type === 'focus') {
              SoftKeysHelper.debug('focusing, will update key', JSON.stringify(this.keys));
              SoftKeysHelper.updateKeys(this.keys);
            } else {
              SoftKeysHelper.debug('bluring, will clear key');
              SoftKeysHelper._printKeys({});
            }
          }
        });
        this._elements.get(domElement).start();
        return;
      }
      this._printKeys(keys);
    },

    save: function(keys) {
      this._savedKeys = keys ? keys : this._registeredKeys;
    },

    restore: function() {
      if (this._savedKeys) {
        this.updateKeys(this._savedKeys);
      }
    },

    push: function(keys) {
      this._stashedKeysArray.push(keys ? keys : this._registeredKeys);
    },

    pop: function() {
      var poppedKeys = this._stashedKeysArray.pop();
      var lastKeys = this._stashedKeysArray[this._stashedKeysArray.length - 1];

      if (lastKeys) {
        this.registerKeys(lastKeys);
      }

      return poppedKeys;
    },

    updateKeys: function(keys) {
      var registeringKeys = {};
      this.debug('updating keys..');
      this.debug('current: ', JSON.stringify(this._registeredKeys));
      this.debug('to be update: ', JSON.stringify(keys));

      for (var key in this._emptyKeys) {
        this.debug(key, keys[key], this._registeredKeys[key]);
        registeringKeys[key] = (key in keys) ? keys[key] : this._registeredKeys[key];
      }
      this.debug('result: ', JSON.stringify(registeringKeys));
      this._printKeys(registeringKeys);
    },

    deregisterKeys: function() {
      this._printKeys({});
    }
  };

  exports.SoftKeysHelper = SoftKeysHelper;
}(window));
