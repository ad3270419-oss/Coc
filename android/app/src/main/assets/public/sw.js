/**
 * Copyright 2018 Google Inc. All Rights Reserved.
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

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "4011717de2d09575ba259ce9137ef239"
  }, {
    "url": "pwa-512x512.png",
    "revision": "024d1531eebf0635948cc8b87452b1f0"
  }, {
    "url": "pwa-192x192.png",
    "revision": "5b8221f02d44e470a7b3b71a826b9d41"
  }, {
    "url": "index.html",
    "revision": "3aef14db0866f7dd1ffd71a1261d2489"
  }, {
    "url": "icon.svg",
    "revision": "e22830735c292ef4cd9d36c32525f670"
  }, {
    "url": "coc-potion-calculator.html",
    "revision": "a6e2ab1fda9cf07010518be6eac8ed07"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "ddb3f9acc06c7ebede2f54b9d6783928"
  }, {
    "url": "assets/workbox-window.prod.es5-Bd17z0YL.js",
    "revision": null
  }, {
    "url": "assets/index-CLu10IL6.css",
    "revision": null
  }, {
    "url": "assets/index-BXvraDiH.js",
    "revision": null
  }, {
    "url": "assets/aistudio/CoC_Builder_Potion_Calculator__1__9cb822eb.html",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "ddb3f9acc06c7ebede2f54b9d6783928"
  }, {
    "url": "icon.svg",
    "revision": "e22830735c292ef4cd9d36c32525f670"
  }, {
    "url": "pwa-192x192.png",
    "revision": "5b8221f02d44e470a7b3b71a826b9d41"
  }, {
    "url": "pwa-512x512.png",
    "revision": "024d1531eebf0635948cc8b87452b1f0"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "4011717de2d09575ba259ce9137ef239"
  }, {
    "url": "manifest.webmanifest",
    "revision": "c60230cbae8f805339ac23a506038bdb"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
