'use babel';
var defaultConfig  = {
    youdaoName:{
        title:'YoudDao File Name',
        description: 'YoudDao File Name',
        type: 'string',
        default:'temp'
    },
    youdaoPath:{
        title:'YoudDao File Path',
        description: 'YoudDao out file path',
        type: 'string',
        default:'temp'
    },
    userPath:{
        title:'User Home Path',
        description: 'a path where home path of the user is',
        type: 'string',
        default:'temp'
    },
    ankiPath:{
        title:'anki Home Path',
        description: 'a path where anki path of the user is',
        type: 'string',
        default:'temp'
    },
    wordType:{
        title:'input a word source',
        description: 'which source you want to download, such as toelf...',
        type: 'string',
        default:'toelf'
    }
}

module.exports.defaultConfig=defaultConfig
