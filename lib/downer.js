'use babel'

import request from 'request';
import querystring from 'querystring';
import xml2js from 'xml2js';
import * as Common from './common';

const jsdom = require('jsdom');
const iconv = require('iconv-lite');
const { JSDOM } = jsdom;

var fs = require('fs')
var path = require('path')

const parseString = xml2js.parseString;

export default class Downer {

    constructor() {
    }

    init() {
    }

    download(url, cb, decode) {
        return new Promise((resolve, reject) => {
            let options = {
                // host:'www.zhoubx2.com',
                // port:'8888',
                url: url,
                encoding:null,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36'
                }
            }
            request(options, (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    try {
                        var dom = this.to_doms(body, decode)
                        cb(resolve, dom)
                    } catch (e) {
                        console.log(e)
                        reject(new Error('Failed to operate data'))
                    }
                } else {
                    reject(new Error('Failed to fetch data'))
                }
            })
        })
    }

    to_doms(body, decode){
        if (decode) body = iconv.decode(body, decode)
        const dom = new JSDOM(body)
        return dom.window.document
    }

    trim(sText){
        var regex = /[\n\r\t]/g
        // merge one line and remove consecutive white space
        return sText.trim().replace(regex, '').replace(/\s{3,}/g, ' ')
    }

    getByClass(clsName, parent){
        var oParent=parent?document.getElementById(parent):document
        var boxArr=new Array()
        var oElements=parent.getElementsByTagName('*')
        for(var i=0;i<oElements.length;i++){
            if(oElements[i].className==clsName){
                boxArr.push(oElements[i])
            }
        }
        return boxArr
    }

    get_firstchild(parent){
        return this.get_nextsibling(parent.firstChild)
    }

    get_nextsibling(n)
    {
        var x=n.nextSibling
        if(x == null) return null
        while (x && x.nodeType!=1)
        {
            x=x.nextSibling
        }
        return x
    }

    logWord(oResult, timeout){
        if (timeout) {
            global.tmout = !global.tmout ? 1: global.tmout + 1
            var notifyStr = `${oResult['title']} timeout!!`
        } else {
            global.already = !global.already ? 1: global.already + 1
            notifyStr = `${oResult['title']} is done!!`
        }
        console.log(`${this.idx}: ${notifyStr} already num ${global.already}, time_out_num:${global.tmout}`)
    }

}
