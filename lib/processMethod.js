'use strict'

/**
 * process methods util
 */

const parse = require('co-body');
const copy = require('copy-to');
const is = require('is-type-of');
const forms = require('formidable');
let processMethod = {};
processMethod.extend = require('extend-shallow');
processMethod.querystring = require('querystring');


/**
 * > Default options that will be loaded. Pass `options` to overwrite them.
 *
 * @param  {Object} `options`
 * @return {Object}
 * @api private
 */
processMethod.defaultSetting = function defaultSetting (options) {
    options = is.object(options)? options : {}
    const types = processMethod.defaultTypes(options.extendTypes)
    options = processMethod.extend(
        {
            fields: false,
            files: false,
            multipart: true,
            textLimit: false,
            formLimit: false,
            jsonLimit: false,
            jsonStrict: true,
            detectJSON: false,
            bufferLimit: false,
            buffer: false,
            strict: true,

            //query string `parse` options
            delimiter: '&',
            decodeURIComponent: processMethod.querystring.unescape,
            maxKeys: 1000
        },
        options
    );

    options.delimiter = options.sep || options.delimiter;
    options.formLimit = options.formLimit || options.urlencodedLimit;
    options.extendTypes = types;
    options.onerror = options.onЕrror || options.onerror;
    options.onerror =
        is.function(options.onerror) ? options.onerror : false;
    options.delimiter =
        is.string(options.delimiter) ? options.delimiter : '&'

    if (!is.function(options.handler)) {
        options.handler = async function noopHandler () {}
    }
    if (!is.function(options.detectJSON)) {
        options.detectJSON = function detectJSON () {
            return false
        }
    }

    return options
}

/**
 * @param  {Object} `types`
 * @return {Object}
 * @api private
 */
processMethod.defaultTypes = function defaultTypes (types) {
    types = is.object(types) ? types : {}
    return processMethod.extend(
        {
            multipart: ['multipart/form-data'],
            text: ['text/*'],
            form: ['application/x-www-form-urlencoded'],
            json: [
                'application/json',
                'application/json-patch+json',
                'application/vnd.api+json',
                'application/csp-report'
            ],
            buffer: ['text/*']
        },
        types
    )
}

/**
 * @param  {String} `method` koa request method
 * @return {Boolean}
 * @api private
 */
processMethod.isValid = function isValid (method) {
    return ['GET', 'HEAD', 'DELETE'].indexOf(method.toUpperCase()) === -1;
}

/**
 * @param  {Object} `ctx` koa context
 * @param  {Object} `opts` default options
 * @return {Object} `ctx` koa context
 * @api private
 */
processMethod.setParsers = function setParsers (ctx, opts) {
    ctx.multipart = processMethod.multipart.bind(ctx)
    return ctx
}

/**
 * @param  {Object} `options` passed or default plugin options
 * @param  {Object} `ctx` koa context
 * @return {Function} thunk
 * @api private
 */
processMethod.multipart = async function multipart () {
    let ctx = this;
    let body = await formy(ctx);
    ctx.request.body = body;
}

/**
 * @param {Object}   `ctx` koa context
 * @param {Object}   `options` plugin options
 * @param {Function} `next` next middleware
 * @api private
 */
processMethod.parseBody = async function parseBody (ctx, options) {
    let opts = options || {};
    let detectJSON = opts.detectJSON;
    let onerror = opts.onerror;

    let enableTypes = opts.enableTypes || ['json', 'form'];
    let enableForm = checkEnable(enableTypes, 'form');
    let enableJson = checkEnable(enableTypes, 'json');
    let enableText = checkEnable(enableTypes, 'text');

    opts.detectJSON = undefined;
    opts.onerror = undefined;

    // force co-body return raw body
    opts.returnRawBody = true;

    // default json types
    let jsonTypes = [
        'application/json',
        'application/json-patch+json',
        'application/vnd.api+json',
        'application/csp-report',
    ];

    // default form types
    let formTypes = [
        'application/x-www-form-urlencoded',
    ];

    // default text types
    let textTypes = [
        'text/plain',
    ];

    let jsonOpts = formatOptions(opts, 'json');
    let formOpts = formatOptions(opts, 'form');
    let textOpts = formatOptions(opts, 'text');

    let extendTypes = opts.extendTypes || {};

    extendType(jsonTypes, extendTypes.json);
    extendType(formTypes, extendTypes.form);
    extendType(textTypes, extendTypes.text);
    if (enableJson && ((detectJSON && detectJSON(ctx)) || ctx.request.is(jsonTypes))) {
        return await parse.json(ctx, jsonOpts);
    }
    if (enableForm && ctx.request.is(formTypes)) {
        return await parse.form(ctx, formOpts);
    }
    if (enableText && ctx.request.is(textTypes)) {
        return await parse.text(ctx, textOpts) || '';
    }
    if (options.multipart && ctx.request.is(options.extendTypes.multipart)) {
        await ctx.multipart(options)|| '';
        return 'multipart';
    }
    return {};
}


function formatOptions(opts, type) {
    let res = {};
    copy(opts).to(res);
    res.limit = opts[type + 'Limit'];
    return res;
}

function extendType(original, extend) {
    if (extend) {
        if (!Array.isArray(extend)) {
            extend = [extend];
        }
        extend.forEach(function (extend) {
            original.push(extend);
        });
    }
}

function checkEnable(types, type) {
    return types.includes(type);
}
/**
 * Donable formidable
 *
 * @param  {Stream} ctx
 * @param  {Object} opts
 * @return {Object}
 * @api private
 */
function formy(ctx) {
    return new Promise(function (resolve, reject) {
        var fields = {};
        var files = {};
        var form = new forms.IncomingForm();
        form.on('end', function () {
            return resolve({
                fields: fields,
                files: files
            });
        }).on('error', function (err) {
            return reject(err);
        }).on('field', function (field, value) {
            if (fields[field]) {
                if (Array.isArray(fields[field])) {
                    fields[field].push(value);
                } else {
                    fields[field] = [fields[field], value];
                }
            } else {
                fields[field] = value;
            }
        }).on('file', function (field, file) {
            if (files[field]) {
                if (Array.isArray(files[field])) {
                    files[field].push(file);
                } else {
                    files[field] = [files[field], file];
                }
            } else {
                files[field] = file;
            }
        });
        form.parse(ctx.req);
    });
}

/**
 * Expose `processMethod` modules
 */

module.exports = processMethod;
