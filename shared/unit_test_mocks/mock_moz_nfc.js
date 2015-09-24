/* exported MockMozNfc */
/* global MockPromise */

(function(exports) {
  require('/shared/test_unit_mocks/mock_promise.js');

  var MockMozNfc = {
    onpeerready: null,
    notifySendFileStatus: function() {
    },
    MockNFCPeer: {
      isLost: false,
      sendNDEF: function(records) {
        return new MockPromise();
      }
    }
  };

  exports.MockMozNfc = MockMozNfc;
})(window);
