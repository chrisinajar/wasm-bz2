
#include "bzlib.h"
#include <emscripten/emscripten.h>
#include <stdlib.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

#define true 1
#define false 0

void (*fnPtr)(void*, int, char) = 0;

void EMSCRIPTEN_KEEPALIVE registerCallback (int ptr) {
  fnPtr = (void (*)(void*, int, char))ptr;
}

void* EMSCRIPTEN_KEEPALIVE start() {
  // printf("Allocating memory\n");
  bz_stream* strm = (bz_stream*)malloc(sizeof(bz_stream));
  int res = BZ2_bzDecompressInit(strm, 0, 0);

  return strm;
}

int EMSCRIPTEN_KEEPALIVE decompress(bz_stream* strm, void* inBuff, int avail_in, void* outBuff, int avail_out) {
  
  if (avail_in != 0) {
    strm->avail_in = avail_in;
    strm->next_in = inBuff;
  }

  strm->avail_out = avail_out;
  strm->next_out = outBuff;

  int res = BZ2_bzDecompress(strm);
  char done = false;

  switch (res) {
    case BZ_PARAM_ERROR:
      // printf("Parameter error for decompress\n");
      done = true;
      break;
    case BZ_DATA_ERROR:
      // printf("a data integrity error is detected in the compressed stream\n");
      done = true;
      break;
    case BZ_DATA_ERROR_MAGIC:
      // printf("the compressed stream doesn't begin with the right magic bytes\n");
      done = true;
      break;
    case BZ_MEM_ERROR:
      // printf("there wasn't enough memory available\n");
      done = true;
      break;
    case BZ_STREAM_END:
      // printf("the logical end of the data stream was detected and all output in has been consumed\n");
      done = true;
      break;
    case BZ_OK:
      // printf("ok\n");
      break;
  }

  int outSize = avail_out - strm->avail_out;

  if (outSize == 0 && strm->avail_in > 0) {
    done = true;
  } else {
    // printf("avail: %d, avail_in: %d\n", outSize, strm->avail_in);
  }

  fnPtr(strm, outSize, done);

  return done;
}

int EMSCRIPTEN_KEEPALIVE finish(bz_stream* strm) {
  // printf("Cleaning up memory\n");
  int res = BZ2_bzDecompressEnd(strm);

  free(strm);

  return res;
}

#ifdef __cplusplus
}
#endif
