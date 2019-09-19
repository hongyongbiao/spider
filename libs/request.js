const urllib=require('url')
const http=require('http')
const https=require('https')
const querystring=require('querystring')


const assert=require('assert')



function requestUrl(url,headers){
    let urlObj=urllib.parse(url)
    //console.log(urlObj)
    let httpMod=null
    if(urlObj.protocol=='http:'){
        httpMod=http
    }else if(urlObj.protocol=='https:'){
        httpMod=https
    }else{
        throw new Error(`协议无法识别: ${urlObj.protocol}`)
    }
    //console.log(urlObj)
    return new Promise((resolve,reject)=>{

        let req=httpMod.request({
            host:urlObj.host,
            path:urlObj.path,
            headers
        },res=>{
            //console.log('success')
            //console.log(res.statusCode)
            if(res.statusCode>=200&&res.statusCode<300||res.statusCode==304){
                let arr=[]
                res.on('data',data=>{
                    arr.push(data)
                })
                res.on('end',()=>{
                    let buffer=Buffer.concat(arr)

                    resolve({
                        statusCode: 200,
                        body: buffer,
                        headers: res.headers
                    })
                })
            }else if(res.statusCode==301 || res.statusCode==302){
                resolve({
                    statusCode: res.statusCode,
                    body: null,
                    headers: res.headers
                })
            }else{
                reject({
                    statusCode: res.statusCode,
                    body: null,
                    headers: res.headers
                })
            }
        })
        
        req.on('err',err=>{
            console.log('fail',err)
        })
        
        req.write('')//发送post数据
        
        req.end()

    })
}

module.exports = async (url,reqHeaders)=>{
    try {
        while(1){
            let { statusCode, body, headers} = await requestUrl(url,reqHeaders)
            //console.log(statusCode,url)
            if(statusCode==200){
                return {body, headers}
            }else{
                assert(statusCode==301||statusCode==302)
                assert(headers.location)
                url=headers.location
            }
        }
    } catch (error) {
        console.log(error)
    }
   
};



