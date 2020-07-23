importScripts("/base/dist/umd/comlink.js");

// add new handler to serialize 'special' strings
Comlink.transferHandlers.set("special-strings", {
  canHandle(s) {
    return s === "aaa" || s === "bbb";
  },
  serialize(s, ep) {
    nbrOfSerializations++;
    lastEp = ep;
    return [{ value: s }, []];
  },
  deserialize(serialized) {
    return serialized.value;
  },
});

const api = {
  echo: (a) => a,
  operations: {
    add: (a, b) => a + b,
    double: (a) => a + a,
  },
};

Comlink.expose(api);
