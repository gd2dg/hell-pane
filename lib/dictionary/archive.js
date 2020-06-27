'use babel'

var fs = require('fs')
import * as Common from '../common'

var archivePath = `${atom.project.getPaths()}\\archive.md`
var archiveBakPath = `${atom.project.getPaths()}\\archive-bak.md`

var tries

export function saveTries(){
    tries.saveTries()
}

export function insert(word){
    tries.insert(word, 100, true)
}

export function existed(word, notify = true){
    if(tries){
        if(!word) word = Common.getWordsFromEditor()
        if(word){
            var e =  tries.startsWith(word)
            // 查询可以在1ms内完成
            if(e){
                if(notify)
                    atom.notifications.addSuccess('search '+ word + ' existed')
                return true
            }
            else{
                if(notify)
                    atom.notifications.addError('search '+ word +' not existed')
                return false
            }
        }
    }
    else{
        atom.notifications.addError('tries not existed')
    }
}


export function archiveWords(){
    var mediaPath = Common.getAnkiMediaPath()
    fs.readdir(mediaPath, function(err, files){
        var rList = []
        files.forEach((file, i) => {
            var re = /(.*)\.mp3/
            var matchArray
            matchArray = file.match(re)
            if(matchArray!=null){
                rList.push(matchArray[1])
            }
        })
        if(fs.existsSync(archivePath)){
            fs.copyFileSync(archivePath, archiveBakPath)
        }
        fs.writeFile(archivePath, rList.join('\n'), (err) =>{
            console.log(rList.length+' words archive success!')
        })
    })
}


class TrieNode {
    constructor() {
        this.value = undefined
        this.isEnd = false
        this.arr = {}
    }
}

class TrieTree {

    constructor() {
        this.root = new TrieNode()
    }

    saveTries(){
        this.visit()
        fs.writeFile(archivePath, this.acc.join('\n'), (err) =>{
            console.log(this.acc.length +' words archive success!')
        })
        this.acc = []
    }

    visit(node, prefix){
        if(!node) {
            node = this.root
            prefix = ''
            this.acc = []
        }
        for (var idx of Object.keys(node.arr).sort()) {
            if (node.arr.hasOwnProperty(idx)) {
                if(node.arr[idx]){
                    if(node.arr[idx].isEnd == true)
                        this.acc.push(prefix + idx)
                    this.visit(node.arr[idx], prefix + idx)
                }
            }
        }
    }

    insert(word, value, log = false) {
        let node = this.root
        for (let i = 0; i < word.length; i++) {
            const index = word[i]
            if (!node.arr[index]) {
                const temp = new TrieNode()
                node.arr[index] = temp
                node = temp
            } else {
                node = node.arr[index]
            }
        }
        if(!node.isEnd && log)
            console.log(word, 'added to tries')
        node.isEnd = true
        node.value = value
    }

    getRoot() {
        return this.root
    }

    startsWith(prefix) {
        const node = this.searchNode(prefix)
        if (node == null) {
            return false
        } else {
            return true
        }
    }

    searchNode(str) {
        let node = this.root
        for (let i = 0; i < str.length; i++) {
            const index = str[i]
            if (node.arr[index]) {
                node = node.arr[index]
            } else {
                return null
            }
        }

        if (node === this.root)
            return null

        return node
    }
}

export function createTries(){
    if(!fs.existsSync(archivePath)) {
        console.log('archivePath not existed');
        return
    }
    if(!tries){
        tries = new TrieTree()
        var starTime = Date.now()
        fs.readFile(archivePath, 'utf-8', (err, data) => {
            // if (err) throw err;
            var j
            data.split('\n').forEach((word, i) =>{
                if(word.trim().length > 0){
                    j = i + 1
                    tries.insert(word, i+1)
                }
            })
            var endTime = Date.now()
            var diff = (endTime - starTime)
            console.log(` ${j} tries created success in ${diff} ms!`)
        })
    }
    else{
        console.log('tries existed')
    }
}

createTries()
