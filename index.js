const Module = require('./libbz2/bzip2');
const Event = require('weakmap-event');
const { partial } = require('ap');

var instance = null;
var fnPtr = null;
var inBuffSize = 1024 * 1024;
var outBuffSize = inBuffSize * 32;

const DataEvent = Event();

const stateStore = {};

module.exports = {
  sendNextChunk,
  flush,
  init,
  start,
  finish,
  onData: DataEvent.listen
};

function sendNextChunk (ref, chunk) {
  ref.buffers.push(chunk);

  while (ref.currentBuffer || ref.buffers.length) {
    if (!ref.currentBuffer || ref.currentBuffer.byteLength < 1) {
      if (!ref.buffers.length) {
        break;
      }
      ref.currentBuffer = ref.buffers.shift();
    }
    let inSize = ref.currentBuffer.byteLength > inBuffSize ? inBuffSize : ref.currentBuffer.byteLength;
    instance.HEAPU8.set(ref.currentBuffer.slice(0, inSize), ref.inBuff);

    // console.log('Working on this chunk...', ref.currentBuffer.byteLength);
    ref.isFinished = !!instance._decompress(ref.ref, ref.inBuff, inSize, ref.outBuff, outBuffSize);
    if (ref.isFinished) {
      // console.log('FINISHED');
    }
    if (inSize === ref.currentBuffer.byteLength) {
      ref.currentBuffer = null;
    } else {
      ref.currentBuffer = ref.currentBuffer.slice(inSize);
    }
  }
}

function flush (ref) {
  while (!ref.isFinished) {
    ref.isFinished = !!instance._decompress(ref.ref, 0, 0, ref.outBuff, outBuffSize);
  }
  // console.log('Finished decompress');
}

async function init () {
  if (instance) {
    return { instance };
  }
  return new Promise(function (resolve, reject) {
    const moduleInstance = Module({
      onRuntimeInitialized: onInit
      // memory growth is enabled, so whatever...
      // TOTAL_MEMORY: 1024 * 1024 * 1024
    });

    function onInit () {
      // console.log('onRuntimeInitialized');
      // should print garbage
      fnPtr = moduleInstance.addFunction(callback, 'viii');
      // console.log('Registered a function', fnPtr);

      moduleInstance._registerCallback(fnPtr);

      instance = moduleInstance;
      resolve({ instance });
    }
  });
}

function callback (refNum, size, done) {
  const ref = stateStore[refNum];
  var buffer = ref.outBuff;
  // console.log('Callback', size, done);
  if (size > 0) {
    const resultView = new Uint8Array(instance.HEAPU8.buffer, buffer, size);
    const result = new Uint8Array(resultView);
    DataEvent.broadcast(ref, result);
  }
  if (done) {
    ref.isFinished = !!done;
    // console.log('FINISHED');
  }
}

async function start () {
  // console.log('start preinit');
  await init();
  // console.log('start postinit');
  var inBuff = instance._malloc(inBuffSize);
  var outBuff = instance._malloc(outBuffSize);
  var ref = instance._start();
  // console.log('This is my ref', ref);

  stateStore[ref] = {
    ref,
    inBuff,
    outBuff,
    buffers: []
  };
  stateStore[ref].onData = partial(DataEvent.listen, stateStore[ref]);
  return stateStore[ref];
}

async function finish (ref) {
  // console.log('finish preinit');
  await init();
  // console.log('finish postinit');
  instance._finish(ref.ref);
  // console.log('finish postfinished', ref.inBuff);
  instance._free(ref.inBuff);
  // console.log('free');
  instance._free(ref.outBuff);
  // console.log('free');

  delete stateStore[ref.ref];
}
