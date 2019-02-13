'use babel';

import Snipets from './snipets';
import {SqlField} from './field';

export default class Sql extends Snipets{

  // constructor(name, note, fieldList) {
  //   super(name, note);
  //   super.init_field_list(fieldList, SqlField);
  // }

  init_data(fieldList){
    super.init_field_list(fieldList, SqlField);
  }

  // command 1
  //sql
  gen_key_data(){
    let sList = [];
    sList.push(this.GenSql());
    sList.push(this.GenHrl());
    sList.push(this.GenMap());
    sList.push(this.GenOperater());
    return sList.join('\n\n');
  }

  GenSql(){
    return 'this is a ddl in db_game.sql'
  }

  GenHrl(){
    return 'this is a sql spec in hrl'
  }

  GenMap(){
    return 'this is a sql spec in map'
  }

  GenOperater(){
    return 'this is a sql spec in erl'
  }

}
