'use babel';

import Request from './request';
import Reply from './reply';
import Mod from './mod';

export default class Fun extends Mod{

  constructor(name, note, type){
    super(name, note, type);
  }

  init_data(dataList){
    // funSpecList, requestList, replyList
    var iRequest = dataList.indexOf('request');
    var iReply = dataList.indexOf('reply');
    var requestList = dataList.slice(iRequest+1, iReply);
    var replyList = dataList.slice(iReply+1);

    this.m_Request = new Request(this.m_Name, this.m_Note, requestList);
    this.m_Reply = new Reply(this.m_Name, this.m_Note, replyList);
  }

  gen_key_data(){
    return this.GenLib();
  }

  gen_py_data(){
    return this.GenPacket();
  }

  gen_pp_data(){
    return this.GenPp();
  }

  //fun模块
  // command 1
  GenLib(){
    return 'this is a erl lib description';
  }

  // command 2
  GenPacket(){
    let sRequest = this.m_Request.toStr();
    let sReply = this.m_Reply.toStr();
    let sResult = sRequest +'\n'+ sReply;
    return sResult;
  }

  // command 3
  GenPp(){
    return 'this is a erl lib description';
  }

}
