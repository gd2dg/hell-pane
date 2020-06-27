'use babel'

import * as Common from '../common'

var fs = require('fs')
var path = require('path')

var maxTabNum = 4

export default class basicAnki {

    parse(title, content){
        var tabList = []
        var lines = content.split('\n')
        var curTab = 0
        var curL = []
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i]
            if(!line) continue // 空行不处理
            var tabRegex = /^-+/
            var matchArray
            if((matchArray = line.match(tabRegex)) != null){
                if(curL.length > 0){
                    tabList.push(curL.join('<br>'))
                    curL = []
                }
            }
            else{
                curL.push(this.parseLine(line))
            }
        }
        if(curL.length > 0){
            tabList.push(curL.join('<br>'))
        }
        if(tabList.length < maxTabNum){
            var left = maxTabNum - tabList.length
            for (var j = 0; j < left; j++) {
                tabList.push('')
            }
        }
        else if(tabList.length > maxTabNum){
            var extend = tabList.slice(maxTabNum - 1)
            tabList  = tabList.slice(0, maxTabNum - 1)
            tabList[3] = extend.join('<br><br>')
        }
        var tagName = Common.getFileName()
        return `${this.parseLine(title)}\t${tabList.join('\t')}\t${tagName}`
    }

    parseLine(line){
        // 将mardown的重点标记转成html标记
        var regex = /\*{2}([^*]*)\*{2}/g
        var to = line.replace(regex, "<span class='emphasize'>$1</span>")
        return to;
    }

}
