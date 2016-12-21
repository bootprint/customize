var _ = require('lodash')

var files = require('../helpers-io').files
var readFiles = require('../helpers-io').readFiles
var deep = require('deep-aplus')(require('q').Promise)
var overrider = require('../').overrider
var expect = require('chai').expect
var stream = require('stream')

var toString = require('stream-to-string')

/* global describe */
/* global it */
/* global xit */

describe('the files-function', function () {
  var x

  it('should resolve to the contents of all contained files', function () {
    var x = files('test/fixtures/testPartials1')
    return deep(
      _.merge(
        {dir: x},
        {dir: files('test/fixtures/testPartials2')},
        overrider)
    )
      .then(function (result) {
        expect(result).to.eql({
          dir: {
            'eins.hbs': {
              path: 'test/fixtures/testPartials1/eins.hbs',
              contents: 'testPartials1/eins {{eins}}'
            },
            'zwei.hbs': {
              path: 'test/fixtures/testPartials2/zwei.hbs',
              contents: 'testPartials2/zwei {{zwei}}'
            },
            'drei.hbs': {
              path: 'test/fixtures/testPartials2/drei.hbs',
              contents: 'testPartials2/drei {{drei}}'
            }
          }
        })

        // Do this before the promise is resolved
        expect(x.valueOf()['eins.hbs'].inspect().state).to.equal('fulfilled')
        // zwei.hbs is taken from 'testPartials2' and should not be loaded from 'testPartials1'
        expect(x.valueOf()['zwei.hbs'].inspect().state).to.equal('pending')
      })
  })

  it('should work correctly with globs', function () {
    x = files('test/fixtures/testPartials1', { glob: '*ei.hbs' })
    return deep(
      _.merge(
        {dir: x},
        {dir: files('test/fixtures/testPartials2', { glob: '*ei.hbs' })},
        overrider)
    )
      .then(function (result) {
        expect(result).to.eql({
          dir: {
            'zwei.hbs': {
              path: 'test/fixtures/testPartials2/zwei.hbs',
              contents: 'testPartials2/zwei {{zwei}}'
            },
            'drei.hbs': {
              path: 'test/fixtures/testPartials2/drei.hbs',
              contents: 'testPartials2/drei {{drei}}'
            }
          }
        })
      })
  })

  it('should return "undefined" if the path is undefined', function () {
    expect(files(undefined)).to.equal(undefined)
  })
})

