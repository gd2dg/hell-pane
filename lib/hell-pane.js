'use babel';

import HellPaneView from './hell-pane-view';
import ListView from './list-view';
import opMgr from './opMgr';
import { CompositeDisposable, Disposable} from 'atom';
import Fun from './fun';
import Record from './record';
import Sql from './sql';
import StateView from './my-state';

import * as Youdao from './youdao';
import * as Common from './common';
import * as Some from './some';
import * as Find from './find';

var defaultConfig = require('./config').defaultConfig

export default {
    config:defaultConfig,
    hellPaneView: null,
    modalPanel: null,
    subscriptions: null,
    stateView :null,

    activate(state) {

        this.subscriptions = new CompositeDisposable(
            // Register command that toggles this view
            atom.commands.add('atom-workspace', {
                'hell-pane:gen_key_data': () => this.gen_data('key'),
                'hell-pane:gen_py_data': () => this.gen_data('py'),
                'hell-pane:gen_pp_data': () => this.gen_data('pp'),
                'hell-pane:test_some': () => this.test_some(),
                'hell-pane:gen_youdao': () => this.gen_youdao(),
                'hell-pane:do_some': () => Some.clear_something(),
                'hell-pane:open_config': () => Some.openConfig(),
                'hell-pane:down_dict': () => Find.find(),
                'hell-pane:down_news': () => Find.getNews(),
                'hell-pane:get_brief': () => Find.get_brief(),
                'hell-pane:get_concept': () => Find.get_concept(),
                'hell-pane:get_toelf_words': () => Find.get_toelf_words()
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
        this.stateView = new StateView().initialize()
    },

    deactivate() {
        // this.modalPanel.destroy();
        this.subscriptions.dispose();
        this.stateView.distroy();
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
    },

    gen_youdao(){
        Youdao.gen_dict('nul')
    }
};
