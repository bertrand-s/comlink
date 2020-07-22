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

describe("Comlink across iframes", function () {
  beforeEach(function () {
    this.ifr = document.createElement("iframe");
    this.ifr.sandbox.add("allow-scripts", "allow-same-origin");
    this.ifr.src = "/base/tests/fixtures/iframe.html";
    document.body.appendChild(this.ifr);
    return new Promise((resolve) => (this.ifr.onload = resolve));
  });

  afterEach(function () {
    this.ifr.remove();
  });

  it("can communicate", async function () {
    const proxy = Comlink.wrap(Comlink.windowEndpoint(this.ifr.contentWindow));
    expect(await proxy(1, 3)).to.equal(4);
  });

  it("can setTimeDebounceRemoveEventListener 100 ms", async function () {
    Comlink.setTimeDebounceRemoveEventListener(100);
    const proxy = Comlink.wrap(Comlink.windowEndpoint(this.ifr.contentWindow));
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
    const proxy = Comlink.wrap(Comlink.windowEndpoint(this.ifr.contentWindow));
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
});
