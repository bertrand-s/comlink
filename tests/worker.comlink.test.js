/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as Comlink from "/base/dist/esm/comlink.mjs";

describe("Comlink across workers", function () {
  beforeEach(function () {
    this.worker = new Worker("/base/tests/fixtures/worker.js");
  });

  afterEach(function () {
    this.worker.terminate();
  });

  it("can communicate", async function () {
    const proxy = Comlink.wrap(this.worker);
    expect(await proxy(1, 3)).to.equal(4);
  });

  it("can tunnels a new endpoint with createEndpoint", async function () {
    const proxy = Comlink.wrap(this.worker);
    const otherEp = await proxy[Comlink.createEndpoint]();
    const otherProxy = Comlink.wrap(otherEp);
    expect(await otherProxy(20, 1)).to.equal(21);
  });

  it("can setTimeDebounceRemoveEventListener 100 ms", async function () {
    Comlink.setTimeDebounceRemoveEventListener(100);
    const proxy = Comlink.wrap(this.worker);
    const proxyDataPre = JSON.parse(
      JSON.stringify(await proxy[Comlink.getProxyData]())
    );
    expect(proxyDataPre).to.include({ size: 0 });
    expect(proxyDataPre).to.not.have.any.keys("hasEventListener", "timeout");

    expect(await proxy(1, 3)).to.equal(4);

    const proxyDataBefore = JSON.parse(
      JSON.stringify(await proxy[Comlink.getProxyData]())
    );

    expect(proxyDataBefore).to.include({ size: 0, hasEventListener: true });
    expect(proxyDataBefore).to.have.any.keys("timeout");

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(proxyDataBefore).to.include({ size: 0, hasEventListener: true });
    expect(proxyDataBefore).to.have.any.keys("timeout");

    await new Promise((resolve) => setTimeout(resolve, 50));

    const proxyDataAfter = JSON.parse(
      JSON.stringify(await proxy[Comlink.getProxyData]())
    );

    expect(proxyDataAfter).to.include({ size: 0 });
    expect(proxyDataAfter).to.not.have.any.keys("hasEventListener", "timeout");
  });

  it("can setTimeDebounceRemoveEventListener 1000 ms", async function () {
    Comlink.setTimeDebounceRemoveEventListener(1000);
    const proxy = Comlink.wrap(this.worker);
    const proxyDataPre = JSON.parse(
      JSON.stringify(await proxy[Comlink.getProxyData]())
    );
    expect(proxyDataPre).to.include({ size: 0 });
    expect(proxyDataPre).to.not.have.any.keys("hasEventListener", "timeout");

    expect(await proxy(1, 3)).to.equal(4);

    const proxyDataBefore = JSON.parse(
      JSON.stringify(await proxy[Comlink.getProxyData]())
    );

    expect(proxyDataBefore).to.include({ size: 0, hasEventListener: true });
    expect(proxyDataBefore).to.have.any.keys("timeout");

    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(proxyDataBefore).to.include({ size: 0, hasEventListener: true });
    expect(proxyDataBefore).to.have.any.keys("timeout");

    await new Promise((resolve) => setTimeout(resolve, 500));

    const proxyDataAfter = JSON.parse(
      JSON.stringify(await proxy[Comlink.getProxyData]())
    );

    expect(proxyDataAfter).to.include({ size: 0 });
    expect(proxyDataAfter).to.not.have.any.keys("hasEventListener", "timeout");
  });

  it("removes event listener after no calls from another proxy", async function () {
    Comlink.setTimeDebounceRemoveEventListener(100);
    const proxy = Comlink.wrap(this.worker);
    const proxyDataPre = JSON.parse(
      JSON.stringify(await proxy[Comlink.getProxyData]())
    );
    expect(proxyDataPre).to.include({ size: 0 });
    expect(proxyDataPre).to.not.have.any.keys("hasEventListener", "timeout");

    const otherEp = await proxy[Comlink.createEndpoint]();
    Comlink.wrap(otherEp);
    const proxyDataBefore = JSON.parse(
      JSON.stringify(await proxy[Comlink.getProxyData]())
    );
    expect(proxyDataBefore).to.include({ size: 0, hasEventListener: true });
    expect(proxyDataBefore).to.have.any.keys("timeout");

    await new Promise((resolve) => setTimeout(resolve, 500));

    const proxyDataAfter = JSON.parse(
      JSON.stringify(await proxy[Comlink.getProxyData]())
    );
    expect(proxyDataAfter).to.include({ size: 0 });
    expect(proxyDataAfter).to.not.have.any.keys("hasEventListener", "timeout");
  });

  it("adds back event listener after calls from self proxy", async function () {
    Comlink.setTimeDebounceRemoveEventListener(100);
    const proxy = Comlink.wrap(this.worker);
    const proxyDataPre = JSON.parse(
      JSON.stringify(await proxy[Comlink.getProxyData]())
    );
    expect(proxyDataPre).to.include({ size: 0 });
    expect(proxyDataPre).to.not.have.any.keys("hasEventListener", "timeout");

    const otherEp = await proxy[Comlink.createEndpoint]();
    const otherProxy = Comlink.wrap(otherEp);
    const proxyDataBefore = JSON.parse(
      JSON.stringify(await proxy[Comlink.getProxyData]())
    );
    expect(proxyDataBefore).to.include({ size: 0, hasEventListener: true });
    expect(proxyDataBefore).to.have.any.keys("timeout");

    await new Promise((resolve) => setTimeout(resolve, 100));

    const proxyDataAfter = JSON.parse(
      JSON.stringify(await proxy[Comlink.getProxyData]())
    );
    expect(proxyDataAfter).to.include({ size: 0 });
    expect(proxyDataAfter).to.not.have.any.keys("hasEventListener", "timeout");

    expect(await proxy(1, 3)).to.equal(4);

    const proxyDataNew = JSON.parse(
      JSON.stringify(await proxy[Comlink.getProxyData]())
    );
    expect(proxyDataNew).to.include({ size: 0, hasEventListener: true });
    expect(proxyDataNew).to.have.any.keys("timeout");
  });

  it("does not add back event listener after calls from self proxy", async function () {
    Comlink.setTimeDebounceRemoveEventListener(100);
    const proxy = Comlink.wrap(this.worker);
    const proxyDataPre = JSON.parse(
      JSON.stringify(await proxy[Comlink.getProxyData]())
    );
    expect(proxyDataPre).to.include({ size: 0 });
    expect(proxyDataPre).to.not.have.any.keys("hasEventListener", "timeout");

    const otherEp = await proxy[Comlink.createEndpoint]();
    Comlink.wrap(otherEp);
    const proxyDataBefore = JSON.parse(
      JSON.stringify(await proxy[Comlink.getProxyData]())
    );
    expect(proxyDataBefore).to.include({ size: 0, hasEventListener: true });
    expect(proxyDataBefore).to.have.any.keys("timeout");
    await new Promise((resolve) => setTimeout(resolve, 100));

    const proxyDataAfter = JSON.parse(
      JSON.stringify(await proxy[Comlink.getProxyData]())
    );
    expect(proxyDataAfter).to.include({ size: 0 });
    expect(proxyDataAfter).to.not.have.any.keys("hasEventListener", "timeout");

    const proxyDataNew = JSON.parse(
      JSON.stringify(await proxy[Comlink.getProxyData]())
    );
    expect(proxyDataNew).to.include({ size: 0 });
    expect(proxyDataNew).to.not.have.any.keys("hasEventListener", "timeout");
  });

  it("can have multiple resolve calls completed", async function () {
    const proxy = Comlink.wrap(this.worker);
    const proxyDataPre = JSON.parse(
      JSON.stringify(await proxy[Comlink.getProxyData]())
    );
    expect(proxyDataPre).to.include({ size: 0 });
    expect(proxyDataPre).to.not.have.any.keys("hasEventListener", "timeout");

    const firstPromise = proxy(1, 3);
    const proxyDataOne = JSON.parse(
      JSON.stringify(await proxy[Comlink.getProxyData]())
    );
    expect(proxyDataOne).to.include({ size: 1, hasEventListener: true });
    expect(proxyDataOne).to.not.have.any.keys("timeout");

    const secondPromise = proxy(2, 3);
    const proxyDataTwo = JSON.parse(
      JSON.stringify(await proxy[Comlink.getProxyData]())
    );
    expect(proxyDataTwo).to.include({ size: 2, hasEventListener: true });
    expect(proxyDataTwo).to.not.have.any.keys("timeout");

    const thirdPromise = proxy(3, 3);
    const proxyDataThree = JSON.parse(
      JSON.stringify(await proxy[Comlink.getProxyData]())
    );
    expect(proxyDataThree).to.include({ size: 3, hasEventListener: true });
    expect(proxyDataThree).to.not.have.any.keys("timeout");

    expect(await firstPromise).to.equal(4);

    const proxyDataResolveOne = JSON.parse(
      JSON.stringify(await proxy[Comlink.getProxyData]())
    );
    expect(proxyDataResolveOne).to.include({ size: 2, hasEventListener: true });
    expect(proxyDataResolveOne).to.not.have.any.keys("timeout");

    expect(await secondPromise).to.equal(5);

    const proxyDataResolveTwo = JSON.parse(
      JSON.stringify(await proxy[Comlink.getProxyData]())
    );
    expect(proxyDataResolveTwo).to.include({ size: 1, hasEventListener: true });
    expect(proxyDataResolveTwo).to.not.have.any.keys("timeout");

    expect(await thirdPromise).to.equal(6);

    const proxyDataResolveThree = JSON.parse(
      JSON.stringify(await proxy[Comlink.getProxyData]())
    );
    expect(proxyDataResolveThree).to.include({
      size: 0,
      hasEventListener: true,
    });
    expect(proxyDataResolveThree).to.have.any.keys("timeout");
  });

  it("will reset debounce timeout", async function () {
    Comlink.setTimeDebounceRemoveEventListener(500);
    const proxy = Comlink.wrap(this.worker);
    const proxyDataPre = JSON.parse(
      JSON.stringify(await proxy[Comlink.getProxyData]())
    );
    expect(proxyDataPre).to.include({ size: 0 });
    expect(proxyDataPre).to.not.have.any.keys("hasEventListener", "timeout");

    const firstPromise = proxy(1, 3);
    const proxyDataOne = JSON.parse(
      JSON.stringify(await proxy[Comlink.getProxyData]())
    );
    expect(proxyDataOne).to.include({ size: 1, hasEventListener: true });
    expect(proxyDataOne).to.not.have.any.keys("timeout");

    expect(await firstPromise).to.equal(4);

    const proxyDataResolveOne = JSON.parse(
      JSON.stringify(await proxy[Comlink.getProxyData]())
    );
    expect(proxyDataResolveOne).to.include({
      size: 0,
      hasEventListener: true,
    });
    expect(proxyDataResolveOne).to.have.any.keys("timeout");

    // now there is a timeout, start another proxy call
    // wait some time and then start another one to clear this out
    await new Promise((resolve) => setTimeout(resolve, 400));

    // start another call
    const secondPromise = proxy(2, 3);
    const proxyDataTwo = JSON.parse(
      JSON.stringify(await proxy[Comlink.getProxyData]())
    );
    expect(proxyDataTwo).to.include({
      size: 1,
      hasEventListener: true,
    });
    // the timeout will be cleared out
    expect(proxyDataTwo).to.not.have.any.keys("timeout");

    // complete 2nd promise
    expect(await secondPromise).to.equal(5);

    // now wait another 400 ms which will be over the 500 ms total
    // and there should still be an event listener and a timeout
    await new Promise((resolve) => setTimeout(resolve, 400));

    const proxyDataTwoB = JSON.parse(
      JSON.stringify(await proxy[Comlink.getProxyData]())
    );
    expect(proxyDataTwoB).to.include({
      size: 0,
      hasEventListener: true,
    });
    // the timeout will be open
    expect(proxyDataTwoB).to.have.any.keys("timeout");

    // should be a new timeout reference id
    expect(proxyDataResolveOne.timeout).to.not.equal(proxyDataTwoB.timeout);

    // now wait a little longer for the last debounced timeout to run
    await new Promise((resolve) => setTimeout(resolve, 200));

    const proxyDataDone = JSON.parse(
      JSON.stringify(await proxy[Comlink.getProxyData]())
    );
    expect(proxyDataDone).to.include({
      size: 0,
    });
    // the event listener and timeout will be removed
    expect(proxyDataDone).to.not.have.any.keys("hasEventListener", "timeout");
  });
});
