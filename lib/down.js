'use babel';

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

var already;
var tout;

export default class downer {

    constructor(word, i) {
        this.init(word)
        this.idx = i
    }

    init(word) {
        this.word = word
        this.dictUrl = `http://dict.youdao.com/w/eng/${querystring.escape(word)}/#keyfrom=dict2.index.suggest`
        this.cigenUrl = `http://www.youdict.com/w/${querystring.escape(word)}`
        this.rootDictUrl = `http://www.youdict.com`
        this.toeflUrl = `http://www.youdict.com/tags/TOEFL`
        this.phoneticUrl = `http://dict.youdao.com/dictvoice?type=0&audio=${querystring.escape(word)}`
        this.newconceptUrl = `http://www.hxen.com/englishlistening/xingainian/kewen3/2014-05-13/347585.html`
    }

    fetch(word) {
        this.init(word);
        return this.download(this.dictUrl, this.do_download_dict);
    }

    download(url, cb) {
        return new Promise((resolve, reject) => {
            let options = {
                url: url,
                encoding:null,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36'
                }
            };
            request(options, (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    // why should it need to pass a this, maybe it has a relation to closesure
                    try {
                        cb(resolve, body, this)
                    } catch (e) {
                        console.log(e);
                        reject(new Error('Failed to operate data'));
                    }
                } else {
                    reject(new Error('Failed to fetch data'));
                }
            });
        })
    }

    to_doms(body, decode){
        if (decode) body = iconv.decode(body, decode)
        const dom = new JSDOM(body);
        return dom.window.document
    }

    parse_toelf_urls(){
        return this.download(this.toeflUrl, this.do_paser_toelf_urls);
    }

    do_paser_toelf_urls(resolve, body, owner){
        var docRoot = owner.to_doms(body)
        var div = owner.getByClass('container yd-tags', docRoot)[0]
        var aList = div.getElementsByTagName('a')
        var perNum = 100
        var rst = []
        var tfun = function(idx){
            console.log(idx);
            var start = idx * perNum
            if (start >= aList.length) {
                resolve(rst)
                return 1
            }
            var promiseArray = []
            for (var i = start; i < start + perNum && i < aList.length; i++) {
                var a = aList[i]
                var url = owner.rootDictUrl+a.href
                console.log(url);
                promiseArray.push(owner.parse_toelf_words(url))
            }
            Promise.all(promiseArray).then(function(data) {
                data.forEach(function(item){
                    rst.push.apply(rst, item)
                })
                tfun(idx + 1)
            })
        }
        tfun(0)
    }

    parse_toelf_words(url, idx){
        return this.download(url, this.do_pase_toelf_words);
    }

    do_pase_toelf_words(resolve, body, owner){
        var docRoot = owner.to_doms(body)
        var divList = owner.getByClass('col-sm-6 col-md-3', docRoot)
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

    get_brief(word){
        this.init(word);
        return this.download(this.cigenUrl, this.do_get_brief);
    }

    do_get_brief(resolve, body, owner){
        var sPhonetic = owner.get_cigen_pron(body, 1, owner)
        var sTitle = owner.word
        // var sPhonetic = owner.get_phonetic(docRoot, 1)
        var docRoot = owner.to_doms(body)
        var sAnswer = owner.get_brief_desc(docRoot)
        // var sFinal = `${sTitle} ${sPhonetic} ${sAnswer}`
        var sFinal = `${sTitle} ${sPhonetic}`
        resolve(sFinal)
    }

    get_brief_desc(docRoot){
        try {
            var root = docRoot.getElementById('yd-word-meaning')
            return root.getElementsByTagName('li')[0].textContent
        } catch (e) {
            return 'not found in dict'
        }
    }

    do_download_dict(resolve, body, owner){
        var docRoot = owner.to_doms(body)
        var sWordEntry
        var o
        var error = false
        try {
            // phonetic, 0:en 1:us
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
            o = {
                'title':sTitle,
                'phonetic':sPhonetic,
                'answer':sAnswer,
                'link':''
            }
        } catch (e) {
            o = {
                'title':owner.word,
                'phonetic':'',
                'answer':'not found in dict',
                'link':''
            }
            error = true
        } finally {
            // down phonetic
            // if (!error) {
            //     var fPath = path.join(Common.getAnkiMediaPath(), `${owner.word}.mp3`)
            //     if(!fs.existsSync(fPath)){
            //         request.get(owner.phoneticUrl)
            //             .on("error",function(err){
            //                 console.log(err);
            //             })
            //             .on("close",() => {
            //                 console.log(owner.word," is downloaded!");
            //             })
            //             .pipe(fs.createWriteStream(fPath))
            //     }
            // }
            // query cigen
            var direct = false
            if(direct){
                o['cigen']=''
                var sFinal = owner.to_final_string(o)
                global.already = !global.already ? 1: global.already + 1
                notifyStr = `${owner.idx}: ${o['title']} is done!!, global.already num:${global.already}`
                console.log(notifyStr);
                resolve(sFinal)
            }
            else{
                var oPromise = owner.download(owner.cigenUrl, owner.do_download_cigen);
                var winnerPromise = new Promise(function (res) {
                    setTimeout(function () { res('timeout') }, 10000);
                });
                Promise.race([oPromise, winnerPromise]).then(function(r){
                    if(r == 'timeout'){
                        global.already = !global.already ? 0: global.already
                        global.tmout = !global.tmout ? 1: global.tmout + 1
                        o['cigen'] = `4.\n${owner.word}`
                        notifyStr = `${owner.idx}: ${o['title']} timeout!!, already num ${global.already}, time_out_num:${global.tmout}`
                    }
                    else{
                        global.tmout = !global.tmout ? 0: global.tmout
                        global.already = !global.already ? 1: global.already + 1
                        o['cigen'] = r['cigen']
                        if(r['pron'] && r['pron'] != ''){ o['phonetic'] = r['pron'] }
                        notifyStr = `${owner.idx}: ${o['title']} is done!!, already num ${global.already}, time_out_num:${global.tmout}`
                    }
                    console.log(notifyStr);
                    var sFinal = owner.to_final_string(o)
                    // atom.notifications.addSuccess(notifyStr)
                    resolve(sFinal)
                })
            }
        }
    }

    get_single_cigen(word){
        this.init(word)
        return this.download(this.cigenUrl, this.do_download_cigen);
    }

    do_download_cigen(resolve, body, owner){
        const dom = new JSDOM(body);
        var docRoot = dom.window.document
        var s = ''
        var r = {}
        var cpron = owner.get_cigen_pron(body, 1, owner)
        r['pron'] = cpron
        try {
            var wpron = docRoot.getElementById('yd-ciyuan')
            var mSpan = wpron.getElementsByTagName('span')[0]
            var mP = wpron.getElementsByTagName('p')[0]
            var sCigen = mP.textContent.replace(/\*/g, '')
            s = `4.\n${mSpan.textContent}\n${sCigen}`
            r['cigen'] = s
        } catch (e) {
            // console.log(e);
            console.log(owner.word, 'error happened when getting cigen!');
            s = `4.`
            r['cigen'] = s
        } finally {
            resolve(r)
        }
    }

    get_cigen_pron(body, type, owner){
        const dom = new JSDOM(body)
        var docRoot = dom.window.document
        try {
            var root = docRoot.getElementById('yd-word-pron')
            var str = root.textContent.replace(/\s/, '')
            console.log(str)
            var reg = /英(.*)\s美(.*)/
            // var reg = 1
            var matchArray
            if((matchArray = str.match(reg)) != null){
                console.log(matchArray);
                var uk = matchArray[1]
                var us = !matchArray[2] ? uk:us
                return type == 1? uk : us
            }
            else{
                return ''
            }
        } catch (e) {
            console.log(e)
            return ''
        }
    }

    get_learning_note(){
        return '4.\n'
    }

    to_phonetic_link(word){
        return `[sound:${word}.mp3]`
    }

    to_final_string(o){
        return `# ${o.title} ${o.phonetic} \n${o.answer}\n${o.cigen}\n\n`
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
            var root = docRoot.getElementsByClassName("collinsToggle")[0]
            var wtContainer = this.getByClass('wt-container', root)[0]
            var head = wtContainer.getElementsByTagName("h4")[0]
            var phonetic = this.getByClass('additional spell phonetic', head)[0]
            return phonetic.textContent
        } catch (e) {
            try{
                var phoneticNode = docRoot.getElementsByClassName('baav')[0]
                var pron = this.getByClass('pronounce', phoneticNode)[Type]
                var phonetic = this.getByClass('phonetic', pron)[0]
                return phonetic.textContent
            }
            catch(e){
                return ''
            }
        }
    }

    get_answer(docRoot){
        try {
            var root = docRoot.getElementsByClassName('collinsToggle trans-container')[0]
            // var wtContainerList = root.getElementsByClassName('wt-container')
            // console.log(wtContainerList.length);
            var rList = []
            for (var i = 0; i < root.children.length; i++) {
                var wtContainer = root.children[i]
                var title = this.getByClass('title trans-tip', wtContainer)[0]
                if(title && title.textContent){rList.push(this.trim(`-- ${title.textContent}`))}
                var liList = wtContainer.getElementsByTagName('li')
                if (liList.length == 0) {
                    rList.push(this.trim(wtContainer.textContent))
                } else {
                    rList.push(this.parse_collins_entry_list(liList))
                }
            }
            return rList.join('\n')
        } catch (e) {
            console.log(e);
            return 'not found in dict'
        }
    }

    parse_collins_entry_list(liList){
        var  sList = []
        for (var i = 0; i < liList.length; i++) {
            var li = liList[i]
            var str = this.parse_collins_entry(li)
            if(str != 0) sList.push(str)
        }
        return sList.join('\n')
    }

    parse_collins_entry(li){
        try {
            var trans = this.getByClass('collinsMajorTrans', li)[0]
            var order = this.getByClass('collinsOrder', trans)[0]
            var oTrans = this.get_nextsibling(order)
            var sTrans = this.parseTrans(oTrans)
            var exampleList = this.getByClass('exampleLists', li)
            if (!exampleList || exampleList.length == 0) {
                return `${sTrans}`
            }
            var sExampleList = []
            for (var i = 0; i < exampleList.length; i++) {
                var oExample = exampleList[i]
                var sExample = this.parseExample(oExample)
                sExampleList.push(`• ${sExample}`)
            }
            var finalExample = sExampleList.join('\n')
            return `${sTrans}\n${finalExample}`
        } catch (e) {
            return 0
        }
    }
    // example

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
        return sText.trim().replace(regex, ' ').replace(/\s{3,}/g, ' ')
    }

    getByClass(clsName, parent){
        // var oParent=parent?document.getElementById(parent):document
        var oParent=parent?parent:document
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
