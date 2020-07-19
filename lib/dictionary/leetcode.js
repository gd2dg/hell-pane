'use babel'

import * as Common from '../common';

var fs = require('fs')
var path = require('path')

var SelectListView = require ('atom-space-pen-views').SelectListView

import Downer from './downer'

var Problems = {}

export class Leetcode extends Downer {

    constructor() {
        super()
        this.logType = 'youdao'
        this.batchTimeOut = 3000
    }

    getProblemsUrl(){
        return 'https://leetcode.com/problemset/all/'
        // return 'https://www.leetcode.com/problemset/all/'
    }

    fetch() {
        this.doFetchAllProblems()
        // return this.download(this.getProblemsUrl(), this.doFetchAllProblems.bind(this))
    }

    doFetchAllProblems(){
        try {
            var rootPath = `${atom.project.getPaths()}`
            fs.readFile(`${rootPath}\\leet.html`, 'utf-8', (error, body) => {
                var docRoot = this.to_doms(body)
                var root = docRoot.getElementsByClassName('reactable-data')[0]
                var trList = root.getElementsByTagName('tr')
                var sList = ['id | title | difficulty', '-----|------|------']
                // 编号 | title | difficulty
                // -----|------|------
                for (var i = 0; i < trList.length; i++) {
                // for (var i = 0; i < 5; i++) {
                    var tr = trList[i]
                    var tds = tr.getElementsByTagName('td')
                    var id = tds[1].textContent
                    var alink = tds[2].getElementsByTagName('a')[0]
                    var title = alink.textContent.split(/\s+/).join(' ')
                    var subLink = alink.href
                    var difficulty = tds[5].textContent
                    var obj = this.getBasicResultObject(id, title, subLink, difficulty)
                    sList.push(this.toResultStr(obj))
                }
                var sResult = sList.join('\n')
                fs.writeFile(`${rootPath}\\all.md`, sResult, () =>{
                    atom.notifications.addSuccess('gen leetcode all problems successfully!!!')
                })
            })
        } catch (e) {
            return 'not found in dict'
        }
    }

    getBasicResultObject(id, title, url, difficulty){
        return {
            id: id,
            title: title,
            url: url,
            difficulty:difficulty
        }
    }

    toResultStr(obj){
        var l = [
            obj.id,
            this.toMdlink(obj.title, obj.url),
            // obj.title,
            // obj.url,
            obj.difficulty
        ]
        return l.join(' | ')
    }

    toMdlink(title, subLink){
        var rootLink = 'https://leetcode.com'
        return `[${title}]( ${rootLink}${subLink} )`
    }

}

export class LeetcodeView extends SelectListView {
    constructor(serializedState) {
        super()
        this.initialize()
    }

    initialize(){
        super.initialize()
        this.addClass('overlay from-top')
        this.setItems(this.getItems())
        this.panel = atom.workspace.addModalPanel({item: this})
    }

    show(){
        this.panel.show()
        this.focusFilterEditor()
    }

    getItems(){
        var rList = [];
        var keys = Object.keys(Problems)
        for (var i = 0; i < keys.length; i++) {
            var e = Problems[keys[i]]
            rList.push(`${e.id} ${e.title}`)
        }
        return rList;
        // return Problems;
    }

    viewForItem(item){
        return `<li>${item}</li><li></li>`
    }

    confirmed(item){
        var id = item.split(/\s/)[0]
        atom.clipboard.write(`# ${Problems[id].str}`)
        this.panel.hide()
        console.log(`${item} was selected`)
    }

    cancelled(){
        this.panel.hide()
        console.log('This view was cancelled')
    }
}

var v;

function genProblemsItem(){
    var leetPath = `${atom.project.getPaths()}\\all.md`
    if(!fs.existsSync(leetPath)) {
        console.log('archivePath not existed');
        return
    }

    fs.readFile(leetPath, 'utf-8', (error, data) =>{
        var lineList = data.split('\n')
        for (var i = 0; i < lineList.length; i++) {
            var line = lineList[i]
            var regx = /^(\d+)\s\|\s\[(.*)\]\((.*)\)\s\|.*$/
            var matchArray
            if((matchArray = line.match(regx)) != null){
                var id = matchArray[1]
                var title = matchArray[2]
                var url = matchArray[3]
                Problems[id] = {id:id, str:line, title:title, url:url}
            }
        }
        atom.notifications.addSuccess('gen Problems successfully!!!!')
    })
}

export function show() {
    if(!v) v = new LeetcodeView()
    v.show()
}

genProblemsItem()
