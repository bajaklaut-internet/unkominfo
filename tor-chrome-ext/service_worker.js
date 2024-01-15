var url = "https://ifconfig.co"
  , proxied = false;

/**
 * Define network settings
 */
var system_network = { mode: 'system' };
var tor_network = {
  mode: 'fixed_servers',
  rules: { singleProxy: { scheme: 'socks4', host: 'tor.irawan.science', port: 9050 } }
};

/**
 * Check tor connection status when coming online
 */
self.addEventListener('online', async function() {
  await checkProxy(url, onProxyCheck);
});

/**
 * Update browser action icon when going offline
 */
self.addEventListener('offline', function() {
  onConnectionChange(false);
});

// watch for proxy errors
/**
 * Update browser action icon and proxy settings on proxy error
 */
chrome.proxy.onProxyError.addListener(function(details) {
  console.error('Proxy Error: ' + details.error);

  // disable proxy
  toggleTorProxy(onConnectionChange);
  notify(
    'Proxy Error',
    'There was a problem connecting to your local tor proxy.  ' +
    'Make sure tor is running'
  );
});

/**
 * Toggle tor proxy settings on browser action icon click
 */
chrome.action.onClicked.addListener(function(tab) {
  toggleTorProxy(onConnectionChange);
});

/**
 * Toggle chrome proxy settings between system and tor
 */
function toggleTorProxy(cb) {
  var config = proxied ? system_network : tor_network;
  chrome.proxy.settings.set({ value: config, scope: 'regular' }, function() {
    proxied = !proxied;

    // update header processing
    chrome.webRequest.onBeforeSendHeaders.removeListener(processHeaders);
    if(proxied) {
      // alter headers on outgoing requests
      chrome.webRequest.onBeforeSendHeaders.addListener(
        processHeaders,
        { urls: ['<all_urls>'] },
        ['blocking', 'requestHeaders']
      );
    }

    cb(proxied);
  });
}

/**
 * Update the browser action icon
 */
function onConnectionChange(connected) {
  var stat  = connected ? "are" : "aren't"
    , image = connected ? 'connected.png' : 'not_connected.png'
    , title = "You "+ stat +" connected to the tor network";

  chrome.action.setTitle({ title: title });
  chrome.action.setIcon({ path: { 38: 'src/icons/' + image } });
}

/**
 * Check for a current tor connection using check.torproject.org
 */

// function checkProxy(cb) {
//   var xhr = new XMLHttpRequest();
//   // don't wait too long
//   xhr.timeout = 5000;
//   xhr.onerror = cb;
//   xhr.ontimeout = cb;
//   xhr.onload = function(e) {
//     var resp = e.target.responseText;
//     cb(null, (resp && resp.indexOf('Sorry') === -1));
//   };
//   xhr.open("GET", url);
//   xhr.send();
// }

async function checkProxy(url, cb) {
  try {
    const controller = new AbortController();
    const signal = controller.signal;
    const timeoutId = setTimeout(() => controller.abort(), 5000);
 
    const response = await fetch(url, { signal });
    clearTimeout(timeoutId);
 
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
 
    const resp = await response.text();
    cb(null, (resp && resp.indexOf('Sorry') === -1));
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Fetch request timed out');
    } else {
      console.error('Another error occurred: ', error);
    }
    cb(error);
  }
 }

/**
 * Handle proxy connection status check
 */
function onProxyCheck(err, isTor) {
  if(err) {
    console.warn('Failed to check tor status at ' + url);
    return chrome.browserAction.setTitle({
      title: 'Unable to check tor status at ' + url
    });
  }
  onConnectionChange(isTor);
}

/**
 * Function strip headers from outgoing requests
 */
function processHeaders(details) {
  for(var i = 0, l = details.requestHeaders.length; i < l; i++) {
    if(details.requestHeaders[i].name === 'Referer') {
      details.requestHeaders.splice(i, 1);
      break;
    }
  }
  return { requestHeaders: details.requestHeaders };
}

function notify(title, message) {
  webkitNotifications
    .createNotification('src/icons/icon48.png', title, message)
    .show();
}

// check proxy status on boot
checkProxy(onProxyCheck);
