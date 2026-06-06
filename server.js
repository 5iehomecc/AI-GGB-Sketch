var http = require("http");
var https = require("https");
var fs = require("fs");
var path = require("path");

var PORT = 8080;
var PROXY_TIMEOUT = 120000;

var PROXY_URL = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy || process.env.http_proxy || "";
var proxyInfo = null;
if (PROXY_URL) {
  try {
    var p = new URL(PROXY_URL);
    proxyInfo = { hostname: p.hostname, port: parseInt(p.port) || 80, auth: p.username ? "Basic " + Buffer.from(p.username + ":" + p.password).toString("base64") : null };
    console.log("Using upstream proxy: " + p.hostname + ":" + (p.port || 80));
  } catch (e) { proxyInfo = null; }
}

var MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
};

var server = http.createServer(function (req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Api-Key");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url.indexOf("/api/proxy") === 0) {
    handleProxy(req, res);
    return;
  }

  if (req.url === "/api/ping") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end('{"ok":true}');
    return;
  }

  var filePath = req.url.split("?")[0];
  if (filePath === "/") filePath = "/index.html";
  filePath = path.join(__dirname, filePath);

  var ext = path.extname(filePath);
  var contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, function (err, data) {
    if (err) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
});

function handleProxy(req, res) {
  var urlObj = new URL(req.url, "http://localhost:" + PORT);
  var targetUrl = urlObj.searchParams.get("url");
  var apiKey = urlObj.searchParams.get("key");
  var isGemini = urlObj.searchParams.get("gemini") === "1";

  if (!targetUrl) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end('{"error":"Missing url parameter"}');
    return;
  }

  var parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
  } catch (e) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end('{"error":"Invalid url parameter"}');
    return;
  }

  var headers = {};
  if (apiKey && !isGemini) {
    headers["Authorization"] = "Bearer " + apiKey;
  }

  if (req.method === "POST") {
    headers["Content-Type"] = "application/json";
    var body = "";
    req.on("data", function (chunk) { body += chunk; });
    req.on("end", function () {
      forwardRequest(req.method, parsedUrl, headers, body, res);
    });
  } else {
    forwardRequest(req.method, parsedUrl, headers, null, res);
  }
}

function forwardRequest(method, parsedUrl, headers, body, res) {
  var isHttps = parsedUrl.protocol === "https:";
  var targetPort = parsedUrl.port || (isHttps ? 443 : 80);

  if (proxyInfo && isHttps) {
    forwardViaTunnel(method, parsedUrl, headers, body, res, targetPort);
  } else if (proxyInfo && !isHttps) {
    forwardViaHttpProxy(method, parsedUrl, headers, body, res);
  } else {
    forwardDirect(method, parsedUrl, headers, body, res, isHttps, targetPort);
  }
}

function forwardDirect(method, parsedUrl, headers, body, res, isHttps, targetPort) {
  var httpModule = isHttps ? https : http;
  var options = {
    hostname: parsedUrl.hostname,
    port: targetPort,
    path: parsedUrl.pathname + parsedUrl.search,
    method: method,
    headers: headers,
    timeout: PROXY_TIMEOUT,
  };

  var proxyReq = httpModule.request(options, function (proxyRes) {
    sendProxyResponse(proxyRes, res);
  });

  proxyReq.on("timeout", function () {
    proxyReq.destroy(new Error("Request timeout (" + PROXY_TIMEOUT + "ms)"));
  });

  proxyReq.on("error", function (err) {
    sendProxyError(res, err.message);
  });

  if (body) proxyReq.write(body);
  proxyReq.end();
}

function forwardViaHttpProxy(method, parsedUrl, headers, body, res) {
  var options = {
    hostname: proxyInfo.hostname,
    port: proxyInfo.port,
    path: parsedUrl.href,
    method: method,
    headers: Object.assign({}, headers),
    timeout: PROXY_TIMEOUT,
  };
  if (proxyInfo.auth) options.headers["Proxy-Authorization"] = proxyInfo.auth;

  var proxyReq = http.request(options, function (proxyRes) {
    sendProxyResponse(proxyRes, res);
  });

  proxyReq.on("timeout", function () {
    proxyReq.destroy(new Error("Request timeout (" + PROXY_TIMEOUT + "ms)"));
  });

  proxyReq.on("error", function (err) {
    sendProxyError(res, err.message);
  });

  if (body) proxyReq.write(body);
  proxyReq.end();
}

function forwardViaTunnel(method, parsedUrl, headers, body, res, targetPort) {
  var connectOptions = {
    hostname: proxyInfo.hostname,
    port: proxyInfo.port,
    method: "CONNECT",
    path: parsedUrl.hostname + ":" + targetPort,
    timeout: 30000,
  };
  if (proxyInfo.auth) {
    connectOptions.headers = { "Proxy-Authorization": proxyInfo.auth };
  }

  var connectReq = http.request(connectOptions);
  connectReq.on("error", function (err) {
    sendProxyError(res, "Proxy tunnel failed: " + err.message);
  });
  connectReq.on("timeout", function () {
    connectReq.destroy(new Error("Proxy tunnel connection timeout"));
  });
  connectReq.on("connect", function (proxyRes, socket) {
    if (proxyRes.statusCode !== 200) {
      sendProxyError(res, "Proxy tunnel rejected: " + proxyRes.statusCode);
      return;
    }

    socket.setTimeout(PROXY_TIMEOUT);

    var options = {
      hostname: parsedUrl.hostname,
      port: targetPort,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: headers,
      socket: socket,
      agent: false,
    };

    var proxyReq = https.request(options, function (tunnelRes) {
      sendProxyResponse(tunnelRes, res);
    });

    proxyReq.on("error", function (err) {
      sendProxyError(res, err.message);
    });

    if (body) proxyReq.write(body);
    proxyReq.end();
  });
  connectReq.end();
}

function sendProxyResponse(proxyRes, res) {
  res.writeHead(proxyRes.statusCode, { "Content-Type": proxyRes.headers["content-type"] || "application/json" });
  proxyRes.pipe(res);
}

function sendProxyError(res, message) {
  if (res.headersSent) {
    res.end();
    return;
  }
  res.writeHead(502, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: message }));
}

server.timeout = 180000;
server.listen(PORT, function () {
  console.log("AI GGB Server running at http://localhost:" + PORT);
  console.log("Server-side proxy enabled - API requests will bypass CORS restrictions");
  console.log("Proxy timeout: " + PROXY_TIMEOUT + "ms");
});
