/* globals Promise */
/* exported MockICEStore */


var MockICEStore = {
  setContacts: function mis_setContacts(ids) {
    MockICEStore.ids = ids;
    return Promise.resolve(ids);
  },
  getContacts: function mis_getContacts() {
    return Promise.resolve(MockICEStore.ids);
  },
  onChange: function() {}
};
