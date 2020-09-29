'use babel'

import * as Common from '../common';

var fs = require('fs')
var path = require('path')
var XLSX = require('xlsx');

import request from 'request';
import Downer from './downer'

const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const iconv = require('iconv-lite');

var gR = []


function getStartDate(){
    return '2020-03-01'
}

function getEndDate(){
    var nowDate = new Date()
    var year = nowDate.getFullYear()
    var month = nowDate.getMonth() + 1
    var day = nowDate.getDate() - 1
    var r =  `${year}-${month}-${day}`
    console.log(r);
    return r
}

var codeConfig = [
    '国投瑞银国家安全混合 (001838)',
    '工银农业产业股票 (001195)',
    '中欧消费主题股票C (002697)',
    '广发科技先锋混合 (008903)',
    '南方中证500信息技术联接C (004347)',
    '华泰柏瑞中证科技ETF联接C (008400)',
    '天弘医疗健康混合C (001559)',
    '天弘中证食品饮料指数C (001632)',
    '天弘创业板ETF联接基金C (001593)',
    '华宝券商ETF联接C (007531)',
    '诺安成长混合 (320007)',
    '天弘中证电子ETF联接C (001618)'
]

var leftNum = codeConfig.length

export function fetch(){
    codeConfig.forEach((item, i) => {
        var matchArray = item.match(/([\u4e00-\u9fa5A-Z0-9a-z]*) \((.*)\)/)
        var title = matchArray[1]
        var code = matchArray[2]
        var oFund = new Fund(code, title, i)
        oFund.fetch()
    });
}

function writeExcel(){
    var path = 'C:\\Users\\Tangduguang\\Desktop\\data.xlsx'
    var wb = XLSX.readFile(path)
    var sheetNameList = []
    gR.forEach((item, i) => {
        var ws_name = item.title
        sheetNameList.push(ws_name)
        var ws_data = item.toResult()
        var ws = XLSX.utils.aoa_to_sheet(ws_data);
        if(wb.Sheets[ws_name]){
            // console.log(wb.Sheets[ws_name]);
            wb.Sheets[ws_name] = ws
        }
        else{
            XLSX.utils.book_append_sheet(wb, ws, ws_name);
        }
    })

    var oSync = parseSyncdromeSheet(sheetNameList)
    var sSyncName = '综合单'
    if(wb.Sheets[sSyncName]){
        wb.Sheets[sSyncName] = oSync
    }
    else{
        XLSX.utils.book_append_sheet(wb, oSync, sSyncName)
    }
    XLSX.writeFile(wb, path)
}

function parseSyncdromeSheet(sheetNameList){
    var o = {A1:{v:''}}
    // 0:B // 1:C
    sheetNameList.forEach((item, i) => {
        var tmp ={ [String.fromCharCode(65+i+1) + '1']:{t:'f', v:`=[data.xlsx]${item}!A1`}  }
        var tmp2 ={ [String.fromCharCode(65+i+1) + '2']:{t:'f', v:`=[data.xlsx]${item}!B3`} }
        Object.assign(o, tmp, tmp2)
        if(i==0){
            var tmp3 ={ [String.fromCharCode(65+i) + '2']:{t:'f', v:`=[data.xlsx]${item}!A3`} }
            Object.assign(o, tmp3)
        }
    });
    o['!ref']=`A1:${String.fromCharCode(65+sheetNameList.length)}2`,
    console.log(o);
    return o
}

class Fund extends Downer {

    constructor(code, title, i) {
        super()
        this.idx = i
        this.code = code
        this.title = title
        this.curPage = 0
        this.pages = 0
        this.theadList = ['净值日期', '日增长率', '单位净值', '累计净值']
        this.tList = []
    }

    toResult(){
        var firstLine = [this.title, this.code]
        return [firstLine, this.theadList].concat(this.tList)
    }

    getProblemsUrl(){
        var basicUrl = 'http://fund.eastmoney.com/f10/F10DataApi.aspx?type=lsjz'
        // return 'https://leetcode.com/problemset/all/'
        // return 'https://www.leetcode.com/problemset/all/'
        return `${basicUrl}&code=${this.code}&page=${this.curPage+1}&sdate=${getStartDate()}&edate=${getEndDate()}&per=20`
    }


    fetch() {
        // this.doFetchAllProblems()
        return this.download(this.getProblemsUrl(), this.doFetchAllProblems.bind(this))
    }

    preParseBody(body, decode){
        console.log(this.curPage);
        var matchArray
        var re = /^var apidata=\{\s+content:"(<table.*<\/table>)",records:(.*),pages:(.*),curpage:(.*)\};$/
        if((matchArray=body.toString().match(re))!=null){
            var domStr = matchArray[1];
            // console.log(domStr);
            this.pages = parseInt(matchArray[3]);
            this.curPage = parseInt(matchArray[4]);
            // console.log(this.pages, this.curPage);
            var dom = new JSDOM(domStr)
            this.dom = dom.window.document
            return false;
            //
        }
        console.log('can not parse the string returned by the api!!!');
        return true;
    }

    parseTables(){
        var tableObj = this.dom.getElementsByTagName('tbody')[0]
        var trs = tableObj.getElementsByTagName('tr')
        for (var i = 0; i < trs.length; i++) {
            var tr = trs.item(i)
            var tds = tr.getElementsByTagName('td')
            var tL = []
            var tList = [0, 3, 1, 2]
            tList.forEach((idx) => {
                var s = tds.item(idx).textContent
                if(idx == 3){
                    tL.push(this.toPoint(s))
                }
                else{
                    tL.push(s)
                }
            })
            this.tList.push(tL)
        }
    }

    toPoint(percent){
        var str=percent.replace("%","");
        str= str/100;
        return str;
    }

    doFetchAllProblems(resolve, error){
        if (!error) {
            try {
                this.parseTables()
                if(this.curPage == this.pages){
                    this.tList = this.tList.reverse()
                    gR.push(this)
                    leftNum -= 1
                    if(leftNum <=0){
                        console.log(gR);
                        writeExcel()
                    }
                } else{
                    this.fetch()
                }
            } catch (e) {
                console.log(e);
            }
        }
    }

}
