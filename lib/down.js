'use babel';

import request from 'request';
import querystring from 'querystring';
import xml2js from 'xml2js';
import * as Common from './common';

const jsdom = require('jsdom');
const { JSDOM } = jsdom;

var fs = require('fs')

const parseString = xml2js.parseString;

export default class downer {

    constructor(word) {
        this.init(word)
    }

    init(word) {
        this.word = word;
        this.cigenURL = `http://www.cgdict.com/index.php?app=cigen&ac=word&w=${querystring.escape(word)}`;
        this.requestURL = `http://dict.youdao.com/w/eng/${querystring.escape(word)}/#keyfrom=dict2.index.suggest`
    }

    fetch(word) {
        this.init(word);
        return this.download(this.requestURL, this.do_download_dict);
    }

    download(url, cb) {
        return new Promise((resolve, reject) => {
            let options = {
                url: url,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36'
                }
            };
            request(options, (error, response, body) => {
                if (!error && response.statusCode == 200) {
                        // why should it need to pass a this, maybe it has a relation to closesure
                        cb(resolve, body, this)
                } else {
                    reject(new Error('Failed to fetch data from youdao.com'));
                }
            });
        })
    }

    do_download_dict(resolve, body, owner){
        const dom = new JSDOM(body);
        var docRoot = dom.window.document
        var sWordEntry
        try {
            // phonetic, 1:en 2:us
            var sPhonetic = owner.get_phonetic(docRoot, 1)
            // title
            var sTitle = owner.get_title(docRoot)
            var sAnswer
            if (sTitle) {
                // answer
                sAnswer = owner.get_answer(docRoot)
            }
            else{
                // answer
                sTitle = owner.word
                sAnswer = owner.get_baic_trans(docRoot)
            }
            sWordEntry = `# ${sTitle} ${sPhonetic}\n${sAnswer}\n${owner.get_learning_note()}\n\n`
        } catch (e) {
            sWordEntry = `# ${owner.word} \nnot found in dict\n\n`
        } finally {
            var oPromise =  owner.download(owner.cigenURL, owner.do_download_cigen);
            oPromise.then((sCiGen) =>{
                var sFinal = `# ${sTitle} ${sPhonetic} ${sCiGen[1]}\n${sAnswer}\n${sCiGen[0]}\n\n`
                resolve(sFinal)
            })
        }
    }

    do_download_cigen(resolve, body, owner){
        const dom = new JSDOM(body);
        var docRoot = dom.window.document
        var s
        var audioUrl=''
        try {
            var wpron = owner.getByClass('wpron', docRoot)[0]
            var audioList = wpron.getElementsByTagName('audio')
            var audio = audioList[audioList.length - 1]
            var souce = audio.getElementsByTagName('source')[0]
            // s = `4.\n${owner.trim(f.textContent)}`
            // s = '4.\n'
        } catch (e) {
            s = '4.\n'
        } finally {
            resolve([s, audioUrl])
        }
    }

    get_learning_note(){
        return '4.\n'
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
        var sTrans = this.trim(oTrans.textContent)
        return `${typeString} -- ${sTrans} `
    }

    trim(sText){
        var regex = /[\n\r\t]/g
        // merge one line and remove consecutive white space
        return sText.trim().replace(regex, '').replace(/\s{3,}/g, ' ')
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
