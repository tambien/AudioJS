#!/bin/bash          
echo "making one file"
cat  ../src/core/*.js ../src/components/*.js > ../build/Audio.js
echo "compiling Audio.js"
java -jar compiler.jar --language_in=ECMASCRIPT5  \
--compilation_level=ADVANCED_OPTIMIZATIONS \
--js=../build/Audio.js --js_output_file=../build/Audio.min.js \
--warning_level=VERBOSE \
--externs=./externs/w3c_audio.js --externs=./externs/underscore.js
