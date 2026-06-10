var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/newsletter-signup.ts
var JSON_HEADERS = { "Content-Type": "application/json" };
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...CORS_HEADERS }
  });
}
__name(json, "json");
async function getAccessToken(env) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_PEOPLE_CLIENT_ID,
      client_secret: env.GOOGLE_PEOPLE_CLIENT_SECRET,
      refresh_token: env.GOOGLE_PEOPLE_REFRESH_TOKEN,
      grant_type: "refresh_token"
    })
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(`Token exchange ${res.status}:`, detail);
    return null;
  }
  const data = await res.json();
  return data.access_token ?? null;
}
__name(getAccessToken, "getAccessToken");
var onRequestOptions = /* @__PURE__ */ __name(async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}, "onRequestOptions");
var onRequestPost = /* @__PURE__ */ __name(async (context) => {
  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ success: false, error: "Invalid email address" }, 400);
  }
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!EMAIL_RE.test(email)) {
    return json({ success: false, error: "Invalid email address" }, 400);
  }
  const { GOOGLE_PEOPLE_CLIENT_ID, GOOGLE_PEOPLE_CLIENT_SECRET, GOOGLE_PEOPLE_REFRESH_TOKEN } = context.env;
  if (!GOOGLE_PEOPLE_CLIENT_ID || !GOOGLE_PEOPLE_CLIENT_SECRET || !GOOGLE_PEOPLE_REFRESH_TOKEN) {
    console.error("Google People OAuth credentials are not fully configured");
    return json({ success: false, error: "Something went wrong. Please try again." }, 500);
  }
  try {
    const accessToken = await getAccessToken(context.env);
    if (!accessToken) {
      return json({ success: false, error: "Something went wrong. Please try again." }, 500);
    }
    const res = await fetch("https://people.googleapis.com/v1/people:createContact", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        emailAddresses: [{ value: email }],
        memberships: [
          {
            // TODO: replace 'contactGroups/Newsletter' with the actual resourceName from the Google People API for the 'Newsletter' label. Run: GET https://people.googleapis.com/v1/contactGroups to find it.
            contactGroupMembership: { contactGroupResourceName: "contactGroups/Newsletter" }
          }
        ]
      })
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`People API ${res.status}:`, detail);
      return json({ success: false, error: "Something went wrong. Please try again." }, 500);
    }
  } catch (err) {
    console.error("People API request failed:", err);
    return json({ success: false, error: "Something went wrong. Please try again." }, 500);
  }
  return json({ success: true }, 200);
}, "onRequestPost");

