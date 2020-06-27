'use babel';

import request from 'request';
import querystring from 'querystring';
import xml2js from 'xml2js';
import * as Common from '../common';

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
        this.rootUrl = 'https://www.youdict.com'
        this.pagesPerRequest = 100
        this.wordsPerList = 50
        this.type = Common.getWordsType()
    }

    parse_newconcept_urls(){
        var rootUrl = 'http://www.hxen.com/englishlistening/xingainian/kewen3/'
        // 获取总页数， 得到每个目录页的url
        // 获取所有条目， 根据每一条目获得每一篇课文的链接
        // 逐一请求下载
        return this.download(rootUrl, this.do_paser_nc_urls);
    }

    do_paser_nc_urls(resolve, body, owner){
        var docRoot = owner.to_doms(body, 'gb2312')
        var pageNum = owner.get_nc_all_page_num(docRoot, owner)
        if (pageNum > 0) {
            var urlList = owner.get_nc_all_text_links(pageNum)
            var promiseArray = [];
            for (var i = 0; i < urlList.length; i++) {
                var url = urlList[i]
                promiseArray.push(owner.paser_page_url(url));
            }
            // query end
            Promise.all(promiseArray).then(function(data) {
                data.forEach(function(tList){
                    tList.forEach(function(o){
                        var oPromise = owner.get_concept(o.url)
                        oPromise.then((sText) =>{
                            console.log(o.url);
                            var fPath = Common.getNewConceptFilePath(o.title)
                            console.log(fPath);
                            fs.writeFileSync(fPath, sText)
                            }
                        )
                    })
                })
                resolve('success')
            })
        }
        else{
            sFinal = 'success'
            resolve(sFinal)
        }
    }

    paser_page_url(url){
        return this.download(url, this.do_paser_page_url);
    }

    do_paser_page_url(resolve, body, owner){
        var docRoot = owner.to_doms(body, 'gb2312')
        var oList = owner.do_paser_page_url2(docRoot, owner)
        resolve(oList)
    }

    do_paser_page_url2(docRoot, owner){
        var ul = owner.getByClass('imgTxtBar clearfix imgTxtBar-b', docRoot)[0]
        var liList = ul.getElementsByTagName('li')
        var uList = []
        for (var i = 0; i < liList.length; i++) {
            var li = liList[i]
            var a = li.getElementsByTagName('a')[0]
            var o = {
                'title':a.title.replace(/[-\u4e00-\u9fa5]/g, '').replace(/\s+/g, '-').replace(':', '_'),
                'url':`http://www.hxen.com/${a.href}`
            }
            uList.push(o)
        }
        return uList
    }

    get_nc_all_page_num(docRoot, owner){
        var fBarl = owner.getByClass('pageBar fr ', docRoot)[0]
        var b = fBarl.getElementsByTagName('b')[0]
        var sFinal = b.textContent
        var matches = sFinal.match(/\d\/(\d)/)
        if(matches){
            sFinal = matches[1]
            return parseInt(sFinal)
        }
        else{
            return 0
        }
    }

    get_nc_all_text_links(pageNum){
        var root = 'http://www.hxen.com/englishlistening/xingainian/kewen3/'
        var aList = []
        for (var i = 1; i <= pageNum; i++) {
            if (i == 1) {
                aList.push(root + 'index.html')
            }
            else{
                aList.push(root + `index_${i}.html`)
            }
        }
        return aList
    }

    get_concept(url){
        return this.download(url, this.do_get_concept);
    }

    do_get_concept(resolve, body0, owner){
        var body = iconv.decode(body0, 'gb2312')
        const dom = new JSDOM(body);
        var docRoot = dom.window.document
        var sFinal
        var txt = docRoot.getElementById('arctext')
        var pList = txt.getElementsByTagName('p')
        var aList = []
        // merge one line and remove consecutive white space
        for (var i = 0; i < pList.length; i++) {
            var p = pList[i]
            var sText0 = p.innerHTML
            var sText = sText0.trim().replace(/<br>/g, '\n').replace(/<a.*a>/g, ' ')
            if (sText.match(/^Exercise\n.*/)) {
                break
            }
            else if(sText.match(/^[【★].*/)){
                aList.push('\n'+sText)
            }
            else{
                aList.push(sText)
            }
        }
        sFinal = aList.join('\n')
        resolve(sFinal)
    }

}
