'use babel';

import request from 'request';
import querystring from 'querystring';
import xml2js from 'xml2js';
import * as Common from './common';

const jsdom = require('jsdom');
const { JSDOM } = jsdom;

var fs = require('fs')

const parseString = xml2js.parseString;

export default class News {

    constructor() {
        this.init()
    }

    init() {
        // this.requestURL = `http://www.voanews.com/east-asia-pacific?date=&to=&page=1`
        this.requestURL = `http://www.kekenet.com/broadcast/CNN/July19CNN`
    }

    fetch() {
        this.init();
        return this.download(this.requestURL);
    }

    download(url) {
        return new Promise((resolve, reject) => {

            let options = {
                url: url,
                headers: {
                    // 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36'
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.78 Safari/537.36'
                }
            };

            request(options, (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    const dom = new JSDOM(body);
                    var docRoot = dom.window.document
                    console.log(body);
                    resolve(body)
                } else {
                    reject(new Error('Failed to fetch data from voa.com'));
                }
            });
        })
    }

    get_baic_trans(docRoot){
        try {
            var root = docRoot.getElementById("phrsListTab")
            var liList = root.getElementsByTagName('li')
            var sList = []
            for (var i = 0; i < liList.length; i++) {
                var str = liList[i].textContent
                sList.push(str)
            }
            return sList.join('\n')
        } catch (e) {
            return 'not found in dict'
        }
    }

    get_title(docRoot){
        try {
            var root = docRoot.getElementsByClassName("collinsToggle")[0]
            var wtContainer = this.getByClass('wt-container', root)[0]
            var head = wtContainer.getElementsByTagName("h4")[0]
            var title = this.getByClass('title', head)[0]
            return title.textContent
        } catch (e) {
            return ''
        }
    }

    get_phonetic(docRoot, Type){
        try {
            var phoneticNode = docRoot.getElementsByClassName('baav')[0]
            var pron = this.getByClass('pronounce', phoneticNode)[Type]
            var phonetic = this.getByClass('phonetic', pron)[0]
            return phonetic.textContent
        } catch (e) {
            return ''
        }
    }

    get_answer(docRoot){
        try {
            var root = docRoot.getElementsByClassName('collinsToggle')[0]
            var wtContainer = this.getByClass('wt-container', root)[0]
            var liList = wtContainer.getElementsByTagName('li')
            return this.parse_collins_entry_list(liList)
        } catch (e) {
            return 'not found in dict'
        }
    }

    parse_collins_entry_list(liList){
        var  sList = []
        for (var i = 0; i < liList.length; i++) {
            var li = liList[i]
            var str = this.parse_collins_entry(li)
            sList.push(str)
        }
        return sList.join('\n')
    }

    parse_collins_entry(li){
        var trans = this.getByClass('collinsMajorTrans', li)[0]
        var order = this.getByClass('collinsOrder', trans)[0]
        var oTrans = this.get_nextsibling(order)
        var sOrder = order.textContent
        var sTrans = this.parseTrans(oTrans)
        var exampleList = this.getByClass('exampleLists', li)
        if (!exampleList || exampleList.length == 0) {
            return `${sOrder}\n${sTrans}`
        }
        var sExampleList = []
        for (var i = 0; i < exampleList.length; i++) {
            var oExample = exampleList[i]
            var sExample = this.parseExample(oExample)
            sExampleList.push(`• ${sExample}`)
        }
        var finalExample = sExampleList.join('\n')
        return `${sOrder}\n${sTrans}\n${finalExample}`
    }

    parseExample(oExample){
        var examples = this.getByClass('examples', oExample)[0]
        var pList = examples.getElementsByTagName('p');
        var sList = []
        for (var i = 0; i < pList.length; i++) {
            var sText = pList[i].textContent
            if(sText != ''){sList.push(sText)}
        }
        return sList.join('\n')
    }

    parseTrans(oTrans){
        var typeList = this.getByClass('additional', oTrans)
        var tList = []
        for (var i = 0; i < typeList.length; i++) {
            var type = typeList[i]
            var sType = type.textContent
            oTrans.removeChild(type)
            tList.push(sType)
        }
        var typeString = tList.join(' ')
        var regex = /[\n\r\t]/g
        // to one line
        var sTrans0 = oTrans.textContent.trim().replace(regex, '')
        // remove consecutive white space
        var sTrans = sTrans0.replace(/\s{3,}/g, ' ')
        return `${typeString} -- ${sTrans} `
    }

    getByClass(clsName, parent){
        var oParent=parent?document.getElementById(parent):document
        var boxArr=new Array()
        var oElements=parent.getElementsByTagName('*');
        for(var i=0;i<oElements.length;i++){
            if(oElements[i].className==clsName){
                boxArr.push(oElements[i]);
            }
        }
        return boxArr;
    }

    get_firstchild(parent){
        return this.get_nextsibling(parent.firstChild)
    }

    get_nextsibling(n)
    {
        var x=n.nextSibling;
        if(x == null) return null;
        while (x && x.nodeType!=1)
        {
            x=x.nextSibling;
        }
        return x;
    }

}
