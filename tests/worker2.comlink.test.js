import * as Comlink from "/base/dist/esm/comlink.mjs";

describe("Comlink TransferHandler across workers", function () {
  let worker1;
  let worker2;
  let nbrOfSerializations = 0;
  let lastEp = null;

  beforeEach(function () {
    nbrOfSerializations = 0;
    lastEp = null;

    // add new handler to serialize 'special' strings
    Comlink.transferHandlers.set("special-strings", {
      canHandle(s) {
        return s === "aaa" || s === "bbb";
      },
      serialize(s, ep) {
        nbrOfSerializations++;
        lastEp = ep;
        return [{ value: "_" + s + "_" }, []];
      },
      deserialize(serialized) {
        return serialized.value;
      },
    });

    worker1 = new Worker("/base/tests/fixtures/worker2.js");
    worker2 = new Worker("/base/tests/fixtures/worker2.js");
  });

  afterEach(function () {
    Comlink.transferHandlers.delete("special-strings");
    worker1.terminate();
    worker2.terminate();
  });

  it("will pass the endpoint param to serialize() - sub-object call", async function () {
    const proxy = Comlink.wrap(worker1);
    const r = await proxy.operations.add("x", "aaa");

    expect(r).to.equal("x_aaa_");
    expect(nbrOfSerializations).to.equal(1);
    expect(lastEp).to.equal(worker1);
  });

  it("will pass the endpoint param to serialize() - double serialization", async function () {
    const proxy = Comlink.wrap(worker1);
    const r = await proxy.operations.add("aaa", "bbb");

    expect(r).to.equal("_aaa__bbb_");
    expect(nbrOfSerializations).to.equal(2);
    expect(lastEp).to.equal(worker1);
  });

  it("will not use TransferHandler if canHandle returns false", async function () {
    const proxy = Comlink.wrap(worker1);
    const r = await proxy.operations.add("x", "y");

    expect(r).to.equal("xy");
    expect(nbrOfSerializations).to.equal(0);
    expect(lastEp).to.equal(null);
  });

  it("will pass different end points for different workers", async function () {
    const proxy1 = Comlink.wrap(worker1);
    const proxy2 = Comlink.wrap(worker2);

    const r1 = await proxy1.echo("aaa");
    expect(r1).to.equal("_aaa_");
    expect(nbrOfSerializations).to.equal(1);
    expect(lastEp).to.equal(worker1);

    nbrOfSerializations = 0;
    const r2 = await proxy2.operations.double("aaa");
    expect(r2).to.equal("_aaa__aaa_");
    expect(nbrOfSerializations).to.equal(1);
    expect(lastEp).to.equal(worker2);

    nbrOfSerializations = 0;
    const r3 = await proxy1.operations.double("aaa");
    expect(r3).to.equal("_aaa__aaa_");
    expect(nbrOfSerializations).to.equal(1);
    expect(lastEp).to.equal(worker1);
  });
});