describe('the readFiles-function', function () {
  var x

  it('should resolve to the contents of all contained files', function () {
    var x = readFiles('test/fixtures/testPartials1', { encoding: 'utf-8' })
    return deep(
      _.merge(
        {dir: x},
        {dir: files('test/fixtures/testPartials2')},
        overrider)
    )
      .then(function (result) {
        expect(result).to.eql({
          dir: {
            'eins.hbs': {
              path: 'test/fixtures/testPartials1/eins.hbs',
              contents: 'testPartials1/eins {{eins}}'
            },
            'zwei.hbs': {
              path: 'test/fixtures/testPartials2/zwei.hbs',
              contents: 'testPartials2/zwei {{zwei}}'
            },
            'drei.hbs': {
              path: 'test/fixtures/testPartials2/drei.hbs',
              contents: 'testPartials2/drei {{drei}}'
            }
          }
        })

        // Do this before the promise is resolved
        expect(x.valueOf()['eins.hbs'].inspect().state).to.equal('fulfilled')
        // zwei.hbs is taken from 'testPartials2' and should not be loaded from 'testPartials1'
        expect(x.valueOf()['zwei.hbs'].inspect().state).to.equal('pending')
      })
  })

  it('should work correctly with globs', function () {
    x = readFiles('test/fixtures/testPartials1', { glob: '*ei.hbs', encoding: 'utf-8' })
    return deep(
      _.merge(
        {dir: x},
        {dir: files('test/fixtures/testPartials2', { glob: '*ei.hbs', encoding: 'utf-8' })},
        overrider)
    )
      .then(function (result) {
        expect(result).to.deep.equal({
          dir: {
            'zwei.hbs': {
              path: 'test/fixtures/testPartials2/zwei.hbs',
              contents: 'testPartials2/zwei {{zwei}}'
            },
            'drei.hbs': {
              path: 'test/fixtures/testPartials2/drei.hbs',
              contents: 'testPartials2/drei {{drei}}'
            }
          }
        })
      })
  })

  it('should return a string for each file, if an encoding is set', function () {
    return deep(readFiles('test/fixtures/testPartials1', { encoding: 'utf-8' }))
      .then(function (result) {
        return expect(result).to.deep.equal({
          'eins.hbs': {
            'contents': 'testPartials1/eins {{eins}}',
            'path': 'test/fixtures/testPartials1/eins.hbs'
          },
          'zwei.hbs': {
            'contents': 'testPartials1/zwei {{zwei}}',
            'path': 'test/fixtures/testPartials1/zwei.hbs'
          }
        })
      })
  })

  it('should return a Buffer for each file, if no encoding is set', function () {
    return deep(readFiles('test/fixtures/testPartials1'))
      .then(function (result) {
        return expect(result).to.deep.equal({
          'eins.hbs': {
            'contents': new Buffer('testPartials1/eins {{eins}}', 'utf-8'),
            'path': 'test/fixtures/testPartials1/eins.hbs'
          },
          'zwei.hbs': {
            'contents': new Buffer('testPartials1/zwei {{zwei}}', 'utf-8'),
            'path': 'test/fixtures/testPartials1/zwei.hbs'
          }
        })
      })
  })

  it('should return a stream, if the "stream"-option is set to true', function () {
    return deep(readFiles('test/fixtures/testPartials1', { stream: true }))
      .then(function (result) {
        expect(result['eins.hbs'].contents).to.be.an.instanceof(stream.Readable)
        expect(result['zwei.hbs'].contents).to.be.an.instanceof(stream.Readable)
        result['eins.hbs'].contents = toString(result['eins.hbs'].contents, 'utf-8')
        result['zwei.hbs'].contents = toString(result['zwei.hbs'].contents, 'utf-8')
        return deep(result)
      })
      .then(function (result) {
        expect(result).to.deep.equal({
          'eins.hbs': {
            'contents': 'testPartials1/eins {{eins}}',
            'path': 'test/fixtures/testPartials1/eins.hbs'
          },
          'zwei.hbs': {
            'contents': 'testPartials1/zwei {{zwei}}',
            'path': 'test/fixtures/testPartials1/zwei.hbs'
          }
        })
      })
  })

  xit('should return a stream with encoding, if the "stream"-option and the "encoding" option are set', function () {
    return deep(readFiles('test/fixtures/testPartials1', { stream: true, encoding: 'hex' }))
      .then(function (result) {
        expect(result['eins.hbs'].contents).to.be.an.instanceof(stream.Readable)
        expect(result['zwei.hbs'].contents).to.be.an.instanceof(stream.Readable)
        result['eins.hbs'].contents = toString(result['eins.hbs'].contents)
        result['zwei.hbs'].contents = toString(result['zwei.hbs'].contents)
        return deep(result)
      })
      .then(function (result) {
        expect(result).to.deep.equal({
          'eins.hbs': {
            'contents': '746573745061727469616c73312f65696e73207b7b65696e737d7d',
            'path': 'test/fixtures/testPartials1/eins.hbs'
          },
          'zwei.hbs': {
            'contents': '746573745061727469616c73312f7a776569207b7b7a7765697d7d',
            'path': 'test/fixtures/testPartials1/zwei.hbs'
          }
        })
      })
  })

  it('should return "undefined" if the path is undefined', function () {
    expect(readFiles(undefined)).to.equal(undefined)
  })
})
