const path = require('path');
const is = require('is-type-of');

module.exports = () => async function bodyParsePatch(ctx, next) {
    // 正文解析处理
    ctx.errors = [];
    if (!ctx.request.body)
        ctx.request.body = {};
    if (ctx.request.body && !is.object(ctx.request.body)) {
        ctx.request.fields = JSON.parse(ctx.request.body);
        ctx.request.body = {};
    }
    if (!ctx.request.fields)
        ctx.request.fields = {};

    ctx.request.body.fields = ctx.request.fields;
    ctx.request.body.files = ctx.request.fields.files;

    if (ctx.request.body.fields.files) {
        for (const fileField in ctx.request.body.files) {
            const file = ctx.request.body.files[fileField];
            const ext = path.extname(file.name);
            const newName = file.name.replace(new RegExp(`${ext}$`), ext.toLowerCase());
            if (newName !== file.name)
                file.name = newName;
        }
        delete ctx.request.body.fields.files;
    }
    await next();
};
