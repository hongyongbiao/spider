const request = require('./libs/request')
const JSDOM =require ('jsdom').JSDOM
const fs=require('fs')
const path=require('path');
const gbk=require('gbk')

const db = require('./db');

async function query(sql){
    await db.startTransaction()
    let data=await db.executeTransaction(sql)
    await db.stopTransaction()

    return data
}

function html2$(html){

    let document=new JSDOM(html).window.document
    return document.querySelectorAll.bind(document)
}

function indexParser(buffer){

    let $=html2$(html2$(buffer.toString())('textarea.f1')[0].value)
    console.log($)
        return Array.from($('li')).map(li => {
            //console.log(li)
            return {
                url:'https:'+li.getElementsByClassName('mod-g-photo')[0].href,
                img_src:'https:'+li.getElementsByClassName('mod-g-photo')[0].children[0].getAttribute('data-lazyload-src'),
                name:li.getElementsByClassName('mod-g-tit')[0].children[0].innerHTML,
                descrption:li.getElementsByClassName('mod-g-desc')[0].innerHTML,
                price:li.getElementsByClassName('mod-g-nprice')[0].innerHTML.match(/\d+(\.\d+)?/g)[0],
                sales:li.getElementsByClassName('mod-g-sales')[0].innerHTML.match(/\d+/g)[0]
            }
            
         })
    
}

async function indexSipder(){
    try {
        let { body, headers } = await request('http://shouji.tmall.com/')
        let datas=indexParser(body)
        //console.log(datas)
       await indexProcessor(datas)
    } catch (error) {
        console.log('请求失败')
    }
}

async function indexProcessor(datas){

    //存入数据库
    for(let i=0;i<datas.length;i++){
      let rows = await query(`select * from shouji_list where url='$(datas.url)'`)
      if(rows>0){
          await query(`update shouji_list set img_src='${datas[i].url}',name='${datas[i].name}',descrption='${datas[i].descrption}',price='${datas[i].price}',sales='${datas[i].sales}' where ID='${rows[0].ID}'`)
      }else{
          await query(`insert into shouji_list (ID, url, img_src, name, descrption, price, sales) values(0,'${datas[i].url}','${datas[i].img_src}','${datas[i].name}','${datas[i].descrption}','${datas[i].price}','${datas[i].sales}')`)

        }
      
    }
    //console.log(datas)
    //继续抓取详情
    for(let i=0;i<datas.length;i++){
        await detailSpider(datas[i].url)
    }
}

async function detailSpider(url){
    try {
        let { body, headers } = await request(url)
        //console.log(body)
        let data= detailParser(body)
        console.log(data)
        detailProcessor(data)
    } catch (error) {
        console.log('detail 请求失败')
    }
}

function detailParser(body){
    //let $=html2$(body.toString())
    let $=html2$(gbk.toString('utf-8',body))
    //console.log(detailhtml)
    let attributes={}
    Array.from($('.attributes-list li')).forEach(li=>{

        let n=li.innerHTML.search(/:|：/)
        if(n==-1)return

        let key=li.innerHTML.substring(0,n)
        let val=li.innerHTML.substring(n+1)

       // let [key,val]=li.innerHTML.split(':')
        attributes[key]=val
    })
    return attributes
    //console.log(attributes)
}

async function detailProcessor(data){

}

(async ()=>{
    await indexSipder()
})()
