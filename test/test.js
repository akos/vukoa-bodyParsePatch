
'use strict'

const bodyParsePatch = require('../index')
const request = require('supertest')
const test = require('mukla')
const koa = require('koa')

const app = new koa().use(bodyParsePatch({
    multipart: true,
    keepExtensions: true,
    strict: false,
    parsePatch: true,
    enableTypes: ['json', 'form', 'text'],
}))

test('should get the raw text body', function (done) {
    app.use(async function(ctx) {
        test.strictEqual(typeof ctx.request.rawBody, 'string')
        test.strictEqual(ctx.request.rawBody, 'msg=test Raw body')
        ctx.body = ctx.request.rawBody
    })
    request(app.callback())
        .post('/')
        .type('text')
        .send('msg=test Raw body')
        .expect(200)
        .expect('msg=test Raw body', done)
})
test('should throw if the body is too large', function (done) {
    const server = new koa().use(bodyParsePatch({
        multipart: true,
        keepExtensions: true,
        strict: false,
        parsePatch: true,
        enableTypes: ['json', 'form', 'text'],
        textLimit: '2b' }))
    request(server.callback())
        .post('/')
        .type('text')
        .send('foobar')
        .expect(413, done)
})
