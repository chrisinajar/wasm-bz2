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
    results.forEach(this.push.bind(this));
    // console.log('Transforming!', chunk.byteLength, resultBuff.byteLength);
    results = [];
    cb();
  }

  async function flush (cb) {
    var ref = await init();
    BZ2.flush(ref);
    BZ2.finish(ref);
    results.forEach(this.push.bind(this));
    // console.log('Flushing!', resultBuff.byteLength);
    results = [];
    cb();
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
