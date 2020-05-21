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
        this.batchPerNum = 20
        this.batchStep = 0
        this.curBatchStep = 0
        this.batchResult = []
        this.batchProvider = null
        this.batchCallBack = null
        this.logType = 'null'
        this.timeoutNum = 0
        this.doneNum = 0
        this.timoutList = []
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

    logWord(word, timeout){
        if (timeout) {
            this.timeoutNum = this.timeoutNum + 1
            var notifyStr = `${this.logType}: ${word} timeout!!`
            console.log(`${notifyStr} already num ${this.doneNum}, time_out_num:${this.timeoutNum}`)
            this.timoutList.push(word)
        } else {
            this.doneNum = this.doneNum + 1
            // notifyStr = `${this.logType}: ${word} is done!!`
        }
    }


    timeoutPromis(word){
        return new Promise(resolve =>{
            setTimeout( function(word){
                resolve([this.getTimeoutResult(word), true])
            }.bind(this, word), this.batchTimeOut)})
    }

    isBatchDone(){
        return this.curBatchStep >= this.batchStep
    }

    getBatchWords(){
        var start = this.curBatchStep * this.batchPerNum
        var end = start + this.batchPerNum
        return this.batchWords.slice(start, end)
    }

    oneBatchStepStart(){
        // console.log(this.curBatchStep + 1, this.batchStep)
    }

    oneBatchStepEnd(){
        console.log(`${this.logType} -- setp:${this.curBatchStep + 1} done in all ${this.batchStep} step!`)
        this.curBatchStep = this.curBatchStep + 1
    }

    allBatchStepEnd(){
        this.logAllBatchStepEnd()
        // %%
        this.batchCallBack(this.batchResult)
    }

    logAllBatchStepEnd(){
        this.batchEndTime = Date.parse(new Date())
        var diff = (this.batchEndTime - this.batchStartTime) / 1000
        if(this.timoutList.length > 0){
            var logTxt = `hell-pane finish ${this.logType} consulting\n all ${this.timeoutNum + this.doneNum} words \n ${this.timoutList} timeout in ${diff} seconds!!, `
        }
        else{
            var logTxt = `hell-pane finish ${this.logType} consulting, all ${this.timeoutNum + this.doneNum} words , in ${diff} seconds!!, `
        }
        atom.notifications.addSuccess(logTxt)
        console.log(logTxt)
    }

    getBatchProvider(word){
        return this.batchProvider(word)
    }

    batch_find(words, callback){
        this.beforeBatchFind(words, callback)
        this.setBatchProvider()
        this.basic_batch_find()
    }

    beforeBatchFind(words, callback){
        atom.notifications.addSuccess(`hell-pane start ${this.logType} consulting!!`)
        this.batchResult = []
        this.batchWords = words
        this.curBatchStep = 0
        this.batchStep = Math.ceil(words.length/this.batchPerNum)
        this.batchCallBack = callback
        // %% time_info
        this.batchStartTime = Date.parse(new Date())
        this.timeoutNum = 0
        this.doneNum = 0
    }

    basic_batch_find(){
        this.oneBatchStepStart()
        var promiseArray = []
        var words = this.getBatchWords()
        for (var i = 0; i < words.length; i++) {
            var word = words[i]
            var oPromise = Promise.race([this.getBatchProvider(word), this.timeoutPromis(word)]).then(
                function(w, [value, timeout]){
                    this.logWord(w, timeout)
                    return value
                }.bind(this, word), function(w, reason){
                    // console.log('mmmmmmmmmmmmmmm');
                    // console.log(value, timeout);
                    return reason
                }.bind(this, word)
            )
            promiseArray.push(oPromise)
        }
        // query end
        Promise.all(promiseArray).then(function(data) {
            this.oneBatchStepEnd()
            this.batchResult.push(data)
            if (this.isBatchDone()) {
                this.allBatchStepEnd()
            }
            else{
                this.basic_batch_find()
            }
        }.bind(this))
    }

    to_final_string(o, cigen){
        if(o.timeout){
            return `# ${o.title}\nquery timeout\n${cigen}\n`
        }
        var answer = o.answer
        var rList = []
        var sList = answer['objlist']
        var result
        if (sList) {
            for (var i = 0; i < sList.length; i++) {
                var obj = sList[i]
                var data= obj['sub-content']
                var dice = 2
                for(var j=0,len=data.length;j<len;j+=dice){
                    var sAnswer = data.slice(j,j+dice).join('\n')
                    if(obj['sub-title']){
                        result = `# ${o.title} <${obj['sub-title']}> ${o.phonetic}\n${answer['add-pa']}${-- obj['sub-title']}${sAnswer}\n${cigen}\n\n`
                    }
                    else{
                        result = `# ${o.title} <note> ${o.phonetic}\n${answer['add-pa']}${sAnswer}\n${cigen}\n\n`
                    }
                    rList.push(result)
                }
            }
        }
        else{
            if (o['phonetic']) {
                rList.push(`# ${o.title} ${o['phonetic']}\n${answer}\n${o.biExample}\n${cigen}\n\n`)
            }
            else{
                rList.push(`# ${o.title}\n${answer}\n${o.biExample}\n${cigen}\n\n`)
            }
        }
        return rList.join('\n')
    }



}
