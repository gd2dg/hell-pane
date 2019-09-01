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
    }
}

module.exports.defaultConfig=defaultConfig
