const processMethod = require('./lib/processMethod');
const parsePatch = require('./lib/parsePatch');

module.exports = function bodyParsePatch(options) {
    options = processMethod.defaultSetting(options)
    let onerror = options.onerror;

    return async function plugin (ctx, next) {
        let multipart = true;
        if (options.strict && !processMethod.isValid(this.method)) {
            return await next
        }

        if (ctx.request.body !== undefined) return await next();
        if (ctx.disableBodyParser) return await next();
        try {
            processMethod.setParsers(ctx);
            const res = await processMethod.parseBody(ctx, options);
            if(res !== 'multipart'){
                ctx.request.body = 'parsed' in res ? res.parsed : {};
                multipart = false;
            }
            if (ctx.request.rawBody === undefined) ctx.request.rawBody = res.raw;
            await parsePatch(ctx, multipart);
        } catch (err) {
            if (onerror) {
                onerror(err, ctx);
            } else {
                throw err;
            }
        }
        await next();
    }
}