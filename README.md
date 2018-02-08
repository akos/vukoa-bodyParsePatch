# vukoa-bodyParsePath

process request format for vukoa or koa, base on [co-body](https://github.com/tj/co-body). support 'from-data', 'x-www-form-urlencoded', 'raw' type body.

## Install

```
npm install vukoa-bodyparsepatch
```

## Usage

```js
var Koa = require('koa');
var bodyParsePatch = require('vukoa-bodyparsepatch');

var app = new Koa();
app.use(bodyParsePatch());

app.use(async ctx => {
  // the parsed body will store in ctx.request.body
  // if nothing was parsed, body will be an empty object {}
  //if you set Options.parsePatch, you will get ctx.request.query and ctx.request.fields;
  ctx.body = ctx.request.body;
});
```

## Options
* **parsePatch**: parser will only parse when parsePatch is true, it will create ctx.request.query and ctx.request.fields
* **enableTypes**: parser will only parse when request type hits enableTypes, default is `['json', 'form']`.
* **formLimit**: limit of the `urlencoded` body. If the body ends up being larger than this limit, a 413 error code is returned. Default is `56kb`.
* **jsonLimit**: limit of the `json` body. Default is `1mb`.
* **textLimit**: limit of the `text` body. Default is `1mb`.
* **strict**: when set to true, JSON parser will only accept arrays and objects. Default is `true`. See [strict mode](https://github.com/cojs/co-body#options) in `co-body`. In strict mode, `ctx.request.body` will always be an object(or array), this avoid lots of type judging. But text body will always return string type.
* **detectJSON**: custom json request detect function. Default is `null`.

  ```js
  app.use(bodyParsePatch({
    detectJSON: function (ctx) {
      return /\.json$/i.test(ctx.path);
    }
  }));
  ```

* **extendTypes**: support extend types:

  ```js
  app.use(bodyParsePatch({
    extendTypes: {
      json: ['application/x-javascript'] // will parse application/x-javascript type body as a JSON string
    }
  }));
  ```

* **onerror**: support custom error handle, if `koa-bodyParsePatch` throw an error, you can customize the response like:

  ```js
  app.use(bodyParsePatch({
    onerror: function (err, ctx) {
      ctx.throw('body parse error', 422);
    }
  }));
  ```

* **disableBodyParser**: you can dynamic disable body parser by set `ctx.disableBodyParser = true`.

```js
app.use(async (ctx, next) => {
  if (ctx.path === '/disable') ctx.disableBodyParser = true;
  await next();
});
app.use(bodyParsePatch());
```

## Raw Body

You can set enableTypes: ['text'] you will get

- if raw body can transfer Json, you will get ctx.request.rawBody and ctx.request.fields = JSON.parse(ctx.request.rawBody)
- else you can only get ctx.request.rawBody

## Koa 2 Support


## Licences

[MIT](LICENSE)
