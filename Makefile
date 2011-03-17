VER = $(shell cat version)
SED_VER = sed "s/@VERSION/${VER}/"

CODE_JQUERY = http://code.jquery.com/
CODE_MOBILE = ${CODE_JQUERY}mobile/1.0a3/

TMP = tmp/
SRC = src/
DIR = target/
LOCAL_DIR = ${DIR}local/${VER}/
GH_DIR = ${DIR}gh-pages/${VER}/

DIRS = scripts/

FILES = index.html \
    scripts/log-colourer.min.js

LOCAL_FILES = scripts/jquery-1.5.1.min.js \
    scripts/jquery.mobile-1.0a3.min.css \
    scripts/jquery.mobile-1.0a3.min.js \
    scripts/images



all: local online gh

clean:
	@@rm -rf ${DIR}*

mktmp:
	@@rm -rf ${TMP}*
	@@for D in $(DIRS); do mkdir -p ${TMP}$$D; done
	@@cat ${SRC}index.html | ${SED_VER} \
	                       | sed "s/.js\"><\/script>/.min.js\"><\/script>/g" \
	                       | sed "s/.css\" \/>/.min.css\" \/>/g" > ${TMP}index.html
	@@cat ${SRC}scripts/log-colourer.js | ${SED_VER} > ${TMP}scripts/log-colourer.js.tmp
	@@java -jar build/google-compiler.jar --js ${TMP}scripts/log-colourer.js.tmp --warning_level QUIET --js_output_file ${TMP}scripts/log-colourer.min.js

local: mktmp
	@@for D in $(DIRS); do mkdir -p ${LOCAL_DIR}$$D; done
	@@for F in $(LOCAL_FILES); do cp -r ${SRC}$$F ${LOCAL_DIR}$$F; done
	@@for F in $(FILES); do cp -r ${TMP}$$F ${LOCAL_DIR}$$F; done

online: mktmp
	@@for D in $(DIRS); do mkdir -p ${GH_DIR}$$D; done
	@@for F in $(FILES); do cp -r ${TMP}$$F ${GH_DIR}$$F; done
	@@cat ${TMP}index.html | sed "s|=\"scripts/|=\"${CODE_MOBILE}|g" \
	                       | sed "s|=\"${CODE_MOBILE}jquery-|=\"${CODE_JQUERY}jquery-|g" \
	                       | sed "s|=\"${CODE_MOBILE}log-colourer.min.js|=\"scripts/log-colourer.min.js|g" \
	                            > ${GH_DIR}index.html

gh: online
	@@rm -rf gh-pages/*
	@@cp -r ${GH_DIR}/* gh-pages/

