/* global MockL10n */

require('/shared/test_unit_mocks/mock_l10n.js');

(function(exports) {
  'use strict';

  exports.MockLazyL10n = {

    get: function(callback) {
      setTimeout(function() {
        callback(MockL10n.get);
      });
    }

  };

})(this);
