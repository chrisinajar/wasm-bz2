var through2 = require('through2');
var BZ2 = require('./index');

module.exports = Stream;

function Stream () {
  var refPromise = null;
  var results = [];

  return through2({
  }, transform, flush);

  async function transform (chunk, encoding, cb) {
    var ref = await init();

    BZ2.sendNextChunk(ref, chunk);
    var resultBuff = Buffer.concat(results);
    results = [];
    cb(null, resultBuff);
  }

  async function flush (cb) {
    var ref = await init();
    BZ2.flush(ref);
    BZ2.finish(ref);
    var resultBuff = Buffer.concat(results);
    results = [];
    cb(null, resultBuff);
  }

  async function init () {
    if (refPromise) {
      return refPromise;
    }
    refPromise = BZ2.start();

    var ref = await refPromise;

    ref.onData(function (buff) {
      results.push(buff);
    });

    return refPromise;
  }
}