// api/calendar.ts
var CACHE = "public, max-age=60, s-maxage=60, stale-while-revalidate=300";
var JSON_HEADERS2 = { "Content-Type": "application/json" };
function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), { status, headers: JSON_HEADERS2 });
}
__name(jsonError, "jsonError");
var onRequest = /* @__PURE__ */ __name(async (context) => {
  const { searchParams } = new URL(context.request.url);
  const id = searchParams.get("id");
  const tab = searchParams.get("tab") || "Sheet1";
  if (!id) {
    return jsonError("Missing required query parameter: id", 400);
  }
  const apiKey = context.env.GOOGLE_DRIVE_API_KEY;
  if (!apiKey) {
    return jsonError("Google API key is not configured", 500);
  }
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/${encodeURIComponent(tab)}?key=${encodeURIComponent(apiKey)}`;
  let res;
  try {
    res = await fetch(url);
  } catch {
    return jsonError("Failed to reach Google Sheets API", 502);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`Sheets API ${res.status}:`, body);
    return jsonError(`Google Sheets API error: ${res.status}`, 502);
  }
  const data = await res.json();
  return new Response(JSON.stringify({ values: data.values ?? [] }), {
    headers: { ...JSON_HEADERS2, "Cache-Control": CACHE }
  });
}, "onRequest");

// api/image.ts
var CACHE_HEADERS = {
  "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400"
};
var DEFAULT_WIDTH = 1200;
var MAX_WIDTH = 2400;
var onRequest2 = /* @__PURE__ */ __name(async (context) => {
  const { searchParams } = new URL(context.request.url);
  const fileId = searchParams.get("id");
  if (!fileId) {
    return new Response("Missing id parameter", { status: 400 });
  }
  const requested = Number(searchParams.get("w"));
  const width = Number.isFinite(requested) && requested > 0 ? Math.min(Math.floor(requested), MAX_WIDTH) : DEFAULT_WIDTH;
  const cdnUrl = `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}=w${width}`;
  let res;
  try {
    res = await fetch(cdnUrl);
  } catch {
    return new Response("Failed to reach image CDN", { status: 502 });
  }
  if (!res.ok) {
    return new Response(`Upstream returned ${res.status}`, { status: res.status });
  }
  return new Response(res.body, {
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "image/jpeg",
      ...CACHE_HEADERS
    }
  });
}, "onRequest");

// ../src/config/photos.ts
var DRIVE_FOLDER_IDS = {
  home: "1vh_6qMf2ClzUdk0VZQ9-lIzwiUB60xGI",
  rush: "1L3kUtkqgmQW7swp01QqrMVHb9Ndtp0vT",
  gallery: "1plhx1WNBP1U8vdEzxeOQmVGpg1Rwp9hA",
  about: "1MjKTgePFa6I1RLOAceIIe_6ffEX1b8vr"
};

// ../src/config/newsletter.ts
var NEWSLETTER_FOLDER_IDS = {
  current: DRIVE_FOLDER_IDS.about,
  // search the about folder for the current newsletter PDF
  archive: "RE1v97IUYhLJWJheqfknmpOoRdjfAfFXyK9"
  // "Old Newsletters" subfolder Drive folder ID
};

// api/newsletter.ts
var JSON_HEADERS3 = { "Content-Type": "application/json" };
var CACHE2 = "s-maxage=60";
var MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];
function jsonError2(message, status) {
  return new Response(JSON.stringify({ error: message }), { status, headers: JSON_HEADERS3 });
}
__name(jsonError2, "jsonError");
function isPdf(file) {
  return file.name.toLowerCase().endsWith(".pdf");
}
__name(isPdf, "isPdf");
function isNewsletter(file) {
  return file.name.toLowerCase().includes("newsletter");
}
__name(isNewsletter, "isNewsletter");
function proxyUrl(id) {
  return `/api/newsletter-pdf?id=${id}`;
}
__name(proxyUrl, "proxyUrl");
function parseIssue(name) {
  const base = name.replace(/\.pdf$/i, "");
  const match2 = base.match(/^(\d{4})-(\d{2})_(.*)$/);
  if (!match2) {
    return { label: base.replace(/-/g, " "), dateLabel: "" };
  }
  const [, year, month, rest] = match2;
  const label = rest.replace(/-/g, " ").split(" ").filter(Boolean).map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
  const monthName = MONTHS[Number(month) - 1] ?? month;
  return { label, dateLabel: `${monthName} ${year}` };
}
__name(parseIssue, "parseIssue");
async function listFolder(folderId, apiKey) {
  const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const fields = encodeURIComponent("files(id,name,modifiedTime)");
  const driveUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&key=${apiKey}`;
  const res = await fetch(driveUrl);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`Drive API ${res.status}:`, body);
    throw new Error(`Google Drive API error: ${res.status}`);
  }
  const data = await res.json();
  return data.files ?? [];
}
__name(listFolder, "listFolder");
var onRequest3 = /* @__PURE__ */ __name(async (context) => {
  const type = new URL(context.request.url).searchParams.get("type");
  if (type !== "current" && type !== "archive") {
    return jsonError2("Query parameter 'type' must be 'current' or 'archive'", 400);
  }
  const apiKey = context.env.GOOGLE_DRIVE_API_KEY;
  if (!apiKey) {
    return jsonError2("Google Drive API key is not configured", 500);
  }
  const folderId = NEWSLETTER_FOLDER_IDS[type];
  let files;
  try {
    files = await listFolder(folderId, apiKey);
  } catch {
    return jsonError2("Failed to reach Google Drive API", 502);
  }
  const pdfs = files.filter(isPdf);
  if (type === "current") {
    const current = pdfs.filter(isNewsletter).sort((a, b) => (b.modifiedTime ?? "").localeCompare(a.modifiedTime ?? ""))[0];
    const payload2 = {
      pdf: current ? { id: current.id, name: current.name, url: proxyUrl(current.id) } : null
    };
    return new Response(JSON.stringify(payload2), {
      headers: { ...JSON_HEADERS3, "Cache-Control": CACHE2 }
    });
  }
  const sorted = [...pdfs].sort((a, b) => b.name.localeCompare(a.name));
  const payload = {
    issues: sorted.map((file) => {
      const { label, dateLabel } = parseIssue(file.name);
      return { id: file.id, name: file.name, label, dateLabel, url: proxyUrl(file.id) };
    })
  };
  return new Response(JSON.stringify(payload), {
    headers: { ...JSON_HEADERS3, "Cache-Control": CACHE2 }
  });
}, "onRequest");

