'use babel';

import HellPaneView from './hell-pane-view';
import ListView from './list-view';
import opMgr from './opMgr';
import { CompositeDisposable, Disposable} from 'atom';
import Fun from './fun';
import Record from './record';
import Sql from './sql';

import * as Common from './common';

export default {

    hellPaneView: null,
    modalPanel: null,
    subscriptions: null,

    activate(state) {

        this.subscriptions = new CompositeDisposable(
            // Register command that toggles this view
            atom.commands.add('atom-workspace', {
                'hell-pane:gen_key_data': () => this.gen_data('key'),
                'hell-pane:gen_py_data': () => this.gen_data('py'),
                'hell-pane:gen_pp_data': () => this.gen_data('pp'),
                'hell-pane:test_some': () => this.test_some()
            }),

            // Destroy any ActiveEditorInfoViews when the package is deactivated.
            new Disposable(() => {
                atom.workspace.getPaneItems().forEach(item => {
                    if (item instanceof HellPaneView) {
                        item.destroy();
                    }
                });
            })
        );
    },

    deactivate() {
        // this.modalPanel.destroy();
        this.subscriptions.dispose();
        // this.hellPaneView.destroy();
    },

    serialize() {
        return {
            // hellPaneViewState: this.hellPaneView.serialize()
        };
    },

    gen_data(Type){
        const editor = atom.workspace.getActiveTextEditor();
        if(editor){
            const selection = editor.getSelectedText();
            if (selection) {
                new opMgr(selection).parse(Type)
            }
            else{
                atom.notifications.addError('bad selection!!!!');
            }
        }
    },

    ParserMod(sSpec){
        var sList = sSpec.split('\n');
        var modSpec = sList[0];
        var dataList = sList.slice(1);

        var specList = modSpec.split(',');
        var modType = specList[0];
        var obj = null;

        switch (modType) {
        case 'fun': obj = Fun; break;
        case 'record': obj = Record; break;
        case 'sql': obj = Sql; break;
        }

        if(obj){
            let oMod = Common.create_mod_by_slist(obj, specList.slice(1), dataList);
            return oMod;
        }
        else{
            return null;
        }
    },

    deserializeActiveEditorInfoView(serialized) {
        return new HellPaneView();
    },

    test_some(){
        this.listView = new ListView()
    }

};
