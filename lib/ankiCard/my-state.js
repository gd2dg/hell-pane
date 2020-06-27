'use babel'

import * as Common from '../common';

class StateView extends HTMLDivElement{

    // 初始化元素
    initialize(){
        // 创建元素
        this.classList.add('hell-pane-wrapper', 'inline-block');
        this.stateBlock = document.createElement('div')
        this.appendChild(this.stateBlock)
        // 渲染
        this.attach()
        // 监听
        this.watchEditor()
        return this
    }

    destroy(){
        if (this.activateDisposable) {
            this.activateDisposable.dispose()
        }
        if (this.statusBarTile){
            this.statusBarTile.destroy()
        }
    }

    watchEditor(){
        atom.workspace.observeActiveTextEditor( (editor) => {
            if (this.statusBarTile) {
                this.countWords(editor)
            } else {
                this.attach(editor)
            }
            if (editor) {
                var disposesable = editor.onDidSave(() =>{
                    this.countWords(editor)
                })
                editor.onDidDestroy(()=>{
                    disposesable.dispose()
                })
            }
        })
    }

    attach(editor){
        // 找到状态栏元素
        var statusBar = atom.views.getView(atom.workspace).querySelector('status-bar')
        if (statusBar) {
            if (!this.statusBarTile) {
                // 添加显示元素
                this.statusBarTile = statusBar.addLeftTile({item:this, priority: 20})
                // 计算数量
                this.countWords(editor)
            } else {
                this.countWords(editor)
            }
        } else {
            this.activateDisposable = atom.packages.onDidActivateInitialPackages(() =>{
                this.activateDisposable.dispose()
                this.attach(editor)
            })
        }
    }

    // 设置显示元素的内容
    countWords(editor){
        var Num = this.countWordsNum(editor)
        var para = this.getShowElem()
        var currentFile = Common.getFileName()
        //设置内容
        para.textContent = `${Num} en-words, current-file:${currentFile}`
        if (Num > 0) {
            para.classList.add('red')
        }
        else{
            para.classList.remove('red')
        }
    }

    // 找到显示的元素， 没有则创建
    getShowElem(){
        var para = this.stateBlock.querySelector("#show-print")
        if (para) {
            return para
        } else {
            var par = document.createElement('span')
            par.id = 'show-print'
            this.stateBlock.appendChild(par)
            return par
        }
    }

    countWordsNum(editor){
        if (!editor) {
            return 0
        } else {
            var Num = 0
            var re = /^# .*/g;
            editor.scan(re, (Match) => { Num++ })
            return Num
        }
    }
}

module.exports = document.registerElement('hell-pane', {prototype: StateView.prototype});
