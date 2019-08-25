'use babel';

import request from 'request';
import querystring from 'querystring';
import xml2js from 'xml2js';
import * as Common from './common';

const jsdom = require('jsdom');
const { JSDOM } = jsdom;

var fs = require('fs')

const parseString = xml2js.parseString;

export default {
    word: null,
    requestURL: null,

    init(word) {
        this.word = word;
        // this.requestURL = `http://dict.youdao.com/fsearch?client=deskdict&keyfrom=chrome.extension&q=${querystring.escape(word)}&pos=-1&doctype=xml&xmlVersion=3.2&dogVersion=1.0&vendor=unknown&appVer=3.1.17.4208&le=eng%2520HTTP/1.1%5Cr%5Cn`;
        this.requestURL = `http://dict.youdao.com/w/eng/${querystring.escape(word)}/#keyfrom=dict2.index.suggest`
    },

    fetch(word) {
        this.init(word);
        return this.download(this.requestURL);
    },

    download(url) {
        return new Promise((resolve, reject) => {
            let options = {
                url: url,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36'
                }
            };
            request(options, (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    var youdaoPath = Common.getYouDaoOutPutPath()
                    var ankiPath = `${youdaoPath}\\anki-import\\`
                    var fPath = `${ankiPath}${this.word}.html`
                    fs.writeFileSync(fPath, body)
                    atom.notifications.addSuccess('gen html success')
                    const dom = new JSDOM(body);
                    var root = dom.window.document.getElementsByClassName("collinsToggle")[0]
                    var wtContainer = this.getByClass('wt-container', root)[0]
                    var head = this.get_firstchild(wtContainer)
                    var oList = this.get_nextsibling(head)
                    var phonetic = this.getByClass('additional spell phonetic', head)[0]
                    console.log(phonetic.textContent);

                    var firstLi = this.get_firstchild(wtContainer)
                    var m = firstLi
                    while(m!=null){
                        var desc = this.getByClass('wt-container', root)[0]
                        var example = this.getByClass('examples', root)[0]
                        console.log(desc);
                        console.log(example);
                    }
                    // var className = fchild.getAttribute("class")
                    // console.log(className);
                    // alert(name)
                    // parseString(body, (err, result) => {
                    //   if (!err)
                    //     resolve(result);
                    //   else
                    //     reject(new Error('Failed to parse data from youdao.com'));
                    // });
                } else {
                    reject(new Error('Failed to fetch data from youdao.com'));
                }
            });
        })
    },

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
    },

    get_firstchild(parent){
        return this.get_nextsibling(parent.firstChild)
    },

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

};
