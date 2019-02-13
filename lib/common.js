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
