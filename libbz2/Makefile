# ------------------------------------------------------------------
# This file is part of bzip2/libbzip2, a program and library for
# lossless, block-sorting data compression.
#
# bzip2/libbzip2 version 1.0.6 of 6 September 2010
# Copyright (C) 1996-2010 Julian Seward <jseward@bzip.org>
#
# Please read the WARNING, DISCLAIMER and PATENTS sections in the 
# README file.
#
# This program is released under the terms of the license contained
# in the file LICENSE.
# ------------------------------------------------------------------

SHELL=/bin/sh

# To assist in cross-compiling
CC=emcc
AR=emar
RANLIB=emranlib
LDFLAGS=--emrun

BIGFILES=-D_FILE_OFFSET_BITS=64
CFLAGS=-s WASM=1 -Wall -Winline -O3 -g $(BIGFILES)

# Where you want it installed when you do 'make install'
PREFIX=/usr/local


OBJS= blocksort.o  \
      huffman.o    \
      crctable.o   \
      randtable.o  \
      compress.o   \
      decompress.o \
      bzlib.o

all: libbz2.a wasm

wasm: libbz2.a wasm.o
	$(CC) $(CFLAGS) -s SINGLE_FILE=1 -s EXTRA_EXPORTED_RUNTIME_METHODS='["addFunction"]' -s RESERVED_FUNCTION_POINTERS=1 -s ALLOW_MEMORY_GROWTH=1 -s ASSERTIONS=1 -s ALLOW_MEMORY_GROWTH=1 -s MODULARIZE=1 $(LDFLAGS) wasm.o -L. -lbz2 -o bzip2.js

libbz2.a: $(OBJS)
	rm -f libbz2.a
	$(AR) cq libbz2.a $(OBJS)
	@if ( test -f $(RANLIB) -o -f /usr/bin/ranlib -o \
		-f /bin/ranlib -o -f /usr/ccs/bin/ranlib ) ; then \
		echo $(RANLIB) libbz2.a ; \
		$(RANLIB) libbz2.a ; \
	fi

clean: 
	rm -f *.o libbz2.a  \
	bzip2.js bzip2.wasm bzip2.wast \

blocksort.o: blocksort.c
	@cat words0
	$(CC) $(CFLAGS) -c blocksort.c
huffman.o: huffman.c
	$(CC) $(CFLAGS) -c huffman.c
crctable.o: crctable.c
	$(CC) $(CFLAGS) -c crctable.c
randtable.o: randtable.c
	$(CC) $(CFLAGS) -c randtable.c
compress.o: compress.c
	$(CC) $(CFLAGS) -c compress.c
decompress.o: decompress.c
	$(CC) $(CFLAGS) -c decompress.c
bzlib.o: bzlib.c
	$(CC) $(CFLAGS) -c bzlib.c
bzip2.o: bzip2.c
	$(CC) $(CFLAGS) -c bzip2.c
wasm.o: wasm.c
	$(CC) $(CFLAGS) -c wasm.c

DISTNAME=bzip2-1.0.6
