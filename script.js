    (function () {
        var on = addEventListener,
            $ = function (q) {
                return document.querySelector(q)
            },
            $$ = function (q) {
                return document.querySelectorAll(q)
            },
            $body = document.body,
            $inner = $('.inner'),
            client = (function () {
                var o = {
                        browser: 'other',
                        browserVersion: 0,
                        os: 'other',
                        osVersion: 0,
                        canUse: null
                    },
                    ua = navigator.userAgent,
                    a, i;
                a = [
                    ['firefox', /Firefox\/([0-9\.]+)/],
                    ['edge', /Edge\/([0-9\.]+)/],
                    ['safari', /Version\/([0-9\.]+).+Safari/],
                    ['chrome', /Chrome\/([0-9\.]+)/],
                    ['ie', /Trident\/.+rv:([0-9]+)/]
                ];
                for (i = 0; i < a.length; i++) {
                    if (ua.match(a[i][1])) {
                        o.browser = a[i][0];
                        o.browserVersion = parseFloat(RegExp.$1);
                        break;
                    }
                }
                a = [
                    ['ios', /([0-9_]+) like Mac OS X/, function (v) {
                        return v.replace('_', '.').replace('_', '');
                    }],
                    ['ios', /CPU like Mac OS X/, function (v) {
                        return 0
                    }],
                    ['android', /Android ([0-9\.]+)/, null],
                    ['mac', /Macintosh.+Mac OS X ([0-9_]+)/, function (v) {
                        return v.replace('_', '.').replace('_', '');
                    }],
                    ['windows', /Windows NT ([0-9\.]+)/, null],
                    ['undefined', /Undefined/, null],
                ];
                for (i = 0; i < a.length; i++) {
                    if (ua.match(a[i][1])) {
                        o.os = a[i][0];
                        o.osVersion = parseFloat(a[i][2] ? (a[i][2])(RegExp.$1) : RegExp.$1);
                        break;
                    }
                }
                var _canUse = document.createElement('div');
                o.canUse = function (p) {
                    var e = _canUse.style,
                        up = p.charAt(0).toUpperCase() + p.slice(1);
                    return (p in e || ('Moz' + up) in e || ('Webkit' + up) in e || ('O' + up) in e || (
                        'ms' + up) in e);
                };
                return o;
            }()),
            trigger = function (t) {
                if (client.browser == 'ie') {
                    var e = document.createEvent('Event');
                    e.initEvent(t, false, true);
                    dispatchEvent(e);
                } else dispatchEvent(new Event(t));
            },
            cssRules = function (selectorText) {
                var ss = document.styleSheets,
                    a = [],
                    f = function (s) {
                        var r = s.cssRules,
                            i;
                        for (i = 0; i < r.length; i++) {
                            if (r[i] instanceof CSSMediaRule && matchMedia(r[i].conditionText).matches)(f)(r[
                                i]);
                            else if (r[i] instanceof CSSStyleRule && r[i].selectorText == selectorText) a.push(
                                r[i]);
                        }
                    },
                    x, i;
                for (i = 0; i < ss.length; i++) f(ss[i]);
                return a;
            };
        var thisURL = function () {
                return window.location.href.replace(window.location.search, '').replace(/#$/, '');
            },
            getVar = function (name) {
                var a = window.location.search.substring(1).split('&'),
                    b, k;
                for (k in a) {
                    b = a[k].split('=');
                    if (b[0] == name) return b[1];
                }
                return null;
            },
            cmd = function (cmd, values, handler) {
                var x, k, data;
                data = new FormData;
                data.append('cmd', cmd);
                for (k in values) data.append(k, values[k]);
                x = new XMLHttpRequest();
                x.open('POST', 'post/cmd');
                x.onreadystatechange = function () {
                    var o;
                    if (x.readyState != 4) return;
                    if (x.status != 200) throw new Error('Failed server response (' + x.status + ')');
                    try {
                        o = JSON.parse(x.responseText);
                    } catch (e) {
                        throw new Error('Invalid server response');
                    }
                    if (!('result' in o) || !('message' in o)) throw new Error(
                        'Incomplete server response');
                    if (o.result !== true) throw new Error(o.message);
                    (handler)(o);
                };
                x.send(data);
            },
            redirectToStripeCheckout = function (options) {
                cmd('stripeCheckoutStart', options, function (response) {
                    Stripe(options.key).redirectToCheckout({
                        sessionId: response.sessionId
                    }).then(function (result) {
                        alert(result.error.message);
                    });
                });
            },
            errors = {
                handle: function (handler) {
                    window.onerror = function (message) {
                        (handler)(message);
                        return true;
                    };
                },
                unhandle: function () {
                    window.onerror = null;
                }
            },
            db = {
                open: function (objectStoreName, handler) {
                    var request = indexedDB.open('carrd');
                    request.onupgradeneeded = function (event) {
                        event.target.result.createObjectStore(objectStoreName, {
                            keyPath: 'id'
                        });
                    };
                    request.onsuccess = function (event) {
                        (handler)(event.target.result.transaction([objectStoreName], 'readwrite')
                            .objectStore(objectStoreName));
                    };
                },
                put: function (objectStore, values, handler) {
                    var request = objectStore.put(values);
                    request.onsuccess = function (event) {
                        (handler)();
                    };
                    request.onerror = function (event) {
                        throw new Error('db.put: error');
                    };
                },
                get: function (objectStore, id, handler) {
                    var request = objectStore.get(id);
                    request.onsuccess = function (event) {
                        if (!event.target.result) throw new Error(
                            'db.get: could not retrieve object with id "' + id + '"');
                        (handler)(event.target.result);
                    };
                    request.onerror = function (event) {
                        throw new Error('db.get: error');
                    };
                },
                delete: function (objectStore, id, handler) {
                    objectStore.delete(id).onsuccess = function (event) {
                        (handler)(event.target.result);
                    };
                },
            };
        var style, sheet, rule;
        style = document.createElement('style');
        style.appendChild(document.createTextNode(''));
        document.head.appendChild(style);
        sheet = style.sheet;
        if (client.os == 'android') {
            (function () {
                sheet.insertRule('body::after { }', 0);
                rule = sheet.cssRules[0];
                var f = function () {
                    rule.style.cssText = 'height: ' + (Math.max(screen.width, screen.height)) + 'px';
                };
                on('load', f);
                on('orientationchange', f);
                on('touchmove', f);
            })();
        } else if (client.os == 'ios') {
            if (client.osVersion <= 11)(function () {
                sheet.insertRule('body::after { }', 0);
                rule = sheet.cssRules[0];
                rule.style.cssText = '-webkit-transform: scale(1.0)';
            })();
            if (client.osVersion <= 11)(function () {
                sheet.insertRule('body.ios-focus-fix::before { }', 0);
                rule = sheet.cssRules[0];
                rule.style.cssText = 'height: calc(100% + 60px)';
                on('focus', function (event) {
                    $body.classList.add('ios-focus-fix');
                }, true);
                on('blur', function (event) {
                    $body.classList.remove('ios-focus-fix');
                }, true);
            })();
        } else if (client.browser == 'ie') {
            if (!('matches' in Element.prototype)) Element.prototype.matches = (Element.prototype
                .msMatchesSelector || Element.prototype.webkitMatchesSelector);
            (function () {
                var a = cssRules('body::before'),
                    r;
                if (a.length > 0) {
                    r = a[0];
                    if (r.style.width.match('calc')) {
                        r.style.opacity = 0.9999;
                        setTimeout(function () {
                            r.style.opacity = 1;
                        }, 100);
                    } else {
                        document.styleSheets[0].addRule('body::before', 'content: none !important;');
                        $body.style.backgroundImage = r.style.backgroundImage.replace('url("images/',
                            'url("assets/images/');
                        $body.style.backgroundPosition = r.style.backgroundPosition;
                        $body.style.backgroundRepeat = r.style.backgroundRepeat;
                        $body.style.backgroundColor = r.style.backgroundColor;
                        $body.style.backgroundAttachment = 'fixed';
                        $body.style.backgroundSize = r.style.backgroundSize;
                    }
                }
            })();
            (function () {
                var t, f;
                f = function () {
                    var mh, h, s, xx, x, i;
                    x = $('#wrapper');
                    x.style.height = 'auto';
                    if (x.scrollHeight <= innerHeight) x.style.height = '100vh';
                    xx = $$('.container.full');
                    for (i = 0; i < xx.length; i++) {
                        x = xx[i];
                        s = getComputedStyle(x);
                        x.style.minHeight = '';
                        x.style.height = '';
                        mh = s.minHeight;
                        x.style.minHeight = 0;
                        x.style.height = '';
                        h = s.height;
                        if (mh == 0) continue;
                        x.style.height = (h > mh ? 'auto' : mh);
                    }
                };
                (f)();
                on('resize', function () {
                    clearTimeout(t);
                    t = setTimeout(f, 250);
                });
                on('load', f);
            })();
        } else if (client.browser == 'edge') {
            (function () {
                var xx = $$('.container > .inner > div:last-child'),
                    x, y, i;
                for (i = 0; i < xx.length; i++) {
                    x = xx[i];
                    y = getComputedStyle(x.parentNode);
                    if (y.display != 'flex' && y.display != 'inline-flex') continue;
                    x.style.marginLeft = '-1px';
                }
            })();
        }
        if (!client.canUse('object-fit')) {
            (function () {
                var xx = $$('.image[data-position]'),
                    x, w, c, i, src;
                for (i = 0; i < xx.length; i++) {
                    x = xx[i];
                    c = x.firstElementChild;
                    if (c.tagName != 'IMG') {
                        w = c;
                        c = c.firstElementChild;
                    }
                    if (c.parentNode.classList.contains('deferred')) {
                        c.parentNode.classList.remove('deferred');
                        src = c.getAttribute('data-src');
                        c.removeAttribute('data-src');
                    } else src = c.getAttribute('src');
                    c.style['backgroundImage'] = 'url(\'' + src + '\')';
                    c.style['backgroundSize'] = 'cover';
                    c.style['backgroundPosition'] = x.dataset.position;
                    c.style['backgroundRepeat'] = 'no-repeat';
                    c.src = 'data:image/svg+xml;charset=utf8,' + escape(
                        '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" viewBox="0 0 1 1"></svg>'
                    );
                    if (x.classList.contains('full') && (x.parentNode && x.parentNode.classList.contains(
                            'full')) && (x.parentNode.parentNode && x.parentNode.parentNode.parentNode && x
                            .parentNode.parentNode.parentNode.classList.contains('container')) && x
                        .parentNode.children.length == 1) {
                        (function (x, w) {
                            var p = x.parentNode.parentNode,
                                f = function () {
                                    x.style['height'] = '0px';
                                    clearTimeout(t);
                                    t = setTimeout(function () {
                                        if (getComputedStyle(p).flexDirection == 'row') {
                                            if (w) w.style['height'] = '100%';
                                            x.style['height'] = (p.scrollHeight + 1) + 'px';
                                        } else {
                                            if (w) w.style['height'] = 'auto';
                                            x.style['height'] = 'auto';
                                        }
                                    }, 125);
                                },
                                t;
                            on('resize', f);
                            on('load', f);
                            (f)();
                        })(x, w);
                    }
                }
            })();
            (function () {
                var xx = $$('.gallery img'),
                    x, p, i, src;
                for (i = 0; i < xx.length; i++) {
                    x = xx[i];
                    p = x.parentNode;
                    if (p.classList.contains('deferred')) {
                        p.classList.remove('deferred');
                        src = x.getAttribute('data-src');
                    } else src = x.getAttribute('src');
                    p.style['backgroundImage'] = 'url(\'' + src + '\')';
                    p.style['backgroundSize'] = 'cover';
                    p.style['backgroundPosition'] = 'center';
                    p.style['backgroundRepeat'] = 'no-repeat';
                    x.style['opacity'] = '0';
                }
            })();
        }
    })();