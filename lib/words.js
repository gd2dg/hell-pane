'use babel';

import request from 'request';
import querystring from 'querystring';
import xml2js from 'xml2js';
import * as Common from './common';

const jsdom = require('jsdom');
const { JSDOM } = jsdom;

var fs = require('fs')
var path = require('path')

import Downer from './downer';

const parseString = xml2js.parseString;

export default class Words extends Downer{

    constructor() {
        super()
        this.init()
    }

    init() {
        this.rootUrl = `http://www.youdict.com`
        this.pagesPerRequest = 100
        this.wordsPerList = 50
        this.type = Common.getWordsType()
    }

    configs(){
        return {
            'toelf':{
                'url': `http://www.youdict.com/tags/TOEFL`
            },
            'ielts':{
                'url':'http://www.youdict.com/tags/IELTS'
            },
            'gre':{
                'url':'http://www.youdict.com/tags/GRE'
            },
            'kaoyan':{
                'url':'http://www.youdict.com/tags/kaoyan'
            }
        }
    }

    getWords(){
        conf = this.configs()
        var o = conf[this.type]
        if (o && o['url']) {
            this.doGetWords(this.type, o['url'])
        }
    }

    doGetWords(type, url){
        atom.notifications.addSuccess(`hell-pane start getting ${type} words ...`)
        var starTime = Date.parse(new Date())
        this.downWords(url).then(function(data){
            var endTime = Date.parse(new Date())
            var diff = (endTime - starTime) / 1000
            this.dealWords(type, data)
            atom.notifications.addSuccess(`hell-pane finish getting ${type} words in ${diff} seconds!!`)
        }.bind(this))
    }

    dealWords(type, data){
        // atom.notifications.addSuccess(`starting write ${type} wrods !!!`)
        var perNum = this.wordsPerList
        var sText
        var sub
        var fileName
        var idx
        var fPath = Common.getWordsPath(type)
        if(!fs.existsSync(fPath)) fs.mkdirSync(fPath)
        for (var i = 0; i < data.length / perNum; i++) {
            idx = i + 1
            fileName = `${type}_${idx}`
            sub = data.slice(i*perNum, (i+1)*perNum)
            sText = sub.join('\n')
            filePath = path.join(fPath, `${fileName}.md`)
            fs.writeFileSync(filePath, sText)
        }
    }

    downWords(url){
        return this.download(url, this.doDownWords.bind(this));
    }

    doDownWords(resolve, docRoot){
        var div = this.getByClass('container yd-tags', docRoot)[0]
        var aList = div.getElementsByTagName('a')
        var perNum = this.pagesPerRequest
        var rst = []
        var tfun = function(idx){
            var start = idx * perNum
            if (start >= aList.length) {
                resolve(rst)
                return 1
            }
            atom.notifications.addSuccess(`starting requst ${this.type} part ${idx + 1}!!!`)
            var promiseArray = []
            for (var i = start; i < start + perNum && i < aList.length; i++) {
                var a = aList[i]
                var url = this.rootUrl + a.href
                promiseArray.push(this.parsePageWords(url))
            }
            Promise.all(promiseArray).then(function(data) {
                data.forEach(function(item){
                    rst.push.apply(rst, item)
                })
                tfun(idx + 1)
            })
        }.bind(this)
        tfun(0)
    }

    parsePageWords(url){
        return this.download(url, this.doParsePageWords.bind(this));
    }

    doParsePageWords(resolve, docRoot){
        var divList = this.getByClass('col-sm-6 col-md-3', docRoot)
        var tList = []
        divList.forEach(function(div){
            var img = div.getElementsByTagName('img')[0]
            var imgUrl = img.src
            var a = div.getElementsByTagName('a')[0]
            var sWord = a.textContent
            var p = div.getElementsByTagName('p')[0]
            var briefTrans = p.textContent.replace(/[\n\t]+/g, ' ')
            tList.push(`${sWord} ${briefTrans}`)
        })
        resolve(tList)
    }

}