// api/newsletter-pdf.ts
var CACHE_HEADERS2 = {
  // PDFs change rarely; an hour at the edge keeps the embed snappy while still
  // picking up a swapped "current" issue reasonably quickly.
  "Cache-Control": "s-maxage=3600"
};
var onRequest4 = /* @__PURE__ */ __name(async (context) => {
  const fileId = new URL(context.request.url).searchParams.get("id");
  if (!fileId) {
    return new Response("Missing id parameter", { status: 400 });
  }
  const apiKey = context.env.GOOGLE_DRIVE_API_KEY;
  if (!apiKey) {
    return new Response("Google Drive API key is not configured", { status: 500 });
  }
  const driveUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&key=${apiKey}`;
  let res;
  try {
    res = await fetch(driveUrl);
  } catch {
    return new Response("Failed to reach Google Drive API", { status: 502 });
  }
  if (!res.ok) {
    return new Response(`Upstream returned ${res.status}`, { status: res.status });
  }
  return new Response(res.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline",
      ...CACHE_HEADERS2
    }
  });
}, "onRequest");

// api/photos.ts
var JSON_HEADERS4 = { "Content-Type": "application/json" };
function jsonError3(message, status) {
  return new Response(JSON.stringify({ error: message }), { status, headers: JSON_HEADERS4 });
}
__name(jsonError3, "jsonError");
var onRequest5 = /* @__PURE__ */ __name(async (context) => {
  const folderId = new URL(context.request.url).searchParams.get("folder");
  if (!folderId) {
    return jsonError3("Missing required query parameter: folder", 400);
  }
  const apiKey = context.env.GOOGLE_DRIVE_API_KEY;
  if (!apiKey) {
    return jsonError3("Google Drive API key is not configured", 500);
  }
  const query = encodeURIComponent(
    `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`
  );
  const fields = encodeURIComponent("files(id,name)");
  const driveUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&key=${apiKey}`;
  let driveRes;
  try {
    driveRes = await fetch(driveUrl);
  } catch {
    return jsonError3("Failed to reach Google Drive API", 502);
  }
  if (!driveRes.ok) {
    const body = await driveRes.text().catch(() => "");
    console.error(`Drive API ${driveRes.status}:`, body);
    return jsonError3(`Google Drive API error: ${driveRes.status}`, 502);
  }
  const data = await driveRes.json();
  const payload = {
    images: (data.files ?? []).map((f) => ({
      id: f.id,
      name: f.name,
      // Routed through our own function (same-origin) so Drive credentials never
      // reach the browser. Grid thumbnails load smaller; lightbox loads larger.
      thumbnailUrl: `/api/image?id=${f.id}&w=800`,
      fullUrl: `/api/image?id=${f.id}&w=2000`
    }))
  };
  return new Response(JSON.stringify(payload), {
    headers: {
      ...JSON_HEADERS4,
      // Cache at the CDN edge for 5 minutes; browser revalidates in background after 1 min
      "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=60"
    }
  });
}, "onRequest");

// ../.wrangler/tmp/pages-CR33Wp/functionsRoutes-0.4199037880770875.mjs
var routes = [
  {
    routePath: "/api/newsletter-signup",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions]
  },
  {
    routePath: "/api/newsletter-signup",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/calendar",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/api/image",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  },
  {
    routePath: "/api/newsletter",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest3]
  },
  {
    routePath: "/api/newsletter-pdf",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest4]
  },
  {
    routePath: "/api/photos",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest5]
  }
];

// ../node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// ../node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError4 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError4;

// ../.wrangler/tmp/bundle-vxePsL/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-vxePsL/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=functionsWorker-0.9243348102157549.mjs.map
