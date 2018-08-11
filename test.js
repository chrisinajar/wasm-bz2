const test = require('tape');
const fs = require('fs');
const BZ2 = require('./index');
const BZ2Stream = require('./stream');

var sample1Buff = fs.readFileSync('./sample1.bz2');

test('can decompress basic file', async function (t) {
  // delete the output file first...
  if (fs.existsSync('./sample1.test')) {
    fs.unlinkSync('./sample1.test');
  }

  // init, usually instant but supports async in case it's streaming the WASM module in
  // every subsequent call to this method after the first will be instance, since the runtime will be loaded at that point
  var ref = await BZ2.start();
  var buffArray = [];
  ref.onData(function (buff) {
    buffArray.push(buff);
  });

  // can be called any number of times to send data in chunk by chunk
  // here i cut the buffer in half just to show it working....
  // sendNextChunk(ref, buff.slice(0, buff.byteLength / 2));
  // sendNextChunk(ref, buff.slice(buff.byteLength / 2));
  BZ2.sendNextChunk(ref, sample1Buff);

  // flushes everything and reads all output
  BZ2.flush(ref);
  // cleans up buffers and state objects
  BZ2.finish(ref);

  // all data is in an array of JS memory space buffers called buffArray
  var myBuffs = Buffer.concat(buffArray);
  fs.writeFileSync('sample1.test', myBuffs);

  t.ok(fs.readFileSync('./sample1.test').equals(fs.readFileSync('./sample1.ref')), 'can decompress in 1 chunk');

  t.end();
});

test('can decompress file in chunks', async function (t) {
  // delete the output file first...
  if (fs.existsSync('./sample1.test')) {
    fs.unlinkSync('./sample1.test');
  }

  // init, usually instant but supports async in case it's streaming the WASM module in
  // every subsequent call to this method after the first will be instance, since the runtime will be loaded at that point
  var ref = await BZ2.start();
  var buffArray = [];
  ref.onData(function (buff) {
    buffArray.push(buff);
  });

  // can be called any number of times to send data in chunk by chunk
  // here i cut the buffer in half just to show it working....
  BZ2.sendNextChunk(ref, sample1Buff.slice(0, sample1Buff.byteLength / 2));
  BZ2.sendNextChunk(ref, sample1Buff.slice(sample1Buff.byteLength / 2));

  // flushes everything and reads all output
  BZ2.flush(ref);
  // cleans up buffers and state objects
  BZ2.finish(ref);

  // all data is in an array of JS memory space buffers called buffArray
  var myBuffs = Buffer.concat(buffArray);
  fs.writeFileSync('sample1.test', myBuffs);

  t.ok(fs.readFileSync('./sample1.test').equals(fs.readFileSync('./sample1.ref')), 'can decompress in multiple chunks');

  t.end();
});

test('can stream decompress', async function (t) {
  // delete the output file first...
  if (fs.existsSync('./sample1.test')) {
    fs.unlinkSync('./sample1.test');
  }
  var stream = new BZ2Stream();

  fs.createReadStream('./sample1.bz2')
    .pipe(stream)
    .pipe(fs.createWriteStream('./sample1.test'));

  stream.on('end', function () {
    t.ok(fs.readFileSync('./sample1.test').equals(fs.readFileSync('./sample1.ref')), 'can decompress in multiple chunks');
    t.end();
  });
});

process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error.message);
});
