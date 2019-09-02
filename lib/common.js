'use babel';

export function create_mod_by_str(Class, sSpec, dataList){
  let sList = sSpec.split(',');
  return create_mod_by_slist(Class, sList, dataList);
}

export function create_mod_by_slist(Class, sList, dataList){
  var name = sList[0];
  var note = sList[1];
  var type = sList[2];
  let obj = new Class(name, note, type);
  obj.init_data(dataList);
  return obj;
}

export function getFileName(){
    return atom.config.get('hell-pane.youdaoName')
}

export function getYouDaoOutPutPath(){
    return atom.config.get('hell-pane.youdaoPath')
}

export function getUserPath(){
    return atom.config.get('hell-pane.userPath')
}

export function getYouDaoInputFilePath(){
    return `${getYouDaoOutPutPath()}\\${getFileName()}.xml`
}

export function getYouDaoOutEditFilePath(){
    return `${getYouDaoOutPutPath()}\\anki-import\\${getFileName()}-edit.md`
}

export function getYouDaoOutPutFilePath(){
    return `${getYouDaoOutPutPath()}\\anki-import\\${getFileName()}.md`
}

export function getAnkiMediaPath(){
    return `${getUserPath()}\\AppData\\Roaming\\Anki2\\User 1\\collection.media\\`
}

export function getNewConceptFilePath(filename){
    return `${getYouDaoOutPutPath()}\\new_concept\\${filename}.md`
}

export function getToelfPath(){
    return `${getYouDaoOutPutPath()}\\toelf\\`
}
