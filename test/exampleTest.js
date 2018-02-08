const Koa = require('koa');
const bodyParsePatch = require('../index');
const app = new Koa();

// x-response-time

app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    ctx.set('X-Response-Time', `${ms}ms`);
});


app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    console.log(`${ctx.method} ${ctx.url} - ${ms}`);
});


app.use(bodyParsePatch({
    multipart: true,
    keepExtensions: true,
    strict: false,
    parsePatch: true,
    enableTypes: ['json', 'form', 'text'],
}));
app.use(async ctx => {
    ctx.body = 'Hello World';
});

app.listen(3000);